// Cálculos para la pantalla Progreso y el resumen semanal.

import { diasHechosEnSemana, etiquetaUnidad, fechaEnSemana, seriesHechas, totalConBarra } from './rutina';
import { totalesDia } from './comidas';
import { capitalizar, diaMes, fechaCorta, horaDeMinutos, minutosDeHora, rotuloSemana, sumarDias } from './fechas';
import { num } from './formato';
import type { Dia, Ejercicio, Objetivos, Rutina, SerieHecha, Sesion } from './tipos';

export interface MejorSerie {
  fecha: string;
  peso: number | null;
  reps: number;
}

/** Mejor serie de cada sesión de un ejercicio: más peso y, a igual peso, más repeticiones. */
export function mejoresSeries(exId: string, sesiones: Sesion[]): MejorSerie[] {
  const porFecha = new Map<string, MejorSerie>();
  for (const s of sesiones) {
    for (const serie of s.ejercicios[exId] ?? []) {
      if (!serie) continue;
      const actual = porFecha.get(s.fecha);
      if (!actual || esMejor(serie, actual)) porFecha.set(s.fecha, { fecha: s.fecha, peso: serie.peso, reps: serie.reps });
    }
  }
  return [...porFecha.values()].sort((a, b) => a.fecha.localeCompare(b.fecha));
}

function esMejor(a: Pick<SerieHecha, 'peso' | 'reps'>, b: Pick<MejorSerie, 'peso' | 'reps'>): boolean {
  const pa = a.peso ?? 0;
  const pb = b.peso ?? 0;
  return pa > pb || (pa === pb && a.reps > b.reps);
}

export function textoSerie(ex: Pick<Ejercicio, 'unidad'>, s: Pick<SerieHecha, 'peso' | 'reps'>): string {
  if (ex.unidad === 'corporal' || s.peso === null) return `${s.reps} reps`;
  const total = totalConBarra(s.peso, ex.unidad);
  const base = `${num(s.peso, 2)} ${etiquetaUnidad(ex.unidad)} × ${s.reps}`;
  return total === null ? base : `${base} (total ${num(total, 2)} kg)`;
}

/** Ejercicios básicos de la rutina con su definición (el primero con ese id). */
export function ejerciciosBasicos(rutina: Rutina): Ejercicio[] {
  const vistos = new Map<string, Ejercicio>();
  for (const d of rutina.dias) for (const e of d.ex) if (e.basico && !vistos.has(e.id)) vistos.set(e.id, e);
  return [...vistos.values()];
}

export function promedio(valores: number[]): number | null {
  return valores.length ? valores.reduce((a, b) => a + b, 0) / valores.length : null;
}

/** Promedio de horas como HH:MM, tolerando que algunas pasen la medianoche (acostarse 23:30 y 0:30). */
export function promedioHora(horas: string[], corte = 12 * 60): string | null {
  const minutos = horas.map(minutosDeHora).filter((m): m is number => m !== null);
  if (!minutos.length) return null;
  // Las horas antes del corte se cuentan como del día siguiente para promediar acostarse.
  const ajustados = minutos.map((m) => (m < corte ? m + 1440 : m));
  const p = promedio(ajustados);
  return p === null ? null : horaDeMinutos(p);
}

export interface ResumenSemana {
  lunes: string;
  entrenamientos: { hechos: number; total: number; dias: string[]; faltaron: string[] };
  diasCargados: number;
  diasConProteina: number;
  diasCuatroComidas: number;
  proteinaProm: number | null;
  kcalProm: number | null;
  aguaProm: number | null;
  pasosProm: number | null;
  acostoProm: string | null;
  levantoProm: string | null;
  energiaProm: number | null;
  ultimoPeso: { fecha: string; valor: number } | null;
  ultimaCintura: { fecha: string; valor: number } | null;
  molestias: { fecha: string; texto: string }[];
  notas: { fecha: string; texto: string }[];
  mejores: { ex: Ejercicio; serie: MejorSerie | null }[];
}

export function resumenSemana(lunes: string, dias: Dia[], sesiones: Sesion[], o: Objetivos, hoy: string, rutina: Rutina): ResumenSemana {
  const domingo = sumarDias(lunes, 6);
  const delaSemana = dias.filter((d) => d.fecha >= lunes && d.fecha <= domingo).sort((a, b) => a.fecha.localeCompare(b.fecha));
  const sesionesSemana = sesiones.filter((s) => s.fecha >= lunes && s.fecha <= domingo);
  // Solo cuentan los días de la rutina actual (no los de una rutina anterior).
  const hechos = diasHechosEnSemana(sesionesSemana, lunes);
  const conComida = delaSemana.map((d) => ({ d, t: totalesDia(d, o.umbralComida) })).filter((x) => x.t.conComida);

  const ultimo = (campo: 'peso' | 'cintura') => {
    const d = [...delaSemana].reverse().find((x) => x[campo] !== null);
    return d ? { fecha: d.fecha, valor: d[campo] as number } : null;
  };

  // Un día de rutina "faltó" solo si ya pasó.
  const faltaron = rutina.dias.filter((r) => !hechos.has(r.id) && fechaEnSemana(lunes, r.dow) < hoy).map((r) => r.nombre);

  return {
    lunes,
    entrenamientos: {
      hechos: rutina.dias.filter((r) => hechos.has(r.id)).length,
      total: rutina.dias.length,
      dias: rutina.dias.filter((r) => hechos.has(r.id)).map((r) => r.nombre),
      faltaron,
    },
    diasCargados: conComida.length,
    diasConProteina: conComida.filter((x) => x.t.p >= o.proteina.min).length,
    diasCuatroComidas: conComida.filter((x) => x.t.comidasConProteina >= 4).length,
    proteinaProm: promedio(conComida.map((x) => x.t.p)),
    kcalProm: promedio(conComida.map((x) => x.t.k)),
    aguaProm: promedio(delaSemana.filter((d) => d.agua > 0).map((d) => d.agua)),
    pasosProm: promedio(delaSemana.map((d) => d.pasos).filter((p): p is number => p !== null && p > 0)),
    acostoProm: promedioHora(delaSemana.map((d) => d.acosto)),
    levantoProm: promedioHora(delaSemana.map((d) => d.levanto), 0),
    energiaProm: promedio(delaSemana.map((d) => d.energia).filter((e): e is number => e !== null)),
    ultimoPeso: ultimo('peso'),
    ultimaCintura: ultimo('cintura'),
    molestias: delaSemana.filter((d) => d.molestias.trim()).map((d) => ({ fecha: d.fecha, texto: d.molestias.trim() })),
    notas: delaSemana.filter((d) => d.nota.trim()).map((d) => ({ fecha: d.fecha, texto: d.nota.trim() })),
    mejores: ejerciciosBasicos(rutina).map((ex) => {
      const series = mejoresSeries(ex.id, sesionesSemana);
      const mejor = series.reduce<MejorSerie | null>((a, s) => (!a || esMejor(s, a) ? s : a), null);
      return { ex, serie: mejor };
    }),
  };
}

