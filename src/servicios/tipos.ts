import type { Almacen, Desuscribir } from './almacen/tipos';

export interface Usuario {
  uid: string;
  email: string | null;
}

export class ErrorAuth extends Error {}

export interface Autenticacion {
  observar(cb: (u: Usuario | null) => void): Desuscribir;
  /** Lanza ErrorAuth con un mensaje para mostrar. */
  ingresar(email: string, clave: string): Promise<void>;
  /** Lanza ErrorAuth con un mensaje para mostrar. */
  recuperar(email: string): Promise<void>;
  salir(): Promise<void>;
  /** Token de identidad para servicios propios (el Worker de IA). */
  token(): Promise<string | null>;
}

// ---------- IA ----------

export interface ItemIA {
  n: string;
  por: string;
  p: number;
  c: number;
  g: number;
  k: number;
}

export interface RespuestaIA {
  items: ItemIA[];
  comentario: string;
}

export interface PedidoIA {
  descripcion: string;
  imagenes: Blob[];
  objetivoProteina: number;
}

export type CodigoErrorIA = 'sin-conexion' | 'sesion' | 'sin-permiso' | 'limite' | 'tamano' | 'cancelado' | 'servidor';

export class ErrorIA extends Error {
  constructor(
    public codigo: CodigoErrorIA,
    mensaje: string,
  ) {
    super(mensaje);
  }
}

export interface ServicioIA {
  /** false si no hay un servicio configurado: la interfaz oculta la opción. */
  disponible: boolean;
  estimar(p: PedidoIA, signal: AbortSignal): Promise<RespuestaIA>;
}

export interface Servicios {
  modo: 'demo' | 'firebase';
  auth: Autenticacion;
  crearAlmacen(uid: string): Almacen;
  ia: ServicioIA;
}
