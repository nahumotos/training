import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { MiniaturaAnimacion, PanelAnimacion, SinAnimacion } from '../../componentes/Animacion';
import { Icono } from '../../componentes/Icono';
import { DIAS_HISTORIAL } from '../../config';
import { sumarDias } from '../../dominio/fechas';
import { diaPorId, idSesion, seriesHechas, totalSeries } from '../../dominio/rutina';
import type { DiaRutina, Ejercicio, NotaEjercicio, SerieHecha, Sesion } from '../../dominio/tipos';
import { useAvisos } from '../../estado/Avisos';
import { useDatos } from '../../estado/Proveedor';
import { usePantallaEncendida, useTemporizador } from '../../estado/Temporizador';
import { Cargando } from '../../app/Estados';
import { useHoy, useNotas, useSesiones, useTitulo } from '../../estado/hooks';
import { NoEncontrada } from '../NoEncontrada';
import { TarjetaEjercicio } from './TarjetaEjercicio';
import estilos from './Rutina.module.css';

const CLAVE_CALOR = 'libreta-calor-abierto';

function leerCalorAbierto(): boolean {
  try {
    return localStorage.getItem(CLAVE_CALOR) === '1';
  } catch {
    return false;
  }
}

/** Agrupa los ejercicios en bloques: sueltos o superseries (mismo `g` consecutivo). */
function bloques(dia: DiaRutina): { etiquetas: string[]; ejercicios: Ejercicio[] }[] {
  const r: { etiquetas: string[]; ejercicios: Ejercicio[] }[] = [];
  let n = 0;
  for (let i = 0; i < dia.ex.length; i++) {
    const ex = dia.ex[i]!;
    const sig = dia.ex[i + 1];
    n++;
    if (ex.g && sig?.g === ex.g) {
      r.push({ etiquetas: [`${n}a`, `${n}b`], ejercicios: [ex, sig] });
      i++;
    } else r.push({ etiquetas: [String(n)], ejercicios: [ex] });
  }
  return r;
}

export function DiaRutinaPantalla() {
  const { diaId = '' } = useParams();
  const dia = diaPorId(diaId);
  useTitulo(dia ? dia.nombre : 'Rutina');
  if (!dia) return <NoEncontrada />;
  return <DiaRutinaContenido dia={dia} />;
}

