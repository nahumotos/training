import { Link } from 'react-router-dom';
import { Disco } from '../componentes/Disco';
import { DIAS_HISTORIAL } from '../config';
import { llegaProteina, proximaComida, totalesDia } from '../dominio/comidas';
import { capitalizar, fechaLarga, lunesDe, sumarDias } from '../dominio/fechas';
import { litros, num } from '../dominio/formato';
import { resumenSemana } from '../dominio/progreso';
import { etapaActual, idSesion, queTocaHoy, semanaDelPlan, seriesHechas, totalSeries } from '../dominio/rutina';
import { useDatos } from '../estado/Proveedor';
import { useDias, useHoy, useSesiones, useTitulo } from '../estado/hooks';
import { useDiaEditable } from './comidas/useDiaEditable';
import { AvisoHoy } from './rutina/AvisoHoy';
import estilos from './Hoy.module.css';

export function Hoy() {
  useTitulo('Hoy');
  const hoy = useHoy();
  const { perfil } = useDatos();
  const o = perfil.objetivos;
  const { dia, cargado, cambiar } = useDiaEditable(hoy);
  const lunes = lunesDe(hoy);
  const [semana] = useDias(lunes, sumarDias(lunes, 6));
  const [sesiones] = useSesiones(sumarDias(hoy, -DIAS_HISTORIAL));

  const toca = queTocaHoy(hoy, perfil.inicioRutina, sesiones);
  const totales = totalesDia(dia, o.umbralComida);
  const proxima = proximaComida(dia, new Date());
  const sesionHoy = toca.tipo === 'entreno' ? sesiones.find((s) => s.id === idSesion(hoy, toca.dia.id)) : undefined;
  const resumen = resumenSemana(lunes, semana.map((d) => (d.fecha === hoy ? dia : d)), sesiones, o, hoy);
  const etapa = etapaActual(hoy, perfil.inicioRutina);
  const numSemana = semanaDelPlan(hoy, perfil.inicioRutina);
  const okP = llegaProteina(totales.p, o);
  const saludo = perfil.nombre ? `Hola, ${perfil.nombre}` : capitalizar(fechaLarga(hoy));

  return (
    <div className="pila">
      <header className="cabecera">
        {perfil.nombre && <p className="ceja">{capitalizar(fechaLarga(hoy))}</p>}
        <h1>{saludo}</h1>
      </header>

      <section className="tarjeta" aria-labelledby="hoy-entreno">
        <div className="fila-titulo">
          <h2 id="hoy-entreno">Entrenamiento</h2>
          {numSemana && <span className="tenue">Semana {numSemana} del plan</span>}
        </div>
        <AvisoHoy toca={toca} conBoton={!sesionHoy?.fin} />
        {toca.tipo === 'entreno' && sesionHoy && seriesHechas(sesionHoy) > 0 && (
          <p className="tenue num">
            {sesionHoy.fin ? 'Terminado: ' : 'En curso: '}
            {seriesHechas(sesionHoy)} de {totalSeries(toca.dia)} series
          </p>
        )}
      </section>

      <section className="tarjeta" aria-labelledby="hoy-comidas">
        <div className="fila-titulo">
          <h2 id="hoy-comidas">Comidas de hoy</h2>
          <Link to="/comidas" className="enlace">
            Ver el día
          </Link>
        </div>
        <div className={estilos.resumen}>
          <Disco valor={totales.p} objetivo={o.proteina.obj} banda={o.proteina} ok={okP}>
            <b className={`grabado ${estilos.cifraDisco}`}>{num(totales.p)}</b>{' '}
            <span className={estilos.deDisco}>de {o.proteina.obj} g</span>{' '}
            <span className={estilos.nombreDisco}>de proteína</span>
          </Disco>
          <dl className={estilos.datos}>
            <div>
              <dt>Calorías</dt>
              <dd>
                <b className="grabado">{num(totales.k)}</b>{' '}
                <span>
                  de {num(o.kcal.min)}–{num(o.kcal.max)}
                </span>
              </dd>
            </div>
            <div>
              <dt>Comidas con proteína</dt>
              <dd>
                <b className="grabado" data-ok={totales.comidasConProteina >= 4 || undefined}>
                  {totales.comidasConProteina}
                </b>{' '}
                <span>de 4</span>
              </dd>
            </div>
          </dl>
        </div>
        <div className={estilos.accionesComida}>
          {proxima ? (
            <Link to={`/comidas?agregar=${proxima.id}`} className="boton primario">
              Cargar {proxima.nombre.toLowerCase()}
            </Link>
          ) : (
            <Link to="/comidas?agregar=extras" className="boton">
              Cargar algo más
            </Link>
          )}
          <button type="button" className="boton" disabled={!cargado} onClick={() => cambiar((d) => ({ ...d, agua: Math.min(10000, d.agua + 250) }))}>
            + Vaso de agua · {litros(dia.agua)}
          </button>
        </div>
      </section>

      <section className="tarjeta" aria-labelledby="hoy-semana">
        <div className="fila-titulo">
          <h2 id="hoy-semana">Esta semana</h2>
          <Link to="/progreso" className="enlace">
            Ver progreso
          </Link>
        </div>
        <ul className={estilos.semana}>
          <li>
            <b className="grabado">
              {resumen.entrenamientos.hechos}/{resumen.entrenamientos.total}
            </b>{' '}
            <span>entrenamientos</span>
          </li>
          <li>
            <b className="grabado">
              {resumen.diasConProteina}/{Math.max(resumen.diasCargados, 1)}
            </b>{' '}
            <span>días con {o.proteina.min} g o más</span>
          </li>
          <li>
            <b className="grabado">{resumen.pasosProm === null ? '—' : num(resumen.pasosProm)}</b>{' '}
            <span>pasos promedio</span>
          </li>
        </ul>
        {etapa && (
          <div className={estilos.etapa}>
            <span className="rotulo">
              Hábitos de la etapa {etapa.num}, semanas {etapa.semanas}
            </span>
            <ul className="lista-reglas">
              {etapa.habitos.map((h) => (
                <li key={h}>{h}</li>
              ))}
            </ul>
            <p className="ayuda">Pasás a la etapa siguiente cuando cumplís estos hábitos 5 de 7 días.</p>
          </div>
        )}
      </section>
    </div>
  );
}
