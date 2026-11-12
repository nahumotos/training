import { useEffect, useId, useRef, useState } from 'react';
import { Icono } from '../../componentes/Icono';
import { nuevoId, proporciones } from '../../dominio/comidas';
import { gramos, leerNumero, num } from '../../dominio/formato';
import { LIMITES } from '../../dominio/saneo';
import type { ItemComida } from '../../dominio/tipos';
import { useAvisos } from '../../estado/Avisos';
import { useDatos, useSesion } from '../../estado/Proveedor';
import { prepararFoto } from '../../servicios/ia/imagen';
import { ErrorIA, type ItemIA } from '../../servicios/tipos';
import estilos from './Comidas.module.css';

const MAX_FOTOS = 4;

/** Preguntas rápidas: lo que una foto no muestra y más cambia las calorías. */
const DETALLES = ['Es frito', 'Lleva aceite', 'Lleva salsa o crema', 'Lleva manteca'];

interface Foto {
  id: string;
  blob: Blob;
  url: string;
}

interface Fila extends ItemIA {
  clave: string;
  pTexto: string;
  kTexto: string;
}

export function FotoTexto({ alAgregar }: { alAgregar: (items: ItemComida[]) => void }) {
  const id = useId();
  const { servicios } = useSesion();
  const { perfil } = useDatos();
  const { avisar } = useAvisos();
  const [fotos, setFotos] = useState<Foto[]>([]);
  const [detalles, setDetalles] = useState<string[]>([]);
  const [texto, setTexto] = useState('');
  const [estado, setEstado] = useState<'listo' | 'calculando'>('listo');
  const [mensaje, setMensaje] = useState('');
  const [resultado, setResultado] = useState<{ filas: Fila[]; comentario: string; conFoto: boolean } | null>(null);
  const control = useRef<AbortController | null>(null);
  const entrada = useRef<HTMLInputElement>(null);
  const fotosRef = useRef(fotos);
  useEffect(() => {
    fotosRef.current = fotos;
  }, [fotos]);

  // Libera las vistas previas y cancela un cálculo en curso al cerrar.
  useEffect(
    () => () => {
      control.current?.abort();
      for (const f of fotosRef.current) URL.revokeObjectURL(f.url);
    },
    [],
  );

  const elegirFotos = async (archivos: FileList | null) => {
    if (!archivos?.length) return;
    setMensaje('');
    const lugar = MAX_FOTOS - fotos.length;
    const lista = Array.from(archivos).slice(0, Math.max(0, lugar));
    const nuevas: Foto[] = [];
    let fallidas = 0;
    for (const a of lista) {
      try {
        const blob = await prepararFoto(a);
        nuevas.push({ id: nuevoId(), blob, url: URL.createObjectURL(blob) });
      } catch {
        fallidas++;
      }
    }
    setFotos((f) => [...f, ...nuevas]);
    if (fallidas) setMensaje(fallidas === 1 ? 'No pude abrir una de las fotos. Probá con otra.' : `No pude abrir ${fallidas} fotos. Probá con otras.`);
    else if (archivos.length > lugar) setMensaje(`Podés usar hasta ${MAX_FOTOS} fotos por comida.`);
    if (entrada.current) entrada.current.value = '';
  };

  const quitarFoto = (fid: string) =>
    setFotos((lista) => {
      const f = lista.find((x) => x.id === fid);
      if (f) URL.revokeObjectURL(f.url);
      return lista.filter((x) => x.id !== fid);
    });

  const calcular = async () => {
    const descripcion = [texto.trim(), ...detalles].filter(Boolean).join('. ').slice(0, 600);
    if (!fotos.length && !texto.trim()) {
      setMensaje('Sacá una foto o escribí qué comiste.');
      return;
    }
    setMensaje('');
    setResultado(null);
    setEstado('calculando');
    control.current = new AbortController();
    try {
      const r = await servicios.ia.estimar(
        { descripcion, imagenes: fotos.map((f) => f.blob), objetivoProteina: perfil.objetivos.proteina.obj },
        control.current.signal,
      );
      if (!r.items.length) {
        setMensaje(r.comentario || 'No pude separar los alimentos. Probá describirlo de otra forma o cargalo en Manual.');
      } else {
        setResultado({
          conFoto: fotos.length > 0,
          comentario: r.comentario,
          filas: r.items.map((it) => ({ ...it, clave: nuevoId(), pTexto: num(it.p, 1), kTexto: String(it.k) })),
        });
      }
    } catch (e) {
      if (e instanceof ErrorIA && e.codigo === 'cancelado') return;
      setMensaje(e instanceof ErrorIA ? e.message : 'No se pudo calcular. Probá de nuevo en un rato o cargalo en Manual.');
    } finally {
      setEstado('listo');
    }
  };

  const editar = (clave: string, campo: 'n' | 'pTexto' | 'kTexto', valor: string) =>
    setResultado((r) => (r ? { ...r, filas: r.filas.map((f) => (f.clave === clave ? { ...f, [campo]: valor } : f)) } : r));

  const filasValidas = (resultado?.filas ?? []).map((f) => {
    const p = leerNumero(f.pTexto);
    const k = leerNumero(f.kTexto);
    const ok = f.n.trim() !== '' && p !== null && p >= LIMITES.p[0] && p <= LIMITES.p[1] && k !== null && k >= LIMITES.k[0] && k <= LIMITES.k[1];
    return { f, p: p ?? 0, k: k ?? 0, ok };
  });
  const todasValidas = filasValidas.length > 0 && filasValidas.every((x) => x.ok);
  const totalP = filasValidas.reduce((a, x) => a + x.p, 0);
  const totalK = filasValidas.reduce((a, x) => a + x.k, 0);
  const prop = resultado ? proporciones({ p: totalP, c: resultado.filas.reduce((a, f) => a + f.c, 0), g: resultado.filas.reduce((a, f) => a + f.g, 0) }) : null;

  const agregarTodo = () => {
    if (!resultado || !todasValidas) return;
    alAgregar(
      filasValidas.map(({ f, p, k }) => ({ id: nuevoId(), n: f.n.trim().slice(0, 80), por: f.por, q: 1, p, c: f.c, g: f.g, k, src: 'ia' as const })),
    );
    avisar(filasValidas.length === 1 ? 'Agregado 1 alimento' : `Agregados ${filasValidas.length} alimentos`);
    for (const f of fotos) URL.revokeObjectURL(f.url);
    setFotos([]);
    setTexto('');
    setDetalles([]);
    setResultado(null);
  };

  return (
    <div className={estilos.fotoTexto}>
      <input
        ref={entrada}
        id={`${id}-fotos`}
        className="solo-lector"
        type="file"
        accept="image/*"
        multiple
        onChange={(e) => void elegirFotos(e.target.files)}
        aria-describedby={`${id}-fotos-ayuda`}
      />
      {fotos.length === 0 ? (
        <label htmlFor={`${id}-fotos`} className={estilos.zonaFoto}>
          <Icono nombre="camara" tam={28} />
          <b>Sacá o elegí fotos de la comida</b>{' '}
          <span id={`${id}-fotos-ayuda`}>Una foto por plato, hasta {MAX_FOTOS}. Se analizan y no se guardan.</span>
        </label>
      ) : (
        <div className={estilos.fotos}>
          <ul className={estilos.miniaturas}>
            {fotos.map((f, i) => (
              <li key={f.id}>
                <img src={f.url} alt={`Foto ${i + 1} de la comida`} />
                <button type="button" onClick={() => quitarFoto(f.id)} aria-label={`Quitar la foto ${i + 1}`}>
                  <Icono nombre="cerrar" tam={14} />
                </button>
              </li>
            ))}
          </ul>
          {fotos.length > 1 && <p className="ayuda">Cada foto cuenta como un plato distinto, y se suman todos.</p>}
          {fotos.length < MAX_FOTOS && (
            <label htmlFor={`${id}-fotos`} className="boton chico">
              Agregar otra foto
            </label>
          )}
        </div>
      )}

      <fieldset className={estilos.detalles}>
        <legend className="rotulo">Lo que no se ve en la foto</legend>
        <div className={estilos.filtros}>
          {DETALLES.map((d) => (
            <button
              key={d}
              type="button"
              aria-pressed={detalles.includes(d)}
              onClick={() => setDetalles((x) => (x.includes(d) ? x.filter((y) => y !== d) : [...x, d]))}
            >
              {d}
            </button>
          ))}
        </div>
      </fieldset>

      <div className="campo">
        <label htmlFor={`${id}-texto`}>{fotos.length ? 'Detalles (opcional)' : 'Contá qué comiste y cuánto'}</label>
        <textarea
          id={`${id}-texto`}
          className="entrada"
          maxLength={600}
          placeholder={fotos.length ? 'Ej.: la carne es nalga; el vaso es de coca común' : 'Ej.: 2 milanesas de pollo al horno con puré y un vaso de coca'}
          value={texto}
          onChange={(e) => setTexto(e.target.value)}
        />
      </div>

      <div className={estilos.acciones}>
        <button type="button" className="boton primario" onClick={() => void calcular()} disabled={estado === 'calculando'}>
          {estado === 'calculando' ? (fotos.length ? 'Analizando…' : 'Calculando…') : 'Calcular'}
        </button>
        {estado === 'calculando' && (
          <button type="button" className="boton" onClick={() => control.current?.abort()}>
            Cancelar
          </button>
        )}
      </div>
      <p className="ayuda">Son estimaciones: revisalas y corregilas antes de agregar.</p>
      {mensaje && (
        <p className="error" role="alert">
          {mensaje}
        </p>
      )}

      {resultado && (
        <div className={estilos.resultado} aria-live="polite">
          {prop && (
            <div className={estilos.proporciones}>
              <span className="rotulo">Proporciones del plato, según las calorías</span>
              <div className={estilos.barraProp} role="img" aria-label={`Proteína ${prop.p} %, hidratos ${prop.c} %, grasas ${prop.g} %`}>
                <span data-m="p" style={{ width: `${prop.p}%` }} />
                <span data-m="c" style={{ width: `${prop.c}%` }} />
                <span data-m="g" style={{ width: `${prop.g}%` }} />
              </div>
              <p className={`${estilos.leyendaProp} num`}>
                <span data-m="p">Proteína {prop.p}&nbsp;%</span>
                <span data-m="c">Hidratos {prop.c}&nbsp;%</span>
                <span data-m="g">Grasas {prop.g}&nbsp;%</span>
              </p>
            </div>
          )}
          {resultado.comentario && <p>{resultado.comentario}</p>}
          {resultado.conFoto && (
            <p className="ayuda">Desde una foto no se ven el aceite ni el peso exacto, así que puede haber un error del 20 al 30&nbsp;%. Si sabés la porción, corregila.</p>
          )}
          <table className={estilos.tablaIA}>
            <thead>
              <tr>
                <th scope="col">Alimento</th>
                <th scope="col">Prot. g</th>
                <th scope="col">kcal</th>
                <th scope="col">
                  <span className="solo-lector">Quitar</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {filasValidas.map(({ f, ok }, i) => (
                <tr key={f.clave} data-error={!ok || undefined}>
                  <td>
                    <input className="entrada" value={f.n} maxLength={80} onChange={(e) => editar(f.clave, 'n', e.target.value)} aria-label={`Alimento ${i + 1}`} />
                    <span className={estilos.porcionIA}>{f.por}</span>
                  </td>
                  <td>
                    <input className="entrada" inputMode="decimal" value={f.pTexto} onChange={(e) => editar(f.clave, 'pTexto', e.target.value)} aria-label={`Proteína de ${f.n}, en gramos`} aria-invalid={!ok} />
                  </td>
                  <td>
                    <input className="entrada" inputMode="numeric" value={f.kTexto} onChange={(e) => editar(f.clave, 'kTexto', e.target.value)} aria-label={`Calorías de ${f.n}`} aria-invalid={!ok} />
                  </td>
                  <td>
                    <button
                      type="button"
                      className={estilos.quitarFila}
                      aria-label={`Sacar ${f.n}`}
                      onClick={() => setResultado((r) => (r ? { ...r, filas: r.filas.filter((x) => x.clave !== f.clave) } : r))}
                    >
                      <Icono nombre="cerrar" tam={16} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {!todasValidas && filasValidas.length > 0 && <p className="error">Revisá las filas marcadas: el nombre no puede quedar vacío y los valores tienen que ser números.</p>}
          <button type="button" className="boton primario ancho" onClick={agregarTodo} disabled={!todasValidas}>
            Agregar todo · {gramos(totalP)} g · {num(totalK)} kcal
          </button>
        </div>
      )}
    </div>
  );
}
