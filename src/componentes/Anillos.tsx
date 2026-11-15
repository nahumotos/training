import { useEffect, useRef, type CSSProperties, type ReactNode } from 'react';
import estilos from './Anillos.module.css';

export interface Anillo {
  valor: number;
  objetivo: number;
  /** De qué color es: cada medida tiene el suyo en toda la app. */
  tono: 'proteina' | 'kcal' | 'agua';
  /** Llegó al objetivo: el anillo se pone verde. */
  ok?: boolean;
  /** Se pasó del rango: el anillo se pone ámbar. */
  exceso?: boolean;
  /** Valor mínimo recomendado: una muesca en el anillo. */
  marca?: number;
}

/**
 * Anillos de progreso, uno dentro del otro (el primero va afuera), como los de la app de
 * actividad del iPhone. Al cambiar el valor el anillo avanza desde donde estaba, y al
 * llegar al objetivo brilla una vez. El dibujo es decorativo: lo que se lee es el contenido
 * del centro y el texto que lo acompaña.
 */
export function Anillos({ anillos, tam = 148, grosor, children }: { anillos: Anillo[]; tam?: number; grosor?: number; children?: ReactNode }) {
  const g = grosor ?? Math.max(5, Math.round(tam * 0.08));
  const separacion = Math.max(2, Math.round(g * 0.25));

  return (
    // Sin contenido en el centro es solo un dibujo: los lectores de pantalla lo saltean.
    <div className={estilos.anillos} style={{ width: tam, height: tam }} aria-hidden={children ? undefined : true}>
      <svg viewBox={`0 0 ${tam} ${tam}`} width={tam} height={tam} aria-hidden="true" focusable="false">
        {anillos.map((a, i) => (
          <UnAnillo key={a.tono} anillo={a} centro={tam / 2} r={tam / 2 - g / 2 - i * (g + separacion)} g={g} />
        ))}
      </svg>
      {children && <div className={estilos.centro}>{children}</div>}
    </div>
  );
}

function UnAnillo({ anillo: a, centro, r, g }: { anillo: Anillo; centro: number; r: number; g: number }) {
  // Brillo al llegar al objetivo mientras se mira la pantalla. No cuenta lo que ya estaba
  // cumplido al abrirla (los datos llegan un instante después de dibujar los anillos).
  const brillo = useRef<SVGCircleElement>(null);
  const montado = useRef(0);
  const okPrevio = useRef(Boolean(a.ok));
  useEffect(() => {
    montado.current = performance.now();
  }, []);
  useEffect(() => {
    const antes = okPrevio.current;
    okPrevio.current = Boolean(a.ok);
    if (!a.ok || antes || performance.now() - montado.current < 1500) return;
    if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return;
    brillo.current?.animate(
      [
        { opacity: 0.55, transform: 'scale(1)' },
        { opacity: 0, transform: 'scale(1.14)' },
      ],
      { duration: 900, easing: 'ease-out' },
    );
  }, [a.ok]);

  const c = 2 * Math.PI * r;
  const escala = Math.max(a.objetivo, 1);
  const fraccion = Math.min(1, Math.max(0, a.valor / escala));
  const angulo = a.marca !== undefined && a.marca < escala ? ((a.marca / escala) * 360 - 90) * (Math.PI / 180) : null;
  const giro = `rotate(-90 ${centro} ${centro})`;

  return (
    <g className={estilos.anillo} data-tono={a.tono} data-ok={a.ok || undefined} data-exceso={a.exceso || undefined}>
      <circle className={estilos.pista} cx={centro} cy={centro} r={r} strokeWidth={g} />
      {fraccion > 0 && (
        <circle
          className={estilos.relleno}
          cx={centro}
          cy={centro}
          r={r}
          strokeWidth={g}
          strokeDasharray={c}
          strokeDashoffset={c * (1 - fraccion)}
          transform={giro}
          style={{ '--vacio': c } as CSSProperties}
        />
      )}
      <circle ref={brillo} className={estilos.brillo} cx={centro} cy={centro} r={r} strokeWidth={g} />
      {angulo !== null && (
        <line
          className={estilos.marca}
          x1={centro + (r - g / 2) * Math.cos(angulo)}
          y1={centro + (r - g / 2) * Math.sin(angulo)}
          x2={centro + (r + g / 2) * Math.cos(angulo)}
          y2={centro + (r + g / 2) * Math.sin(angulo)}
        />
      )}
    </g>
  );
}
