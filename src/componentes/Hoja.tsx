import { useEffect, useId, useRef, type ReactNode } from 'react';
import estilos from './Hoja.module.css';

/**
 * Hoja que sube desde abajo, sobre un <dialog> nativo: atrapa el foco, se cierra
 * con Escape y deja inerte el resto de la página.
 */
export function Hoja({
  abierta,
  titulo,
  alCerrar,
  children,
  textoCerrar = 'Listo',
}: {
  abierta: boolean;
  titulo: string;
  alCerrar: () => void;
  children: ReactNode;
  textoCerrar?: string;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  const idTitulo = useId();

  useEffect(() => {
    const d = ref.current;
    if (!d) return;
    if (abierta && !d.open) {
      d.showModal();
      document.documentElement.classList.add('bloqueo-scroll');
    } else if (!abierta && d.open) {
      d.close();
    }
    return () => document.documentElement.classList.remove('bloqueo-scroll');
  }, [abierta]);

  return (
    <dialog
      ref={ref}
      className={estilos.hoja}
      aria-labelledby={idTitulo}
      onCancel={(e) => {
        e.preventDefault();
        alCerrar();
      }}
      onClick={(e) => {
        // Un toque en el fondo (fuera del contenido) cierra la hoja.
        if (e.target === ref.current) alCerrar();
      }}
    >
      {abierta && (
        <div className={estilos.contenido}>
          <div className={estilos.encabezado}>
            <h2 id={idTitulo}>{titulo}</h2>
            <button type="button" className="boton chico" onClick={alCerrar}>
              {textoCerrar}
            </button>
          </div>
          <div className={estilos.cuerpo}>{children}</div>
        </div>
      )}
    </dialog>
  );
}
