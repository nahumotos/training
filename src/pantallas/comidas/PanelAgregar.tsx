import { useState } from 'react';
import { Hoja } from '../../componentes/Hoja';
import { COMIDAS } from '../../dominio/comidas';
import type { ComidaId, ItemComida } from '../../dominio/tipos';
import { useSesion } from '../../estado/Proveedor';
import { FotoTexto } from './FotoTexto';
import { ListaAlimentos } from './ListaAlimentos';
import { Manual } from './Manual';
import estilos from './Comidas.module.css';

type Pestana = 'lista' | 'ia' | 'manual';

export function PanelAgregar({
  comida,
  alCerrar,
  alAgregar,
  recientes,
}: {
  comida: ComidaId | null;
  alCerrar: () => void;
  alAgregar: (comida: ComidaId, items: ItemComida[]) => void;
  recientes: ItemComida[];
}) {
  const { servicios } = useSesion();
  const [pestana, setPestana] = useState<Pestana>('lista');
  const def = COMIDAS.find((c) => c.id === comida);
  const conIA = servicios.ia.disponible;
  const pestanas: { id: Pestana; texto: string }[] = [
    { id: 'lista', texto: 'Lista' },
    ...(conIA ? [{ id: 'ia' as const, texto: 'Foto o texto' }] : []),
    { id: 'manual', texto: 'Manual' },
  ];
  const activa = pestana === 'ia' && !conIA ? 'lista' : pestana;

  const agregar = (items: ItemComida[]) => {
    if (comida) alAgregar(comida, items);
  };

  return (
    <Hoja abierta={comida !== null} titulo={def ? `Agregar ${def.a}` : 'Agregar'} alCerrar={alCerrar}>
      <div className={estilos.pestanas} role="tablist" aria-label="Forma de cargar">
        {pestanas.map((p) => (
          <button
            key={p.id}
            type="button"
            role="tab"
            id={`pestana-${p.id}`}
            aria-selected={activa === p.id}
            aria-controls={`panel-${p.id}`}
            tabIndex={activa === p.id ? 0 : -1}
            onClick={() => setPestana(p.id)}
            onKeyDown={(e) => {
              if (e.key !== 'ArrowRight' && e.key !== 'ArrowLeft') return;
              const i = pestanas.findIndex((x) => x.id === activa);
              const sig = pestanas[(i + (e.key === 'ArrowRight' ? 1 : pestanas.length - 1)) % pestanas.length]!;
              setPestana(sig.id);
              document.getElementById(`pestana-${sig.id}`)?.focus();
            }}
          >
            {p.texto}
          </button>
        ))}
      </div>
      <div role="tabpanel" id={`panel-${activa}`} aria-labelledby={`pestana-${activa}`} className={estilos.panelPestana}>
        {activa === 'lista' && <ListaAlimentos recientes={recientes} alAgregar={agregar} />}
        {activa === 'ia' && <FotoTexto alAgregar={agregar} />}
        {activa === 'manual' && <Manual alAgregar={agregar} />}
      </div>
    </Hoja>
  );
}
