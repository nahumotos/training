import { useEffect, useRef, useState, type RefObject } from 'react';
import estilos from './Graficos.module.css';

export interface Barra {
  clave: string;
  etiqueta: string;
  valor: number | null;
  /** Texto bajo la etiqueta (por ejemplo, las calorías del día). */
  sub?: string;
  destacada?: boolean;
}

/**
 * Barras por día con una línea de objetivo. Las barras que llegan al objetivo
 * cambian de color, así se ve de un vistazo qué días se cumplió.
 */
export function GraficoBarras({
  barras,
  objetivo,
  minimoOk,
  descripcion,
  formato,
  color = 'proteina',
}: {
  barras: Barra[];
  objetivo: { valor: number; texto: string };
  /** Desde este valor la barra se considera cumplida. */
  minimoOk: number;
  descripcion: string;
  formato: (v: number) => string;
  color?: 'proteina' | 'kcal';
}) {
  const maximo = Math.max(objetivo.valor * 1.2, ...barras.map((b) => (b.valor ?? 0) * 1.08));
  return (
    <figure className={estilos.figura} aria-label={descripcion}>
      <div className={estilos.area} role="img" aria-label={descripcion}>
        {barras.map((b) => (
          <div className={estilos.columna} key={b.clave}>
            {b.valor !== null && (
              <div
                className={`${estilos.barra} ${estilos[color]}`}
                data-ok={b.valor >= minimoOk || undefined}
                style={{ height: `${Math.max(2, Math.min(100, (b.valor / maximo) * 100))}%` }}
              />
            )}
          </div>
        ))}
        <div className={estilos.objetivo} style={{ bottom: `${(objetivo.valor / maximo) * 100}%` }}>
          <span>{objetivo.texto}</span>
        </div>
      </div>
      <div className={estilos.etiquetas} aria-hidden="true">
        {barras.map((b) => (
          <div key={b.clave} data-destacada={b.destacada || undefined}>
            <span>{b.etiqueta}</span>
            <b className="num">{b.valor === null ? '—' : formato(b.valor)}</b>
            {b.sub && <span className="num">{b.sub}</span>}
          </div>
        ))}
      </div>
    </figure>
  );
}

function useAncho<T extends HTMLElement>(): [RefObject<T | null>, number] {
  const ref = useRef<T>(null);
  const [ancho, setAncho] = useState(320);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const ro = new ResizeObserver(([e]) => e && setAncho(Math.max(200, Math.round(e.contentRect.width))));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  return [ref, ancho];
}

export interface Punto {
  clave: string;
  /** Etiqueta del eje X (fecha corta). */
  x: string;
  y: number;
  /** Texto del punto en la tabla de datos. */
  detalle?: string;
}

/** Línea de evolución con el último valor destacado y una tabla de datos accesible. */
export function GraficoLinea({
  puntos,
  descripcion,
  formato,
  unidad,
  alto = 150,
}: {
  puntos: Punto[];
  descripcion: string;
  formato: (v: number) => string;
  unidad: string;
  alto?: number;
}) {
  const [ref, ancho] = useAncho<HTMLDivElement>();
  if (!puntos.length) return null;

  const margen = { arriba: 22, abajo: 22, izq: 8, der: 8 };
  const ys = puntos.map((p) => p.y);
  let min = Math.min(...ys);
  let max = Math.max(...ys);
  if (max - min < 1e-9) {
    min -= 1;
    max += 1;
  }
  const relleno = (max - min) * 0.15;
  min -= relleno;
  max += relleno;
  const w = ancho - margen.izq - margen.der;
  const h = alto - margen.arriba - margen.abajo;
  const x = (i: number) => margen.izq + (puntos.length === 1 ? w / 2 : (i / (puntos.length - 1)) * w);
  const y = (v: number) => margen.arriba + (1 - (v - min) / (max - min)) * h;
  const ruta = puntos.map((p, i) => `${i ? 'L' : 'M'}${x(i).toFixed(1)},${y(p.y).toFixed(1)}`).join(' ');
  const ultimo = puntos[puntos.length - 1]!;
  const primero = puntos[0]!;
  const xUlt = x(puntos.length - 1);

  return (
    <figure className={estilos.figura}>
      <div ref={ref} className={estilos.lienzo}>
        <svg width={ancho} height={alto} role="img" aria-label={descripcion}>
          <line x1={margen.izq} x2={ancho - margen.der} y1={alto - margen.abajo} y2={alto - margen.abajo} className={estilos.eje} />
          <path d={`${ruta} L${xUlt.toFixed(1)},${alto - margen.abajo} L${x(0).toFixed(1)},${alto - margen.abajo} Z`} className={estilos.relleno} />
          <path d={ruta} className={estilos.linea} />
          {puntos.map((p, i) => (
            <circle key={p.clave} cx={x(i)} cy={y(p.y)} r={i === puntos.length - 1 ? 5 : 3} className={i === puntos.length - 1 ? estilos.puntoFinal : estilos.punto} />
          ))}
          {/* La cifra del último punto se alinea hacia adentro para no cortarse en el borde. */}
          <text
            x={xUlt > ancho / 2 ? Math.min(xUlt + 6, ancho - 2) : Math.max(xUlt - 6, 2)}
            y={y(ultimo.y) - 12}
            textAnchor={xUlt > ancho / 2 ? 'end' : 'start'}
            className={estilos.valor}
          >
            {formato(ultimo.y)}
          </text>
          <text x={margen.izq} y={alto - 6} className={estilos.ejeTexto}>
            {primero.x}
          </text>
          {puntos.length > 1 && (
            <text x={ancho - margen.der} y={alto - 6} textAnchor="end" className={estilos.ejeTexto}>
              {ultimo.x}
            </text>
          )}
        </svg>
      </div>
      <details className={estilos.datos}>
        <summary>Ver los datos</summary>
        <table>
          <thead>
            <tr>
              <th scope="col">Fecha</th>
              <th scope="col">{unidad}</th>
            </tr>
          </thead>
          <tbody>
            {[...puntos].reverse().map((p) => (
              <tr key={p.clave}>
                <td>{p.x}</td>
                <td className="num">{p.detalle ?? formato(p.y)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </details>
    </figure>
  );
}
