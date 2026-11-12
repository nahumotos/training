// Saneo de datos que vienen de afuera del código: almacenamiento, importación o la IA.
// Nada de lo que se lee se usa sin pasar por acá: valores fuera de rango o con tipos
// incorrectos se descartan en lugar de romper la interfaz.

import { diaVacio, IDS_COMIDA, nuevoId } from './comidas';
import { esFechaIso, minutosDeHora } from './fechas';
import { OBJETIVOS_INICIALES, perfilInicial, validarObjetivos } from './perfil';
import type {
  AlimentoPropio,
  Dia,
  Exportacion,
  ItemComida,
  NotaEjercicio,
  NotaSemana,
  Objetivos,
  OrigenItem,
  Perfil,
  SerieHecha,
  Sesion,
} from './tipos';

type Crudo = Record<string, unknown>;

const esObjeto = (v: unknown): v is Crudo => typeof v === 'object' && v !== null && !Array.isArray(v);

/** Número dentro de [min, max] o null. */
export function numero(v: unknown, min: number, max: number): number | null {
  if (typeof v !== 'number' && typeof v !== 'string') return null;
  if (typeof v === 'string' && v.trim() === '') return null;
  const n = Number(v);
  return Number.isFinite(n) && n >= min && n <= max ? n : null;
}

export function texto(v: unknown, max: number): string {
  return typeof v === 'string' ? v.slice(0, max) : '';
}

const ORIGENES: OrigenItem[] = ['lib', 'mio', 'ia', 'manual'];

export const LIMITES = {
  q: [0.25, 20],
  p: [0, 300],
  c: [0, 1000],
  g: [0, 500],
  k: [0, 5000],
  agua: [0, 10000],
  pasos: [0, 100000],
  peso: [30, 250],
  cintura: [40, 200],
  energia: [1, 5],
} as const satisfies Record<string, readonly [number, number]>;

export function sanearItem(v: unknown): ItemComida | null {
  if (!esObjeto(v)) return null;
  const n = texto(v.n, 80).trim();
  if (!n) return null;
  const p = numero(v.p, ...LIMITES.p);
  const k = numero(v.k, ...LIMITES.k);
  if (p === null || k === null) return null;
  const src = ORIGENES.includes(v.src as OrigenItem) ? (v.src as OrigenItem) : 'manual';
  const item: ItemComida = {
    id: texto(v.id, 40) || nuevoId(),
    n,
    por: texto(v.por, 60),
    q: numero(v.q, ...LIMITES.q) ?? 1,
    p,
    c: numero(v.c, ...LIMITES.c),
    g: numero(v.g, ...LIMITES.g),
    k,
    src,
  };
  const ref = texto(v.ref, 60);
  if (ref) item.ref = ref;
  return item;
}

export function sanearDia(fecha: string, v: unknown): Dia {
  const d = diaVacio(fecha);
  if (!esObjeto(v)) return d;
  const comidas = esObjeto(v.comidas) ? v.comidas : {};
  for (const id of IDS_COMIDA) {
    const lista = Array.isArray(comidas[id]) ? (comidas[id] as unknown[]) : [];
    d.comidas[id] = lista.map(sanearItem).filter((x): x is ItemComida => x !== null).slice(0, 60);
  }
  d.agua = numero(v.agua, ...LIMITES.agua) ?? 0;
  d.pasos = numero(v.pasos, ...LIMITES.pasos);
  if (d.pasos !== null) d.pasos = Math.round(d.pasos);
  d.acosto = typeof v.acosto === 'string' && minutosDeHora(v.acosto) !== null ? v.acosto : '';
  d.levanto = typeof v.levanto === 'string' && minutosDeHora(v.levanto) !== null ? v.levanto : '';
  const energia = numero(v.energia, ...LIMITES.energia);
  d.energia = energia === null ? null : Math.round(energia);
  d.peso = numero(v.peso, ...LIMITES.peso);
  d.cintura = numero(v.cintura, ...LIMITES.cintura);
  d.molestias = texto(v.molestias, 300);
  d.nota = texto(v.nota, 1000);
  return d;
}

export function sanearAlimentoPropio(id: string, v: unknown): AlimentoPropio | null {
  if (!esObjeto(v)) return null;
  const n = texto(v.n, 80).trim();
  const p = numero(v.p, ...LIMITES.p);
  const k = numero(v.k, ...LIMITES.k);
  if (!n || p === null || k === null || !id) return null;
  return {
    id,
    n,
    por: texto(v.por, 60) || '1 porción',
    p,
    c: numero(v.c, ...LIMITES.c),
    g: numero(v.g, ...LIMITES.g),
    k,
    creado: texto(v.creado, 40) || new Date().toISOString(),
  };
}

export function sanearNota(v: unknown): NotaEjercicio | null {
  if (!esObjeto(v)) return null;
  return {
    peso: numero(v.peso, 0, 1000),
    nota: texto(v.nota, 300),
    actualizado: texto(v.actualizado, 40),
  };
}

