import { useMemo, useState } from 'react';
import { Paso } from '../../componentes/Paso';
import { BIBLIOTECA, CATEGORIAS, coincide } from '../../datos/alimentos';
import { nuevoId } from '../../dominio/comidas';
import { cantidad, gramos, num } from '../../dominio/formato';
import type { Alimento, CategoriaId, ItemComida, OrigenItem } from '../../dominio/tipos';
import { useAvisos } from '../../estado/Avisos';
import { useDatos } from '../../estado/Proveedor';
import { useAlimentosPropios } from '../../estado/hooks';
import estilos from './Comidas.module.css';

type Filtro = 'recientes' | 'todo' | CategoriaId | 'mios';

interface Opcion {
  clave: string;
  alimento: Alimento;
  src: OrigenItem;
  /** Cantidad con la que arranca (la de la última vez, para los recientes). */
  q: number;
  borrable?: boolean;
}

export function ListaAlimentos({ recientes, alAgregar }: { recientes: ItemComida[]; alAgregar: (items: ItemComida[]) => void }) {
  const { almacen } = useDatos();
  const { avisar } = useAvisos();
  const propios = useAlimentosPropios();
  const [consulta, setConsulta] = useState('');
  const [filtro, setFiltro] = useState<Filtro>(recientes.length ? 'recientes' : 'todo');
  const [elegido, setElegido] = useState<{ clave: string; q: number } | null>(null);
  const [confirmarBorrar, setConfirmarBorrar] = useState<string | null>(null);

  const opciones = useMemo<Opcion[]>(() => {
    const lib: Opcion[] = BIBLIOTECA.map((a) => ({ clave: `lib-${a.id}`, alimento: a, src: 'lib', q: 1 }));
    const mios: Opcion[] = propios.map((a) => ({ clave: `mio-${a.id}`, alimento: a, src: 'mio', q: 1, borrable: true }));
    const rec: Opcion[] = recientes.map((it) => ({
      clave: `rec-${it.ref ?? it.n}`,
      alimento: { id: it.ref ?? it.n, n: it.n, por: it.por, p: it.p, c: it.c, g: it.g, k: it.k },
      src: it.src,
      q: it.q,
    }));
    const q = consulta.trim();
    if (q) {
      // Al buscar, se busca en todo: biblioteca y Mis alimentos (y recientes que no estén en ninguno).
      const vistos = new Set([...lib, ...mios].map((o) => o.alimento.n.toLowerCase()));
      const extra = rec.filter((o) => !vistos.has(o.alimento.n.toLowerCase()));
      return [...mios, ...lib, ...extra].filter((o) => coincide(`${o.alimento.n} ${o.alimento.por}`, q));
    }
    if (filtro === 'recientes') return rec;
    if (filtro === 'mios') return mios;
    if (filtro === 'todo') return [...mios, ...lib];
    return lib.filter((o) => (o.alimento as (typeof BIBLIOTECA)[number]).cat === filtro);
  }, [consulta, filtro, propios, recientes]);

  const filtros: { id: Filtro; texto: string }[] = [
    ...(recientes.length ? [{ id: 'recientes' as const, texto: 'Recientes' }] : []),
    { id: 'todo', texto: 'Todo' },
    ...CATEGORIAS.map((c) => ({ id: c.id, texto: c.nombre })),
    { id: 'mios', texto: 'Mis alimentos' },
  ];
  const ayuda = consulta.trim()
    ? ''
    : filtro === 'mios'
      ? 'Lo que cargás en Manual con «Guardar en Mis alimentos» aparece acá.'
      : filtro === 'recientes'
        ? 'Lo que más cargaste en las últimas semanas, con la cantidad de la última vez.'
        : (CATEGORIAS.find((c) => c.id === filtro)?.ayuda ?? '');

  const agregar = (o: Opcion, q: number) => {
    const a = o.alimento;
    alAgregar([{ id: nuevoId(), n: a.n, por: a.por, q, p: a.p, c: a.c, g: a.g, k: a.k, src: o.src, ref: a.id }]);
    avisar(`Agregado: ${a.n} ${cantidad(q)}`);
    setElegido(null);
  };

  const borrar = (o: Opcion) => {
    void almacen.borrarAlimento(o.alimento.id).catch(() => undefined);
    avisar(`Borrado de Mis alimentos: ${o.alimento.n}`);
    setConfirmarBorrar(null);
    setElegido(null);
  };

  return (
    <>
      <div className="campo">
        <label htmlFor="buscar-alimento" className="solo-lector">
          Buscar alimento
        </label>
        <input
          id="buscar-alimento"
          className="entrada"
          type="search"
          autoComplete="off"
          placeholder="Buscar: pollo, fideos, yogur…"
          value={consulta}
          onChange={(e) => {
            setConsulta(e.target.value);
            setElegido(null);
          }}
        />
      </div>
      {!consulta.trim() && (
        <div className={estilos.filtros} role="group" aria-label="Categorías">
          {filtros.map((f) => (
            <button
              key={f.id}
              type="button"
              aria-pressed={filtro === f.id}
              onClick={() => {
                setFiltro(f.id);
                setElegido(null);
              }}
            >
              {f.texto}
            </button>
          ))}
        </div>
      )}
      {ayuda && <p className="ayuda">{ayuda}</p>}

      {opciones.length === 0 ? (
        <p className="ayuda">
          {filtro === 'mios' && !consulta.trim() ? 'Todavía no guardaste alimentos. Cargalos en Manual.' : 'No lo encontré. Probá con otra palabra o cargalo en Manual.'}
        </p>
      ) : (
        <ul className={estilos.biblioteca}>
          {opciones.map((o) => {
            const sel = elegido?.clave === o.clave;
            const a = o.alimento;
            return (
              <li key={o.clave}>
                <button
                  type="button"
                  className={estilos.item}
                  aria-expanded={sel}
                  onClick={() => {
                    setElegido(sel ? null : { clave: o.clave, q: o.q });
                    setConfirmarBorrar(null);
                  }}
                >
                  <span className={estilos.nombreItem}>
                    {a.n}
                    {o.q !== 1 && <span className={estilos.cantidad}>{cantidad(o.q)}</span>}
                  </span>
                  <span className={estilos.porcion}>{a.por || '1 porción'}</span>
                  <span className={`${estilos.valores} num`}>
                    <b>{gramos(a.p)} g</b> · {num(a.k)} kcal
                  </span>
                </button>
                {sel && elegido && (
                  <div className={estilos.edicion}>
                    <Paso
                      valor={cantidad(elegido.q)}
                      etiqueta="cantidad"
                      alMenos={() => setElegido({ ...elegido, q: Math.max(0.5, elegido.q - 0.5) })}
                      alMas={() => setElegido({ ...elegido, q: Math.min(10, elegido.q + 0.5) })}
                      menosDeshabilitado={elegido.q <= 0.5}
                      masDeshabilitado={elegido.q >= 10}
                    />
                    <button type="button" className={`boton primario ${estilos.agregarElegido}`} onClick={() => agregar(o, elegido.q)}>
                      Agregar · {gramos(a.p * elegido.q)} g · {num(a.k * elegido.q)} kcal
                    </button>
                    {o.borrable &&
                      (confirmarBorrar === o.clave ? (
                        <button type="button" className="boton chico peligro" onClick={() => borrar(o)}>
                          Sí, borrar
                        </button>
                      ) : (
                        <button type="button" className="boton chico" onClick={() => setConfirmarBorrar(o.clave)}>
                          Borrar
                        </button>
                      ))}
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </>
  );
}
