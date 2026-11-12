// Servicios del modo demo: sin Firebase y con la IA simulada.

import { AlmacenDemo } from './almacen/demo';
import { Emisor } from './almacen/comun';
import { ErrorAuth, ErrorIA, type Autenticacion, type RespuestaIA, type Servicios, type Usuario } from './tipos';

const USUARIO_DEMO: Usuario = { uid: 'demo', email: 'demo@libreta.local' };
const CLAVE_SESION = 'libreta-demo-sesion';

function sesionGuardada(): boolean {
  try {
    return localStorage.getItem(CLAVE_SESION) !== 'salio';
  } catch {
    return true;
  }
}

class AuthDemo implements Autenticacion {
  private usuario = new Emisor<Usuario | null>(sesionGuardada() ? USUARIO_DEMO : null);

  observar(cb: (u: Usuario | null) => void) {
    return this.usuario.suscribir(cb);
  }
  async ingresar(email: string, clave: string) {
    if (!email.includes('@') || clave.length < 6) throw new ErrorAuth('El email o la contraseña no coinciden.');
    try {
      localStorage.removeItem(CLAVE_SESION);
    } catch {
      /* sin almacenamiento: la sesión dura lo que la pestaña */
    }
    this.usuario.emitir(USUARIO_DEMO);
  }
  async recuperar(email: string) {
    if (!email.includes('@')) throw new ErrorAuth('Revisá el email.');
  }
  async salir() {
    try {
      localStorage.setItem(CLAVE_SESION, 'salio');
    } catch {
      /* idem */
    }
    this.usuario.emitir(null);
  }
  async token() {
    return 'token-demo';
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
              const items = p.imagenes.flatMap((_, i) => RESPUESTA_FOTO.items.map((it) => ({ ...it, n: p.imagenes.length > 1 ? `${it.n} (plato ${i + 1})` : it.n })));
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
