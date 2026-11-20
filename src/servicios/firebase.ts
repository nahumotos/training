// Servicios de producción: Firebase Authentication, Cloud Firestore y el Worker de IA.
// Este módulo se carga solo en modo Firebase, así el modo demo no descarga el SDK.

import { initializeApp } from 'firebase/app';
import {
  browserLocalPersistence,
  createUserWithEmailAndPassword,
  indexedDBLocalPersistence,
  initializeAuth,
  onAuthStateChanged,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  signOut,
  type AuthError,
} from 'firebase/auth';
import { initializeFirestore, persistentLocalCache, persistentMultipleTabManager } from 'firebase/firestore';
import { AlmacenFirestore } from './almacen/firestore';
import { crearCuentasFirestore } from './cuentasFirestore';
import { crearServicioIA } from './ia/cliente';
import { ErrorAuth, type Autenticacion, type Servicios } from './tipos';

export interface ConfigFirebase {
  apiKey: string;
  authDomain: string;
  projectId: string;
  appId: string;
}

function mensajeAuth(e: unknown): string {
  const codigo = (e as AuthError)?.code ?? '';
  switch (codigo) {
    case 'auth/invalid-credential':
    case 'auth/wrong-password':
    case 'auth/user-not-found':
    case 'auth/invalid-login-credentials':
      return 'El email o la contraseña no coinciden.';
    case 'auth/invalid-email':
    case 'auth/missing-email':
      return 'Revisá el email.';
    case 'auth/too-many-requests':
      return 'Demasiados intentos. Esperá unos minutos o restablecé la contraseña.';
    case 'auth/network-request-failed':
      return 'Sin conexión. Revisá internet y probá de nuevo.';
    case 'auth/user-disabled':
      return 'Esta cuenta está deshabilitada.';
    case 'auth/email-already-in-use':
      return 'Ya hay una cuenta con ese email. Ingresá con tu contraseña o restablecela.';
    case 'auth/weak-password':
      return 'La contraseña tiene que tener al menos 8 caracteres.';
    case 'auth/operation-not-allowed':
    case 'auth/admin-restricted-operation':
      return 'El registro de cuentas nuevas está cerrado en este sitio.';
    default:
      return 'No se pudo ingresar. Probá de nuevo en un rato.';
  }
}

export function crearServiciosFirebase(config: ConfigFirebase, urlIA: string | undefined): Servicios {
  const app = initializeApp(config);
  // Sin popups ni redirecciones: el ingreso con email funciona igual en Safari y en la app instalada.
  const authFb = initializeAuth(app, { persistence: [indexedDBLocalPersistence, browserLocalPersistence] });
  authFb.languageCode = 'es';
  const db = initializeFirestore(app, {
    localCache: persistentLocalCache({ tabManager: persistentMultipleTabManager() }),
    ignoreUndefinedProperties: true,
  });

  const auth: Autenticacion = {
    observar: (cb) => onAuthStateChanged(authFb, (u) => cb(u ? { uid: u.uid, email: u.email } : null)),
    async ingresar(email, clave) {
      try {
        await signInWithEmailAndPassword(authFb, email.trim(), clave);
      } catch (e) {
        throw new ErrorAuth(mensajeAuth(e));
      }
    },
    async registrar(email, clave) {
      try {
        const r = await createUserWithEmailAndPassword(authFb, email.trim(), clave);
        return r.user.uid;
      } catch (e) {
        throw new ErrorAuth(mensajeAuth(e));
      }
    },
    async recuperar(email) {
      try {
        await sendPasswordResetEmail(authFb, email.trim());
      } catch (e) {
        // Por seguridad, Firebase no avisa si el email no existe; solo se informan errores de formato o red.
        const codigo = (e as AuthError)?.code ?? '';
        if (codigo === 'auth/user-not-found') return;
        throw new ErrorAuth(mensajeAuth(e));
      }
    },
    salir: () => signOut(authFb),
    token: async () => (authFb.currentUser ? authFb.currentUser.getIdToken() : null),
  };

  return {
    modo: 'firebase',
    auth,
    crearAlmacen: (uid) => new AlmacenFirestore(db, uid),
    cuentas: crearCuentasFirestore(db),
    ia: crearServicioIA(urlIA, auth.token),
  };
}
