import { Link } from 'react-router-dom';
import { Icono } from '../../componentes/Icono';
import { DIAS_HISTORIAL } from '../../config';
import { fechaCorta, fechaLarga, lunesDe, sumarDias } from '../../dominio/fechas';
import { DIAS_RUTINA, diasHechosEnSemana, queTocaHoy, seriesHechas, totalSeries } from '../../dominio/rutina';
import { useDatos } from '../../estado/Proveedor';
import { useHoy, useSesiones, useTitulo } from '../../estado/hooks';
import { AvisoHoy } from './AvisoHoy';
import estilos from './Rutina.module.css';

export function Rutina() {
  useTitulo('Rutina');
  const hoy = useHoy();
  const { perfil } = useDatos();
  const [sesiones] = useSesiones(sumarDias(hoy, -DIAS_HISTORIAL));
  const toca = queTocaHoy(hoy, perfil.inicioRutina, sesiones);
  const hechosSemana = diasHechosEnSemana(sesiones, lunesDe(hoy));

  return (
    <div className="pila pantalla amplia">
      <header className="cabecera">
        <p className="ceja">Rutina actual</p>
        <h1>Torso / Pierna · 4 días</h1>
        <p className="sub">
          Fase 1, desde el {fechaLarga(perfil.inicioRutina)}. Miércoles y domingo, descanso; sábado, comodín.
        </p>
      </header>

      <AvisoHoy toca={toca} />

      <nav className={estilos.dias} aria-label="Días de entrenamiento">
        {DIAS_RUTINA.map((d) => {
          const ultima = [...sesiones].reverse().find((s) => s.dia === d.id && seriesHechas(s) > 0);
          const esHoy = toca.tipo === 'entreno' && toca.dia.id === d.id;
          return (
            <Link key={d.id} to={`/rutina/${d.id}`} className={estilos.tarjetaDia} data-hoy={esHoy || undefined}>
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
            </Link>
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
            <b>Descanso</b>: 2–3 min en los ejercicios grandes y 1–1,5 min en el resto. Al marcar una serie arranca el temporizador. En las superseries, el
            descanso va después del par.
          </li>
          <li>
            <b>Si faltás</b>, recuperás la sesión el sábado de 8 a 13 h. Si no llegás, seguís la semana siguiente en orden.
          </li>
        </ul>
        <Link to="/plan#reglas" className="enlace">
          Ver todas las reglas del plan
        </Link>
      </details>
    </div>
  );
}
