import { useEffect, useRef, type ReactNode } from 'react';
import { Link, NavLink, useLocation } from 'react-router-dom';
import { Icono, type NombreIcono } from '../componentes/Icono';
import { NOMBRE_APP } from '../config';
import { useDatos } from '../estado/Proveedor';
import estilos from './Marco.module.css';

const SECCIONES: { a: string; texto: string; icono: NombreIcono; fin?: boolean }[] = [
  { a: '/', texto: 'Hoy', icono: 'hoy', fin: true },
  { a: '/rutina', texto: 'Rutina', icono: 'rutina' },
  { a: '/comidas', texto: 'Comidas', icono: 'comidas' },
  { a: '/progreso', texto: 'Progreso', icono: 'progreso' },
  { a: '/plan', texto: 'Plan', icono: 'plan' },
];

function EstadoConexion() {
  const { sync } = useDatos();
  if (!sync.enLinea) {
    return (
      <span className={estilos.estado} data-tipo="sin-senal">
        <Icono nombre="sinSenal" tam={16} />
        Sin conexión · se guarda en el teléfono
      </span>
    );
  }
  if (sync.pendientes > 0) {
    return (
      <span className={estilos.estado} data-tipo="guardando">
        Guardando…
      </span>
    );
  }
  return null;
}

export function Marco({ children }: { children: ReactNode }) {
  const { pathname } = useLocation();
  const principal = useRef<HTMLElement>(null);
  const primerRender = useRef(true);

  // Al cambiar de pantalla: arriba de todo y el foco en el contenido (para lectores de pantalla).
  useEffect(() => {
    if (primerRender.current) {
      primerRender.current = false;
      return;
    }
    window.scrollTo(0, 0);
    principal.current?.focus({ preventScroll: true });
  }, [pathname]);

  return (
    <div className={estilos.marco}>
      <a href="#contenido" className={estilos.saltar}>
        Saltar al contenido
      </a>
      <header className={estilos.superior}>
        <Link to="/" className={estilos.marca}>
          <span className={estilos.disco} aria-hidden="true" />
          {NOMBRE_APP}
        </Link>
        <EstadoConexion />
        <NavLink to="/ajustes" className={estilos.ajustes} aria-label="Ajustes">
          <Icono nombre="ajustes" />
          <span className={estilos.textoAjustes}>Ajustes</span>
        </NavLink>
      </header>
      <nav className={estilos.nav} aria-label="Principal">
        {SECCIONES.map((s) => (
          <NavLink key={s.a} to={s.a} end={s.fin} className={estilos.enlace}>
            <Icono nombre={s.icono} />
            <span>{s.texto}</span>
          </NavLink>
        ))}
      </nav>
      <main id="contenido" ref={principal} tabIndex={-1} className={estilos.principal}>
        {children}
      </main>
    </div>
  );
}
