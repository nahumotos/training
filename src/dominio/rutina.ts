import { diaSemana, diferenciaDias, lunesDe, sumarDias } from './fechas';
import type { DiaRutina, Ejercicio, NivelRutina, NotaEjercicio, ObjetivoRutina, Rutina, SerieHecha, Sesion, UnidadPeso } from './tipos';

export function diaPorId(rutina: Rutina, id: string): DiaRutina | undefined {
  return rutina.dias.find((d) => d.id === id);
}

export const NOMBRES_NIVEL: Record<NivelRutina, string> = { principiante: 'Principiante', intermedio: 'Intermedio', avanzado: 'Avanzado' };

/**
 * Rutinas para sugerir: las de esa cantidad de días y ese objetivo (sin objetivo, todas las de
 * esos días). Si no hay ninguna, las del objetivo con la cantidad de días más parecida.
 * `otras`: las demás de esa cantidad de días.
 */
export function sugerirRutinas(
  plantillas: Rutina[],
  dias: number,
  objetivo: ObjetivoRutina | null,
): { principales: Rutina[]; exactas: boolean; otras: Rutina[] } {
  const elegibles = plantillas.filter((p) => !p.oculta);
  const delObjetivo = elegibles.filter((p) => !objetivo || p.objetivos.includes(objetivo));
  const exactas = delObjetivo.filter((p) => p.frecuencia === dias);
  const otras = elegibles.filter((p) => p.frecuencia === dias && !exactas.includes(p));
  if (exactas.length) return { principales: exactas, exactas: true, otras };
  const distancia = Math.min(...delObjetivo.map((p) => Math.abs(p.frecuencia - dias)));
  return { principales: delObjetivo.filter((p) => Math.abs(p.frecuencia - dias) === distancia), exactas: false, otras };
}

/** Fecha de un día de la semana (0 domingo … 6 sábado) en la semana que empieza en `lunes`. */
export function fechaEnSemana(lunes: string, dow: number): string {
  return sumarDias(lunes, (dow + 6) % 7);
}

const NOMBRES_DIAS = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado'];

/** «lunes, miércoles y viernes». */
export function listaDias(dows: number[]): string {
  const orden = [...dows].sort((a, b) => ((a + 6) % 7) - ((b + 6) % 7)).map((d) => NOMBRES_DIAS[d]!);
  return orden.length > 1 ? `${orden.slice(0, -1).join(', ')} y ${orden.at(-1)}` : (orden[0] ?? '');
}

/** Cómo se organiza la semana, en una línea: «Lunes, miércoles y viernes; sábado, comodín.» */
export function textoSemana(rutina: Rutina): string {
  const entreno = rutina.dias.map((d) => d.dow);
  const comodin = rutina.comodin.filter((d) => !entreno.includes(d));
  const frase = listaDias(entreno);
  return `${frase.charAt(0).toUpperCase()}${frase.slice(1)}${comodin.length ? `; ${listaDias(comodin)}, comodín` : ''}.`;
}

export function idSesion(fecha: string, diaId: string): string {
  return `${fecha}_${diaId}`;
}

export function totalSeries(dia: DiaRutina): number {
  return dia.ex.reduce((a, e) => a + e.s, 0);
}

export function seriesHechas(s: Sesion | null | undefined): number {
  if (!s) return 0;
  return Object.values(s.ejercicios).reduce((a, lista) => a + lista.filter(Boolean).length, 0);
}

// ---------- Qué toca hoy ----------

export type QueToca =
  | { tipo: 'antes'; inicio: string }
  | { tipo: 'entreno'; dia: DiaRutina }
  | { tipo: 'descanso'; consejo: string; domingo: boolean }
  | { tipo: 'comodin'; pendientes: DiaRutina[]; dow: number };

/**
 * Qué corresponde según el día de la semana. Los días de comodín de la rutina (el sábado,
 * en la mayoría) sugieren los entrenamientos que faltaron esa semana.
 */
export function queTocaHoy(hoy: string, inicio: string, sesiones: Sesion[], rutina: Rutina): QueToca {
  if (hoy < inicio) return { tipo: 'antes', inicio };
  const dow = diaSemana(hoy);
  const dia = rutina.dias.find((d) => d.dow === dow);
  if (dia) return { tipo: 'entreno', dia };
  if (rutina.comodin.includes(dow)) {
    const lunes = lunesDe(hoy);
    const hechos = diasHechosEnSemana(sesiones, lunes);
    const pendientes = rutina.dias.filter((d) => !hechos.has(d.id) && fechaEnSemana(lunes, d.dow) >= inicio && fechaEnSemana(lunes, d.dow) < hoy);
    return { tipo: 'comodin', pendientes, dow };
  }
  return { tipo: 'descanso', consejo: rutina.descanso, domingo: dow === 0 };
}

/** Días de rutina con al menos una serie hecha en la semana que empieza en `lunes`. */
export function diasHechosEnSemana(sesiones: Sesion[], lunes: string): Set<string> {
  const domingo = sumarDias(lunes, 6);
  const hechos = new Set<string>();
  for (const s of sesiones) {
    if (s.fecha >= lunes && s.fecha <= domingo && seriesHechas(s) > 0) hechos.add(s.dia);
  }
  return hechos;
}

