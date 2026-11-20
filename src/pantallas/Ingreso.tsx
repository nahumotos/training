import { useEffect, useRef, useState, type FormEvent } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { NOMBRE_APP } from '../config';
import { hoyIso } from '../dominio/fechas';
import { LARGO_NOMBRE, perfilInicial, validarPerfil } from '../dominio/perfil';
import { useSesion } from '../estado/Proveedor';
import { useTitulo } from '../estado/hooks';
import { ErrorAuth } from '../servicios/tipos';
import estilos from './Ingreso.module.css';

export function Ingreso() {
  const [modo, setModo] = useState<'ingresar' | 'registrar'>('ingresar');
  useTitulo(modo === 'ingresar' ? 'Ingresar' : 'Crear cuenta');
  const { servicios } = useSesion();
  const [nombre, setNombre] = useState('');
  const [email, setEmail] = useState('');
  const [clave, setClave] = useState('');
  const [clave2, setClave2] = useState('');
  const [error, setError] = useState('');
  const [info, setInfo] = useState('');
  const navegar = useNavigate();
  const ubicacion = useLocation();
  const [enviando, setEnviando] = useState(false);
  // Una cuenta nueva empieza por elegir su rutina, no por la pantalla de la que salió la sesión
  // anterior. El destino se fija en la dirección y la cuenta se crea recién cuando quedó fijado
  // (el router aplica la navegación como transición, después de otros cambios).
  const pendiente = useRef<{ email: string; clave: string; nombre: string; hoy: string } | null>(null);
  const destinoFijado = (ubicacion.state as { desde?: string } | null)?.desde === '/rutina';

  useEffect(() => {
    const datos = pendiente.current;
    if (!datos || !destinoFijado) return;
    pendiente.current = null;
    void (async () => {
      try {
        const uid = await servicios.auth.registrar(datos.email, datos.clave);
        // Perfil nuevo sin rutina.
        void servicios
          .crearAlmacen(uid)
          .guardarPerfil({ ...perfilInicial(), nombre: datos.nombre, inicioRutina: datos.hoy, rutina: null })
          .catch(() => undefined);
      } catch (err) {
        setError(err instanceof ErrorAuth ? err.message : 'No se pudo crear la cuenta. Probá de nuevo en un rato.');
        setEnviando(false);
      }
    })();
  }, [servicios, destinoFijado, ubicacion.key]);

  const cambiarModo = (m: 'ingresar' | 'registrar') => {
    setModo(m);
    setError('');
    setInfo('');
  };

  const registrar = (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setInfo('');
    const hoy = hoyIso();
    if (validarPerfil(nombre, hoy, hoy).length) {
      setError(`El nombre va solo con letras y espacios, hasta ${LARGO_NOMBRE} caracteres.`);
      return;
    }
    if (!email.trim() || !clave) {
      setError('Completá el email y la contraseña.');
      return;
    }
    if (clave.length < 8) {
      setError('La contraseña tiene que tener al menos 8 caracteres.');
      return;
    }
    if (clave !== clave2) {
      setError('Las contraseñas no coinciden.');
      return;
    }
    setEnviando(true);
    pendiente.current = { email, clave, nombre: nombre.trim().replace(/\s+/g, ' '), hoy };
    navegar('/ingresar', { replace: true, state: { desde: '/rutina' } });
  };

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

        {modo === 'registrar' ? (
          <form className={estilos.formulario} onSubmit={registrar} noValidate aria-label="Crear cuenta">
            <h2 className={estilos.subtitulo}>Crear cuenta</h2>
            <div className="campo">
              <label htmlFor="registro-nombre">Tu nombre (opcional)</label>
              <input
                id="registro-nombre"
                className="entrada"
                autoComplete="given-name"
                maxLength={LARGO_NOMBRE}
                value={nombre}
                onChange={(e) => setNombre(e.target.value)}
              />
            </div>
            <div className="campo">
              <label htmlFor="registro-email">Email</label>
              <input
                id="registro-email"
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
              <label htmlFor="registro-clave">Contraseña</label>
              <input
                id="registro-clave"
                className="entrada"
                type="password"
                autoComplete="new-password"
                value={clave}
                onChange={(e) => setClave(e.target.value)}
                aria-describedby="registro-clave-ayuda"
              />
              <p id="registro-clave-ayuda" className="ayuda">
                Al menos 8 caracteres.
              </p>
            </div>
            <div className="campo">
              <label htmlFor="registro-clave2">Repetí la contraseña</label>
              <input
                id="registro-clave2"
                className="entrada"
                type="password"
                autoComplete="new-password"
                value={clave2}
                onChange={(e) => setClave2(e.target.value)}
              />
            </div>
            {error && (
              <p className="error" role="alert">
                {error}
              </p>
            )}
            <button type="submit" className="boton primario ancho" disabled={enviando}>
              {enviando ? 'Creando la cuenta…' : 'Crear cuenta'}
            </button>
            <p className={estilos.cambiar}>
              ¿Ya tenés cuenta?{' '}
              <button type="button" className="enlace" onClick={() => cambiarModo('ingresar')}>
                Ingresá
              </button>
            </p>
          </form>
        ) : (
          <form className={estilos.formulario} onSubmit={ingresar} noValidate aria-label="Ingresar">
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
            <p className={estilos.cambiar}>
              ¿No tenés cuenta?{' '}
              <button type="button" className="enlace" onClick={() => cambiarModo('registrar')}>
                Creá una gratis
              </button>
            </p>
          </form>
        )}
      </div>
    </main>
  );
}
