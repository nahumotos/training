import { useEffect, useRef, useState } from 'react';
import { num } from '../dominio/formato';

const DURACION = 550;

/**
 * Una cifra que, cuando cambia, cuenta desde el valor anterior hasta el nuevo
 * (por ejemplo, de 22 a 34 g al cargar un alimento). Con «reducir movimiento» cambia de una.
 */
export function Cifra({ valor, formato = (v) => num(v) }: { valor: number; formato?: (v: number) => string }) {
  const [mostrado, setMostrado] = useState(valor);
  const actual = useRef(valor);

  useEffect(() => {
    const desde = actual.current;
    if (desde === valor) return;
    const quieto = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    const inicio = performance.now();
    let id = 0;
    const paso = (t: number) => {
      const avance = quieto ? 1 : Math.min(1, (t - inicio) / DURACION);
      const v = avance < 1 ? desde + (valor - desde) * (1 - (1 - avance) ** 3) : valor;
      actual.current = v;
      setMostrado(v);
      if (avance < 1) id = requestAnimationFrame(paso);
    };
    id = requestAnimationFrame(paso);
    return () => cancelAnimationFrame(id);
  }, [valor]);

  return <>{formato(mostrado)}</>;
}
