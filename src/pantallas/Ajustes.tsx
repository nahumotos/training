import { useId, useState, type FormEvent } from 'react';
import { Cargando } from '../app/Estados';
import { Icono } from '../componentes/Icono';
import { NOMBRE_APP, VERSION } from '../config';
import { esFechaIso, fechaLarga, hoyIso } from '../dominio/fechas';
import { leerNumero } from '../dominio/formato';
import { OBJETIVOS_INICIALES, validarObjetivos, type ErrorValidacion } from '../dominio/perfil';
import { ErrorImportacion, sanearExportacion } from '../dominio/saneo';
import type { Exportacion, Objetivos, Perfil } from '../dominio/tipos';
import { useAvisos } from '../estado/Avisos';
import { useDatos, useSesion } from '../estado/Proveedor';
import { useTitulo } from '../estado/hooks';
import estilos from './Ajustes.module.css';

type FormObjetivos = Record<'pObj' | 'pMin' | 'pMax' | 'kMin' | 'kMax' | 'cMin' | 'cMax' | 'gMin' | 'gMax' | 'agua' | 'umbral', string>;

const aForm = (o: Objetivos): FormObjetivos => ({
  pObj: String(o.proteina.obj),
  pMin: String(o.proteina.min),
  pMax: String(o.proteina.max),
  kMin: String(o.kcal.min),
  kMax: String(o.kcal.max),
  cMin: String(o.hidratos.min),
  cMax: String(o.hidratos.max),
  gMin: String(o.grasas.min),
  gMax: String(o.grasas.max),
  agua: String(o.agua),
  umbral: String(o.umbralComida),
});

const deForm = (f: FormObjetivos): Objetivos => {
  const n = (s: string) => leerNumero(s) ?? Number.NaN;
  return {
    proteina: { obj: n(f.pObj), min: n(f.pMin), max: n(f.pMax) },
    kcal: { min: n(f.kMin), max: n(f.kMax) },
    hidratos: { min: n(f.cMin), max: n(f.cMax) },
    grasas: { min: n(f.gMin), max: n(f.gMax) },
    agua: n(f.agua),
    umbralComida: n(f.umbral),
  };
};

export default function Ajustes() {
  useTitulo('Ajustes');
  const { servicios } = useSesion();
  const { perfil, perfilCargado, almacen, usuario } = useDatos();

  const guardarPerfil = (p: Perfil) => almacen.guardarPerfil(p).catch(() => undefined);

  return (
    <div className="pila pantalla">
      <header className="cabecera">
        <h1>Tu cuenta y tus objetivos</h1>
      </header>
      {/* La clave remonta los formularios cuando llega el perfil guardado o cambia en otro dispositivo. */}
      {/* Hasta tener el perfil guardado no se muestran los formularios: guardar antes lo pisaría. */}
      {perfilCargado ? (
        <>
          <PerfilYRutina key={`${perfil.nombre}|${perfil.inicioRutina}`} perfil={perfil} alGuardar={guardarPerfil} />
          <ObjetivosForm key={JSON.stringify(perfil.objetivos)} perfil={perfil} alGuardar={guardarPerfil} />
        </>
      ) : (
        <Cargando enLinea />
      )}
      <Datos />
      <Instalar />
      <section className="tarjeta" aria-labelledby="aj-cuenta">
        <h2 id="aj-cuenta" className="titulo-seccion con-icono">
        <Icono nombre="ajustes" tam={20} />
        Cuenta
      </h2>
        <p>
          Ingresaste como <b>{usuario.email}</b>
          {servicios.modo === 'demo' && ' (modo demo: los datos quedan solo en este navegador)'}.
        </p>
        <p className="tenue">
          Cálculo de comidas con IA: {servicios.ia.disponible ? 'activado' : 'no configurado (falta la dirección del servicio en la configuración del sitio)'}.
        </p>
        <button type="button" className="boton peligro" onClick={() => void servicios.auth.salir()}>
          Cerrar sesión
        </button>
      </section>
      <section className="tarjeta" aria-labelledby="aj-acerca">
        <h2 id="aj-acerca" className="titulo-seccion con-icono">
        <Icono nombre="libro" tam={20} />
        Acerca de
      </h2>
        <p className="tenue">
          {NOMBRE_APP} {VERSION}. Fotos de los ejercicios:{' '}
          <a href="https://github.com/yuhonas/free-exercise-db" target="_blank" rel="noopener noreferrer">
            Free Exercise DB
          </a>
          , de dominio público. Fuentes Barlow y Barlow Condensed (SIL Open Font License).
        </p>
      </section>
    </div>
  );
}

