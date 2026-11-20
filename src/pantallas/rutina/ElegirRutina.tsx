import { useId, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Icono, type NombreIcono } from '../../componentes/Icono';
import { PLANTILLAS } from '../../datos/plantillas';
import { NOMBRES_NIVEL, sugerirRutinas } from '../../dominio/rutina';
import type { ObjetivoRutina, Rutina } from '../../dominio/tipos';
import { useAvisos } from '../../estado/Avisos';
import { useDatos } from '../../estado/Proveedor';
import { useHoy, useTitulo } from '../../estado/hooks';
import estilos from './Rutina.module.css';

const OBJETIVOS: { id: ObjetivoRutina; texto: string; detalle: string; icono: NombreIcono }[] = [
  { id: 'musculo', texto: 'Ganar músculo', detalle: 'Más volumen y forma', icono: 'rutina' },
  { id: 'fuerza', texto: 'Ganar fuerza', detalle: 'Levantar más en los básicos', icono: 'series' },
  { id: 'forma', texto: 'Ponerme en forma', detalle: 'Bajar grasa y sumar aire', icono: 'fuego' },
  { id: 'gluteos', texto: 'Glúteos y piernas', detalle: 'Tren inferior con foco en glúteo', icono: 'pasos' },
];

const FRECUENCIAS = [2, 3, 4, 5, 6];

export function ElegirRutina({ cambiando = false }: { cambiando?: boolean }) {
  useTitulo(cambiando ? 'Cambiar de rutina' : 'Elegí tu rutina');
  const id = useId();
  const [dias, setDias] = useState<number | null>(null);
  const [objetivo, setObjetivo] = useState<ObjetivoRutina | null>(null);
  const sugeridas = dias ? sugerirRutinas(PLANTILLAS, dias, objetivo) : null;

  return (
    <div className="pila pantalla">
      <header className="cabecera">
        <p className="ceja">{cambiando ? 'Cambiar de rutina' : 'Para empezar'}</p>
        <h1>Elegí tu rutina</h1>
        <p className="sub">Decinos cuántos días podés entrenar y qué buscás. Te mostramos las rutinas armadas que mejor encajan.</p>
      </header>

      <section className="tarjeta" aria-labelledby={`${id}-dias`}>
        <h2 id={`${id}-dias`} className="titulo-seccion">
          ¿Cuántos días por semana podés entrenar?
        </h2>
        <div className={estilos.frecuencias} role="radiogroup" aria-labelledby={`${id}-dias`}>
          {FRECUENCIAS.map((n) => (
            <label key={n} className={estilos.frecuencia}>
              <input type="radio" name={`${id}-dias`} value={n} checked={dias === n} onChange={() => setDias(n)} />
              <span>
                <b className="grabado">{n}</b>
                <span className="solo-lector"> días</span>
              </span>
            </label>
          ))}
        </div>
      </section>

      <section className="tarjeta" aria-labelledby={`${id}-objetivo`}>
        <h2 id={`${id}-objetivo`} className="titulo-seccion">
          ¿Qué querés lograr?
        </h2>
        <div className={estilos.objetivos} role="radiogroup" aria-labelledby={`${id}-objetivo`}>
          {OBJETIVOS.map((o) => (
            <label key={o.id} className={estilos.objetivo}>
              <input type="radio" name={`${id}-objetivo`} value={o.id} checked={objetivo === o.id} onChange={() => setObjetivo(o.id)} />
              <span>
                <Icono nombre={o.icono} tam={22} />
                <b>{o.texto}</b>
                <span className="tenue">{o.detalle}</span>
              </span>
            </label>
          ))}
        </div>
      </section>

      {sugeridas ? (
        <section className="pila" aria-labelledby={`${id}-resultados`}>
          <div className="fila-titulo">
            <h2 id={`${id}-resultados`}>Rutinas para vos</h2>
            <span className="tenue">
              {sugeridas.principales.length} {sugeridas.principales.length === 1 ? 'opción' : 'opciones'}
            </span>
          </div>
          {!sugeridas.exactas && (
            <p className={estilos.avisoSugeridas}>
              No hay una rutina de {dias} días para ese objetivo. Estas son las que más se parecen; los otros días podés caminar o descansar.
            </p>
          )}
          {sugeridas.principales.map((r) => (
            <TarjetaPlantilla key={r.id} rutina={r} />
          ))}
          {objetivo && sugeridas.otras.length > 0 && (
            <details className="tarjeta desplegable">
              <summary>
                Otras rutinas de {dias} días
                <Icono nombre="abajo" />
              </summary>
              <div className="pila">
                {sugeridas.otras.map((r) => (
                  <TarjetaPlantilla key={r.id} rutina={r} />
                ))}
              </div>
            </details>
          )}
        </section>
      ) : (
        <p className="vacio">
          <Icono nombre="rutina" tam={28} />
          Elegí cuántos días por semana y te mostramos las rutinas.
        </p>
      )}
    </div>
  );
}

