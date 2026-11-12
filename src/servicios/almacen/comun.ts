import type { Exportacion } from '../../dominio/tipos';
import type { Almacen, ResultadoImportacion } from './tipos';

/** Pequeño emisor de eventos para estados que observan varias pantallas. */
export class Emisor<T> {
  private oyentes = new Set<(v: T) => void>();
  constructor(private valor: T) {}

  get actual(): T {
    return this.valor;
  }

  emitir(v: T): void {
    this.valor = v;
    for (const o of this.oyentes) o(v);
  }

  suscribir(cb: (v: T) => void, inmediato = true): () => void {
    this.oyentes.add(cb);
    if (inmediato) cb(this.valor);
    return () => this.oyentes.delete(cb);
  }
}

/** Lee el estado actual de una suscripción una sola vez. */
export function leerUnaVez<T>(suscribir: (cb: (v: T) => void) => () => void): Promise<T> {
  return new Promise((resolve) => {
    let listo = false;
    let desuscribir: (() => void) | null = null;
    desuscribir = suscribir((v) => {
      if (listo) return;
      listo = true;
      resolve(v);
      // Puede llamarse antes de que `suscribir` devuelva; se desuscribe en la próxima vuelta.
      queueMicrotask(() => desuscribir?.());
    });
    if (listo) queueMicrotask(() => desuscribir?.());
  });
}

/**
 * Importa una exportación escribiendo documento por documento. No borra nada:
 * reemplaza los documentos con el mismo id.
 */
export async function importarEnAlmacen(a: Almacen, e: Exportacion): Promise<ResultadoImportacion> {
  const escrituras: Promise<void>[] = [];
  if (e.perfil) escrituras.push(a.guardarPerfil(e.perfil));
  for (const d of e.dias) escrituras.push(a.guardarDia(d));
  for (const al of e.alimentos) escrituras.push(a.guardarAlimento(al));
  for (const [id, n] of Object.entries(e.notas)) escrituras.push(a.guardarNota(id, n));
  for (const s of e.sesiones) escrituras.push(a.guardarSesion(s));
  for (const s of e.semanas) escrituras.push(a.guardarSemana(s));
  // Sin conexión, las escrituras quedan en el dispositivo y no se resuelven hasta sincronizar:
  // no se espera a que lleguen al servidor para informar el resultado.
  void Promise.allSettled(escrituras);
  return {
    dias: e.dias.length,
    alimentos: e.alimentos.length,
    notas: Object.keys(e.notas).length,
    sesiones: e.sesiones.length,
    semanas: e.semanas.length,
    perfil: e.perfil !== null,
  };
}
