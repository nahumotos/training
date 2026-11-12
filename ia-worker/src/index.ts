/**
 * Punto de entrada del Worker de IA de Libreta.
 * Solo exporta el manejador: el runtime de Workers trata cada export del módulo
 * principal como un punto de entrada, así que la lógica vive en logica.ts.
 */
import { contarUso, encabezadosCors, estimar, Fallo, json, leerPedido, verificarUsuario, type Entorno } from './logica';

export default {
  async fetch(pedido: Request, env: Entorno): Promise<Response> {
    const origen = pedido.headers.get('Origin');
    const permitidos = (env.ORIGENES ?? '')
      .split(',')
      .map((o) => o.trim().replace(/\/+$/, ''))
      .filter(Boolean);
    const cors = origen && permitidos.includes(origen) ? encabezadosCors(origen) : null;

    if (!cors) return json({ error: 'Origen no permitido' }, 403);
    if (pedido.method === 'OPTIONS') return new Response(null, { status: 204, headers: cors });

    const url = new URL(pedido.url);
    if (url.pathname !== '/estimar') return json({ error: 'No encontrado' }, 404, cors);
    if (pedido.method !== 'POST') return json({ error: 'Método no permitido' }, 405, { ...cors, Allow: 'POST, OPTIONS' });

    try {
      if (!env.ANTHROPIC_API_KEY || !env.FIREBASE_PROYECTO) throw new Fallo(500, 'Worker sin configurar');
      const uid = await verificarUsuario(pedido.headers.get('Authorization'), env.FIREBASE_PROYECTO);
      const datos = await leerPedido(pedido);
      await contarUso(env, uid);
      const resultado = await estimar(datos, env);
      return json(resultado, 200, cors);
    } catch (e) {
      if (e instanceof Fallo) {
        if (e.estado >= 500) console.error(`ia: ${e.estado} ${e.message}`);
        return json({ error: e.message }, e.estado, cors);
      }
      console.error('ia: error inesperado', e instanceof Error ? e.message : String(e));
      return json({ error: 'Error interno' }, 500, cors);
    }
  },
};
