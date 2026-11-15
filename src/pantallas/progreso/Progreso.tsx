import { useEffect, useId, useRef, useState } from 'react';
import { Anillos } from '../../componentes/Anillos';
import { GraficoBarras, GraficoLinea } from '../../componentes/Graficos';
import { Icono } from '../../componentes/Icono';
import { DIAS_HISTORIAL } from '../../config';
import { deIso, diaMes, lunesDe, rotuloSemana, sumarDias } from '../../dominio/fechas';
import { litros, num } from '../../dominio/formato';
import { mejoresSeries, resumenSemana, serieSemana, textoResumen, textoSerie } from '../../dominio/progreso';
import { DIAS_RUTINA, etiquetaUnidad } from '../../dominio/rutina';
import type { Ejercicio, Objetivos } from '../../dominio/tipos';
import { useAvisos } from '../../estado/Avisos';
import { useDatos } from '../../estado/Proveedor';
import { useDias, useHoy, useNotaSemana, useSesiones, useTitulo } from '../../estado/hooks';
import estilos from './Progreso.module.css';

const INICIALES = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];

/** Todos los ejercicios de la rutina, sin repetir, con los básicos primero. */
function ejerciciosParaGrafico(): Ejercicio[] {
  const vistos = new Map<string, Ejercicio>();
  for (const d of DIAS_RUTINA) for (const e of d.ex) if (!vistos.has(e.id) && e.unidad !== 'corporal') vistos.set(e.id, e);
  return [...vistos.values()].sort((a, b) => Number(Boolean(b.basico)) - Number(Boolean(a.basico)));
}

const EJERCICIOS_GRAFICO = ejerciciosParaGrafico();