// ---------- Unidades de peso ----------

export function etiquetaUnidad(u: UnidadPeso): string {
  switch (u) {
    case 'lado-barra':
    case 'lado':
      return 'kg por lado';
    case 'cu':
      return 'kg c/u';
    case 'kg':
      return 'kg';
    case 'corporal':
      return '';
  }
}

export const PESO_BARRA = 20;

/** Peso total levantado con barra, si se puede calcular. */
export function totalConBarra(peso: number | null, u: UnidadPeso): number | null {
  if (peso === null || u !== 'lado-barra') return null;
  return PESO_BARRA + 2 * peso;
}

export function incrementoSugerido(u: UnidadPeso): string {
  switch (u) {
    case 'lado-barra':
    case 'lado':
      return '1,25–2,5 kg por lado';
    case 'cu':
      return '1–2 kg por mancuerna';
    case 'kg':
      return 'una placa';
    case 'corporal':
      return 'más repeticiones o una pausa arriba';
  }
}

// ---------- Historial y progresión ----------

export interface UltimaVez {
  fecha: string;
  series: SerieHecha[];
}

/** Última sesión anterior (distinta de `excluir`) en la que se hizo al menos una serie del ejercicio. */
export function ultimaVez(exId: string, sesiones: Sesion[], excluir?: string): UltimaVez | null {
  let mejor: { s: Sesion; series: SerieHecha[] } | null = null;
  for (const s of sesiones) {
    if (s.id === excluir) continue;
    const series = (s.ejercicios[exId] ?? []).filter((x): x is SerieHecha => x !== null);
    if (!series.length) continue;
    if (!mejor || s.fecha > mejor.s.fecha || (s.fecha === mejor.s.fecha && s.inicio > mejor.s.inicio)) mejor = { s, series };
  }
  return mejor ? { fecha: mejor.s.fecha, series: mejor.series } : null;
}

export function historial(exId: string, sesiones: Sesion[], limite = 4): UltimaVez[] {
  return sesiones
    .map((s) => ({ fecha: s.fecha, inicio: s.inicio, series: (s.ejercicios[exId] ?? []).filter((x): x is SerieHecha => x !== null) }))
    .filter((x) => x.series.length > 0)
    .sort((a, b) => b.fecha.localeCompare(a.fecha) || b.inicio.localeCompare(a.inicio))
    .slice(0, limite)
    .map(({ fecha, series }) => ({ fecha, series }));
}

export type Sugerencia = 'subir' | 'mas-reps';

/** Doble progresión: si todas las series llegaron al máximo del rango, toca subir el peso. */
export function sugerencia(ex: Ejercicio, series: SerieHecha[]): Sugerencia {
  if (series.length >= ex.s && series.slice(0, ex.s).every((s) => s.reps >= ex.r[1])) return 'subir';
  return 'mas-reps';
}

export interface ValorInicialSerie {
  peso: number | null;
  /** Repeticiones de la vez anterior, para mostrarlas como referencia. */
  repsPrevias: number | null;
}

/**
 * Valores con los que arranca cada fila de series: el peso de la última vez
 * (o el anotado como peso de trabajo; si no hay ninguno, vacío) y las repeticiones previas
 * como referencia.
 */
export function valoresIniciales(ex: Ejercicio, ultima: UltimaVez | null, nota: NotaEjercicio | undefined): ValorInicialSerie[] {
  const base = ultima?.series.at(-1)?.peso ?? nota?.peso;
  return Array.from({ length: ex.s }, (_, i) => {
    const previa = ultima?.series[i];
    return {
      peso: ex.unidad === 'corporal' ? null : (previa?.peso ?? base ?? null),
      repsPrevias: previa?.reps ?? null,
    };
  });
}

// ---------- Hábitos por etapa ----------

export interface Etapa {
  num: 1 | 2 | 3;
  semanas: string;
  habitos: string[];
}

export const ETAPAS: Etapa[] = [
  { num: 1, semanas: '1–2', habitos: ['4 comidas con proteína', '4 entrenamientos', 'Caminata de 20 minutos'] },
  { num: 2, semanas: '3–4', habitos: ['Levantarte a la misma hora los 7 días', '1 L de agua fuera del gimnasio', 'Pausas activas'] },
  { num: 3, semanas: '5–8', habitos: ['Cardio 1–2 veces por semana', 'Dejar resuelta la comida del día siguiente', '7.000–8.000 pasos'] },
];

/** Semana del plan (1 = primera) o null antes del inicio. */
export function semanaDelPlan(hoy: string, inicio: string): number | null {
  const d = diferenciaDias(inicio, hoy);
  return d < 0 ? null : Math.floor(d / 7) + 1;
}

export function etapaActual(hoy: string, inicio: string): Etapa | null {
  const sem = semanaDelPlan(hoy, inicio);
  if (sem === null) return null;
  if (sem <= 2) return ETAPAS[0]!;
  if (sem <= 4) return ETAPAS[1]!;
  return ETAPAS[2]!;
}
