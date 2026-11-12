import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import estilos from './Avisos.module.css';

interface Aviso {
  id: number;
  texto: string;
  accion?: { texto: string; hacer: () => void };
  /** ms; 0 para que quede hasta que se cierre. */
  duracion: number;
}

interface ValorAvisos {
  avisar: (texto: string, opciones?: { accion?: Aviso['accion']; duracion?: number }) => void;
}

const Ctx = createContext<ValorAvisos | null>(null);

export function ProveedorAvisos({ children }: { children: ReactNode }) {
  const [aviso, setAviso] = useState<Aviso | null>(null);
  const contador = useRef(0);

  const avisar = useCallback<ValorAvisos['avisar']>((texto, opciones) => {
    contador.current += 1;
    setAviso({ id: contador.current, texto, accion: opciones?.accion, duracion: opciones?.duracion ?? (opciones?.accion ? 5000 : 2600) });
  }, []);

  useEffect(() => {
    if (!aviso || aviso.duracion === 0) return;
    const t = window.setTimeout(() => setAviso((a) => (a?.id === aviso.id ? null : a)), aviso.duracion);
    return () => window.clearTimeout(t);
  }, [aviso]);

  const valor = useMemo(() => ({ avisar }), [avisar]);

  return (
    <Ctx.Provider value={valor}>
      {children}
      <div className={estilos.zona} role="status" aria-live="polite">
        {aviso && (
          <div className={estilos.aviso} key={aviso.id}>
            <span>{aviso.texto}</span>
            {aviso.accion && (
              <button
                type="button"
                className={estilos.accion}
                onClick={() => {
                  aviso.accion?.hacer();
                  setAviso(null);
                }}
              >
                {aviso.accion.texto}
              </button>
            )}
            {aviso.duracion === 0 && (
              <button type="button" className={estilos.cerrar} aria-label="Cerrar aviso" onClick={() => setAviso(null)}>
                ×
              </button>
            )}
          </div>
        )}
      </div>
    </Ctx.Provider>
  );
}

export function useAvisos(): ValorAvisos {
  const v = useContext(Ctx);
  if (!v) throw new Error('useAvisos fuera de ProveedorAvisos');
  return v;
}