export default function Progreso() {
  useTitulo('Progreso');
  const hoy = useHoy();
  const { perfil } = useDatos();
  const o = perfil.objetivos;
  const [lunes, setLunes] = useState(() => lunesDe(hoy));
  const [dias] = useDias(sumarDias(hoy, -DIAS_HISTORIAL), hoy);
  const [sesiones] = useSesiones(sumarDias(hoy, -DIAS_HISTORIAL));
  const ejercicios = EJERCICIOS_GRAFICO;
  const [exId, setExId] = useState(ejercicios[0]?.id ?? '');
  const idSelect = useId();
  const esSemanaActual = lunes === lunesDe(hoy);

  const r = resumenSemana(lunes, dias, sesiones, o, hoy);
  const serie = serieSemana(lunes, dias, o);

  const ex = ejercicios.find((e) => e.id === exId);
  const cargas = ex ? mejoresSeries(ex.id, sesiones).slice(-12) : [];
  const pesos = dias.filter((d) => d.peso !== null).map((d) => ({ clave: d.fecha, x: diaMes(d.fecha), y: d.peso! }));
  const cinturas = dias.filter((d) => d.cintura !== null).map((d) => ({ clave: d.fecha, x: diaMes(d.fecha), y: d.cintura! }));

  return (
    <div className="pila pantalla amplia">
      <header className="cabecera">
        <h1>Cómo vas</h1>
      </header>

      <div className={estilos.navSemana}>
        <button type="button" className={estilos.flecha} onClick={() => setLunes((l) => sumarDias(l, -7))} aria-label="Semana anterior">
          <Icono nombre="izquierda" />
        </button>
        <h2 className={estilos.semana}>{rotuloSemana(lunes)}</h2>
        <button
          type="button"
          className={estilos.flecha}
          onClick={() => setLunes((l) => sumarDias(l, 7))}
          disabled={esSemanaActual}
          aria-label="Semana siguiente"
        >
          <Icono nombre="derecha" />
        </button>
      </div>

      <section className="tarjeta" aria-label="Resumen de la semana">
        <dl className={estilos.kpis}>
          <div>
            <Anillos tam={34} grosor={5} anillos={[{ tono: 'proteina', valor: r.entrenamientos.hechos, objetivo: r.entrenamientos.total }]} />
            <dt>Entrenamientos</dt>
            <dd className="num">
              {r.entrenamientos.hechos} <span>de {r.entrenamientos.total}</span>
            </dd>
          </div>
          <div>
            <Anillos tam={34} grosor={5} anillos={[{ tono: 'proteina', valor: r.diasConProteina, objetivo: Math.max(r.diasCargados, 1) }]} />
            <dt>Días con proteína</dt>
            <dd className="num">
              {r.diasConProteina} <span>de {r.diasCargados} cargados</span>
            </dd>
          </div>
          <div>
            <Anillos tam={34} grosor={5} anillos={[{ tono: 'proteina', valor: r.diasCuatroComidas, objetivo: Math.max(r.diasCargados, 1) }]} />
            <dt>4 comidas con proteína</dt>
            <dd className="num">
              {r.diasCuatroComidas} <span>días</span>
            </dd>
          </div>
          <div>
            <Anillos tam={34} grosor={5} anillos={[{ tono: 'proteina', valor: r.proteinaProm ?? 0, objetivo: o.proteina.obj, ok: r.proteinaProm !== null && r.proteinaProm >= o.proteina.min }]} />
            <dt>Proteína promedio</dt>
            <dd className="num">{r.proteinaProm === null ? '—' : <>{num(r.proteinaProm)} <span>g</span></>}</dd>
          </div>
          <div>
            <Anillos tam={34} grosor={5} anillos={[{ tono: 'kcal', valor: r.kcalProm ?? 0, objetivo: o.kcal.min }]} />
            <dt>Calorías promedio</dt>
            <dd className="num">{r.kcalProm === null ? '—' : num(r.kcalProm)}</dd>
          </div>
          <div data-tono="azul">
            <Icono nombre="pasos" tam={20} />
            <dt>Pasos promedio</dt>
            <dd className="num">{r.pasosProm === null ? '—' : num(r.pasosProm)}</dd>
          </div>
          <div data-tono="azul">
            <Icono nombre="luna" tam={20} />
            <dt>Sueño</dt>
            <dd className="num">{r.acostoProm && r.levantoProm ? <>{r.acostoProm} <span>a</span> {r.levantoProm}</> : '—'}</dd>
          </div>
          <div>
            <Anillos tam={34} grosor={5} anillos={[{ tono: 'agua', valor: r.aguaProm ?? 0, objetivo: o.agua, ok: r.aguaProm !== null && r.aguaProm >= o.agua }]} />
            <dt>Agua promedio</dt>
            <dd className="num">{r.aguaProm === null ? '—' : litros(r.aguaProm)}</dd>
          </div>
        </dl>
        {r.entrenamientos.faltaron.length > 0 && <p className="tenue">Faltaron: {r.entrenamientos.faltaron.join(', ')}.</p>}
      </section>

      <div className="columnas">
        <section className="tarjeta" aria-labelledby="graf-proteina">
          <div className="fila-titulo">
            <h2 id="graf-proteina">Proteína por día</h2>
            <span className="tenue">Objetivo {o.proteina.obj} g</span>
          </div>
          <GraficoBarras
            barras={serie.map((s) => ({ clave: s.fecha, etiqueta: `${INICIALES[deIso(s.fecha).getDay()]} ${deIso(s.fecha).getDate()}`, valor: s.p, destacada: s.fecha === hoy }))}
            objetivo={{ valor: o.proteina.obj, texto: `${o.proteina.obj} g` }}
            minimoOk={o.proteina.min}
            descripcion={`Proteína por día de la ${rotuloSemana(lunes).toLowerCase()}`}
            formato={(v) => num(v)}
          />
        </section>

        <section className="tarjeta" aria-labelledby="graf-kcal">
          <div className="fila-titulo">
            <h2 id="graf-kcal">Calorías por día</h2>
            <span className="tenue">
              Rango {num(o.kcal.min)}–{num(o.kcal.max)}
            </span>
          </div>
          <GraficoBarras
            barras={serie.map((s) => ({ clave: s.fecha, etiqueta: `${INICIALES[deIso(s.fecha).getDay()]} ${deIso(s.fecha).getDate()}`, valor: s.k, destacada: s.fecha === hoy }))}
            objetivo={{ valor: Math.round((o.kcal.min + o.kcal.max) / 2), texto: num(Math.round((o.kcal.min + o.kcal.max) / 2)) }}
            minimoOk={Number.POSITIVE_INFINITY}
            descripcion={`Calorías por día de la ${rotuloSemana(lunes).toLowerCase()}`}
            formato={(v) => num(v)}
            color="kcal"
          />
        </section>
      </div>

      <div className="columnas">
        <section className="tarjeta" aria-labelledby="graf-cargas">
          <div className="fila-titulo">
            <h2 id="graf-cargas">Cargas por ejercicio</h2>
            <span className="tenue">Mejor serie de cada sesión</span>
          </div>
          <div className="campo">
            <label htmlFor={idSelect}>Ejercicio</label>
            <select id={idSelect} className="entrada" value={exId} onChange={(e) => setExId(e.target.value)}>
              {ejercicios.map((e) => (
                <option key={e.id} value={e.id}>
                  {e.n}
                  {e.basico ? ' (básico)' : ''}
                </option>
              ))}
            </select>
          </div>
          {ex && cargas.length ? (
            <GraficoLinea
              puntos={cargas.map((c) => ({ clave: c.fecha, x: diaMes(c.fecha), y: c.peso ?? 0, detalle: textoSerie(ex, c) }))}
              descripcion={`Evolución de ${ex.n}: de ${num(cargas[0]!.peso ?? 0, 2)} a ${num(cargas.at(-1)!.peso ?? 0, 2)} ${etiquetaUnidad(ex.unidad)}`}
              formato={(v) => `${num(v, 2)} kg`}
              unidad={`Mejor serie (${etiquetaUnidad(ex.unidad)})`}
            />
          ) : (
            <p className="tenue">Todavía no registraste series de este ejercicio.</p>
          )}
        </section>

        <section className="tarjeta" aria-labelledby="graf-medidas">
          <div className="fila-titulo">
            <h2 id="graf-medidas">Peso y cintura</h2>
            <span className="tenue">Se cargan en Comidas → El resto del día</span>
          </div>
          <h3 className="rotulo">Peso</h3>
          {pesos.length ? (
            <GraficoLinea puntos={pesos} descripcion={`Peso: último ${num(pesos.at(-1)!.y, 1)} kg`} formato={(v) => `${num(v, 1)} kg`} unidad="Peso (kg)" />
          ) : (
            <p className="tenue">Sin mediciones todavía.</p>
          )}
          <h3 className="rotulo">Cintura</h3>
          {cinturas.length ? (
            <GraficoLinea puntos={cinturas} descripcion={`Cintura: última ${num(cinturas.at(-1)!.y, 1)} cm`} formato={(v) => `${num(v, 1)} cm`} unidad="Cintura (cm)" />
          ) : (
            <p className="tenue">Sin mediciones todavía. Medila cada 2 semanas a la altura del ombligo, en ayunas.</p>
          )}
        </section>
      </div>

      <ResumenRevision key={lunes} lunes={lunes} resumen={r} objetivos={o} />
    </div>
  );
}