/** Texto del resumen semanal para pegar en el chat de coaching. */
export function textoResumen(r: ResumenSemana, notaSemana: string, o: Objetivos): string {
  const l: string[] = [];
  const n0 = (v: number | null, suf = '') => (v === null ? 'sin datos' : `${num(v)}${suf}`);
  l.push(`Resumen semanal · ${rotuloSemana(r.lunes)}`);
  l.push('');
  l.push('ENTRENAMIENTO');
  l.push(`- Entrenamientos: ${r.entrenamientos.hechos} de ${r.entrenamientos.total}${r.entrenamientos.dias.length ? ` (${r.entrenamientos.dias.join(', ')})` : ''}`);
  if (r.entrenamientos.faltaron.length) l.push(`- Faltaron: ${r.entrenamientos.faltaron.join(', ')}`);
  l.push('- Mejor serie de los básicos:');
  for (const m of r.mejores) {
    l.push(`  - ${m.ex.n}: ${m.serie ? `${textoSerie(m.ex, m.serie)} (${fechaCorta(m.serie.fecha)})` : 'no se hizo'}`);
  }
  l.push('');
  l.push('COMIDA');
  l.push(`- Días cargados: ${r.diasCargados} de 7`);
  l.push(`- Días con ${o.proteina.min} g de proteína o más: ${r.diasConProteina}`);
  l.push(`- Días con las 4 comidas con proteína: ${r.diasCuatroComidas}`);
  l.push(
    r.proteinaProm === null && r.kcalProm === null
      ? '- Promedio por día cargado: sin datos'
      : `- Promedio por día cargado: ${n0(r.proteinaProm, ' g')} de proteína y ${n0(r.kcalProm, ' kcal')}`,
  );
  l.push(`- Agua promedio: ${r.aguaProm === null ? 'sin datos' : `${num(r.aguaProm / 1000, 2)} L`}`);
  l.push('');
  l.push('HÁBITOS Y CUERPO');
  l.push(`- Pasos promedio: ${n0(r.pasosProm)}`);
  l.push(`- Sueño promedio: ${r.acostoProm && r.levantoProm ? `de ${r.acostoProm} a ${r.levantoProm}` : 'sin datos'}`);
  l.push(`- Energía promedio: ${r.energiaProm === null ? 'sin datos' : `${num(r.energiaProm, 1)} de 5`}`);
  l.push(`- Peso: ${r.ultimoPeso ? `${num(r.ultimoPeso.valor, 1)} kg (${diaMes(r.ultimoPeso.fecha)})` : 'no se midió'}`);
  l.push(`- Cintura: ${r.ultimaCintura ? `${num(r.ultimaCintura.valor, 1)} cm (${diaMes(r.ultimaCintura.fecha)})` : 'no se midió'}`);
  l.push(`- Molestias: ${r.molestias.length ? r.molestias.map((m) => `${fechaCorta(m.fecha)}: ${m.texto}`).join('; ') : 'ninguna'}`);
  if (r.notas.length) {
    l.push('- Notas de los días:');
    for (const nota of r.notas) l.push(`  - ${capitalizar(fechaCorta(nota.fecha))}: ${nota.texto}`);
  }
  l.push('');
  l.push(`QUÉ ME COSTÓ: ${notaSemana.trim() || 'sin completar'}`);
  return l.join('\n');
}

/** Totales por día para gráficos de la semana. */
export function serieSemana(lunes: string, dias: Dia[], o: Objetivos): { fecha: string; p: number | null; k: number | null }[] {
  const porFecha = new Map(dias.map((d) => [d.fecha, d]));
  return Array.from({ length: 7 }, (_, i) => {
    const fecha = sumarDias(lunes, i);
    const d = porFecha.get(fecha);
    if (!d) return { fecha, p: null, k: null };
    const t = totalesDia(d, o.umbralComida);
    return t.conComida ? { fecha, p: t.p, k: t.k } : { fecha, p: null, k: null };
  });
}

export function sesionConSeries(s: Sesion): boolean {
  return seriesHechas(s) > 0;
}
