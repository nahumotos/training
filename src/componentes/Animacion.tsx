import { Icono } from './Icono';
import estilos from './Animacion.module.css';

/** Dos fotos (inicio y final del movimiento) que se alternan. */
function Cuadros({ img, nombre, tam }: { img: string; nombre: string; tam: 'chico' | 'grande' }) {
  return (
    <span className={estilos.cuadros}>
      <img src={`/ejercicios/${tam}/${img}-0.webp`} alt={`${nombre}: posición inicial`} loading="lazy" decoding="async" width={tam === 'chico' ? 240 : 480} height={tam === 'chico' ? 160 : 320} />
      <img className={estilos.final} src={`/ejercicios/${tam}/${img}-1.webp`} alt={`${nombre}: posición final`} loading="lazy" decoding="async" width={tam === 'chico' ? 240 : 480} height={tam === 'chico' ? 160 : 320} />
    </span>
  );
}

/** Miniatura que se puede tocar para ver la animación en grande. */
export function MiniaturaAnimacion({
  img,
  nombre,
  abierta,
  alTocar,
  idPanel,
}: {
  img: string;
  nombre: string;
  abierta: boolean;
  alTocar: () => void;
  idPanel: string;
}) {
  return (
    <button
      type="button"
      className={estilos.miniatura}
      onClick={alTocar}
      aria-expanded={abierta}
      aria-controls={idPanel}
      aria-label={`${abierta ? 'Ocultar' : 'Ver'} cómo se hace: ${nombre}`}
    >
      <Cuadros img={img} nombre={nombre} tam="chico" />
      <span className={estilos.lupa} aria-hidden="true">
        <Icono nombre="ampliar" tam={12} />
      </span>
    </button>
  );
}

export function PanelAnimacion({ img, nombre, id, leyenda }: { img: string; nombre: string; id: string; leyenda: string }) {
  return (
    <div className={estilos.panel} id={id}>
      <div className={estilos.grande}>
        <Cuadros img={img} nombre={nombre} tam="grande" />
      </div>
      <p className={estilos.leyenda}>{leyenda}</p>
    </div>
  );
}

/** Lugar para un ejercicio sin animación. */
export function SinAnimacion() {
  return (
    <span className={estilos.vacio} aria-hidden="true">
      <Icono nombre="series" />
    </span>
  );
}
