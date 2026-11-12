import { LIMITES, numero, texto } from '../../dominio/saneo';
import type { ItemIA, RespuestaIA } from '../tipos';

/** Valida la respuesta del servicio de IA. Descarta los alimentos con datos inválidos. */
export function validarRespuestaIA(v: unknown): RespuestaIA {
  const o = typeof v === 'object' && v !== null ? (v as Record<string, unknown>) : {};
  const lista = Array.isArray(o.items) ? o.items : [];
  const items: ItemIA[] = [];
  for (const x of lista.slice(0, 12)) {
    if (typeof x !== 'object' || x === null) continue;
    const r = x as Record<string, unknown>;
    const n = texto(r.n, 80).trim();
    const p = numero(r.p, ...LIMITES.p);
    const k = numero(r.k, ...LIMITES.k);
    if (!n || p === null || k === null) continue;
    items.push({
      n,
      por: texto(r.por, 60).trim(),
      p: Math.round(p * 10) / 10,
      c: Math.round(numero(r.c, ...LIMITES.c) ?? 0),
      g: Math.round(numero(r.g, ...LIMITES.g) ?? 0),
      k: Math.round(k),
    });
  }
  return { items, comentario: texto(o.comentario, 300).trim() };
}
