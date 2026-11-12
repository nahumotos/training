import { useEffect, useState } from 'react';
import type { Desuscribir } from '../servicios/almacen/tipos';

/**
 * Se suscribe a una fuente de datos mientras el componente está montado.
 * `clave` identifica la suscripción: cuando cambia, se vuelve a suscribir.
 * Devuelve [valor, cargado].
 */
export function useSuscripcion<T>(
  suscribir: ((cb: (v: T) => void) => Desuscribir) | null,
  clave: string,
  inicial: T,
): [T, boolean] {
  const [estado, setEstado] = useState<{ clave: string; valor: T; cargado: boolean }>({ clave, valor: inicial, cargado: false });

  useEffect(() => {
    if (!suscribir) return;
    let activo = true;
    const quitar = suscribir((v) => {
      if (activo) setEstado({ clave, valor: v, cargado: true });
    });
    return () => {
      activo = false;
      quitar();
    };
    // `suscribir` cambia en cada render; la suscripción depende solo de `clave`.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [clave]);

  // Mientras llega el primer valor de una clave nueva, se muestra el inicial.
  if (estado.clave !== clave) return [inicial, false];
  return [estado.valor, estado.cargado];
}