function PerfilYRutina({ perfil, alGuardar }: { perfil: Perfil; alGuardar: (p: Perfil) => void }) {
  const id = useId();
  const { avisar } = useAvisos();
  const [nombre, setNombre] = useState(perfil.nombre);
  const [inicio, setInicio] = useState(perfil.inicioRutina);
  const [error, setError] = useState('');

  const enviar = (e: FormEvent) => {
    e.preventDefault();
    if (!esFechaIso(inicio)) {
      setError('Elegí una fecha válida.');
      return;
    }
    setError('');
    alGuardar({ ...perfil, nombre: nombre.trim().slice(0, 60), inicioRutina: inicio });
    avisar('Guardado');
  };

  return (
    <form className="tarjeta" onSubmit={enviar} aria-labelledby={`${id}-t`} noValidate>
      <h2 id={`${id}-t`} className="titulo-seccion con-icono">
        <Icono nombre="persona" tam={20} />
        Perfil y rutina
      </h2>
      <div className="grilla-campos">
        <div className="campo">
          <label htmlFor={`${id}-nombre`}>Nombre</label>
          <input id={`${id}-nombre`} className="entrada" autoComplete="given-name" maxLength={60} value={nombre} onChange={(e) => setNombre(e.target.value)} />
        </div>
        <div className="campo">
          <label htmlFor={`${id}-inicio`}>Inicio de la rutina</label>
          <input
            id={`${id}-inicio`}
            className="entrada"
            type="date"
            value={inicio}
            onChange={(e) => setInicio(e.target.value)}
            aria-invalid={Boolean(error)}
            aria-describedby={`${id}-inicio-ayuda`}
          />
        </div>
      </div>
      <p className="ayuda" id={`${id}-inicio-ayuda`}>
        {esFechaIso(inicio) ? `La semana 1 del plan empieza el ${fechaLarga(inicio)}.` : 'Elegí el lunes en que empezás.'}
      </p>
      {error && (
        <p className="error" role="alert">
          {error}
        </p>
      )}
      <button type="submit" className="boton primario">
        Guardar
      </button>
    </form>
  );
}

const CAMPOS: { titulo: string; campos: [keyof FormObjetivos, string][]; error: string[] }[] = [
  { titulo: 'Proteína (g por día)', campos: [['pObj', 'Objetivo'], ['pMin', 'Mínimo'], ['pMax', 'Máximo']], error: ['proteina.obj', 'proteina.rango'] },
  { titulo: 'Calorías (kcal por día)', campos: [['kMin', 'Mínimo'], ['kMax', 'Máximo']], error: ['kcal'] },
  { titulo: 'Hidratos (g por día)', campos: [['cMin', 'Mínimo'], ['cMax', 'Máximo']], error: ['hidratos'] },
  { titulo: 'Grasas (g por día)', campos: [['gMin', 'Mínimo'], ['gMax', 'Máximo']], error: ['grasas'] },
  { titulo: 'Otros', campos: [['agua', 'Agua (ml)'], ['umbral', 'Proteína por comida (g)']], error: ['agua', 'umbralComida'] },
];

function ObjetivosForm({ perfil, alGuardar }: { perfil: Perfil; alGuardar: (p: Perfil) => void }) {
  const id = useId();
  const { avisar } = useAvisos();
  const [f, setF] = useState(() => aForm(perfil.objetivos));
  const [errores, setErrores] = useState<ErrorValidacion[]>([]);

  const enviar = (e: FormEvent) => {
    e.preventDefault();
    const o = deForm(f);
    const err = validarObjetivos(o);
    setErrores(err);
    if (err.length) return;
    alGuardar({ ...perfil, objetivos: o });
    avisar('Objetivos guardados');
  };

  return (
    <form className="tarjeta" onSubmit={enviar} aria-labelledby={`${id}-t`} noValidate>
      <h2 id={`${id}-t`} className="titulo-seccion con-icono">
        <Icono nombre="disco" tam={20} />
        Objetivos diarios
      </h2>
      <p className="tenue">Los del plan son para recomposición en mantenimiento. Ajustalos en las revisiones, cada 2 semanas.</p>
      {CAMPOS.map((g) => {
        const errs = errores.filter((x) => g.error.includes(x.campo));
        return (
          <fieldset key={g.titulo} className={estilos.grupo}>
            <legend className={estilos.leyenda}>{g.titulo}</legend>
            <div className="grilla-campos">
              {g.campos.map(([k, texto]) => (
                <div className="campo" key={k}>
                  <label htmlFor={`${id}-${k}`}>{texto}</label>
                  <input
                    id={`${id}-${k}`}
                    className="entrada"
                    inputMode="numeric"
                    autoComplete="off"
                    value={f[k]}
                    onChange={(e) => setF((x) => ({ ...x, [k]: e.target.value }))}
                    aria-invalid={errs.length > 0}
                  />
                </div>
              ))}
            </div>
            {errs.map((x) => (
              <p key={x.campo} className="error" role="alert">
                {x.mensaje}
              </p>
            ))}
          </fieldset>
        );
      })}
      <div className={estilos.acciones}>
        <button type="button" className="boton" onClick={() => setF(aForm(OBJETIVOS_INICIALES))}>
          Volver a los del plan
        </button>
        <button type="submit" className="boton primario">
          Guardar objetivos
        </button>
      </div>
    </form>
  );
}

