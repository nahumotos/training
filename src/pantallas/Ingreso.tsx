import { useState, type FormEvent } from 'react';
import { NOMBRE_APP } from '../config';
import { useSesion } from '../estado/Proveedor';
import { useTitulo } from '../estado/hooks';
import { ErrorAuth } from '../servicios/tipos';
import estilos from './Ingreso.module.css';

export function Ingreso() {
  useTitulo('Ingresar');
  const { servicios } = useSesion();
  const [email, setEmail] = useState('');
  const [clave, setClave] = useState('');
  const [error, setError] = useState('');
  const [info, setInfo] = useState('');
  const [enviando, setEnviando] = useState(false);

  const ingresar = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setInfo('');
    if (!email.trim() || !clave) {
      setError('Completá el email y la contraseña.');
      return;
    }
    setEnviando(true);
    try {
      await servicios.auth.ingresar(email, clave);
    } catch (err) {
      setError(err instanceof ErrorAuth ? err.message : 'No se pudo ingresar. Probá de nuevo en un rato.');
    } finally {
      setEnviando(false);
    }
  };

  const recuperar = async () => {
    setError('');
    setInfo('');
    if (!email.trim()) {
      setError('Escribí tu email y después tocá «Olvidé mi contraseña».');
      return;
    }
    try {
      await servicios.auth.recuperar(email);
      setInfo('Si el email tiene una cuenta, te llega un mensaje para crear una contraseña nueva. Revisá también el correo no deseado.');
    } catch (err) {
      setError(err instanceof ErrorAuth ? err.message : 'No se pudo enviar el email. Probá de nuevo en un rato.');
    }
  };

  return (
    <main className={estilos.pantalla}>
      {/* Decoración: un disco grande, el sello de la app. */}
      <div className={estilos.escena} aria-hidden="true">
        <span className={estilos.discoGrande} />
      </div>
      <div className={estilos.caja}>
        <div className={estilos.marca}>
          <span className={estilos.disco} aria-hidden="true" />
          <span>{NOMBRE_APP}</span>
        </div>
        <h1>Tu rutina, tus comidas y tu progreso, en un solo lugar</h1>
        <p className="tenue">Registrá cada serie en el gimnasio, cargá lo que comés y seguí el plan semana a semana, aunque no tengas señal.</p>

        <form className={estilos.formulario} onSubmit={ingresar} noValidate>
          <div className="campo">
            <label htmlFor="ingreso-email">Email</label>
            <input
              id="ingreso-email"
              className="entrada"
              type="email"
              autoComplete="email"
              inputMode="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              aria-invalid={Boolean(error) && !email.trim()}
            />
          </div>
          <div className="campo">
            <label htmlFor="ingreso-clave">Contraseña</label>
            <input
              id="ingreso-clave"
              className="entrada"
              type="password"
              autoComplete="current-password"
              value={clave}
              onChange={(e) => setClave(e.target.value)}
              aria-invalid={Boolean(error) && !clave}
            />
          </div>
          {error && (
            <p className="error" role="alert">
              {error}
            </p>
          )}
          {info && (
            <p className={estilos.info} role="status">
              {info}
            </p>
          )}
          <button type="submit" className="boton primario ancho" disabled={enviando}>
            {enviando ? 'Ingresando…' : 'Ingresar'}
          </button>
          <button type="button" className="enlace" onClick={recuperar}>
            Olvidé mi contraseña
          </button>
        </form>
        <p className={estilos.pie}>Las cuentas las crea el administrador del sitio.</p>
      </div>
    </main>
  );
}
