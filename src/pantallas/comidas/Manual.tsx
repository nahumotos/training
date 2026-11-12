import { useId, useState, type FormEvent } from 'react';
import { nuevoId } from '../../dominio/comidas';
import { leerNumero, num } from '../../dominio/formato';
import { LIMITES } from '../../dominio/saneo';
import type { ItemComida } from '../../dominio/tipos';
import { useAvisos } from '../../estado/Avisos';
import { useDatos } from '../../estado/Proveedor';
import estilos from './Comidas.module.css';

const VACIO = { n: '', por: '', p: '', c: '', g: '', k: '' };

export function Manual({ alAgregar }: { alAgregar: (items: ItemComida[]) => void }) {
  const id = useId();
  const { almacen } = useDatos();
  const { avisar } = useAvisos();
  const [f, setF] = useState(VACIO);
  const [guardar, setGuardar] = useState(true);
  const [errores, setErrores] = useState<Partial<Record<keyof typeof VACIO, string>>>({});

  const campo = (k: keyof typeof VACIO) => ({
    id: `${id}-${k}`,
    value: f[k],
    onChange: (e: { target: { value: string } }) => setF((x) => ({ ...x, [k]: e.target.value })),
    'aria-invalid': Boolean(errores[k]),
    'aria-describedby': errores[k] ? `${id}-${k}-error` : undefined,
  });

  const p = leerNumero(f.p);
  const c = leerNumero(f.c);
  const g = leerNumero(f.g);
  const kEscrito = leerNumero(f.k);
  // Si no se escriben las calorías pero sí los tres macros, se calculan.
  const kCalculado = kEscrito === null && p !== null && c !== null && g !== null ? Math.round(p * 4 + c * 4 + g * 9) : null;

  const enviar = (e: FormEvent) => {
    e.preventDefault();
    const err: typeof errores = {};
    const n = f.n.trim().slice(0, 80);
    if (!n) err.n = 'Poné el nombre del alimento.';
    const enRango = (v: number | null, [min, max]: readonly [number, number]) => v !== null && v >= min && v <= max;
    if (!enRango(p, LIMITES.p)) err.p = 'La proteína es un número entre 0 y 300.';
    if (f.c.trim() && !enRango(c, LIMITES.c)) err.c = 'Los hidratos son un número entre 0 y 1.000.';
    if (f.g.trim() && !enRango(g, LIMITES.g)) err.g = 'Las grasas son un número entre 0 y 500.';
    const k = kEscrito ?? kCalculado;
    if (!enRango(k, LIMITES.k)) err.k = 'Las calorías son un número entre 0 y 5.000 (o completá proteína, hidratos y grasas para calcularlas).';
    setErrores(err);
    if (Object.keys(err).length) {
      document.getElementById(`${id}-${Object.keys(err)[0]}`)?.focus();
      return;
    }
    const por = f.por.trim().slice(0, 60) || '1 porción';
    const valores = { n, por, p: p!, c: f.c.trim() ? c : null, g: f.g.trim() ? g : null, k: k! };
    let ref: string | undefined;
    if (guardar) {
      ref = nuevoId();
      void almacen.guardarAlimento({ id: ref, ...valores, creado: new Date().toISOString() }).catch(() => undefined);
    }
    alAgregar([{ id: nuevoId(), q: 1, src: guardar ? 'mio' : 'manual', ...valores, ...(ref ? { ref } : {}) }]);
    avisar(guardar ? `Agregado y guardado en Mis alimentos: ${n}` : `Agregado: ${n}`);
    setF(VACIO);
  };

  const error = (k: keyof typeof VACIO) =>
    errores[k] ? (
      <p className="error" id={`${id}-${k}-error`}>
        {errores[k]}
      </p>
    ) : null;

  return (
    <form className={estilos.manual} onSubmit={enviar} noValidate>
      <div className="campo">
        <label htmlFor={`${id}-n`}>Alimento</label>
        <input className="entrada" autoComplete="off" maxLength={80} placeholder="Ej.: Yogur proteico" {...campo('n')} />
        {error('n')}
      </div>
      <div className="campo">
        <label htmlFor={`${id}-por`}>Porción</label>
        <input className="entrada" autoComplete="off" maxLength={60} placeholder="Ej.: 1 pote (160 g)" {...campo('por')} />
      </div>
      <div className="grilla-campos">
        <div className="campo">
          <label htmlFor={`${id}-p`}>Proteína (g)</label>
          <input className="entrada" inputMode="decimal" autoComplete="off" placeholder="0" {...campo('p')} />
          {error('p')}
        </div>
        <div className="campo">
          <label htmlFor={`${id}-k`}>Calorías (kcal)</label>
          <input className="entrada" inputMode="decimal" autoComplete="off" placeholder={kCalculado !== null ? num(kCalculado) : '0'} {...campo('k')} />
          {error('k')}
        </div>
        <div className="campo">
          <label htmlFor={`${id}-c`}>Hidratos (g)</label>
          <input className="entrada" inputMode="decimal" autoComplete="off" placeholder="Opcional" {...campo('c')} />
          {error('c')}
        </div>
        <div className="campo">
          <label htmlFor={`${id}-g`}>Grasas (g)</label>
          <input className="entrada" inputMode="decimal" autoComplete="off" placeholder="Opcional" {...campo('g')} />
          {error('g')}
        </div>
      </div>
      {kCalculado !== null && <p className="ayuda">Sin calorías escritas, se calculan con los macros: {num(kCalculado)} kcal.</p>}
      <label className={estilos.casilla}>
        <input type="checkbox" checked={guardar} onChange={(e) => setGuardar(e.target.checked)} />
        Guardar en Mis alimentos para la próxima
      </label>
      <button type="submit" className="boton primario">
        Agregar
      </button>
    </form>
  );
}
