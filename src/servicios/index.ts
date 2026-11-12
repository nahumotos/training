import type { Servicios } from './tipos';

export type ResultadoServicios = { ok: true; servicios: Servicios } | { ok: false; faltan: string[] };

/**
 * Elige los servicios según la configuración: modo demo (datos en el navegador)
 * o Firebase. Si faltan variables de Firebase, lo informa para mostrarlo en pantalla.
 */
export async function crearServicios(): Promise<ResultadoServicios> {
  const env = import.meta.env;
  if (env.VITE_MODO === 'demo') {
    const { crearServiciosDemo } = await import('./demo');
    return { ok: true, servicios: crearServiciosDemo() };
  }
  const config = {
    apiKey: env.VITE_FIREBASE_API_KEY,
    authDomain: env.VITE_FIREBASE_AUTH_DOMAIN,
    projectId: env.VITE_FIREBASE_PROJECT_ID,
    appId: env.VITE_FIREBASE_APP_ID,
  };
  const faltan = Object.entries({
    VITE_FIREBASE_API_KEY: config.apiKey,
    VITE_FIREBASE_AUTH_DOMAIN: config.authDomain,
    VITE_FIREBASE_PROJECT_ID: config.projectId,
    VITE_FIREBASE_APP_ID: config.appId,
  })
    .filter(([, v]) => !v)
    .map(([k]) => k);
  if (faltan.length) return { ok: false, faltan };
  const { crearServiciosFirebase } = await import('./firebase');
  const completa = { apiKey: config.apiKey!, authDomain: config.authDomain!, projectId: config.projectId!, appId: config.appId! };
  return { ok: true, servicios: crearServiciosFirebase(completa, env.VITE_IA_URL) };
}
