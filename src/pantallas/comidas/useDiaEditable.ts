import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import type { Dia } from '../../dominio/tipos';
import { useDia } from '../../estado/hooks';

/**
 * Día del diario con edición inmediata (solo una vez cargado lo guardado): cada cambio se ve al instante y se guarda.
 * Mientras el almacén confirma el cambio, se muestra la copia local, así dos toques
 * seguidos no se pisan.
 */
export function useDiaEditable(fecha: string) {
  const { dia: remoto, cargado, guardar } = useDia(fecha);
  const [local, setLocal] = useState<{ fecha: string; dia: Dia } | null>(null);
  // La copia local vale mientras el almacén no devuelva lo mismo que se guardó.
  const vigente = local?.fecha === fecha && JSON.stringify(local.dia) !== JSON.stringify(remoto) ? local.dia : null;
  const actual = vigente ?? remoto;
  // Último valor, para encadenar dos cambios seguidos antes de que React vuelva a dibujar.
  const actualRef = useRef(actual);
  const cargadoRef = useRef(cargado);
  useLayoutEffect(() => {
    actualRef.current = actual;
    cargadoRef.current = cargado;
  }, [actual, cargado]);

  // Por las dudas, la copia local se descarta a los pocos segundos del último cambio.
  useEffect(() => {
    if (!local) return;
    const t = window.setTimeout(() => setLocal(null), 3000);
    return () => window.clearTimeout(t);
  }, [local]);

  const cambiar = useCallback(
    (f: (d: Dia) => Dia) => {
      // Antes de tener lo guardado, un cambio pisaría el día entero: la pantalla no lo permite.
      if (!cargadoRef.current) return;
      const nuevo = f(structuredClone(actualRef.current));
      actualRef.current = nuevo;
      setLocal({ fecha, dia: nuevo });
      guardar(nuevo);
    },
    [fecha, guardar],
  );

  return { dia: actual, cargado, cambiar };
}
