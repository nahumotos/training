import { Anillos } from '../../componentes/Anillos';
import { Cifra } from '../../componentes/Cifra';
import { estadoKcal, llegaProteina, type TotalesDia } from '../../dominio/comidas';
import { gramos, litros, num } from '../../dominio/formato';
import type { Objetivos } from '../../dominio/tipos';
import estilos from './Comidas.module.css';

function Medidor({ valor, escala, banda, ok, tipo }: { valor: number; escala: number; banda: { min: number; max: number }; ok: boolean; tipo: 'k' | 'c' | 'g' }) {
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
  const escalaK = Math.max(o.kcal.max * 1.2, totales.k);
  const okAgua = agua >= o.agua;

  return (
    <section className="tarjeta" aria-label="Resumen del día">
      <div className={estilos.metricas}>
        <div className={estilos.proteina}>
          <Anillos
            tam={140}
            anillos={[
              { tono: 'proteina', valor: totales.p, objetivo: o.proteina.obj, marca: o.proteina.min, ok: okP },
              { tono: 'kcal', valor: totales.k, objetivo: o.kcal.min, ok: k.tipo === 'rango', exceso: k.tipo === 'arriba' },
            ]}
          >
            <b className={`grabado ${estilos.cifraDisco}`}>
              <Cifra valor={totales.p} />
            </b>{' '}
            <span className={estilos.deDisco}>de {o.proteina.obj} g</span>
            <span className="solo-lector"> de proteína.</span>
          </Anillos>
          <p className={okP ? `${estilos.estadoMetrica} ${estilos.ok}` : estilos.estadoMetrica}>
            {okP ? 'Llegaste al objetivo de proteína' : `Te faltan ${num(o.proteina.obj - totales.p)} g de proteína`}
          </p>
        </div>
        <div className={estilos.otras}>
          <div className={estilos.metrica}>
            <span className="rotulo">Calorías</span>
            <p className={estilos.cifra}>
              <b className="grabado">
                <Cifra valor={totales.k} />
              </b>{' '}
              <span>
                de {num(o.kcal.min)}–{num(o.kcal.max)} kcal
              </span>
            </p>
            <Medidor valor={totales.k} escala={escalaK} banda={o.kcal} ok={false} tipo="k" />
            <p className={estilos.estadoMetrica}>
              {k.tipo === 'faltan' ? `Te quedan unas ${num(k.cuanto)} kcal` : k.tipo === 'rango' ? 'En el rango' : `${num(k.cuanto)} kcal arriba del rango`}
            </p>
          </div>
          <div className={estilos.macro}>
            <span>Hidratos</span>
            <b className="num">{gramos(totales.c)} g</b>
            <Medidor valor={totales.c} escala={Math.max(o.hidratos.max * 1.2, totales.c)} banda={o.hidratos} ok={false} tipo="c" />
            <span className="tenue num">
              <span className="solo-lector">objetivo </span>
              {o.hidratos.min}–{o.hidratos.max}
            </span>
          </div>
          <div className={estilos.macro}>
            <span>Grasas</span>
            <b className="num">{gramos(totales.g)} g</b>
            <Medidor valor={totales.g} escala={Math.max(o.grasas.max * 1.2, totales.g)} banda={o.grasas} ok={false} tipo="g" />
            <span className="tenue num">
              <span className="solo-lector">objetivo </span>
              {o.grasas.min}–{o.grasas.max}
            </span>
          </div>
          {totales.parcial && <p className="ayuda">Hidratos y grasas parciales: algunos alimentos no los informan.</p>}
        </div>
      </div>
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
