import { useEffect } from 'react';
import { registerSW } from 'virtual:pwa-register';
import { useAvisos } from '../estado/Avisos';

/**
 * Registra el service worker (que hace que la app abra sin conexión) y avisa
 * cuando hay una versión nueva, sin recargar sola en medio de un entrenamiento.
 */
export function AvisoActualizacion() {
  const { avisar } = useAvisos();
  useEffect(() => {
    if (!('serviceWorker' in navigator) || import.meta.env.DEV) return;
    const actualizar = registerSW({
      onNeedRefresh() {
        avisar('Hay una versión nueva de la app.', { accion: { texto: 'Actualizar', hacer: () => void actualizar(true) }, duracion: 0 });
      },
    });
  }, [avisar]);
  return null;
}
