import { Icono } from './Icono';
import estilos from './Paso.module.css';

/** Contador con botones − y +. */
export function Paso({
  valor,
  texto,
  alMenos,
  alMas,
  menosDeshabilitado,
  masDeshabilitado,
  etiqueta,
}: {
  valor: string;
  texto?: string;
  alMenos: () => void;
  alMas: () => void;
  menosDeshabilitado?: boolean;
  masDeshabilitado?: boolean;
  /** Qué se cuenta, para lectores de pantalla: "cantidad", "agua"… */
  etiqueta: string;
}) {
  return (
    <div className={estilos.paso} role="group" aria-label={etiqueta}>
      <button type="button" onClick={alMenos} disabled={menosDeshabilitado} aria-label={`Restar ${etiqueta}`}>
        <Icono nombre="menos" tam={20} />
      </button>
      <output className="num" aria-live="polite">
        {valor}
        {texto && <span className="solo-lector"> {texto}</span>}
      </output>
      <button type="button" onClick={alMas} disabled={masDeshabilitado} aria-label={`Sumar ${etiqueta}`}>
        <Icono nombre="mas" tam={20} />
      </button>
    </div>
  );
}
