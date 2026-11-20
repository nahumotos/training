import { Link } from 'react-router-dom';
import { EnlaceDeslizante } from '../../app/EnlaceDeslizante';
import { Icono } from '../../componentes/Icono';
import { DIAS_HISTORIAL } from '../../config';
import { fechaCorta, fechaLarga, lunesDe, sumarDias } from '../../dominio/fechas';
import { diasHechosEnSemana, listaDias, queTocaHoy, seriesHechas, textoSemana, totalSeries } from '../../dominio/rutina';
import type { Rutina as TipoRutina } from '../../dominio/tipos';
import { useDatos } from '../../estado/Proveedor';
import { useHoy, useSesiones, useTitulo } from '../../estado/hooks';
import { AvisoHoy } from './AvisoHoy';
import { ElegirRutina } from './ElegirRutina';
import estilos from './Rutina.module.css';

export function Rutina() {
  const { rutina } = useDatos();
  // Una cuenta nueva elige primero su rutina.
  if (!rutina) return <ElegirRutina />;
  return <RutinaActual rutina={rutina} />;
}

function RutinaActual({ rutina }: { rutina: TipoRutina }) {
  useTitulo('Rutina');
  const hoy = useHoy();
  const { perfil, puede } = useDatos();
  const [sesiones] = useSesiones(sumarDias(hoy, -DIAS_HISTORIAL));
  const toca = queTocaHoy(hoy, perfil.inicioRutina, sesiones, rutina);
  const hechosSemana = diasHechosEnSemana(sesiones, lunesDe(hoy));
  const comodin = rutina.comodin.filter((d) => !rutina.dias.some((x) => x.dow === d));

  return (
    <div className="pila pantalla amplia">
      <header className="cabecera">
        <p className="ceja">Tu rutina</p>
        <h1>{rutina.nombre}</h1>
        <p className="sub">
          Desde el {fechaLarga(perfil.inicioRutina)}. {textoSemana(rutina)}
        </p>
        <Link to="/rutina/elegir" className="enlace-mas">
          Cambiar de rutina
          <Icono nombre="derecha" tam={18} />
        </Link>
      </header>

      <AvisoHoy toca={toca} rutina={rutina} conProgreso={puede('progreso')} />

      <nav className={estilos.dias} aria-label="Días de entrenamiento">
        {rutina.dias.map((d) => {
          const ultima = [...sesiones].reverse().find((s) => s.dia === d.id && seriesHechas(s) > 0);
          const esHoy = toca.tipo === 'entreno' && toca.dia.id === d.id;
          return (
            <EnlaceDeslizante key={d.id} to={`/rutina/${d.id}`} paso="adelante" className={estilos.tarjetaDia} data-hoy={esHoy || undefined}>
              <span className={estilos.arriba}>
                <span className={estilos.disco} data-tipo={d.tipo} aria-hidden="true">
                  {d.letra}
                </span>
                {esHoy && <span className={estilos.pildora}>Hoy</span>}
              </span>
              <span className={estilos.cuando}>
                Día {d.num} · {d.dia}
              </span>
              <span className={estilos.nombreDia}>{d.nombre}</span>
              <span className={estilos.foco}>{d.foco}</span>
              <span className={estilos.estadoDia}>
                {hechosSemana.has(d.id) ? (
                  <span className={estilos.hecho}>
                    <Icono nombre="check" tam={16} /> Hecho esta semana
                  </span>
                ) : ultima ? (
                  `Última vez: ${fechaCorta(ultima.fecha)}`
                ) : (
                  `${d.ex.length} ejercicios · ${totalSeries(d)} series`
                )}
              </span>
            </EnlaceDeslizante>
          );
        })}
      </nav>

      <details className="tarjeta desplegable">
        <summary>
          Cómo progresar
          <Icono nombre="abajo" />
        </summary>
        <ul className="lista-reglas">
          <li>
            <b>Subí el peso</b> cuando completás el máximo del rango en todas las series con el RIR indicado. Con el peso nuevo volvés al mínimo del rango.
          </li>
          <li>
            <b>RIR 2</b>: terminás la serie sabiendo que podías hacer 2 repeticiones más con buena técnica. Si la técnica se rompe, la serie terminó.
          </li>
          <li>
            <b>Descanso</b>: el que indica cada ejercicio; en los grandes, 2–3 min. Al marcar una serie arranca el temporizador. En las superseries, el descanso
            va después del par.
          </li>
          <li>
            <b>Si faltás</b>,{' '}
            {comodin.length
              ? `recuperás la sesión el ${listaDias(comodin)}${rutina.horarioComodin ? ` ${rutina.horarioComodin}` : ''}. Si no llegás, seguís la semana siguiente en orden.`
              : 'seguís la semana siguiente en orden, sin duplicar días.'}
          </li>
        </ul>
        {puede('plan') && rutina.id === 'fase1' && (
          <Link to="/plan#reglas" className="enlace">
            Ver todas las reglas del plan
          </Link>
        )}
      </details>
    </div>
  );
}
