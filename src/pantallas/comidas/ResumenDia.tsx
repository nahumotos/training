import { estadoKcal, llegaProteina, type TotalesDia } from '../../dominio/comidas';
import { gramos, litros, num } from '../../dominio/formato';
import type { Objetivos } from '../../dominio/tipos';
import estilos from './Comidas.module.css';

function Medidor({ valor, escala, banda, ok, tipo }: { valor: number; escala: number; banda: { min: number; max: number }; ok: boolean; tipo: 'p' | 'k' }) {
  return (
    <div className={estilos.medidor} data-tipo={tipo} aria-hidden="true">
      <span className={estilos.banda} style={{ left: `${(banda.min / escala) * 100}%`, width: `${((banda.max - banda.min) / escala) * 100}%` }} />
      <span className={estilos.relleno} data-ok={ok || undefined} style={{ width: `${Math.min(100, (valor / escala) * 100)}%` }} />
    </div>
  );
}

export function ResumenDia({ totales, agua, objetivos: o }: { totales: TotalesDia; agua: number; objetivos: Objetivos }) {
  const okP = llegaProteina(totales.p, o);
  const k = estadoKcal(totales.k, o);
  const escalaP = Math.max(o.proteina.max * 1.15, totales.p);
  const escalaK = Math.max(o.kcal.max * 1.2, totales.k);
  const okAgua = agua >= o.agua;

  return (
    <section className="tarjeta" aria-label="Resumen del día">
      <div className={estilos.metricas}>
        <div className={estilos.metrica}>
          <span className="rotulo">Proteína</span>
          <p className={estilos.cifra}>
            <b className="num">{num(totales.p)}</b>{' '}
            <span>de {o.proteina.obj} g</span>
          </p>
          <Medidor valor={totales.p} escala={escalaP} banda={o.proteina} ok={okP} tipo="p" />
          <p className={okP ? `${estilos.estadoMetrica} ${estilos.ok}` : estilos.estadoMetrica}>
            {okP ? 'Llegaste al objetivo de proteína' : `Te faltan ${num(o.proteina.obj - totales.p)} g`}
          </p>
        </div>
        <div className={estilos.metrica}>
          <span className="rotulo">Calorías</span>
          <p className={estilos.cifra}>
            <b className="num">{num(totales.k)}</b>{' '}
            <span>
              de {num(o.kcal.min)}–{num(o.kcal.max)} kcal
            </span>
          </p>
          <Medidor valor={totales.k} escala={escalaK} banda={o.kcal} ok={false} tipo="k" />
          <p className={estilos.estadoMetrica}>
            {k.tipo === 'faltan' ? `Te quedan unas ${num(k.cuanto)} kcal` : k.tipo === 'rango' ? 'En el rango' : `${num(k.cuanto)} kcal arriba del rango`}
          </p>
        </div>
      </div>
      <p className={estilos.macros}>
        Hidratos <b className="num">{gramos(totales.c)} g</b> <span className="tenue">({o.hidratos.min}–{o.hidratos.max})</span> · Grasas{' '}
        <b className="num">{gramos(totales.g)} g</b> <span className="tenue">({o.grasas.min}–{o.grasas.max})</span>
        {totales.parcial && <span className="tenue"> · parcial: algunos alimentos no los informan</span>}
      </p>
      <div className="chips">
        <span className={totales.comidasConProteina >= 4 ? 'chip bien' : 'chip'}>
          Comidas con proteína <b>{totales.comidasConProteina} de 4</b>
        </span>
        <span className={okAgua ? 'chip bien' : 'chip'}>
          Agua <b>{litros(agua)}</b>
        </span>
      </div>
      {!okP && totales.conComida && (
        <p className={estilos.consejo}>
          Para sumar proteína: 2 huevos (12 g) · 1 taza de leche (8 g) · 2 fetas de queso (9 g) · 100 g de pollo (31 g). Una comida cuenta como «con proteína»
          desde {o.umbralComida} g.
        </p>
      )}
    </section>
  );
}
