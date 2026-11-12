import { useCallback, useEffect, useState } from 'react';
import { diaVacio } from '../dominio/comidas';
import { hoyIso } from '../dominio/fechas';
import type { AlimentoPropio, Dia, NotaEjercicio, NotaSemana, Sesion } from '../dominio/tipos';
import { useDatos } from './Proveedor';
import { useSuscripcion } from './suscripcion';

export function useDia(fecha: string): { dia: Dia; cargado: boolean; guardar: (d: Dia) => void } {
  const { almacen, usuario } = useDatos();
  const [dia, cargado] = useSuscripcion<Dia | null>((cb) => almacen.dia(fecha, cb), `dia-${usuario.uid}-${fecha}`, null);
  const guardar = useCallback(
    (d: Dia) => {
      almacen.guardarDia(d).catch(() => {
        /* el error ya se informa desde el almacén */
      });
    },
    [almacen],
  );
  return { dia: dia ?? diaVacio(fecha), cargado, guardar };
}

export function useDias(desde: string, hasta: string): [Dia[], boolean] {
  const { almacen, usuario } = useDatos();
  return useSuscripcion<Dia[]>((cb) => almacen.dias(desde, hasta, cb), `dias-${usuario.uid}-${desde}-${hasta}`, []);
}

export function useSesiones(desde: string): [Sesion[], boolean] {
  const { almacen, usuario } = useDatos();
  return useSuscripcion<Sesion[]>((cb) => almacen.sesiones(desde, cb), `sesiones-${usuario.uid}-${desde}`, []);
}

export function useNotas(): [Record<string, NotaEjercicio>, boolean] {
  const { almacen, usuario } = useDatos();
  return useSuscripcion<Record<string, NotaEjercicio>>((cb) => almacen.notas(cb), `notas-${usuario.uid}`, {});
}

export function useAlimentosPropios(): AlimentoPropio[] {
  const { almacen, usuario } = useDatos();
  return useSuscripcion<AlimentoPropio[]>((cb) => almacen.alimentos(cb), `alimentos-${usuario.uid}`, [])[0];
}

export function useNotaSemana(lunes: string): [NotaSemana | null, boolean] {
  const { almacen, usuario } = useDatos();
  return useSuscripcion<NotaSemana | null>((cb) => almacen.semana(lunes, cb), `semana-${usuario.uid}-${lunes}`, null);
}

/** Fecha de hoy que se actualiza sola al pasar la medianoche o al volver a la app. */
export function useHoy(): string {
  const [hoy, setHoy] = useState(hoyIso());
  useEffect(() => {
    const revisar = () => setHoy(hoyIso());
    const id = window.setInterval(revisar, 60_000);
    document.addEventListener('visibilitychange', revisar);
    return () => {
      window.clearInterval(id);
      document.removeEventListener('visibilitychange', revisar);
    };
  }, []);
  return hoy;
}

/** Cambia el título de la pestaña según la pantalla. */
export function useTitulo(titulo: string): void {
  useEffect(() => {
    document.title = titulo ? `${titulo} · Libreta` : 'Libreta';
  }, [titulo]);
}
