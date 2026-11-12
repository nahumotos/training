import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { Icono } from '../../componentes/Icono';
import { fechaLarga } from '../../dominio/fechas';
import type { QueToca } from '../../dominio/rutina';
import estilos from './Rutina.module.css';

/** Qué toca hoy, en una línea, con el acceso directo al día de rutina. */
export function AvisoHoy({ toca, conBoton = false }: { toca: QueToca; conBoton?: boolean }) {
  let texto: ReactNode;
  let enlace: { a: string; texto: string } | null = null;
  switch (toca.tipo) {
    case 'antes':
      texto = (
        <>
          La rutina arranca el <b>{fechaLarga(toca.inicio)}</b>. Hasta entonces, seguí con tu rutina actual: descansá 2–3 min en los ejercicios grandes y
          anotá las repeticiones.
        </>
      );
      break;
    case 'entreno':
      texto = (
        <>
          Hoy toca <b>{toca.dia.nombre}</b>: {toca.dia.foco.toLowerCase()}. Después, 20–30 min de caminata.
        </>
      );
      enlace = { a: `/rutina/${toca.dia.id}`, texto: `Empezar ${toca.dia.nombre}` };
      break;
    case 'descanso':
      texto = toca.domingo ? (
        <>
          Domingo: <b>descanso</b> y caminata de {toca.caminata}. A la noche, armá el resumen de la semana en Progreso.
        </>
      ) : (
        <>
          Hoy es día de <b>descanso</b>. Caminata de {toca.caminata}.
        </>
      );
      if (toca.domingo) enlace = { a: '/progreso', texto: 'Ver el resumen de la semana' };
      break;
    case 'comodin':
      if (toca.pendientes.length) {
        const primero = toca.pendientes[0]!;
        texto = (
          <>
            Sábado: <b>comodín</b> de 8 a 13 h. Esta semana falta {toca.pendientes.map((d) => d.nombre).join(', ')}: podés hacer {primero.nombre} hoy.
          </>
        );
        enlace = { a: `/rutina/${primero.id}`, texto: `Hacer ${primero.nombre}` };
      } else {
        texto = (
          <>
            Sábado: hiciste los 4 días de la semana. Caminata de 30–40 min y <b>descanso</b>.
          </>
        );
      }
      break;
  }
  return (
    <div className={estilos.avisoHoy}>
      <Icono nombre="hoy" />
      <p>{texto}</p>
      {conBoton && enlace && (
        <Link to={enlace.a} className="boton primario chico">
          {enlace.texto}
        </Link>
      )}
    </div>
  );
}
