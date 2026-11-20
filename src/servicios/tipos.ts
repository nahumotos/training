import type { Seccion } from '../dominio/tipos';
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
  /** Crea la cuenta y deja la sesión iniciada. Devuelve el uid. Lanza ErrorAuth con un mensaje para mostrar. */
  registrar(email: string, clave: string): Promise<string>;
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

// ---------- Cuentas y permisos ----------

/** Qué puede ver una cuenta. Rutina está siempre habilitada. */
export interface Acceso {
  /** Entra al panel de administración y cambia los permisos de las demás cuentas. */
  admin: boolean;
  /** Cuenta habilitada a mano antes del registro abierto (lista «permitidos»): ve todo. */
  anterior: boolean;
  /** Secciones habilitadas por el admin, además de Rutina. */
  secciones: Seccion[];
}

/** Datos de una cuenta para el panel de administración. */
export interface Cuenta {
  uid: string;
  email: string;
  nombre: string;
  /** ISO. */
  creado: string;
  /** ISO. */
  ultimoIngreso: string;
}

export interface CuentaConAcceso extends Cuenta {
  acceso: Acceso;
}

export interface ServicioCuentas {
  /** Permisos de una cuenta; se vuelve a llamar cuando el admin los cambia. */
  acceso(uid: string, cb: (a: Acceso) => void): Desuscribir;
  /** Anota la cuenta (email, nombre, último ingreso) para que aparezca en el panel de administración. */
  anotar(c: { uid: string; email: string; nombre?: string }): Promise<void>;
  /** Solo admin: todas las cuentas con sus permisos, ordenadas de la más nueva a la más vieja. */
  cuentas(cb: (c: CuentaConAcceso[]) => void, alError: () => void): Desuscribir;
  /** Solo admin: qué secciones ve una cuenta (además de Rutina). */
  guardarSecciones(uid: string, secciones: Seccion[]): Promise<void>;
}

export interface Servicios {
  modo: 'demo' | 'firebase';
  auth: Autenticacion;
  crearAlmacen(uid: string): Almacen;
  cuentas: ServicioCuentas;
  ia: ServicioIA;
}
