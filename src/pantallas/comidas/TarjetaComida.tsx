import { useState } from 'react';
import { Paso } from '../../componentes/Paso';
import { COMIDAS, type Macros } from '../../dominio/comidas';
import { cantidad, gramos, num } from '../../dominio/formato';
import type { ComidaId, ItemComida } from '../../dominio/tipos';
import estilos from './Comidas.module.css';

export function TarjetaComida({
  comida,
  items,
  macros,
  ayer,
  alAgregar,
  alCopiarAyer,
  alCambiarCantidad,
  alQuitar,
}: {
  comida: ComidaId;
  items: ItemComida[];
  macros: Macros | undefined;
  ayer: ItemComida[];
  alAgregar: () => void;
  alCopiarAyer: () => void;
  alCambiarCantidad: (id: string, q: number) => void;
  alQuitar: (id: string) => void;
}) {
  const def = COMIDAS.find((c) => c.id === comida)!;
  const [abierto, setAbierto] = useState<string | null>(null);

  return (
    <section className="tarjeta" aria-labelledby={`comida-${comida}`}>
      <div className={estilos.cabComida}>
        <div>
          <h2 id={`comida-${comida}`}>{def.nombre}</h2>
          <span className={estilos.hora}>{def.hora}</span>
        </div>
        {items.length > 0 && macros && (
          <p className={`${estilos.totalComida} num`}>
            <b>{gramos(macros.p)} g</b> · {num(macros.k)} kcal
          </p>
        )}
      </div>

      {items.length ? (
        <ul className={estilos.items}>
          {items.map((it) => {
            const editando = abierto === it.id;
            return (
              <li key={it.id}>
                <button type="button" className={estilos.item} aria-expanded={editando} onClick={() => setAbierto(editando ? null : it.id)}>
                  <span className={estilos.nombreItem}>
                    {it.n}
                    <span className={estilos.cantidad}>{cantidad(it.q)}</span>
                  </span>
                  <span className={estilos.porcion}>{it.por || '1 porción'}</span>
                  <span className={`${estilos.valores} num`}>
                    <b>{gramos(it.p * it.q)} g</b> · {num(it.k * it.q)} kcal
                  </span>
                </button>
                {editando && (
                  <div className={estilos.edicion}>
                    <Paso
                      valor={cantidad(it.q)}
                      etiqueta="cantidad"
                      alMenos={() => alCambiarCantidad(it.id, Math.max(0.5, it.q - 0.5))}
                      alMas={() => alCambiarCantidad(it.id, Math.min(10, it.q + 0.5))}
                      menosDeshabilitado={it.q <= 0.5}
                      masDeshabilitado={it.q >= 10}
                    />
                    <button
                      type="button"
                      className="boton chico peligro"
                      aria-label={`Quitar ${it.n}`}
                      onClick={() => {
                        setAbierto(null);
                        alQuitar(it.id);
                      }}
                    >
                      Quitar
                    </button>
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      ) : (
        <div className={estilos.vacia}>
          <span>Sin cargar.</span>
          {ayer.length > 0 && (
            <button type="button" className="enlace" onClick={alCopiarAyer}>
              Copiar lo de ayer: {ayer.slice(0, 3).map((i) => `${i.n}${i.q !== 1 ? ` ${cantidad(i.q)}` : ''}`).join(', ')}
              {ayer.length > 3 ? '…' : ''}
            </button>
          )}
        </div>
      )}

      <button type="button" className={estilos.agregar} onClick={alAgregar}>
        + Agregar {def.a}
      </button>
    </section>
  );
}
