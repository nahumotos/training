import type { Acceso } from '../servicios/tipos';
import type { Seccion } from './tipos';

/** Secciones que el admin habilita por cuenta. Rutina está siempre. */
export const SECCIONES_OPCIONALES: readonly Exclude<Seccion, 'rutina'>[] = ['comidas', 'progreso', 'plan'];

export const NOMBRES_SECCION: Record<Seccion, string> = {
  rutina: 'Rutina',
  comidas: 'Comidas',
  progreso: 'Progreso',
  plan: 'Plan',
};

/** Acceso de una cuenta nueva: solo Rutina. */
export const ACCESO_INICIAL: Acceso = { admin: false, anterior: false, secciones: [] };

export function puede(a: Acceso, s: Seccion): boolean {
  return s === 'rutina' || a.admin || a.anterior || a.secciones.includes(s);
}

/** Deja solo secciones conocidas, sin repetir y en orden. */
export function sanearSecciones(v: unknown): Exclude<Seccion, 'rutina'>[] {
  if (!Array.isArray(v)) return [];
  return SECCIONES_OPCIONALES.filter((s) => v.includes(s));
}
