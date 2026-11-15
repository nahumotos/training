import { useId, useMemo, useRef, useState, type FormEvent } from 'react';
import { MiniaturaAnimacion, PanelAnimacion } from '../../componentes/Animacion';
import { Icono } from '../../componentes/Icono';
import { fechaCorta } from '../../dominio/fechas';
import { leerNumero, num } from '../../dominio/formato';
import { textoSerie } from '../../dominio/progreso';
import { etiquetaUnidad, historial, incrementoSugerido, sugerencia, totalConBarra, ultimaVez, valoresIniciales } from '../../dominio/rutina';
import type { Ejercicio, NotaEjercicio, SerieHecha, Sesion } from '../../dominio/tipos';
import estilos from './Rutina.module.css';

interface Borrador {
  peso: string;
  reps: string;
}

/** Lo que el usuario escribió en una fila; `t` es la serie guardada sobre la que escribió. */
interface Edicion extends Borrador {
  t: string | undefined;
}

const aTexto = (n: number | null) => (n === null ? '' : num(n, 2));

export function TarjetaEjercicio({
  ex,
  etiqueta,
  sesion,
  sesiones,
  nota,
  alMarcar,
  alGuardarNota,
}: {
  ex: Ejercicio;
  etiqueta: string;
  sesion: Sesion | null;
  sesiones: Sesion[];
  nota: NotaEjercicio | undefined;
  alMarcar: (indice: number, serie: SerieHecha | null) => void;
  alGuardarNota: (n: NotaEjercicio) => void;
}) {
  const idBase = useId();
  const [verAnimacion, setVerAnimacion] = useState(false);
  const [verTecnica, setVerTecnica] = useState(false);
  const [editandoNota, setEditandoNota] = useState(false);
  const [error, setError] = useState<{ fila: number; texto: string } | null>(null);
  /** La última serie marcada en esta visita: solo esa hace la animación de «hecha». */
  const [recien, setRecien] = useState<number | null>(null);
  const repsRefs = useRef<(HTMLInputElement | null)[]>([]);
  const pesoRefs = useRef<(HTMLInputElement | null)[]>([]);

  const ultima = useMemo(() => ultimaVez(ex.id, sesiones, sesion?.id), [ex.id, sesiones, sesion?.id]);
  const iniciales = useMemo(() => valoresIniciales(ex, ultima, nota), [ex, ultima, nota]);
  const guardadas = useMemo(() => sesion?.ejercicios[ex.id] ?? [], [sesion, ex.id]);
  const conPeso = ex.unidad !== 'corporal';

  // Lo que muestra cada fila: lo que se escribió, o lo guardado hoy, o lo de la última vez.
  // Si la serie guardada cambia desde otro lado (otro dispositivo), gana lo guardado.
  const [ediciones, setEdiciones] = useState<Record<number, Edicion>>({});
  const borradores: Borrador[] = iniciales.map((v, i) => {
    const g = guardadas[i];
    const e = ediciones[i];
    if (e && (!g || g.t === e.t)) return { peso: e.peso, reps: e.reps };
    return g ? { peso: aTexto(g.peso), reps: String(g.reps) } : { peso: aTexto(v.peso), reps: '' };
  });

  const cambiar = (i: number, campo: keyof Borrador, valor: string) => {
    setError(null);
    const fila = { ...borradores[i]!, [campo]: valor, t: guardadas[i]?.t };
    setEdiciones((prev) => ({ ...prev, [i]: fila }));
  };

  /** Lee una fila. Devuelve la serie o un error para mostrar. */
  const leerFila = (i: number): SerieHecha | string => {
    const b = borradores[i]!;
    const previas = iniciales[i]?.repsPrevias ?? null;
    const reps = b.reps.trim() === '' ? previas : leerNumero(b.reps);
    if (reps === null || !Number.isInteger(reps) || reps < 1 || reps > 100) return 'Anotá las repeticiones (un número entero).';
    let peso: number | null = null;
    if (conPeso) {
      peso = leerNumero(b.peso);
      if (peso === null || peso < 0 || peso > 500) return 'Anotá el peso con números (por ejemplo, 7,5).';
    }
    return { peso, reps, t: new Date().toISOString() };
  };

  const marcar = (i: number) => {
    if (guardadas[i]) {
      // Al desmarcar, los valores quedan escritos para volver a marcarla.
      const fila = { ...borradores[i]!, t: undefined };
      setEdiciones((prev) => ({ ...prev, [i]: fila }));
      alMarcar(i, null);
      return;
    }
    const r = leerFila(i);
    if (typeof r === 'string') {
      setError({ fila: i, texto: r });
      (r.startsWith('Anotá las rep') ? repsRefs : pesoRefs).current[i]?.focus();
      return;
    }
    // La serie queda con lo marcado y las siguientes sin tocar toman ese peso.
    const peso = aTexto(r.peso);
    const sig: Record<number, Edicion> = { [i]: { peso, reps: String(r.reps), t: r.t } };
    borradores.forEach((b, j) => {
      if (j > i && !guardadas[j] && !b.reps) sig[j] = { ...b, peso, t: undefined };
    });
    setEdiciones((prev) => ({ ...prev, ...sig }));
    alMarcar(i, r);
  };

  /** Corrige una serie ya marcada al salir del campo. */
  const corregir = (i: number) => {
    if (!guardadas[i]) return;
    const r = leerFila(i);
    if (typeof r === 'string') {
      setError({ fila: i, texto: r });
      return;
    }
    const g = guardadas[i]!;
    if (r.peso !== g.peso || r.reps !== g.reps) {
      setEdiciones((prev) => ({ ...prev, [i]: { peso: aTexto(r.peso), reps: String(r.reps), t: g.t } }));
      alMarcar(i, { ...r, t: g.t });
    }
  };

  const sug = ultima ? sugerencia(ex, ultima.series) : null;
  const pesoNota = nota?.peso ?? null;
  const total = totalConBarra(pesoNota, ex.unidad);
  const hist = verTecnica ? historial(ex.id, sesiones.filter((s) => s.id !== sesion?.id)) : [];
  const idPanel = `${idBase}-anim`;
  const unidad = etiquetaUnidad(ex.unidad);

  return (
    <article className={`tarjeta ${estilos.ejercicio}`} aria-labelledby={`${idBase}-titulo`}>
      <div className={estilos.cabEjercicio}>
        <MiniaturaAnimacion img={ex.img} nombre={ex.n} abierta={verAnimacion} idPanel={idPanel} alTocar={() => setVerAnimacion((v) => !v)} />
        <div>
          <h3 id={`${idBase}-titulo`} className={estilos.nombreEjercicio}>
            <span className="solo-lector">Ejercicio </span>
            <span className={estilos.numero}>{etiqueta}</span>
            <span className="solo-lector">: </span>
            {ex.n}
          </h3>
          <p className="tenue">{ex.m}</p>
        </div>
      </div>
      {verAnimacion && <PanelAnimacion img={ex.img} nombre={ex.n} id={idPanel} leyenda="Posición inicial y final. La máquina de tu gimnasio puede ser distinta: fijate en el movimiento." />}

      <dl className={estilos.datos}>
        <div>
          <dt>Series</dt>
          <dd>{ex.s}</dd>
        </div>
        <div>
          <dt>Reps{ex.porBrazo ? ' x brazo' : ''}</dt>
          <dd>
            {ex.r[0]}–{ex.r[1]}
          </dd>
        </div>
        <div>
          <dt>Descanso</dt>
          <dd>{ex.descTxt}</dd>
        </div>
        <div>
          <dt>RIR</dt>
          <dd>{ex.rir}</dd>
        </div>
      </dl>

      {editandoNota ? (
        <FormNota
          ex={ex}
          nota={nota}
          alCancelar={() => setEditandoNota(false)}
          alGuardar={(n) => {
            alGuardarNota(n);
            setEditandoNota(false);
          }}
        />
      ) : (
        <div className={estilos.nota}>
          <Icono nombre="lapiz" tam={18} />
          <div className={estilos.textoNota}>
            {pesoNota !== null && conPeso ? (
              <span className={estilos.peso}>
                {num(pesoNota, 2)} {unidad}
                {total !== null && <span className={estilos.total}> · total {num(total, 2)} kg</span>}
              </span>
            ) : (
              <span>
                <span className={estilos.sugerido}>Sugerido</span>
                <span className="solo-lector">: </span>
                <span className={estilos.peso}>{ex.sug}</span>
              </span>
            )}
            {nota?.nota && <span className={estilos.notaLibre}>{nota.nota}</span>}
          </div>
          <button type="button" className={estilos.botonNota} onClick={() => setEditandoNota(true)}>
            Editar
          </button>
        </div>
      )}

      {ultima && (
        <p className={estilos.ultima}>
          <span>Última vez · {fechaCorta(ultima.fecha)}</span>
          <span className={`${estilos.valorUltima} num`}>
            {conPeso && ultima.series[0]?.peso !== null && ultima.series[0] ? `${num(ultima.series[0].peso ?? 0, 2)} · ` : ''}
            {ultima.series.map((s) => s.reps).join(' · ')}
          </span>
          {sug === 'subir' ? (
            <span className="chip bien">Subí {incrementoSugerido(ex.unidad)}</span>
          ) : (
            <span className="chip">Buscá +1 rep</span>
          )}
        </p>
      )}

      <table className={estilos.series}>
        <caption className="solo-lector">Series de {ex.n}</caption>
        <thead>
          <tr>
            <th scope="col">Serie</th>
            {conPeso && <th scope="col">{unidad}</th>}
            <th scope="col">Reps</th>
            <th scope="col">
              <span className="solo-lector">Hecha</span>
            </th>
          </tr>
        </thead>
        <tbody>
          {borradores.map((b, i) => {
            const hecha = Boolean(guardadas[i]);
            const previas = iniciales[i]?.repsPrevias;
            return (
              <tr key={i} data-hecha={hecha || undefined}>
                <th scope="row" className="num">
                  {i + 1}
                </th>
                {conPeso && (
                  <td>
                    <input
                      ref={(el) => {
                        pesoRefs.current[i] = el;
                      }}
                      className={`entrada ${estilos.celda}`}
                      inputMode="decimal"
                      autoComplete="off"
                      aria-label={`Peso de la serie ${i + 1}, en ${unidad}`}
                      value={b.peso}
                      onChange={(e) => cambiar(i, 'peso', e.target.value)}
                      onBlur={() => corregir(i)}
                      aria-invalid={error?.fila === i && error.texto.includes('peso')}
                    />
                  </td>
                )}
                <td>
                  <input
                    ref={(el) => {
                      repsRefs.current[i] = el;
                    }}
                    className={`entrada ${estilos.celda}`}
                    inputMode="numeric"
                    autoComplete="off"
                    aria-label={`Repeticiones de la serie ${i + 1}${previas ? `; la vez anterior hiciste ${previas}` : ''}`}
                    placeholder={previas ? String(previas) : `${ex.r[0]}–${ex.r[1]}`}
                    value={b.reps}
                    onChange={(e) => cambiar(i, 'reps', e.target.value)}
                    onBlur={() => corregir(i)}
                    aria-invalid={error?.fila === i && error.texto.includes('repeticiones')}
                  />
                </td>
                <td>
                  <button
                    type="button"
                    className={estilos.marcar}
                    aria-pressed={hecha}
                    aria-label={hecha ? `Serie ${i + 1} hecha. Tocá para desmarcarla` : `Marcar la serie ${i + 1} como hecha`}
                    data-recien={recien === i || undefined}
                    onClick={() => {
                      if (!hecha) setRecien(i);
                      marcar(i);
                    }}
                  >
                    <Icono nombre="check" tam={22} />
                  </button>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
      {error && (
        <p className="error" role="alert">
          Serie {error.fila + 1}: {error.texto}
        </p>
      )}
      {iniciales.some((v) => v.repsPrevias !== null) && <p className={estilos.pista}>Si dejás las reps vacías, se usan las de la vez anterior.</p>}

      <button type="button" className="boton chico" aria-expanded={verTecnica} onClick={() => setVerTecnica((v) => !v)}>
        {verTecnica ? 'Ocultar técnica' : 'Técnica e historial'}
      </button>
      {verTecnica && (
        <div className={estilos.tecnica}>
          <p>{ex.t}</p>
          <p>
            <span className="rotulo">Alternativa </span>
            {ex.alt}
          </p>
          {ex.aviso && <p className={estilos.aviso}>{ex.aviso}</p>}
          {hist.length > 0 && (
            <div className={estilos.historial}>
              <span className="rotulo">Últimas veces</span>
              <ul>
                {hist.map((h) => (
                  <li key={h.fecha}>
                    <span>{fechaCorta(h.fecha)}</span>
                    <span className="num">{h.series.map((s) => textoSerie(ex, s)).join(' · ')}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </article>
  );
}

function FormNota({
  ex,
  nota,
  alGuardar,
  alCancelar,
}: {
  ex: Ejercicio;
  nota: NotaEjercicio | undefined;
  alGuardar: (n: NotaEjercicio) => void;
  alCancelar: () => void;
}) {
  const id = useId();
  const [peso, setPeso] = useState(aTexto(nota?.peso ?? null));
  const [texto, setTexto] = useState(nota?.nota ?? '');
  const [error, setError] = useState('');
  const conPeso = ex.unidad !== 'corporal';

  const enviar = (e: FormEvent) => {
    e.preventDefault();
    let p: number | null = null;
    if (conPeso && peso.trim()) {
      p = leerNumero(peso);
      if (p === null || p < 0 || p > 500) {
        setError('Escribí el peso con números, por ejemplo 7,5.');
        return;
      }
    }
    alGuardar({ peso: p, nota: texto.trim().slice(0, 300), actualizado: new Date().toISOString() });
  };

  return (
    <form className={estilos.formNota} onSubmit={enviar}>
      {conPeso && (
        <div className="campo">
          <label htmlFor={`${id}-peso`}>Peso de trabajo ({etiquetaUnidad(ex.unidad)})</label>
          <input id={`${id}-peso`} className="entrada" inputMode="decimal" autoComplete="off" value={peso} onChange={(e) => setPeso(e.target.value)} aria-invalid={Boolean(error)} />
        </div>
      )}
      <div className="campo">
        <label htmlFor={`${id}-nota`}>Nota</label>
        <textarea id={`${id}-nota`} className="entrada" maxLength={300} placeholder="Ej.: asiento en 4, agarre en la marca" value={texto} onChange={(e) => setTexto(e.target.value)} />
      </div>
      {error && (
        <p className="error" role="alert">
          {error}
        </p>
      )}
      <div className={estilos.acciones}>
        <button type="button" className="boton" onClick={alCancelar}>
          Cancelar
        </button>
        <button type="submit" className="boton primario">
          Guardar
        </button>
      </div>
    </form>
  );
}
