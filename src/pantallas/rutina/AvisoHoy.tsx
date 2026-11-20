import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { EnlaceDeslizante } from '../../app/EnlaceDeslizante';
import { Icono } from '../../componentes/Icono';
import { capitalizar, fechaLarga } from '../../dominio/fechas';
import type { QueToca } from '../../dominio/rutina';
import type { Rutina } from '../../dominio/tipos';
import estilos from './Rutina.module.css';

const NOMBRES = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado'];

/** Qué toca hoy, en una línea, con el acceso directo al día de rutina. */
export function AvisoHoy({
  toca,
  rutina,
  conBoton = false,
  conProgreso = false,
}: {
  toca: QueToca;
  rutina: Rutina;
  conBoton?: boolean;
  conProgreso?: boolean;
}) {
  let texto: ReactNode;
  let enlace: { a: string; texto: string } | null = null;
  switch (toca.tipo) {
    case 'antes':
      texto = (
        <>
          La rutina arranca el <b>{fechaLarga(toca.inicio)}</b>. Hasta entonces, seguí con lo que venías haciendo: descansá 2–3 min en los ejercicios grandes y
          anotá las repeticiones.
        </>
      );
      break;
    case 'entreno': {
      const final = toca.dia.final?.[0];
      texto = (
        <>
          Hoy toca <b>{toca.dia.nombre}</b>: {toca.dia.foco.toLowerCase()}.
          {rutina.despues ? ` ${rutina.despues}` : final ? ` Al final, ${final.n.toLowerCase()} (${final.dosis}).` : ''}
        </>
      );
      enlace = { a: `/rutina/${toca.dia.id}`, texto: `Empezar ${toca.dia.nombre}` };
      break;
    }
    case 'descanso':
      texto = toca.domingo ? (
        <>
          Domingo: <b>descanso</b>. {toca.consejo}
          {conProgreso && ' A la noche, armá el resumen de la semana en Progreso.'}
        </>
      ) : (
        <>
          Hoy es día de <b>descanso</b>. {toca.consejo}
        </>
      );
      if (toca.domingo && conProgreso) enlace = { a: '/progreso', texto: 'Ver el resumen de la semana' };
      break;
    case 'comodin': {
      const dia = capitalizar(NOMBRES[toca.dow]!);
      const horario = rutina.horarioComodin ? ` ${rutina.horarioComodin}` : '';
      if (toca.pendientes.length) {
        const primero = toca.pendientes[0]!;
        texto = (
          <>
            {dia}: <b>comodín</b>
            {horario}. Esta semana falta {toca.pendientes.map((d) => d.nombre).join(', ')}: podés hacer {primero.nombre} hoy.
          </>
        );
        enlace = { a: `/rutina/${primero.id}`, texto: `Hacer ${primero.nombre}` };
      } else {
        texto = (
          <>
            {dia}: hiciste los {rutina.dias.length} días de la semana. {rutina.descanso} <b>Descanso</b>.
          </>
        );
      }
      break;
    }
  }
  return (
    <div className={estilos.avisoHoy} data-tipo={toca.tipo}>
      {toca.tipo === 'entreno' ? (
        <span className={estilos.disco} data-tipo={toca.dia.tipo} aria-hidden="true">
          {toca.dia.letra}
        </span>
      ) : (
        <span className={estilos.iconoAviso} aria-hidden="true">
          <Icono nombre={toca.tipo === 'descanso' ? 'luna' : 'hoy'} />
        </span>
      )}
      <p>{texto}</p>
      {conBoton &&
        enlace &&
        (enlace.a.startsWith('/rutina/') ? (
          <EnlaceDeslizante to={enlace.a} paso="adelante" className="boton primario chico">
            {enlace.texto}
          </EnlaceDeslizante>
        ) : (
          <Link to={enlace.a} className="boton primario chico">
            {enlace.texto}
          </Link>
        ))}
    </div>
  );
}
