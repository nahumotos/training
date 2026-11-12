// Fechas en formato YYYY-MM-DD, siempre en la hora local del usuario.

const pad = (n: number) => String(n).padStart(2, '0');

export function aIso(d: Date): string {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

export function hoyIso(ahora: Date = new Date()): string {
  return aIso(ahora);
}

export function esFechaIso(s: unknown): s is string {
  if (typeof s !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(s)) return false;
  const d = deIso(s);
  return aIso(d) === s;
}

export function deIso(iso: string): Date {
  const [a, m, d] = iso.split('-').map(Number);
  return new Date(a ?? 1970, (m ?? 1) - 1, d ?? 1);
}

export function sumarDias(iso: string, n: number): string {
  const d = deIso(iso);
  d.setDate(d.getDate() + n);
  return aIso(d);
}

/** Días entre dos fechas (b - a). */
export function diferenciaDias(a: string, b: string): number {
  const ms = deIso(b).getTime() - deIso(a).getTime();
  return Math.round(ms / 86_400_000);
}

/** Lunes de la semana de la fecha. */
export function lunesDe(iso: string): string {
  const dow = deIso(iso).getDay();
  return sumarDias(iso, dow === 0 ? -6 : 1 - dow);
}

export function diaSemana(iso: string): number {
  return deIso(iso).getDay();
}

const DIAS = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado'];
const DIAS_CORTOS = ['dom', 'lun', 'mar', 'mié', 'jue', 'vie', 'sáb'];
const MESES = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];
const MESES_CORTOS = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];

/** "jueves 12 de noviembre" */
export function fechaLarga(iso: string): string {
  const d = deIso(iso);
  return `${DIAS[d.getDay()]} ${d.getDate()} de ${MESES[d.getMonth()]}`;
}

/** "jue 12" */
export function fechaCorta(iso: string): string {
  const d = deIso(iso);
  return `${DIAS_CORTOS[d.getDay()]} ${d.getDate()}`;
}

/** "12 nov" */
export function diaMes(iso: string): string {
  const d = deIso(iso);
  return `${d.getDate()} ${MESES_CORTOS[d.getMonth()]}`;
}

export function nombreDia(dow: number): string {
  return DIAS[dow] ?? '';
}

/** "Semana del 9 al 15 de noviembre" (o entre meses distintos). */
export function rotuloSemana(lunes: string): string {
  const a = deIso(lunes);
  const b = deIso(sumarDias(lunes, 6));
  if (a.getMonth() === b.getMonth()) return `Semana del ${a.getDate()} al ${b.getDate()} de ${MESES[b.getMonth()]}`;
  return `Semana del ${a.getDate()} de ${MESES[a.getMonth()]} al ${b.getDate()} de ${MESES[b.getMonth()]}`;
}

export function capitalizar(s: string): string {
  return s ? s.charAt(0).toUpperCase() + s.slice(1) : s;
}

/** Minutos desde la medianoche para HH:MM, o null. */
export function minutosDeHora(h: string): number | null {
  const m = /^(\d{2}):(\d{2})$/.exec(h);
  if (!m) return null;
  const hh = Number(m[1]);
  const mm = Number(m[2]);
  if (hh > 23 || mm > 59) return null;
  return hh * 60 + mm;
}

export function horaDeMinutos(min: number): string {
  const t = ((Math.round(min) % 1440) + 1440) % 1440;
  return `${pad(Math.floor(t / 60))}:${pad(t % 60)}`;
}