const CORTOS = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];

function TarjetaPlantilla({ rutina }: { rutina: Rutina }) {
  const navegar = useNavigate();
  const hoy = useHoy();
  const { almacen, perfil, rutina: actual } = useDatos();
  const { avisar } = useAvisos();
  const [confirmar, setConfirmar] = useState(false);
  const id = useId();
  const esActual = actual?.id === rutina.id;

  const elegir = () => {
    void almacen.guardarPerfil({ ...perfil, rutina: rutina.id, inicioRutina: hoy }).catch(() => undefined);
    avisar(`Rutina elegida: ${rutina.nombre}`);
    navegar('/rutina');
  };

  return (
    <article className={`tarjeta ${estilos.plantilla}`} aria-labelledby={`${id}-n`}>
      <div className={estilos.plantillaCabeza}>
        <h3 id={`${id}-n`}>{rutina.nombre}</h3>
        <ul className={estilos.etiquetas} aria-label="Características">
          <li>{rutina.frecuencia} días</li>
          <li>{NOMBRES_NIVEL[rutina.nivel]}</li>
          <li>{rutina.dias.map((d) => CORTOS[d.dow]).join(' · ')}</li>
        </ul>
      </div>
      <p>{rutina.descripcion}</p>
      <details className={estilos.diasPlantilla}>
        <summary>
          Ver los {rutina.dias.length} días
          <Icono nombre="abajo" tam={18} />
        </summary>
        <ol>
          {rutina.dias.map((d) => (
            <li key={d.id}>
              <span className={estilos.disco} data-tipo={d.tipo} aria-hidden="true">
                {d.letra}
              </span>
              <div>
                <b>
                  {d.dia}: {d.nombre}
                </b>
                <span className="tenue">{d.ex.map((e) => e.n).join(' · ')}</span>
              </div>
            </li>
          ))}
        </ol>
        <p className="ayuda">
          Los días se pueden hacer en otro orden si hace falta. Descanso: {rutina.descanso.charAt(0).toLowerCase() + rutina.descanso.slice(1)}
        </p>
      </details>
      {esActual ? (
        <p className={estilos.actual}>
          <Icono nombre="check" tam={18} /> Es tu rutina actual
        </p>
      ) : confirmar ? (
        <div className={estilos.confirmarReinicio} role="group" aria-label={`Confirmar ${rutina.nombre}`}>
          <p>Tu rutina pasa a ser {rutina.nombre}, desde hoy. Lo que ya registraste queda guardado.</p>
          <div className={estilos.botonesReinicio}>
            <button type="button" className="boton primario" onClick={elegir}>
              Confirmar
            </button>
            <button type="button" className="boton" onClick={() => setConfirmar(false)}>
              Cancelar
            </button>
          </div>
        </div>
      ) : (
        <button type="button" className="boton primario" onClick={() => (actual ? setConfirmar(true) : elegir())}>
          Elegir esta rutina
        </button>
      )}
    </article>
  );
}
