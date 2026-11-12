import { Link } from 'react-router-dom';
import { useTitulo } from '../estado/hooks';

export function NoEncontrada() {
  useTitulo('Página no encontrada');
  return (
    <div className="pila">
      <header className="cabecera">
        <p className="ceja">Error 404</p>
        <h1>Esta página no existe</h1>
        <p className="sub">Puede que el enlace esté mal escrito o que la página se haya movido.</p>
      </header>
      <Link to="/" className="boton primario">
        Ir a Hoy
      </Link>
    </div>
  );
}
