// Cuentas y permisos en Firestore:
// - admins/{uid}: administradores (se crean a mano desde la consola).
// - permitidos/{uid}: cuentas habilitadas a mano antes del registro abierto; ven todo.
// - accesos/{uid}: secciones habilitadas por un admin ({ secciones: [...] }). Solo un admin lo escribe.
// - cuentas/{uid}: email, nombre y fechas, para listar las cuentas en el panel de administración.

import { collection, doc, getDoc, onSnapshot, setDoc, type DocumentSnapshot, type Firestore, type QuerySnapshot } from 'firebase/firestore';
import { sanearSecciones } from '../dominio/acceso';
import type { Seccion } from '../dominio/tipos';
import type { Acceso, Cuenta, CuentaConAcceso, ServicioCuentas } from './tipos';

const texto = (v: unknown, max: number) => (typeof v === 'string' ? v.slice(0, max) : '');

export function crearCuentasFirestore(db: Firestore): ServicioCuentas {
  // Las anotaciones van de a una: dos a la vez verían la cuenta sin anotar y las dos
  // pondrían fecha de alta (y las reglas rechazan cambiarla).
  let cola: Promise<void> = Promise.resolve();
  const anotar = async ({ uid, email, nombre }: { uid: string; email: string; nombre?: string }) => {
    const ref = doc(db, 'cuentas', uid);
    const ahora = new Date().toISOString();
    const previa = await getDoc(ref).catch(() => null);
    // Sin saber si la cuenta ya estaba anotada no se escribe (se pisaría la fecha de alta); se anota en el próximo ingreso.
    if (!previa || (!previa.exists() && previa.metadata.fromCache)) return;
    const datos: Record<string, string> = { email: email.slice(0, 200), ultimoIngreso: ahora };
    if (nombre !== undefined) datos.nombre = nombre.slice(0, 60);
    if (!previa.exists()) {
      datos.creado = ahora;
      datos.nombre ??= '';
    }
    await setDoc(ref, datos, { merge: true });
  };

  return {
    acceso(uid, cb) {
      // Tres lecturas; se avisa recién cuando respondieron todas (un permiso denegado cuenta como «no»).
      // Que un documento no esté en la caché no dice nada (puede ser que no haya señal): para
      // saber que no existe hace falta la respuesta del servidor.
      const estado: { admin?: boolean; anterior?: boolean; secciones?: Seccion[] } = {};
      const emitir = () => {
        if (estado.admin === undefined || estado.anterior === undefined || estado.secciones === undefined) return;
        cb({ admin: estado.admin, anterior: estado.anterior, secciones: estado.secciones } satisfies Acceso);
      };
      const escuchar = (ruta: string, alDato: (s: DocumentSnapshot) => void, alFallar: () => void) =>
        onSnapshot(
          doc(db, ruta, uid),
          (s) => {
            if (!s.exists() && s.metadata.fromCache) return;
            alDato(s);
            emitir();
          },
          () => {
            alFallar();
            emitir();
          },
        );
      const fin = [
        escuchar(
          'admins',
          (s) => (estado.admin = s.exists()),
          () => (estado.admin = false),
        ),
        escuchar(
          'permitidos',
          (s) => (estado.anterior = s.exists()),
          () => (estado.anterior = false),
        ),
        escuchar(
          'accesos',
          (s) => (estado.secciones = s.exists() ? sanearSecciones(s.data().secciones) : []),
          () => (estado.secciones = []),
        ),
      ];
      return () => fin.forEach((f) => f());
    },

    anotar(datos) {
      const paso = cola.then(() => anotar(datos));
      cola = paso.catch(() => undefined);
      return paso;
    },

    cuentas(cb, alError) {
      let cuentas: Cuenta[] | null = null;
      let accesos: Map<string, Seccion[]> | null = null;
      let admins: Set<string> | null = null;
      let anteriores: Set<string> | null = null;
      const emitir = () => {
        if (!cuentas || !accesos || !admins || !anteriores) return;
        const lista: CuentaConAcceso[] = cuentas.map((c) => ({
          ...c,
          acceso: { admin: admins!.has(c.uid), anterior: anteriores!.has(c.uid), secciones: accesos!.get(c.uid) ?? [] },
        }));
        lista.sort((a, b) => b.creado.localeCompare(a.creado));
        cb(lista);
      };
      const ids = (s: QuerySnapshot) => new Set(s.docs.map((d) => d.id));
      const fallo = () => alError();
      const fin = [
        onSnapshot(
          collection(db, 'cuentas'),
          (s) => {
            cuentas = s.docs.map((d) => {
              const v = d.data();
              return {
                uid: d.id,
                email: texto(v.email, 200),
                nombre: texto(v.nombre, 60),
                creado: texto(v.creado, 40),
                ultimoIngreso: texto(v.ultimoIngreso, 40),
              };
            });
            emitir();
          },
          fallo,
        ),
        onSnapshot(
          collection(db, 'accesos'),
          (s) => {
            accesos = new Map(s.docs.map((d) => [d.id, sanearSecciones(d.data().secciones)]));
            emitir();
          },
          fallo,
        ),
        onSnapshot(
          collection(db, 'admins'),
          (s) => {
            admins = ids(s);
            emitir();
          },
          fallo,
        ),
        onSnapshot(
          collection(db, 'permitidos'),
          (s) => {
            anteriores = ids(s);
            emitir();
          },
          fallo,
        ),
      ];
      return () => fin.forEach((f) => f());
    },

    async guardarSecciones(uid, secciones) {
      await setDoc(doc(db, 'accesos', uid), { secciones: sanearSecciones(secciones), actualizado: new Date().toISOString() });
    },
  };
}
