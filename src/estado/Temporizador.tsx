import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode, type CSSProperties } from 'react';
import { reloj } from '../dominio/formato';
import estilos from './Temporizador.module.css';

interface Estado {
  /** Momento en que termina el descanso (ms). */
  fin: number;
  total: number;
  etiqueta: string;
}

interface ValorTemporizador {
  activo: boolean;
  iniciar: (segundos: number, etiqueta: string) => void;
  detener: () => void;
}

const Ctx = createContext<ValorTemporizador | null>(null);

/** Pitido corto con Web Audio. Solo suena si el usuario ya interactuó con la página. */
function pitar(contexto: AudioContext | null) {
  if (!contexto) return;
  try {
    const t = contexto.currentTime;
    for (const [i, frecuencia] of [880, 1175].entries()) {
      const osc = contexto.createOscillator();
      const gan = contexto.createGain();
      osc.frequency.value = frecuencia;
      gan.gain.setValueAtTime(0.0001, t + i * 0.18);
      gan.gain.exponentialRampToValueAtTime(0.25, t + i * 0.18 + 0.02);
      gan.gain.exponentialRampToValueAtTime(0.0001, t + i * 0.18 + 0.16);
      osc.connect(gan).connect(contexto.destination);
      osc.start(t + i * 0.18);
      osc.stop(t + i * 0.18 + 0.17);
    }
  } catch {
    /* sin audio */
  }
}

export function ProveedorTemporizador({ children }: { children: ReactNode }) {
  const [estado, setEstado] = useState<Estado | null>(null);
  const [termino, setTermino] = useState(false);
  const [ahora, setAhora] = useState(() => Date.now());
  const audio = useRef<AudioContext | null>(null);

  const iniciar = useCallback((segundos: number, etiqueta: string) => {
    // El contexto de audio se crea con el toque del usuario, como exige Safari.
    if (!audio.current && typeof window.AudioContext === 'function') {
      try {
        audio.current = new AudioContext();
      } catch {
        audio.current = null;
      }
    }
    void audio.current?.resume?.();
    setTermino(false);
    setAhora(Date.now());
    setEstado({ fin: Date.now() + segundos * 1000, total: segundos, etiqueta });
  }, []);

  const detener = useCallback(() => {
    setEstado(null);
    setTermino(false);
  }, []);

  const sumar = (seg: number) =>
    setEstado((e) => (e ? { ...e, fin: Math.max(Date.now() + 5000, e.fin + seg * 1000), total: Math.max(5, e.total + seg) } : e));

  useEffect(() => {
    if (!estado) return;
    const id = window.setInterval(() => {
      const t = Date.now();
      setAhora(t);
      if (t >= estado.fin) {
        pitar(audio.current);
        setEstado(null);
        setTermino(true);
      }
    }, 250);
    return () => window.clearInterval(id);
  }, [estado]);

  useEffect(() => {
    if (!termino) return;
    const t = window.setTimeout(() => setTermino(false), 6000);
    return () => window.clearTimeout(t);
  }, [termino]);

  const restante = estado ? Math.max(0, (estado.fin - ahora) / 1000) : 0;
  const valor = useMemo(() => ({ activo: estado !== null, iniciar, detener }), [estado, iniciar, detener]);
  const visible = estado !== null || termino;

  return (
    <Ctx.Provider value={valor}>
      <div className={estilos.contenedor} data-visible={visible || undefined}>{children}</div>
      {visible && (
        <div className={estilos.barra} role="timer" aria-live="off" data-termino={termino || undefined}>
          {estado ? (
            <>
              <span className={estilos.progreso} style={{ '--resto': estado.total ? restante / estado.total : 0 } as CSSProperties} aria-hidden="true" />
              <div className={estilos.info}>
                <span className={estilos.etiqueta}>Descanso de {estado.etiqueta}</span>
                <span className={estilos.tiempo}>
                  <span aria-hidden="true">{reloj(Math.ceil(restante))}</span>
                  <span className="solo-lector">Quedan {Math.ceil(restante)} segundos</span>
                </span>
              </div>
              <div className={estilos.acciones}>
                <button type="button" onClick={() => sumar(-15)} aria-label="Restar 15 segundos">
                  −15
                </button>
                <button type="button" onClick={() => sumar(15)} aria-label="Sumar 15 segundos">
                  +15
                </button>
                <button type="button" onClick={detener} className={estilos.saltar}>
                  Saltar
                </button>
              </div>
            </>
          ) : (
            <div className={estilos.info} role="alert">
              <span className={estilos.listo}>¡A la próxima serie!</span>
            </div>
          )}
        </div>
      )}
    </Ctx.Provider>
  );
}

export function useTemporizador(): ValorTemporizador {
  const v = useContext(Ctx);
  if (!v) throw new Error('useTemporizador fuera de ProveedorTemporizador');
  return v;
}

/** Mantiene la pantalla encendida mientras `activo` sea true, si el navegador lo permite. */
export function usePantallaEncendida(activo: boolean): void {
  useEffect(() => {
    if (!activo || !('wakeLock' in navigator)) return;
    let bloqueo: WakeLockSentinel | null = null;
    let vigente = true;
    const pedir = async () => {
      try {
        if (document.visibilityState === 'visible') bloqueo = await navigator.wakeLock.request('screen');
        if (!vigente) await bloqueo?.release();
      } catch {
        /* lo rechaza en ahorro de batería o si no está visible */
      }
    };
    const alVolver = () => {
      if (document.visibilityState === 'visible') void pedir();
    };
    void pedir();
    document.addEventListener('visibilitychange', alVolver);
    return () => {
      vigente = false;
      document.removeEventListener('visibilitychange', alVolver);
      void bloqueo?.release().catch(() => undefined);
    };
  }, [activo]);
}
