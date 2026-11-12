import type { ComidaId, Dia, ItemComida, Objetivos } from './tipos';

export interface DefComida {
  id: ComidaId;
  nombre: string;
  hora: string;
  /** "al desayuno", "a la merienda"… */
  a: string;
  /** Cuenta para "comidas con proteína". */
  principal: boolean;
}

export const COMIDAS: DefComida[] = [
  { id: 'desayuno', nombre: 'Desayuno', hora: '8:45', a: 'al desayuno', principal: true },
  { id: 'almuerzo', nombre: 'Almuerzo', hora: '12:30', a: 'al almuerzo', principal: true },
  { id: 'merienda', nombre: 'Merienda', hora: '15:30', a: 'a la merienda', principal: true },
  { id: 'cena', nombre: 'Cena', hora: '21:00', a: 'a la cena', principal: true },
  { id: 'extras', nombre: 'Extras', hora: 'Picoteo y bebidas', a: 'a extras', principal: false },
];

export const IDS_COMIDA: ComidaId[] = COMIDAS.map((c) => c.id);

export function esComidaId(s: unknown): s is ComidaId {
  return typeof s === 'string' && (IDS_COMIDA as string[]).includes(s);
}

export function diaVacio(fecha: string): Dia {
  return {
    fecha,
    comidas: { desayuno: [], almuerzo: [], merienda: [], cena: [], extras: [] },
    agua: 0,
    pasos: null,
    acosto: '',
    levanto: '',
    energia: null,
    peso: null,
    cintura: null,
    molestias: '',
    nota: '',
  };
}

export interface Macros {
  p: number;
  k: number;
  /** Hidratos de los alimentos que lo informan. */
  c: number;
  /** Grasas de los alimentos que lo informan. */
  g: number;
  /** true si algún alimento no informa hidratos o grasas. */
  parcial: boolean;
}

export function macrosDe(items: ItemComida[]): Macros {
  const t: Macros = { p: 0, k: 0, c: 0, g: 0, parcial: false };
  for (const it of items) {
    t.p += it.p * it.q;
    t.k += it.k * it.q;
    if (it.c === null || it.g === null) t.parcial = true;
    else {
      t.c += it.c * it.q;
      t.g += it.g * it.q;
    }
  }
  return t;
}

export interface TotalesDia extends Macros {
  porComida: Record<ComidaId, Macros>;
  /** Comidas principales con al menos el umbral de proteína. */
  comidasConProteina: number;
  /** true si el día tiene al menos un alimento. */
  conComida: boolean;
}

export function totalesDia(dia: Dia, umbralComida: number): TotalesDia {
  const porComida = {} as Record<ComidaId, Macros>;
  const total: Macros = { p: 0, k: 0, c: 0, g: 0, parcial: false };
  let comidasConProteina = 0;
  let conComida = false;
  for (const def of COMIDAS) {
    const items = dia.comidas[def.id];
    if (items.length) conComida = true;
    const m = macrosDe(items);
    porComida[def.id] = m;
    total.p += m.p;
    total.k += m.k;
    total.c += m.c;
    total.g += m.g;
    total.parcial ||= m.parcial;
    if (def.principal && m.p >= umbralComida) comidasConProteina++;
  }
  return { ...total, porComida, comidasConProteina, conComida };
}

export type EstadoKcal = { tipo: 'faltan'; cuanto: number } | { tipo: 'rango' } | { tipo: 'arriba'; cuanto: number };

export function estadoKcal(k: number, o: Objetivos): EstadoKcal {
  if (k < o.kcal.min) return { tipo: 'faltan', cuanto: Math.round((o.kcal.min + o.kcal.max) / 2 - k) };
  if (k <= o.kcal.max) return { tipo: 'rango' };
  return { tipo: 'arriba', cuanto: Math.round(k - o.kcal.max) };
}

export function llegaProteina(p: number, o: Objetivos): boolean {
  return p >= o.proteina.min;
}

/** Próxima comida principal sin cargar según la hora, para sugerirla en Hoy. */
export function proximaComida(dia: Dia, ahora: Date): DefComida | null {
  const minutos = ahora.getHours() * 60 + ahora.getMinutes();
  // Una comida se sugiere desde una hora antes de su horario.
  const horarios: Record<ComidaId, number> = { desayuno: 0, almuerzo: 11 * 60, merienda: 14 * 60 + 30, cena: 19 * 60, extras: 24 * 60 };
  const pendientes = COMIDAS.filter((c) => c.principal && dia.comidas[c.id].length === 0);
  const vigente = [...pendientes].reverse().find((c) => horarios[c.id] <= minutos);
  return vigente ?? pendientes[0] ?? null;
}

export function nuevoId(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}

/** Alimentos usados en los últimos días, del más usado al menos usado (empate: el más reciente). */
export function recientes(dias: Dia[], limite = 12): ItemComida[] {
  const vistos = new Map<string, { item: ItemComida; veces: number; ultimo: string }>();
  for (const d of dias) {
    for (const c of IDS_COMIDA) {
      for (const it of d.comidas[c]) {
        const clave = (it.ref ?? it.n).toLowerCase();
        const v = vistos.get(clave);
        if (v) {
          v.veces++;
          if (d.fecha >= v.ultimo) {
            v.ultimo = d.fecha;
            v.item = it;
          }
        } else vistos.set(clave, { item: it, veces: 1, ultimo: d.fecha });
      }
    }
  }
  return [...vistos.values()]
    .sort((a, b) => b.veces - a.veces || b.ultimo.localeCompare(a.ultimo))
    .slice(0, limite)
    .map((v) => v.item);
}

/** Proporción de calorías por macronutriente, en porcentaje entero que suma 100. */
export function proporciones(m: Pick<Macros, 'p' | 'c' | 'g'>): { p: number; c: number; g: number } | null {
  const ep = m.p * 4;
  const ec = m.c * 4;
  const eg = m.g * 9;
  const total = ep + ec + eg;
  if (total <= 0) return null;
  const p = Math.round((ep / total) * 100);
  const c = Math.round((ec / total) * 100);
  return { p, c, g: Math.max(0, 100 - p - c) };
}