function sanearSerie(v: unknown): SerieHecha | null {
  if (!esObjeto(v)) return null;
  const reps = numero(v.reps, 0, 200);
  if (reps === null) return null;
  return { peso: numero(v.peso, 0, 1000), reps: Math.round(reps), t: texto(v.t, 40) };
}

export function sanearSesion(id: string, v: unknown): Sesion | null {
  if (!esObjeto(v)) return null;
  const fecha = v.fecha;
  const dia = texto(v.dia, 40);
  if (!esFechaIso(fecha) || !dia) return null;
  const ejercicios: Sesion['ejercicios'] = {};
  if (esObjeto(v.ejercicios)) {
    for (const [exId, series] of Object.entries(v.ejercicios)) {
      if (!Array.isArray(series) || exId.length > 60) continue;
      ejercicios[exId] = series.slice(0, 12).map(sanearSerie);
    }
  }
  return {
    id: id || `${fecha}_${dia}`,
    dia,
    fecha,
    inicio: texto(v.inicio, 40),
    fin: typeof v.fin === 'string' ? v.fin.slice(0, 40) : null,
    ejercicios,
  };
}

function sanearObjetivos(v: unknown): Objetivos {
  const base = structuredClone(OBJETIVOS_INICIALES);
  if (!esObjeto(v)) return base;
  const rango = (x: unknown, def: { min: number; max: number }) =>
    esObjeto(x) ? { min: numero(x.min, 0, 10000) ?? def.min, max: numero(x.max, 0, 10000) ?? def.max } : def;
  const prot = esObjeto(v.proteina) ? v.proteina : {};
  const o: Objetivos = {
    proteina: {
      obj: numero(prot.obj, 0, 1000) ?? base.proteina.obj,
      min: numero(prot.min, 0, 1000) ?? base.proteina.min,
      max: numero(prot.max, 0, 1000) ?? base.proteina.max,
    },
    kcal: rango(v.kcal, base.kcal),
    hidratos: rango(v.hidratos, base.hidratos),
    grasas: rango(v.grasas, base.grasas),
    agua: numero(v.agua, 0, 10000) ?? base.agua,
    umbralComida: numero(v.umbralComida, 0, 100) ?? base.umbralComida,
  };
  // Si lo guardado es incoherente, se vuelve a los objetivos del plan.
  return validarObjetivos(o).length ? base : o;
}

export function sanearPerfil(v: unknown): Perfil {
  const p = perfilInicial();
  if (!esObjeto(v)) return p;
  p.nombre = texto(v.nombre, 60);
  if (esFechaIso(v.inicioRutina)) p.inicioRutina = v.inicioRutina;
  p.objetivos = sanearObjetivos(v.objetivos);
  return p;
}

export function sanearSemana(lunes: string, v: unknown): NotaSemana | null {
  if (!esFechaIso(lunes) || !esObjeto(v)) return null;
  return { lunes, nota: texto(v.nota, 2000) };
}

export class ErrorImportacion extends Error {}

/** Lee un archivo de exportación. Lanza ErrorImportacion con un mensaje para mostrar si no es válido. */
export function sanearExportacion(v: unknown): Exportacion {
  if (!esObjeto(v) || v.formato !== 'libreta') {
    throw new ErrorImportacion('El archivo no es una exportación de Libreta.');
  }
  if (v.version !== 1) {
    throw new ErrorImportacion('El archivo es de una versión que esta app no conoce.');
  }
  const lista = (x: unknown) => (Array.isArray(x) ? x : []);
  const dias = lista(v.dias)
    .filter((d): d is Crudo => esObjeto(d) && esFechaIso(d.fecha))
    .map((d) => sanearDia(d.fecha as string, d));
  const alimentos = lista(v.alimentos)
    .map((a) => (esObjeto(a) ? sanearAlimentoPropio(texto(a.id, 60), a) : null))
    .filter((a): a is AlimentoPropio => a !== null);
  const notas: Record<string, NotaEjercicio> = {};
  if (esObjeto(v.notas)) {
    for (const [id, n] of Object.entries(v.notas)) {
      const s = sanearNota(n);
      if (s && id.length <= 60) notas[id] = s;
    }
  }
  const sesiones = lista(v.sesiones)
    .map((s) => (esObjeto(s) ? sanearSesion(texto(s.id, 80), s) : null))
    .filter((s): s is Sesion => s !== null);
  const semanas = lista(v.semanas)
    .map((s) => (esObjeto(s) ? sanearSemana(texto(s.lunes, 10), s) : null))
    .filter((s): s is NotaSemana => s !== null);
  return {
    formato: 'libreta',
    version: 1,
    exportado: texto(v.exportado, 40),
    perfil: v.perfil === null || v.perfil === undefined ? null : sanearPerfil(v.perfil),
    dias,
    alimentos,
    notas,
    sesiones,
    semanas,
  };
}