/**
 * Resumen semanal para pegar en el chat de coaching. Se monta de nuevo con cada
 * semana (key), así el borrador de una semana nunca se guarda en otra.
 */
function ResumenRevision({ lunes, resumen, objetivos }: { lunes: string; resumen: ReturnType<typeof resumenSemana>; objetivos: Objetivos }) {
  const [notaSemana, cargada] = useNotaSemana(lunes);
  if (!cargada) {
    return (
      <section className="tarjeta" id="resumen" aria-labelledby="resumen-titulo" aria-busy="true">
        <h2 id="resumen-titulo">Resumen para la revisión</h2>
        <p className="tenue">Cargando…</p>
      </section>
    );
  }
  return <ResumenEditable lunes={lunes} guardada={notaSemana?.nota ?? ''} resumen={resumen} objetivos={objetivos} />;
}

function ResumenEditable({ lunes, guardada, resumen, objetivos }: { lunes: string; guardada: string; resumen: ReturnType<typeof resumenSemana>; objetivos: Objetivos }) {
  const { almacen } = useDatos();
  const { avisar } = useAvisos();
  const [borrador, setBorrador] = useState(guardada);
  const ultimoGuardado = useRef(guardada);
  const textoRef = useRef<HTMLTextAreaElement>(null);

  const guardar = (valor: string) => {
    const nota = valor.slice(0, 2000);
    if (nota === ultimoGuardado.current) return;
    ultimoGuardado.current = nota;
    void almacen.guardarSemana({ lunes, nota }).catch(() => undefined);
  };

  // Se guarda solo, un momento después de dejar de escribir.
  useEffect(() => {
    const t = window.setTimeout(() => guardar(borrador), 700);
    return () => window.clearTimeout(t);
    // guardar solo usa valores estables de esta semana.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [borrador]);

  const texto = textoResumen(resumen, borrador, objetivos);
  const copiar = async () => {
    try {
      await navigator.clipboard.writeText(texto);
      avisar('Resumen copiado: pegalo en el chat de coaching');
    } catch {
      textoRef.current?.focus();
      textoRef.current?.select();
      avisar('Seleccioné el texto: copialo desde el menú del teléfono');
    }
  };

  return (
    <section className="tarjeta" id="resumen" aria-labelledby="resumen-titulo">
      <div className="fila-titulo">
        <h2 id="resumen-titulo">Resumen para la revisión</h2>
      </div>
      <p className="tenue">Completá qué te costó, copiá el resumen y pegalo en el chat de coaching.</p>
      <div className="campo">
        <label htmlFor="resumen-nota">Qué te costó esta semana</label>
        <textarea id="resumen-nota" className="entrada" maxLength={2000} value={borrador} onBlur={() => guardar(borrador)} onChange={(e) => setBorrador(e.target.value)} />
      </div>
      <div className="campo">
        <label htmlFor="resumen-texto">Vista previa</label>
        <textarea id="resumen-texto" ref={textoRef} className={`entrada ${estilos.vistaPrevia}`} readOnly value={texto} rows={12} />
      </div>
      <button type="button" className="boton primario" onClick={() => void copiar()}>
        <Icono nombre="copiar" tam={18} />
        Copiar resumen
      </button>
    </section>
  );
}
