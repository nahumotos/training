import { useId, useState } from 'react';
import { Cargando } from '../../app/Estados';
import { Icono } from '../../componentes/Icono';
import { NOMBRES_SECCION, SECCIONES_OPCIONALES } from '../../dominio/acceso';
import type { Seccion } from '../../dominio/tipos';
import { useAvisos } from '../../estado/Avisos';
import { useDatos, useSesion } from '../../estado/Proveedor';
import { useSuscripcion } from '../../estado/suscripcion';
import { useTitulo } from '../../estado/hooks';
import type { CuentaConAcceso } from '../../servicios/tipos';
import estilos from './Admin.module.css';

const fecha = (iso: string) => {
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? '—' : d.toLocaleDateString('es-AR', { day: 'numeric', month: 'short', year: 'numeric' });
};

/** Panel de administración: cuentas registradas y qué secciones ve cada una. */
export default function Admin() {
  useTitulo('Administración');
  const { servicios } = useSesion();
  const [error, setError] = useState(false);
  const [cuentas, cargadas] = useSuscripcion<CuentaConAcceso[]>((cb) => servicios.cuentas.cuentas(cb, () => setError(true)), 'cuentas', []);
  const [filtro, setFiltro] = useState('');
  const idBuscar = useId();

  const texto = filtro.trim().toLowerCase();
  const visibles = texto ? cuentas.filter((c) => c.email.toLowerCase().includes(texto) || c.nombre.toLowerCase().includes(texto)) : cuentas;

  return (
    <div className="pila pantalla">
      <header className="cabecera">
        <p className="ceja">Administración</p>
        <h1>Cuentas</h1>
        <p className="sub">Las cuentas nuevas solo ven Rutina. Habilitá las demás secciones para cada persona; el cambio le llega al instante.</p>
      </header>

      {error ? (
        <p className="vacio" role="alert">
          <Icono nombre="candado" tam={28} />
          No se pudo cargar la lista de cuentas. Revisá que las reglas de Firestore estén publicadas y que tu cuenta figure en «admins».
        </p>
      ) : !cargadas ? (
        <Cargando enLinea />
      ) : (
        <>
          <div className="campo">
            <label htmlFor={idBuscar}>Buscar por email o nombre</label>
            <input id={idBuscar} className="entrada" type="search" autoComplete="off" value={filtro} onChange={(e) => setFiltro(e.target.value)} />
          </div>
          <p className="tenue" aria-live="polite">
            {visibles.length === cuentas.length
              ? `${cuentas.length} ${cuentas.length === 1 ? 'cuenta' : 'cuentas'}`
              : `${visibles.length} de ${cuentas.length} cuentas`}
          </p>
          <ul className={estilos.lista}>
            {visibles.map((c) => (
              <FilaCuenta key={c.uid} cuenta={c} />
            ))}
          </ul>
          {!visibles.length && <p className="vacio">No hay cuentas que coincidan.</p>}
        </>
      )}
    </div>
  );
}

function FilaCuenta({ cuenta: c }: { cuenta: CuentaConAcceso }) {
  const { servicios } = useSesion();
  const { usuario } = useDatos();
  const { avisar } = useAvisos();
  const id = useId();
  const total = c.acceso.admin || c.acceso.anterior;
  const quien = c.nombre || c.email;

  const cambiar = (s: Exclude<Seccion, 'rutina'>, activa: boolean) => {
    const nuevas = activa ? [...c.acceso.secciones, s] : c.acceso.secciones.filter((x) => x !== s);
    servicios.cuentas
      .guardarSecciones(c.uid, nuevas)
      .then(() => avisar(`${NOMBRES_SECCION[s]} ${activa ? 'habilitado' : 'deshabilitado'} para ${quien}`))
      .catch(() => avisar('No se pudo guardar el cambio. Probá de nuevo.'));
  };

  return (
    <li className={`tarjeta ${estilos.cuenta}`} aria-labelledby={`${id}-n`}>
      <div className={estilos.cabeza}>
        <span className={estilos.inicial} aria-hidden="true">
          {(c.nombre || c.email).charAt(0).toUpperCase()}
        </span>
        <div className={estilos.quien}>
          <b id={`${id}-n`}>{c.nombre || c.email}</b>
          {c.nombre && <span className="tenue">{c.email}</span>}
          <span className="tenue">
            Desde el {fecha(c.creado)} · último ingreso {fecha(c.ultimoIngreso)}
          </span>
        </div>
        <div className={estilos.marcas}>
          {c.uid === usuario.uid && <span className={estilos.marca}>Vos</span>}
          {c.acceso.admin && <span className={estilos.marca}>Admin</span>}
          {!c.acceso.admin && c.acceso.anterior && <span className={estilos.marca}>Acceso completo</span>}
        </div>
      </div>
      <fieldset className={estilos.permisos}>
        <legend className="solo-lector">Secciones de {quien}</legend>
        <label className={estilos.interruptor}>
          <span>Rutina</span>
          <input type="checkbox" role="switch" checked disabled aria-describedby={`${id}-siempre`} />
        </label>
        {SECCIONES_OPCIONALES.map((s) => (
          <label key={s} className={estilos.interruptor}>
            <span>{NOMBRES_SECCION[s]}</span>
            <input
              type="checkbox"
              role="switch"
              checked={total || c.acceso.secciones.includes(s)}
              disabled={total}
              onChange={(e) => cambiar(s, e.target.checked)}
            />
          </label>
        ))}
        <p id={`${id}-siempre`} className="ayuda">
          {total ? 'Ve todas las secciones.' : 'Rutina está siempre habilitada.'}
        </p>
      </fieldset>
    </li>
  );
}
