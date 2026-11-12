// Formato de números para la interfaz, en español de Argentina.

const cache = new Map<number, Intl.NumberFormat>();

function formateador(decimales: number): Intl.NumberFormat {
  let f = cache.get(decimales);
  if (!f) {
    f = new Intl.NumberFormat('es-AR', { minimumFractionDigits: 0, maximumFractionDigits: decimales });
    cache.set(decimales, f);
  }
  return f;
}

/** 1234.5 → "1.234,5" con hasta `decimales` decimales. */
export function num(n: number, decimales = 0): string {
  return formateador(decimales).format(n);
}

/** Gramos: un decimal por debajo de 10, enteros desde 10. */
export function gramos(n: number): string {
  return Math.abs(n) < 10 ? num(n, 1) : num(n, 0);
}

/** Litros a partir de mililitros: 1750 → "1,75 L". */
export function litros(ml: number): string {
  return `${num(ml / 1000, 2)} L`;
}

/** Multiplicador de cantidad: 1.5 → "×1,5". */
export function cantidad(q: number): string {
  return `×${num(q, 2)}`;
}

/** Interpreta un número escrito por el usuario, con coma o punto decimal. */
export function leerNumero(s: string): number | null {
  const t = s.trim().replace(/\s/g, '').replace(',', '.');
  if (t === '') return null;
  const n = Number(t);
  return Number.isFinite(n) ? n : null;
}

/** Segundos a "m:ss". */
export function reloj(segundos: number): string {
  const s = Math.max(0, Math.round(segundos));
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
}
