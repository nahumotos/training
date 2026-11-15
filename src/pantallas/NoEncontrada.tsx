import { Link } from 'react-router-dom';
import { Icono } from '../componentes/Icono';
import { useTitulo } from '../estado/hooks';

export function NoEncontrada() {
  useTitulo('Página no encontrada');
  return (
    <div className="pila pantalla">
      <div className="vacio">
        <Icono nombre="disco" tam={40} />
        <span>Error 404</span>
      </div>
      <header className="cabecera">
        <h1>Esta página no existe</h1>
        <p className="sub">Puede que el enlace esté mal escrito o que la página se haya movido.</p>
      </header>
      <Link to="/" className="boton primario">
        <Icono nombre="hoy" tam={20} />
        Ir a Hoy
      </Link>
    </div>
  );
}
