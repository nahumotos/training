// Servicios del modo demo: sin Firebase y con la IA simulada. Las cuentas y los permisos
// se guardan en el navegador, para probar el registro y el panel de administración.

import { sanearSecciones } from '../dominio/acceso';
import { AlmacenDemo } from './almacen/demo';
import { Emisor } from './almacen/comun';
import {
  ErrorAuth,
  ErrorIA,
  type Acceso,
  type Autenticacion,
  type CuentaConAcceso,
  type RespuestaIA,
  type ServicioCuentas,
  type Servicios,
  type Usuario,
} from './tipos';

/** La cuenta de siempre del modo demo: es la administradora. */
const USUARIO_DEMO: Usuario = { uid: 'demo', email: 'demo@libreta.local' };
const CLAVE_SESION = 'libreta-demo-sesion';
const CLAVE_CUENTAS = 'libreta-demo-cuentas';
const CLAVE_ACCESOS = 'libreta-demo-accesos';

interface CuentaDemo {
  uid: string;
  email: string;
  clave: string;
  nombre: string;
  creado: string;
  ultimoIngreso: string;
}

function leer<T>(clave: string, base: T): T {
  try {
    const v = localStorage.getItem(clave);
    return v ? (JSON.parse(v) as T) : base;
  } catch {
    return base;
  }
}

function escribir(clave: string, v: unknown) {
  try {
    if (v === null) localStorage.removeItem(clave);
    else localStorage.setItem(clave, typeof v === 'string' ? v : JSON.stringify(v));
  } catch {
    /* sin almacenamiento: vale hasta cerrar la pestaña */
  }
}

const cuentasGuardadas = () => leer<CuentaDemo[]>(CLAVE_CUENTAS, []);

function usuarioDeSesion(): Usuario | null {
  let s: string | null = null;
  try {
    s = localStorage.getItem(CLAVE_SESION);
  } catch {
    /* idem */
  }
  if (s === 'salio') return null;
  const c = s ? cuentasGuardadas().find((x) => x.uid === s) : undefined;
  return c ? { uid: c.uid, email: c.email } : USUARIO_DEMO;
}

class AuthDemo implements Autenticacion {
  private usuario = new Emisor<Usuario | null>(usuarioDeSesion());

  observar(cb: (u: Usuario | null) => void) {
    return this.usuario.suscribir(cb);
  }
  async ingresar(email: string, clave: string) {
    const propia = cuentasGuardadas().find((c) => c.email === email.trim().toLowerCase());
    if (propia) {
      if (propia.clave !== clave) throw new ErrorAuth('El email o la contraseña no coinciden.');
      escribir(CLAVE_SESION, propia.uid);
      this.usuario.emitir({ uid: propia.uid, email: propia.email });
      return;
    }
    // Cualquier otro email entra a la cuenta de siempre del modo demo.
    if (!email.includes('@') || clave.length < 6) throw new ErrorAuth('El email o la contraseña no coinciden.');
    escribir(CLAVE_SESION, null);
    this.usuario.emitir(USUARIO_DEMO);
  }
  async registrar(email: string, clave: string) {
    const mail = email.trim().toLowerCase();
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(mail)) throw new ErrorAuth('Revisá el email.');
    if (clave.length < 8) throw new ErrorAuth('La contraseña tiene que tener al menos 8 caracteres.');
    const cuentas = cuentasGuardadas();
    if (mail === USUARIO_DEMO.email || cuentas.some((c) => c.email === mail)) {
      throw new ErrorAuth('Ya hay una cuenta con ese email. Ingresá con tu contraseña o restablecela.');
    }
    const ahora = new Date().toISOString();
    const uid = `demo${Date.now().toString(36)}${cuentas.length}`;
    escribir(CLAVE_CUENTAS, [...cuentas, { uid, email: mail, clave, nombre: '', creado: ahora, ultimoIngreso: ahora }]);
    escribir(CLAVE_SESION, uid);
    this.usuario.emitir({ uid, email: mail });
    return uid;
  }
  async recuperar(email: string) {
    if (!email.includes('@')) throw new ErrorAuth('Revisá el email.');
  }
  async salir() {
    escribir(CLAVE_SESION, 'salio');
    this.usuario.emitir(null);
  }
  async token() {
    return 'token-demo';
  }
}

