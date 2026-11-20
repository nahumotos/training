import { Link } from 'react-router-dom';
import { Anillos } from '../componentes/Anillos';
import { Cifra } from '../componentes/Cifra';
import { Icono } from '../componentes/Icono';
import { DIAS_HISTORIAL } from '../config';
import { estadoKcal, llegaProteina, proximaComida, totalesDia } from '../dominio/comidas';
import { capitalizar, fechaLarga, lunesDe, sumarDias } from '../dominio/fechas';
import { litros, num } from '../dominio/formato';
import { resumenSemana } from '../dominio/progreso';
import { etapaActual, idSesion, queTocaHoy, semanaDelPlan, seriesHechas, totalSeries } from '../dominio/rutina';
import type { Dia, Objetivos } from '../dominio/tipos';
import { useDatos } from '../estado/Proveedor';
import { SeccionBloqueada } from './SeccionBloqueada';
import { useDias, useHoy, useSesiones, useTitulo } from '../estado/hooks';
import { useDiaEditable } from './comidas/useDiaEditable';
import { AvisoHoy } from './rutina/AvisoHoy';
import estilos from './Hoy.module.css';

export function Hoy() {
  useTitulo('Hoy');
  const hoy = useHoy();
  const { perfil, rutina, puede } = useDatos();
  const o = perfil.objetivos;
  const { dia, cargado, cambiar } = useDiaEditable(hoy);
  const lunes = lunesDe(hoy);
  const [semana] = useDias(lunes, sumarDias(lunes, 6));
  const [sesiones] = useSesiones(sumarDias(hoy, -DIAS_HISTORIAL));
  const conComidas = puede('comidas');

  const toca = rutina ? queTocaHoy(hoy, perfil.inicioRutina, sesiones, rutina) : null;
  const sesionHoy = toca?.tipo === 'entreno' ? sesiones.find((s) => s.id === idSesion(hoy, toca.dia.id)) : undefined;
  const resumen = rutina
    ? resumenSemana(
        lunes,
        semana.map((d) => (d.fecha === hoy ? dia : d)),
        sesiones,
        o,
        hoy,
        rutina,
      )
    : null;
  const seriesSemana = sesiones.filter((s) => s.fecha >= lunes && rutina?.dias.some((d) => d.id === s.dia)).reduce((a, s) => a + seriesHechas(s), 0);
  const esPlanPersonal = rutina?.id === 'fase1';
  const etapa = esPlanPersonal ? etapaActual(hoy, perfil.inicioRutina) : null;
  const numSemana = rutina ? semanaDelPlan(hoy, perfil.inicioRutina) : null;
  const saludo = perfil.nombre ? `Hola, ${perfil.nombre}` : capitalizar(fechaLarga(hoy));

  return (
    <div className="pila pantalla amplia">
      <header className="cabecera">
        {perfil.nombre && <p className="ceja">{capitalizar(fechaLarga(hoy))}</p>}
        <h1>{saludo}</h1>
      </header>

      <div className="columnas parejas">
        <section className={`tarjeta ${estilos.heroe}`} aria-labelledby="hoy-entreno">
          <div className="fila-titulo">
            <h2 id="hoy-entreno">Entrenamiento</h2>
            {numSemana && (
              <span className="tenue">
                Semana {numSemana} {esPlanPersonal ? 'del plan' : 'de tu rutina'}
              </span>
            )}
          </div>
          {rutina && toca ? (
            <>
              <AvisoHoy toca={toca} rutina={rutina} conBoton={!sesionHoy?.fin} conProgreso={puede('progreso')} />
              {toca.tipo === 'entreno' && sesionHoy && seriesHechas(sesionHoy) > 0 && (
                <div className={estilos.enCurso}>
                  <p className="tenue num">
                    {sesionHoy.fin ? 'Terminado: ' : 'En curso: '}
                    {seriesHechas(sesionHoy)} de {totalSeries(toca.dia)} series
                  </p>
                  <span className={estilos.barra} aria-hidden="true">
                    <span style={{ transform: `scaleX(${Math.min(1, seriesHechas(sesionHoy) / totalSeries(toca.dia))})` }} />
                  </span>
                </div>
              )}
            </>
          ) : (
            <>
              <p>Todavía no elegiste tu rutina. Decinos cuántos días podés entrenar y qué buscás, y te armamos la semana.</p>
              <Link to="/rutina" className="boton primario">
                Elegir mi rutina
              </Link>
            </>
          )}
        </section>

        {conComidas ? <ComidasDeHoy dia={dia} cargado={cargado} cambiar={cambiar} o={o} /> : <SeccionBloqueada seccion="comidas" compacta />}
      </div>

      {rutina && resumen && (
        <section className="tarjeta" aria-labelledby="hoy-semana">
          <div className="fila-titulo">
            <h2 id="hoy-semana">Esta semana</h2>
            {puede('progreso') && (
              <Link to="/progreso" className="enlace-mas">
                Ver progreso
                <Icono nombre="derecha" tam={18} />
              </Link>
            )}
          </div>
          <ul className={estilos.semana} data-columnas={conComidas ? 3 : 2}>
            <li className="dato">
              <Anillos tam={36} grosor={5} anillos={[{ tono: 'proteina', valor: resumen.entrenamientos.hechos, objetivo: resumen.entrenamientos.total }]} />
              <b className="grabado">
                {resumen.entrenamientos.hechos}/{resumen.entrenamientos.total}
              </b>{' '}
              <span>entrenamientos</span>
            </li>
            {conComidas ? (
              <>
                <li className="dato">
                  <Anillos tam={36} grosor={5} anillos={[{ tono: 'proteina', valor: resumen.diasConProteina, objetivo: Math.max(resumen.diasCargados, 1) }]} />
                  <b className="grabado">
                    {resumen.diasConProteina}/{Math.max(resumen.diasCargados, 1)}
                  </b>{' '}
                  <span>días con {o.proteina.min} g o más</span>
                </li>
                <li className="dato" data-tono="azul">
                  <span className={estilos.iconoDato}>
                    <Icono nombre="pasos" tam={20} />
                  </span>
                  <b className="grabado">{resumen.pasosProm === null ? '—' : num(resumen.pasosProm)}</b> <span>pasos promedio</span>
                </li>
              </>
            ) : (
              <li className="dato" data-tono="azul">
                <span className={estilos.iconoDato}>
                  <Icono nombre="series" tam={20} />
                </span>
                <b className="grabado">{seriesSemana}</b> <span>series hechas</span>
              </li>
            )}
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
      )}
    </div>
  );
}

