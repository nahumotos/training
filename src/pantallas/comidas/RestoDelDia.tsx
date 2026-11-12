import { useEffect, useId, useRef, useState } from 'react';
import { Paso } from '../../componentes/Paso';
import { leerNumero, litros, num } from '../../dominio/formato';
import { LIMITES } from '../../dominio/saneo';
import type { Dia } from '../../dominio/tipos';
import estilos from './Comidas.module.css';

type CampoTexto = 'pasos' | 'peso' | 'cintura' | 'molestias' | 'nota';

function valorInicial(d: Dia, campo: CampoTexto): string {
  const v = d[campo];
  if (v === null) return '';
  return typeof v === 'number' ? num(v, campo === 'pasos' ? 0 : 1).replace(/\./g, '') : v;
}

/**
 * Campo que guarda mientras escribís (con una pausa) y al salir.
 * Muestra un error si el valor no es válido y no lo guarda.
 */
function useCampo(dia: Dia, campo: CampoTexto, cambiar: (f: (d: Dia) => Dia) => void) {
  const [texto, setTexto] = useState(() => valorInicial(dia, campo));
  const [error, setError] = useState('');
  const enfocado = useRef(false);
  const temporizador = useRef<number | undefined>(undefined);

  // Si el dato cambia desde afuera (otro dispositivo, otro día) y no se está escribiendo, se actualiza.
  const externo = valorInicial(dia, campo);
  useEffect(() => {
    if (!enfocado.current) setTexto(externo);
  }, [externo, dia.fecha]);

  const interpretar = (t: string): { ok: true; valor: Dia[CampoTexto] } | { ok: false; error: string } => {
    if (campo === 'molestias') return { ok: true, valor: t.slice(0, 300) };
    if (campo === 'nota') return { ok: true, valor: t.slice(0, 1000) };
    if (!t.trim()) return { ok: true, valor: null };
    const n = leerNumero(t.replace(/\./g, campo === 'pasos' ? '' : '.'));
    const [min, max] = LIMITES[campo];
    if (n === null || n < min || n > max) {
      const que = campo === 'pasos' ? 'Los pasos' : campo === 'peso' ? 'El peso' : 'La cintura';
      return { ok: false, error: `${que}: un número entre ${num(min)} y ${num(max)}.` };
    }
    return { ok: true, valor: campo === 'pasos' ? Math.round(n) : Math.round(n * 10) / 10 };
  };

  const guardar = (t: string) => {
    const r = interpretar(t);
    if (!r.ok) {
      setError(r.error);
      return;
    }
    setError('');
    if (r.valor !== dia[campo]) cambiar((d) => ({ ...d, [campo]: r.valor }));
  };

  return {
    props: {
      value: texto,
      onChange: (e: { target: { value: string } }) => {
        setTexto(e.target.value);
        window.clearTimeout(temporizador.current);
        const v = e.target.value;
        temporizador.current = window.setTimeout(() => guardar(v), 700);
      },
      onFocus: () => {
        enfocado.current = true;
      },
      onBlur: () => {
        enfocado.current = false;
        window.clearTimeout(temporizador.current);
        guardar(texto);
      },
      'aria-invalid': Boolean(error),
    },
    error,
  };
}

export function RestoDelDia({ dia, objetivoAgua, cambiar }: { dia: Dia; objetivoAgua: number; cambiar: (f: (d: Dia) => Dia) => void }) {
  const id = useId();
  const pasos = useCampo(dia, 'pasos', cambiar);
  const peso = useCampo(dia, 'peso', cambiar);
  const cintura = useCampo(dia, 'cintura', cambiar);
  const molestias = useCampo(dia, 'molestias', cambiar);
  const nota = useCampo(dia, 'nota', cambiar);
  const errores = [pasos.error, peso.error, cintura.error].filter(Boolean);

  const hora = (campo: 'acosto' | 'levanto', valor: string) => {
    if (valor === '' || /^\d{2}:\d{2}$/.test(valor)) cambiar((d) => ({ ...d, [campo]: valor }));
  };

  return (
    <section className="tarjeta" aria-labelledby={`${id}-titulo`}>
      <h2 id={`${id}-titulo`} className="titulo-seccion">
        El resto del día
      </h2>

      <div className={estilos.agua}>
        <div>
          <b>Agua</b>
          <p className="tenue">Objetivo: {litros(objetivoAgua)}, contando el gimnasio. El mate no cuenta.</p>
        </div>
        <Paso
          valor={litros(dia.agua)}
          etiqueta="un vaso de agua"
          alMenos={() => cambiar((d) => ({ ...d, agua: Math.max(0, d.agua - 250) }))}
          alMas={() => cambiar((d) => ({ ...d, agua: Math.min(10000, d.agua + 250) }))}
          menosDeshabilitado={dia.agua <= 0}
        />
      </div>
      <p className="ayuda">Cada toque suma o resta un vaso de 250 ml.</p>

      <div className="grilla-campos">
        <div className="campo">
          <label htmlFor={`${id}-pasos`}>Pasos</label>
          <input id={`${id}-pasos`} className="entrada" inputMode="numeric" autoComplete="off" placeholder="App Salud" {...pasos.props} />
        </div>
        <div className="campo">
          <label htmlFor={`${id}-acosto`}>Te acostaste</label>
          <input id={`${id}-acosto`} className="entrada" type="time" value={dia.acosto} onChange={(e) => hora('acosto', e.target.value)} />
        </div>
        <div className="campo">
          <label htmlFor={`${id}-levanto`}>Te levantaste</label>
          <input id={`${id}-levanto`} className="entrada" type="time" value={dia.levanto} onChange={(e) => hora('levanto', e.target.value)} />
        </div>
      </div>

      <fieldset className={estilos.energia}>
        <legend className="rotulo">Energía</legend>
        <div className={estilos.segmentos}>
          {[1, 2, 3, 4, 5].map((n) => (
            <button
              key={n}
              type="button"
              aria-pressed={dia.energia === n}
              aria-label={`Energía ${n} de 5`}
              onClick={() => cambiar((d) => ({ ...d, energia: d.energia === n ? null : n }))}
            >
              {n}
            </button>
          ))}
        </div>
        <p className="ayuda">1 = sin energía · 5 = con mucha energía</p>
      </fieldset>

      <div className="grilla-campos">
        <div className="campo">
          <label htmlFor={`${id}-peso`}>Peso (kg)</label>
          <input id={`${id}-peso`} className="entrada" inputMode="decimal" autoComplete="off" placeholder="Si te pesaste" {...peso.props} />
        </div>
        <div className="campo">
          <label htmlFor={`${id}-cintura`}>Cintura (cm)</label>
          <input id={`${id}-cintura`} className="entrada" inputMode="decimal" autoComplete="off" placeholder="Cada 2 semanas" {...cintura.props} />
        </div>
      </div>
      {errores.length > 0 && (
        <p className="error" role="alert">
          {errores.join(' ')}
        </p>
      )}
      <div className="campo">
        <label htmlFor={`${id}-molestias`}>Molestias</label>
        <input id={`${id}-molestias`} className="entrada" autoComplete="off" maxLength={300} placeholder="Ej.: hombro derecho, 3 de 10" {...molestias.props} />
      </div>
      <div className="campo">
        <label htmlFor={`${id}-nota`}>Nota del día</label>
        <textarea id={`${id}-nota`} className="entrada" maxLength={1000} placeholder="Cómo te fue, qué te costó" {...nota.props} />
      </div>
    </section>
  );
}
