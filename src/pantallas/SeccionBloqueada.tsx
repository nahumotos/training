import { Link } from 'react-router-dom';
import { Icono } from '../componentes/Icono';
import { NOMBRES_SECCION } from '../dominio/acceso';
import type { Seccion } from '../dominio/tipos';
import { useTitulo } from '../estado/hooks';
import estilos from './SeccionBloqueada.module.css';

const QUE_ES: Record<Seccion, string> = {
  rutina: 'Tu rutina de entrenamiento.',
  comidas: 'El registro de comidas con proteína y calorías, el agua y el resto del día.',
  progreso: 'El resumen de cada semana, los gráficos y las cargas de cada ejercicio.',
  plan: 'La guía del plan: estrategia, semana tipo y reglas.',
};

/** Lo que ve una cuenta en una sección que el admin todavía no le habilitó. */
export function SeccionBloqueada({ seccion, compacta = false }: { seccion: Seccion; compacta?: boolean }) {
  const nombre = NOMBRES_SECCION[seccion];
  if (compacta) {
    return (
      <section className={`tarjeta ${estilos.compacta}`} aria-labelledby={`bloq-${seccion}`}>
        <div className="fila-titulo">
          <h2 id={`bloq-${seccion}`}>{nombre}</h2>
          <span className={estilos.etiqueta}>
            <Icono nombre="candado" tam={15} />
            No habilitado
          </span>
        </div>
        <p className="tenue">{QUE_ES[seccion]} El administrador puede habilitarlo para tu cuenta.</p>
      </section>
    );
  }
  return <PaginaBloqueada seccion={seccion} />;
}

function PaginaBloqueada({ seccion }: { seccion: Seccion }) {
  const nombre = NOMBRES_SECCION[seccion];
  useTitulo(nombre);
  return (
    <div className="pila pantalla">
      <header className="cabecera">
        <h1>{nombre}</h1>
      </header>
      <section className={`tarjeta ${estilos.panel}`} aria-label={`${nombre} no habilitado`}>
        <span className={estilos.icono} aria-hidden="true">
          <Icono nombre="candado" tam={30} />
        </span>
        <h2 className="titulo-seccion">Todavía no está habilitado para tu cuenta</h2>
        <p>{QUE_ES[seccion]}</p>
        <p className="tenue">Pedile al administrador que lo active. Mientras tanto, seguí con tu rutina.</p>
        <Link to="/rutina" className="boton primario">
          Ir a mi rutina
        </Link>
      </section>
    </div>
  );
}