function ComidasDeHoy({ dia, cargado, cambiar, o }: { dia: Dia; cargado: boolean; cambiar: (f: (d: Dia) => Dia) => void; o: Objetivos }) {
  const totales = totalesDia(dia, o.umbralComida);
  const proxima = proximaComida(dia, new Date());
  const okP = llegaProteina(totales.p, o);
  const kcal = estadoKcal(totales.k, o);
  return (
    <section className="tarjeta" aria-labelledby="hoy-comidas">
      <div className="fila-titulo">
        <h2 id="hoy-comidas">Comidas de hoy</h2>
        <Link to="/comidas" className="enlace-mas">
          Ver el día
          <Icono nombre="derecha" tam={18} />
        </Link>
      </div>
      <div className={estilos.resumen}>
        <Anillos
          tam={156}
          anillos={[
            { tono: 'proteina', valor: totales.p, objetivo: o.proteina.obj, marca: o.proteina.min, ok: okP },
            { tono: 'kcal', valor: totales.k, objetivo: o.kcal.min, ok: kcal.tipo === 'rango', exceso: kcal.tipo === 'arriba' },
          ]}
        >
          <b className={`grabado ${estilos.cifraDisco}`}>
            <Cifra valor={totales.p} />
          </b>{' '}
          <span className={estilos.deDisco}>de {o.proteina.obj} g</span> <span className={estilos.nombreDisco}>de proteína</span>
        </Anillos>
        <dl className={estilos.datos}>
          <div>
            <dt>
              <span className={estilos.punto} data-tono="kcal" aria-hidden="true" />
              Calorías
            </dt>
            <dd>
              <b className="grabado">
                <Cifra valor={totales.k} />
              </b>{' '}
              <span>
                de {num(o.kcal.min)}–{num(o.kcal.max)}
              </span>
            </dd>
          </div>
          <div>
            <dt>
              <span className={estilos.punto} aria-hidden="true" />
              Comidas con proteína
            </dt>
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
          <Icono nombre="gota" tam={20} />
          <span>+ Vaso de agua · {litros(dia.agua)}</span>
        </button>
      </div>
    </section>
  );
}
