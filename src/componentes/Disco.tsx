import type { CSSProperties, ReactNode } from 'react';
import estilos from './Disco.module.css';

/**
 * Indicador en forma de disco de pesas: el aro se llena hasta el objetivo y marca
 * el rango recomendado. El contenido (las cifras) va en el centro, como el número
 * grabado del disco. El dibujo es decorativo: el texto del centro es lo que se lee.
 */
export function Disco({
  valor,
  objetivo,
  banda,
  ok = false,
  tam = 148,
  children,
}: {
  valor: number;
  objetivo: number;
  banda?: { min: number; max: number };
  ok?: boolean;
  tam?: number;
  children: ReactNode;
}) {
  const grosor = Math.round(tam * 0.12);
  const r = (tam - grosor) / 2 - 2;
  const c = 2 * Math.PI * r;
  const escala = Math.max(objetivo, 1);
  const fraccion = Math.min(1, Math.max(0, valor / escala));
  const marca = (v: number) => {
    const a = (Math.min(1, v / escala) * 360 - 90) * (Math.PI / 180);
    const r1 = r - grosor / 2 - 3;
    const r2 = r + grosor / 2 + 3;
    return { x1: tam / 2 + r1 * Math.cos(a), y1: tam / 2 + r1 * Math.sin(a), x2: tam / 2 + r2 * Math.cos(a), y2: tam / 2 + r2 * Math.sin(a) };
  };

  return (
    <div className={estilos.disco} style={{ width: tam, height: tam } as CSSProperties} data-ok={ok || undefined}>
      <svg viewBox={`0 0 ${tam} ${tam}`} width={tam} height={tam} aria-hidden="true" focusable="false">
        {/* Borde exterior del disco */}
        <circle className={estilos.borde} cx={tam / 2} cy={tam / 2} r={r + grosor / 2 + 1} />
        <circle className={estilos.pista} cx={tam / 2} cy={tam / 2} r={r} strokeWidth={grosor} />
        {/* Collar interior, como el aro que rodea el agujero de un disco */}
        <circle className={estilos.collar} cx={tam / 2} cy={tam / 2} r={r - grosor / 2 - 5} />
        <circle
          className={estilos.relleno}
          cx={tam / 2}
          cy={tam / 2}
          r={r}
          strokeWidth={grosor}
          strokeDasharray={c}
          strokeDashoffset={c * (1 - fraccion)}
          transform={`rotate(-90 ${tam / 2} ${tam / 2})`}
          style={{ '--vacio': c } as CSSProperties}
        />
        {banda && banda.min < escala && <line className={estilos.marca} {...marca(banda.min)} />}
      </svg>
      <div className={estilos.centro}>{children}</div>
    </div>
  );
}
