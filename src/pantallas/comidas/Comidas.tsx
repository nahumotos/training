import { useMemo, useState } from 'react';
import { Link, Navigate, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { Icono } from '../../componentes/Icono';
import { esComidaId, IDS_COMIDA, nuevoId, recientes, totalesDia } from '../../dominio/comidas';
import { capitalizar, esFechaIso, fechaLarga, sumarDias } from '../../dominio/fechas';
import type { ComidaId, ItemComida } from '../../dominio/tipos';
import { useAvisos } from '../../estado/Avisos';
import { useDatos } from '../../estado/Proveedor';
import { useDias, useHoy, useTitulo } from '../../estado/hooks';
import { Cargando } from '../../app/Estados';
import { PanelAgregar } from './PanelAgregar';
import { RestoDelDia } from './RestoDelDia';
import { ResumenDia } from './ResumenDia';
import { SemanaProteina } from './SemanaProteina';
import { TarjetaComida } from './TarjetaComida';
import { useDiaEditable } from './useDiaEditable';
import estilos from './Comidas.module.css';

export function Comidas() {
  const hoy = useHoy();
  const { fecha: param } = useParams();
  if (param !== undefined && (!esFechaIso(param) || param > hoy)) return <Navigate to="/comidas" replace />;
  return <DiarioDia fecha={param ?? hoy} hoy={hoy} />;
}

function DiarioDia({ fecha, hoy }: { fecha: string; hoy: string }) {
  useTitulo(fecha === hoy ? 'Comidas de hoy' : `Comidas del ${fechaLarga(fecha)}`);
  const navegar = useNavigate();
  const [busqueda, setBusqueda] = useSearchParams();
  const { perfil } = useDatos();
  const { avisar } = useAvisos();
  const { dia, cargado, cambiar } = useDiaEditable(fecha);
  const [anteriores] = useDias(sumarDias(fecha, -21), sumarDias(fecha, -1));
  const o = perfil.objetivos;

  const agregarParam = busqueda.get('agregar');
  const [panel, setPanel] = useState<ComidaId | null>(esComidaId(agregarParam) ? agregarParam : null);

  const ayer = anteriores.find((d) => d.fecha === sumarDias(fecha, -1)) ?? null;
  const usados = useMemo(() => recientes([...anteriores, dia]), [anteriores, dia]);
  const totales = totalesDia(dia, o.umbralComida);

  const abrir = (c: ComidaId) => setPanel(c);
  const cerrar = () => {
    setPanel(null);
    if (busqueda.has('agregar')) {
      busqueda.delete('agregar');
      setBusqueda(busqueda, { replace: true });
    }
  };

  const agregar = (comida: ComidaId, items: ItemComida[]) => {
    cambiar((d) => ({ ...d, comidas: { ...d.comidas, [comida]: [...d.comidas[comida], ...items] } }));
  };

  const cambiarCantidad = (comida: ComidaId, id: string, q: number) => {
    cambiar((d) => ({ ...d, comidas: { ...d.comidas, [comida]: d.comidas[comida].map((it) => (it.id === id ? { ...it, q } : it)) } }));
  };

  const quitar = (comida: ComidaId, id: string) => {
    const lista = dia.comidas[comida];
    const pos = lista.findIndex((it) => it.id === id);
    const item = lista[pos];
    if (!item) return;
    cambiar((d) => ({ ...d, comidas: { ...d.comidas, [comida]: d.comidas[comida].filter((it) => it.id !== id) } }));
    avisar(`Quitado: ${item.n}`, {
      accion: {
        texto: 'Deshacer',
        hacer: () =>
          cambiar((d) => {
            const nueva = [...d.comidas[comida]];
            nueva.splice(Math.min(pos, nueva.length), 0, item);
            return { ...d, comidas: { ...d.comidas, [comida]: nueva } };
          }),
      },
    });
  };

  const copiarDeAyer = (comida: ComidaId) => {
    if (!ayer) return;
    const items = ayer.comidas[comida].map((it) => ({ ...it, id: nuevoId() }));
    agregar(comida, items);
    avisar('Copiado de ayer');
  };

  const esHoy = fecha === hoy;
  const etiquetaRelativa = esHoy ? 'Hoy' : fecha === sumarDias(hoy, -1) ? 'Ayer' : '';

  return (
    <div className="pila">
      <header className={estilos.navFecha}>
        <Link to={`/comidas/${sumarDias(fecha, -1)}`} className={estilos.flecha} aria-label="Día anterior">
          <Icono nombre="izquierda" />
        </Link>
        <div className={estilos.fecha}>
          <span className="ceja">{etiquetaRelativa || 'Diario de comidas'}</span>
          <h1>{capitalizar(fechaLarga(fecha))}</h1>
        </div>
        {esHoy ? (
          <span className={estilos.flecha} aria-hidden="true" data-deshabilitada />
        ) : (
          <Link to={sumarDias(fecha, 1) === hoy ? '/comidas' : `/comidas/${sumarDias(fecha, 1)}`} className={estilos.flecha} aria-label="Día siguiente">
            <Icono nombre="derecha" />
          </Link>
        )}
      </header>
      {!esHoy && (
        <button type="button" className={`boton chico ${estilos.volverHoy}`} onClick={() => navegar('/comidas')}>
          Volver a hoy
        </button>
      )}

      {cargado ? (
        <>
          <ResumenDia totales={totales} agua={dia.agua} objetivos={o} />

          <div className={estilos.comidas}>
            {IDS_COMIDA.map((c) => (
              <TarjetaComida
                key={c}
                comida={c}
                items={dia.comidas[c]}
                macros={totales.porComida[c]}
                ayer={ayer?.comidas[c] ?? []}
                alAgregar={() => abrir(c)}
                alCopiarAyer={() => copiarDeAyer(c)}
                alCambiarCantidad={(id, q) => cambiarCantidad(c, id, q)}
                alQuitar={(id) => quitar(c, id)}
              />
            ))}
          </div>

          <RestoDelDia dia={dia} objetivoAgua={o.agua} cambiar={cambiar} />

          <SemanaProteina fecha={fecha} dias={[...anteriores, dia]} objetivos={o} />

          <p className={estilos.pie}>Los valores son aproximados. Si un envase dice otra cosa, cargalo en Manual con los datos de la etiqueta.</p>
        </>
      ) : (
        <Cargando enLinea />
      )}

      {cargado && <PanelAgregar comida={panel} alCerrar={cerrar} alAgregar={agregar} recientes={usados} />}
    </div>
  );
}
