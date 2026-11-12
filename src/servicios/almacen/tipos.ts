import type { AlimentoPropio, Dia, Exportacion, NotaEjercicio, NotaSemana, Perfil, Sesion } from '../../dominio/tipos';

export type Desuscribir = () => void;

export interface EstadoSync {
  enLinea: boolean;
  /** Cambios guardados en el dispositivo que todavía no llegaron al servidor. */
  pendientes: number;
}

export type MotivoError = 'sin-acceso' | 'otro';

export interface ResultadoImportacion {
  dias: number;
  alimentos: number;
  notas: number;
  sesiones: number;
  semanas: number;
  perfil: boolean;
}

/**
 * Acceso a los datos de un usuario. Las lecturas son suscripciones: el callback
 * se llama con el estado actual y otra vez con cada cambio. Las escrituras se
 * aplican enseguida en el dispositivo; la promesa se resuelve cuando el cambio
 * llega al servidor, así que la interfaz no las espera.
 */
export interface Almacen {
  perfil(cb: (p: Perfil | null) => void): Desuscribir;
  guardarPerfil(p: Perfil): Promise<void>;

  dia(fecha: string, cb: (d: Dia | null) => void): Desuscribir;
  /** Días con fecha entre desde y hasta, inclusive. */
  dias(desde: string, hasta: string, cb: (d: Dia[]) => void): Desuscribir;
  guardarDia(d: Dia): Promise<void>;

  alimentos(cb: (a: AlimentoPropio[]) => void): Desuscribir;
  guardarAlimento(a: AlimentoPropio): Promise<void>;
  borrarAlimento(id: string): Promise<void>;

  notas(cb: (n: Record<string, NotaEjercicio>) => void): Desuscribir;
  guardarNota(exId: string, n: NotaEjercicio): Promise<void>;

  /** Sesiones con fecha desde `desde` en adelante. */
  sesiones(desde: string, cb: (s: Sesion[]) => void): Desuscribir;
  guardarSesion(s: Sesion): Promise<void>;
  borrarSesion(id: string): Promise<void>;

  semana(lunes: string, cb: (n: NotaSemana | null) => void): Desuscribir;
  guardarSemana(n: NotaSemana): Promise<void>;

  exportar(): Promise<Exportacion>;
  importar(e: Exportacion): Promise<ResultadoImportacion>;

  estado(cb: (e: EstadoSync) => void): Desuscribir;
  /** Errores de lectura (por ejemplo, una cuenta sin acceso). */
  errores(cb: (motivo: MotivoError) => void): Desuscribir;
}