function DiaRutinaContenido({ dia }: { dia: DiaRutina }) {
  const hoy = useHoy();
  const navegar = useNavigate();
  const { almacen } = useDatos();
  const { avisar } = useAvisos();
  const temporizador = useTemporizador();
  const [notas, notasCargadas] = useNotas();
  const [sesiones, sesionesCargadas] = useSesiones(sumarDias(hoy, -DIAS_HISTORIAL));
  // Hasta tener lo guardado no se puede marcar: si no, una sesión nueva pisaría la existente.
  const listo = notasCargadas && sesionesCargadas;
  const [calorAbierto, setCalorAbierto] = useState(leerCalorAbierto);
  const [animacionAbierta, setAnimacionAbierta] = useState<string | null>(null);

  const id = idSesion(hoy, dia.id);
  const sesion = useMemo(() => sesiones.find((s) => s.id === id) ?? null, [sesiones, id]);
  const hechas = seriesHechas(sesion);
  const total = totalSeries(dia);
  const enCurso = hechas > 0 && !sesion?.fin;

  usePantallaEncendida(enCurso);

  useEffect(() => {
    try {
      localStorage.setItem(CLAVE_CALOR, calorAbierto ? '1' : '0');
    } catch {
      /* preferencia opcional */
    }
  }, [calorAbierto]);

  const guardarSerie = (ex: Ejercicio, indice: number, serie: SerieHecha | null) => {
    const base: Sesion = sesion ?? { id, dia: dia.id, fecha: hoy, inicio: new Date().toISOString(), fin: null, ejercicios: {} };
    const lista = [...(base.ejercicios[ex.id] ?? [])];
    while (lista.length < ex.s) lista.push(null);
    lista[indice] = serie;
    const nueva: Sesion = { ...base, fin: null, ejercicios: { ...base.ejercicios, [ex.id]: lista } };
    void almacen.guardarSesion(nueva).catch(() => undefined);

    if (serie) {
      // El último peso usado queda como el peso de trabajo del ejercicio.
      const nota = notas[ex.id];
      if (serie.peso !== null && nota?.peso !== serie.peso) {
        void almacen.guardarNota(ex.id, { peso: serie.peso, nota: nota?.nota ?? '', actualizado: new Date().toISOString() }).catch(() => undefined);
      }
      if (ex.desc > 0) temporizador.iniciar(ex.desc, ex.n);
    }
  };

  const guardarNota = (ex: Ejercicio, n: NotaEjercicio) => {
    void almacen.guardarNota(ex.id, n).catch(() => undefined);
    avisar('Nota guardada');
  };

  const terminar = () => {
    if (!sesion) return;
    void almacen.guardarSesion({ ...sesion, fin: new Date().toISOString() }).catch(() => undefined);
    temporizador.detener();
    avisar(`Entrenamiento guardado: ${hechas} de ${total} series`);
    navegar('/rutina');
  };

  return (
    <div className="pila pantalla">
      <Link to="/rutina" className={estilos.volver}>
        <Icono nombre="izquierda" tam={16} />
        Mi rutina
      </Link>
      <header className="cabecera">
        <p className="ceja">{dia.dia}</p>
        <h1>
          Día {dia.num}: {dia.nombre}
        </h1>
        <p className="sub">{dia.foco}</p>
        <ul className={estilos.metaDia}>
          <li>
            <Icono nombre="rutina" tam={18} />
            {dia.ex.length} ejercicios
          </li>
          <li>
            <Icono nombre="series" tam={18} />
            {total} series
          </li>
          <li>
            <Icono nombre="reloj" tam={18} />
            {dia.duracion}
          </li>
        </ul>
      </header>
      <div className={estilos.progresoFijo} data-tipo={dia.tipo}>
        <div className={estilos.avance} role="progressbar" aria-label="Series hechas hoy" aria-valuemin={0} aria-valuemax={total} aria-valuenow={hechas} aria-valuetext={`${hechas} de ${total}`}>
          <span style={{ transform: `scaleX(${total ? hechas / total : 0})` }} />
        </div>
        <p className="num">
          {hechas ? `${hechas} de ${total} series hechas hoy` : 'Marcá cada serie al terminarla: arranca el descanso y queda guardada.'}
        </p>
      </div>

      <details className="tarjeta desplegable" open={calorAbierto} onToggle={(e) => setCalorAbierto(e.currentTarget.open)}>
        <summary>
          <span>
            Entrada en calor <span className="tenue">· 8–10 min</span>
          </span>
          <Icono nombre="abajo" />
        </summary>
        <ul className={estilos.calor}>
          {dia.calor.map((c, i) => {
            const idPanel = `calor-${dia.id}-${i}`;
            const abierta = animacionAbierta === idPanel;
            return (
              <li key={c.n}>
                <div className={estilos.filaCalor}>
                  {c.img ? (
                    <MiniaturaAnimacion img={c.img} nombre={c.n} abierta={abierta} idPanel={idPanel} alTocar={() => setAnimacionAbierta(abierta ? null : idPanel)} />
                  ) : (
                    <SinAnimacion />
                  )}
                  <div className={estilos.textoCalor}>
                    <b>{c.n}</b>
                    {c.nota && <span className="tenue">{c.nota}</span>}
                  </div>
                  <span className={`${estilos.dosis} num`}>{c.dosis}</span>
                </div>
                {c.img && abierta && <PanelAnimacion img={c.img} nombre={c.n} id={idPanel} leyenda="Posición inicial y final del movimiento." />}
              </li>
            );
          })}
        </ul>
      </details>

      <div className="fila-titulo">
        <h2>Principal</h2>
        <span className="tenue num">{total} series efectivas</span>
      </div>

      {listo ? (
        <>
          <div className={estilos.lista}>
            {bloques(dia).map((b) =>
              b.ejercicios.length > 1 ? (
                <section key={b.etiquetas.join('')} className={estilos.superserie} aria-label={`Superserie ${b.etiquetas.join(' y ')}`}>
                  <p className={estilos.leyendaSuperserie}>
                    <b>Superserie</b> Alterná una serie de cada uno; el descanso va después del par.
                  </p>
                  {b.ejercicios.map((ex, i) => (
                    <TarjetaEjercicio
                      key={ex.id}
                      ex={ex}
                      etiqueta={b.etiquetas[i]!}
                      sesion={sesion}
                      sesiones={sesiones}
                      nota={notas[ex.id]}
                      alMarcar={(indice, serie) => guardarSerie(ex, indice, serie)}
                      alGuardarNota={(n) => guardarNota(ex, n)}
                    />
                  ))}
                </section>
              ) : (
                <TarjetaEjercicio
                  key={b.ejercicios[0]!.id}
                  ex={b.ejercicios[0]!}
                  etiqueta={b.etiquetas[0]!}
                  sesion={sesion}
                  sesiones={sesiones}
                  nota={notas[b.ejercicios[0]!.id]}
                  alMarcar={(indice, serie) => guardarSerie(b.ejercicios[0]!, indice, serie)}
                  alGuardarNota={(n) => guardarNota(b.ejercicios[0]!, n)}
                />
              ),
            )}
          </div>

          {hechas > 0 && (
            <button type="button" className="boton primario ancho" onClick={terminar}>
              {sesion?.fin ? 'Volver a la rutina' : 'Terminar entrenamiento'}
            </button>
          )}
          <p className={estilos.credito}>
            Fotos de los ejercicios: <a href="https://github.com/yuhonas/free-exercise-db" target="_blank" rel="noopener noreferrer">Free Exercise DB</a>, de dominio
            público. Las máquinas pueden ser distintas a las de tu gimnasio: fijate en el movimiento.
          </p>
        </>
      ) : (
        <Cargando enLinea />
      )}
    </div>
  );
}
