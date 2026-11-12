import { useState } from 'react';
import { useDatos, useSesion } from '../estado/Proveedor';
import { useTitulo } from '../estado/hooks';
import estilos from './Ingreso.module.css';

/** Cuenta válida que todavía no figura en la lista de permitidos de Firestore. */
export function SinAcceso() {
  useTitulo('Sin acceso');
  const { servicios } = useSesion();
  const { usuario } = useDatos();
  const [copiado, setCopiado] = useState(false);

  const copiar = async () => {
    try {
      await navigator.clipboard.writeText(usuario.uid);
      setCopiado(true);
    } catch {
      setCopiado(false);
    }
  };

  return (
    <main className={estilos.pantalla}>
      <div className={estilos.caja}>
        <p className="ceja">Falta un paso</p>
        <h1>Tu cuenta todavía no tiene acceso</h1>
        <p>
          Ingresaste como <b>{usuario.email}</b>, pero la cuenta no está habilitada para guardar datos. Pasale este código al administrador para que la habilite:
        </p>
        <div className="tarjeta">
          <span className="rotulo">Identificador de la cuenta</span>
          <code className={estilos.codigo}>{usuario.uid}</code>
          <button type="button" className="boton chico" onClick={copiar}>
            {copiado ? 'Copiado' : 'Copiar'}
          </button>
        </div>
        <p className="tenue">
          Si sos el administrador: en Firestore, creá el documento <code>permitidos/{'{este identificador}'}</code> (puede estar vacío) y volvé a abrir la app. El README lo explica paso a paso.
        </p>
        <button type="button" className="boton" onClick={() => void servicios.auth.salir()}>
          Cerrar sesión
        </button>
      </div>
    </main>
  );
}
