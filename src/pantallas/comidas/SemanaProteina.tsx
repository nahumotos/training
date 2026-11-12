import { GraficoBarras } from '../../componentes/Graficos';
import { promedio } from '../../dominio/progreso';
import { totalesDia } from '../../dominio/comidas';
import { deIso, sumarDias } from '../../dominio/fechas';
import { num } from '../../dominio/formato';
import type { Dia, Objetivos } from '../../dominio/tipos';

const INICIALES = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];

/** Proteína de los últimos 7 días hasta la fecha que se está viendo. */
export function SemanaProteina({ fecha, dias, objetivos: o }: { fecha: string; dias: Dia[]; objetivos: Objetivos }) {
  const porFecha = new Map(dias.map((d) => [d.fecha, d]));
  const serie = Array.from({ length: 7 }, (_, i) => {
    const f = sumarDias(fecha, i - 6);
    const d = porFecha.get(f);
    const t = d ? totalesDia(d, o.umbralComida) : null;
    return { fecha: f, p: t?.conComida ? t.p : null, k: t?.conComida ? t.k : null };
  });
  const cargados = serie.filter((x) => x.p !== null);
  const conObjetivo = cargados.filter((x) => (x.p ?? 0) >= o.proteina.min).length;
  const promP = promedio(cargados.map((x) => x.p!));
  const promK = promedio(cargados.map((x) => x.k!));
  const descripcion = serie
    .map((x) => `${INICIALES[deIso(x.fecha).getDay()]} ${deIso(x.fecha).getDate()}: ${x.p === null ? 'sin cargar' : `${num(x.p)} g de proteína`}`)
    .join('; ');

  return (
    <section className="tarjeta" aria-labelledby="semana-titulo">
      <div className="fila-titulo">
        <h2 id="semana-titulo">Últimos 7 días</h2>
        <span className="tenue">Proteína por día</span>
      </div>
      <GraficoBarras
        barras={serie.map((x) => ({
          clave: x.fecha,
          etiqueta: `${INICIALES[deIso(x.fecha).getDay()]} ${deIso(x.fecha).getDate()}`,
          valor: x.p,
          sub: x.k === null ? '' : num(x.k),
          destacada: x.fecha === fecha,
        }))}
        objetivo={{ valor: o.proteina.obj, texto: `${o.proteina.obj} g` }}
        minimoOk={o.proteina.min}
        descripcion={`Proteína por día: ${descripcion}`}
        formato={(v) => num(v)}
      />
      {cargados.length ? (
        <p className="tenue">
          Días con {o.proteina.min} g o más: <b>{conObjetivo} de {cargados.length}</b> · Promedio por día cargado: <b>{num(promP ?? 0)} g</b> de proteína y{' '}
          <b>{num(promK ?? 0)} kcal</b>
        </p>
      ) : (
        <p className="tenue">Cuando cargues comidas, acá vas a ver cómo viene la semana.</p>
      )}
    </section>
  );
}