function Datos() {
  const id = useId();
  const { almacen } = useDatos();
  const { avisar } = useAvisos();
  const [pendiente, setPendiente] = useState<Exportacion | null>(null);
  const [error, setError] = useState('');
  const [ocupado, setOcupado] = useState(false);

  const exportar = async () => {
    setOcupado(true);
    try {
      const e = await almacen.exportar();
      const blob = new Blob([JSON.stringify(e, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `libreta-${hoyIso()}.libreta.json`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.setTimeout(() => URL.revokeObjectURL(url), 10_000);
      avisar(`Exportados ${e.dias.length} días y ${e.sesiones.length} entrenamientos`);
    } catch {
      setError('No se pudieron leer los datos. Si estás sin conexión, probá cuando vuelva la señal.');
    } finally {
      setOcupado(false);
    }
  };

  const leerArchivo = async (archivo: File | undefined) => {
    setError('');
    setPendiente(null);
    if (!archivo) return;
    if (archivo.size > 20 * 1024 * 1024) {
      setError('El archivo es demasiado grande para ser una exportación de la app.');
      return;
    }
    try {
      setPendiente(sanearExportacion(JSON.parse(await archivo.text())));
    } catch (e) {
      setError(e instanceof ErrorImportacion ? e.message : 'El archivo no es un JSON válido.');
    }
  };

  const importar = async () => {
    if (!pendiente) return;
    setOcupado(true);
    try {
      const r = await almacen.importar(pendiente);
      avisar(`Importados ${r.dias} días, ${r.sesiones} entrenamientos y ${r.alimentos} alimentos propios`);
      setPendiente(null);
    } catch {
      setError('No se pudo importar. Probá de nuevo.');
    } finally {
      setOcupado(false);
    }
  };

  return (
    <section className="tarjeta" aria-labelledby={`${id}-t`}>
      <h2 id={`${id}-t`} className="titulo-seccion con-icono">
        <Icono nombre="descargar" tam={20} />
        Tus datos
      </h2>
      <p className="tenue">Descargá una copia de todo (días, entrenamientos, notas y alimentos propios) o importá una copia anterior.</p>
      <button type="button" className="boton" onClick={() => void exportar()} disabled={ocupado}>
        Exportar copia
      </button>
      <div className="campo">
        <label htmlFor={`${id}-archivo`}>Importar una copia</label>
        <input id={`${id}-archivo`} type="file" accept="application/json,.json" className={estilos.archivo} onChange={(e) => void leerArchivo(e.target.files?.[0])} />
      </div>
      {pendiente && (
        <div className={estilos.confirmar} role="group" aria-label="Confirmar importación">
          <p>
            El archivo tiene <b>{pendiente.dias.length}</b> días, <b>{pendiente.sesiones.length}</b> entrenamientos, <b>{Object.keys(pendiente.notas).length}</b> notas de
            ejercicios y <b>{pendiente.alimentos.length}</b> alimentos propios{pendiente.perfil ? ', además del perfil' : ''}. Lo que tenga la misma fecha o nombre se
            reemplaza; lo demás no se toca.
          </p>
          <div className={estilos.acciones}>
            <button type="button" className="boton" onClick={() => setPendiente(null)}>
              Cancelar
            </button>
            <button type="button" className="boton primario" onClick={() => void importar()} disabled={ocupado}>
              Importar
            </button>
          </div>
        </div>
      )}
      {error && (
        <p className="error" role="alert">
          {error}
        </p>
      )}
    </section>
  );
}

function Instalar() {
  return (
    <section className="tarjeta" aria-labelledby="aj-instalar">
      <h2 id="aj-instalar" className="titulo-seccion con-icono">
        <Icono nombre="hoy" tam={20} />
        Instalar en el iPhone
      </h2>
      <ol className={estilos.pasos}>
        <li>Abrí este sitio en Safari.</li>
        <li>Tocá el botón Compartir (el cuadrado con la flecha hacia arriba).</li>
        <li>Elegí «Agregar a inicio» y confirmá.</li>
      </ol>
      <p className="tenue">Se abre como una app, desde el ícono, y funciona sin señal: lo que cargás se sincroniza cuando vuelve la conexión.</p>
    </section>
  );
}
