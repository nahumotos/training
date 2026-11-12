import { NOMBRE_APP } from '../config';
import estilos from './Estados.module.css';

export function Cargando({ enLinea = false }: { enLinea?: boolean }) {
  return (
    <div className={enLinea ? estilos.cargandoEnLinea : estilos.cargando} role="status" aria-live="polite">
      <span className={estilos.disco} aria-hidden="true" />
      <span>Cargando…</span>
    </div>
  );
}

/** Se muestra si el sitio se publicó sin la configuración de Firebase. */
export function FaltaConfiguracion({ faltan }: { faltan: string[] }) {
  return (
    <main className={estilos.pantalla}>
      <div className={estilos.caja}>
        <p className="ceja">{NOMBRE_APP}</p>
        <h1>Falta configurar el sitio</h1>
        {faltan.length ? (
          <>
            <p>Estas variables no tienen valor en el archivo .env.local:</p>
            <ul>
              {faltan.map((f) => (
                <li key={f}>
                  <code>{f}</code>
                </li>
              ))}
            </ul>
            <p className="tenue">Completalas con los datos de tu proyecto de Firebase, volvé a compilar y publicá de nuevo. El README explica los pasos.</p>
          </>
        ) : (
          <p>No se pudo iniciar la conexión con Firebase. Revisá la configuración y la consola del navegador.</p>
        )}
      </div>
    </main>
  );
}
