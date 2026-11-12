import { ErrorIA, type PedidoIA, type RespuestaIA, type ServicioIA } from '../tipos';
import { aBase64 } from './imagen';
import { validarRespuestaIA } from './respuesta';

const MENSAJES = {
  sinConexion: 'Necesitás conexión para calcular. Mientras tanto, cargalo desde la lista o en Manual.',
  sesion: 'Tu sesión venció. Cerrá sesión y volvé a ingresar.',
  sinPermiso: 'Tu cuenta no tiene habilitado el cálculo con IA.',
  limite: 'Llegaste al límite de cálculos por hoy. Cargalo desde la lista o en Manual.',
  tamano: 'Las fotos pesan demasiado. Probá con menos fotos.',
  servidor: 'No se pudo calcular. Probá de nuevo en un rato o cargalo en Manual.',
};

/** Cliente del Worker de IA. Sin URL configurada, la opción queda oculta. */
export function crearServicioIA(url: string | undefined, obtenerToken: () => Promise<string | null>): ServicioIA {
  const base = url?.trim().replace(/\/+$/, '');
  if (!base) {
    return { disponible: false, estimar: () => Promise.reject(new ErrorIA('servidor', MENSAJES.servidor)) };
  }
  return {
    disponible: true,
    async estimar(p: PedidoIA, signal: AbortSignal): Promise<RespuestaIA> {
      if (!navigator.onLine) throw new ErrorIA('sin-conexion', MENSAJES.sinConexion);
      const token = await obtenerToken();
      if (!token) throw new ErrorIA('sesion', MENSAJES.sesion);
      const imagenes = await Promise.all(p.imagenes.map(async (b) => ({ tipo: b.type || 'image/jpeg', datos: await aBase64(b) })));

      let r: Response;
      try {
        r = await fetch(`${base}/estimar`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
          body: JSON.stringify({ descripcion: p.descripcion, imagenes, objetivoProteina: p.objetivoProteina }),
          signal,
        });
      } catch {
        if (signal.aborted) throw new ErrorIA('cancelado', '');
        throw new ErrorIA('sin-conexion', MENSAJES.sinConexion);
      }

      if (!r.ok) {
        if (r.status === 401) throw new ErrorIA('sesion', MENSAJES.sesion);
        if (r.status === 403) throw new ErrorIA('sin-permiso', MENSAJES.sinPermiso);
        if (r.status === 413) throw new ErrorIA('tamano', MENSAJES.tamano);
        if (r.status === 429) throw new ErrorIA('limite', MENSAJES.limite);
        throw new ErrorIA('servidor', MENSAJES.servidor);
      }
      try {
        return validarRespuestaIA(await r.json());
      } catch {
        if (signal.aborted) throw new ErrorIA('cancelado', '');
        throw new ErrorIA('servidor', MENSAJES.servidor);
      }
    },
  };
}