class CuentasDemo implements ServicioCuentas {
  private cambios = new Emisor(0);

  private accesoDe(uid: string): Acceso {
    const accesos = leer<Record<string, unknown>>(CLAVE_ACCESOS, {});
    return { admin: uid === USUARIO_DEMO.uid, anterior: false, secciones: sanearSecciones(accesos[uid]) };
  }

  acceso(uid: string, cb: (a: Acceso) => void) {
    return this.cambios.suscribir(() => cb(this.accesoDe(uid)));
  }

  async anotar({ uid, email, nombre }: { uid: string; email: string; nombre?: string }) {
    if (uid === USUARIO_DEMO.uid) return;
    const cuentas = cuentasGuardadas().map((c) => (c.uid === uid ? { ...c, email, nombre: nombre ?? c.nombre, ultimoIngreso: new Date().toISOString() } : c));
    escribir(CLAVE_CUENTAS, cuentas);
    this.cambios.emitir(this.cambios.actual + 1);
  }

  cuentas(cb: (c: CuentaConAcceso[]) => void) {
    return this.cambios.suscribir(() => {
      const propias = cuentasGuardadas().map(({ clave: _clave, ...c }) => ({ ...c, acceso: this.accesoDe(c.uid) }));
      const demo: CuentaConAcceso = {
        uid: USUARIO_DEMO.uid,
        email: USUARIO_DEMO.email!,
        nombre: '',
        creado: '2026-11-01T12:00:00.000Z',
        ultimoIngreso: new Date().toISOString(),
        acceso: this.accesoDe(USUARIO_DEMO.uid),
      };
      cb([...propias.sort((a, b) => b.creado.localeCompare(a.creado)), demo]);
    });
  }

  async guardarSecciones(uid: string, secciones: Acceso['secciones']) {
    const accesos = leer<Record<string, unknown>>(CLAVE_ACCESOS, {});
    escribir(CLAVE_ACCESOS, { ...accesos, [uid]: sanearSecciones(secciones) });
    this.cambios.emitir(this.cambios.actual + 1);
  }
}

const RESPUESTA_FOTO: RespuestaIA = {
  items: [
    { n: 'Carne a la cacerola', por: '1 porción grande (200 g cocida)', p: 52, c: 4, g: 22, k: 430 },
    { n: 'Papas hervidas en salsa', por: '1 plato (300 g)', p: 6, c: 55, g: 2, k: 260 },
  ],
  comentario: 'Plato con buena proteína; las papas aportan casi todos los hidratos.',
};

function respuestaTexto(descripcion: string): RespuestaIA {
  return {
    items: [{ n: descripcion.slice(0, 60) || 'Comida', por: '1 porción', p: 25, c: 30, g: 12, k: 330 }],
    comentario: 'Cálculo simulado del modo demo.',
  };
}

export function crearServiciosDemo(): Servicios {
  return {
    modo: 'demo',
    auth: new AuthDemo(),
    crearAlmacen: (uid) => new AlmacenDemo(`libreta-demo-datos-${uid}`),
    cuentas: new CuentasDemo(),
    ia: {
      disponible: true,
      estimar: (p, signal) =>
        new Promise((resolve, reject) => {
          // Igual que el servicio real: sin señal no se puede calcular.
          if (!navigator.onLine) {
            reject(new ErrorIA('sin-conexion', 'Necesitás conexión para calcular. Mientras tanto, cargalo desde la lista o en Manual.'));
            return;
          }
          const t = setTimeout(() => {
            if (p.imagenes.length) {
              // Cada foto es un plato distinto: el simulador repite el plato por foto.
              const items = p.imagenes.flatMap((_, i) =>
                RESPUESTA_FOTO.items.map((it) => ({ ...it, n: p.imagenes.length > 1 ? `${it.n} (plato ${i + 1})` : it.n })),
              );
              resolve({ items, comentario: RESPUESTA_FOTO.comentario });
            } else resolve(respuestaTexto(p.descripcion));
          }, 400);
          signal.addEventListener('abort', () => {
            clearTimeout(t);
            reject(new ErrorIA('cancelado', ''));
          });
        }),
    },
  };
}
