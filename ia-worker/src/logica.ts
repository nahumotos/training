/**
 * Lógica del Worker de IA de Libreta (el punto de entrada está en index.ts).
 *
 * POST /estimar  { descripcion, imagenes: [{ tipo, datos(base64) }], objetivoProteina }
 *   → 200 { items: [{ n, por, p, c, g, k }], comentario }
 *
 * Seguridad:
 * - Solo acepta pedidos desde los orígenes de ORIGENES (CORS).
 * - Pide el token de sesión de Firebase y lo valida con Firestore: lee con ese mismo
 *   token los permisos de la cuenta. Si el token es falso o venció, Firestore lo rechaza.
 *   Calculan las cuentas anteriores al registro abierto (permitidos/{uid}), las de los
 *   administradores (admins/{uid}) y las que tienen habilitada la sección Comidas
 *   (accesos/{uid}); el resto recibe 403.
 * - La clave de Anthropic vive solo como secreto del Worker.
 * - Opcional: límite de cálculos por persona y por día (KV "LIMITES").
 *
 * El plan gratuito de Workers da ~10 ms de CPU por pedido: por eso no se vuelve a
 * serializar el base64 de las fotos (se arma el cuerpo por concatenación, después
 * de comprobar que no trae caracteres que rompan el JSON).
 */

export interface AlmacenKV {
  get(clave: string): Promise<string | null>;
  put(clave: string, valor: string, opciones?: { expirationTtl?: number }): Promise<void>;
}

export interface Entorno {
  ANTHROPIC_API_KEY: string;
  FIREBASE_PROYECTO: string;
  ORIGENES: string;
  LIMITE_DIARIO?: string;
  MODELO_TEXTO?: string;
  MODELO_FOTO?: string;
  LIMITES?: AlmacenKV;
}

const MODELO_TEXTO = 'claude-haiku-5-5';
const MODELO_FOTO = 'claude-sonnet-5-5';
const MAX_CUERPO = 6_000_000; // bytes del pedido completo
const MAX_FOTOS = 4;
const MAX_FOTO = 2_000_000; // caracteres base64 por foto (~1,5 MB)
const MAX_DESCRIPCION = 600;
const TIPOS = new Set(['image/jpeg', 'image/png', 'image/webp']);
// Primeros caracteres del base64 de cada formato (cabecera del archivo).
const FIRMAS: Record<string, string> = { 'image/jpeg': '/9j/', 'image/png': 'iVBORw0KGgo', 'image/webp': 'UklGR' };

export const SISTEMA = [
  'Sos nutricionista y estimás comidas caseras argentinas a partir de fotos y descripciones.',
  'Reglas:',
  '- Cada foto es un plato distinto que la persona comió. Sumá todos; nunca trates dos fotos como el mismo plato.',
  '- Separá cada alimento en un ítem (por ejemplo: milanesa, puré, ensalada) con la porción estimada en medidas caseras y gramos, por ejemplo "1 milanesa mediana (150 g)".',
  '- Para cada ítem estimá proteína (p), hidratos (c) y grasas (g) en gramos, y calorías (k). Que k sea coherente con 4·p + 4·c + 9·g.',
  '- Tené en cuenta el aceite de cocción o de fritura cuando corresponda o cuando la persona lo indique.',
  '- Si la descripción contradice la foto, priorizá la descripción.',
  '- Incluí las bebidas con calorías. El agua y el mate amargo no se anotan.',
  '- Si algo no es comida o no se puede estimar, no lo incluyas y aclaralo en el comentario.',
  '- comentario: una o dos frases cortas, en español rioplatense, útiles para la persona (por ejemplo, qué sumar para llegar a la proteína). Sin sermones.',
].join('\n');

export const HERRAMIENTA = {
  name: 'registrar_comida',
  description: 'Registra los alimentos estimados de la comida.',
  input_schema: {
    type: 'object',
    properties: {
      items: {
        type: 'array',
        maxItems: 12,
        items: {
          type: 'object',
          properties: {
            n: { type: 'string', description: 'Nombre corto del alimento' },
            por: { type: 'string', description: 'Porción estimada, en medidas caseras y gramos' },
            p: { type: 'number', description: 'Proteína en gramos' },
            c: { type: 'number', description: 'Hidratos en gramos' },
            g: { type: 'number', description: 'Grasas en gramos' },
            k: { type: 'number', description: 'Calorías' },
          },
          required: ['n', 'por', 'p', 'c', 'g', 'k'],
        },
      },
      comentario: { type: 'string' },
    },
    required: ['items', 'comentario'],
  },
} as const;

/** Error con el código HTTP que se devuelve a la app. */
export class Fallo extends Error {
  constructor(
    readonly estado: number,
    mensaje: string,
  ) {
    super(mensaje);
  }
}

export function encabezadosCors(origen: string): Record<string, string> {
  return {
    'Access-Control-Allow-Origin': origen,
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Authorization, Content-Type',
    'Access-Control-Max-Age': '86400',
    Vary: 'Origin',
  };
}

export function json(cuerpo: unknown, estado: number, extra: Record<string, string> = {}): Response {
  return new Response(JSON.stringify(cuerpo), {
    status: estado,
    headers: { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff', ...extra },
  });
}

/* ---------- Sesión ---------- */

// Tokens ya verificados en esta instancia del Worker, para no consultar Firestore en cada pedido.
const verificados = new Map<string, { uid: string; hasta: number }>();

function decodificarBase64Url(s: string): string {
  const b64 = s.replace(/-/g, '+').replace(/_/g, '/');
  const bin = atob(b64 + '='.repeat((4 - (b64.length % 4)) % 4));
  return new TextDecoder().decode(Uint8Array.from(bin, (c) => c.charCodeAt(0)));
}

/** Secciones de un documento accesos/{uid} tal como lo devuelve la API REST de Firestore. */
export function seccionesDeDocumento(doc: unknown): string[] {
  const valores = (doc as { fields?: { secciones?: { arrayValue?: { values?: unknown } } } } | null)?.fields?.secciones?.arrayValue?.values;
  if (!Array.isArray(valores)) return [];
  return valores.map((v) => (v as { stringValue?: unknown } | null)?.stringValue).filter((v): v is string => typeof v === 'string');
}

/**
 * Devuelve el uid si el token es válido y la cuenta puede usar el cálculo con IA.
 * Primero descarta tokens mal formados, vencidos o de otro proyecto (sin red);
 * la firma la comprueba Firestore al leer los permisos de la cuenta con ese token.
 */
export async function verificarUsuario(autorizacion: string | null, proyecto: string): Promise<string> {
  const token = autorizacion?.match(/^Bearer ([A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+)$/)?.[1];
  if (!token) throw new Fallo(401, 'Falta la sesión');
  const ahora = Date.now();

  const enCache = verificados.get(token);
  if (enCache && enCache.hasta > ahora) return enCache.uid;

  let carga: { aud?: unknown; iss?: unknown; sub?: unknown; exp?: unknown };
  try {
    carga = JSON.parse(decodificarBase64Url(token.split('.')[1]!));
  } catch {
    throw new Fallo(401, 'Sesión inválida');
  }
  const uid = typeof carga.sub === 'string' ? carga.sub : '';
  const vence = typeof carga.exp === 'number' ? carga.exp * 1000 : 0;
  if (carga.aud !== proyecto || carga.iss !== `https://securetoken.google.com/${proyecto}` || !/^[A-Za-z0-9]{1,128}$/.test(uid) || vence <= ahora) {
    throw new Fallo(401, 'Sesión inválida o vencida');
  }

  // Las tres lecturas van juntas; un documento que no existe responde 404.
  const base = `https://firestore.googleapis.com/v1/projects/${encodeURIComponent(proyecto)}/databases/(default)/documents`;
  const leer = (coleccion: string) =>
    fetch(`${base}/${coleccion}/${uid}`, { headers: { Authorization: `Bearer ${token}` }, signal: AbortSignal.timeout(10_000) });
  let permitido: Response, admin: Response, acceso: Response;
  try {
    [permitido, admin, acceso] = await Promise.all([leer('permitidos'), leer('admins'), leer('accesos')]);
  } catch {
    throw new Fallo(503, 'No se pudo verificar la sesión');
  }
  const respuestas = [permitido, admin, acceso];
  if (respuestas.some((r) => r.status === 401 || r.status === 403)) throw new Fallo(401, 'Sesión inválida o vencida');
  const fallida = respuestas.find((r) => !r.ok && r.status !== 404);
  if (fallida) throw new Fallo(503, `Firestore respondió ${fallida.status}`);

  let habilitada = permitido.ok || admin.ok;
  if (!habilitada && acceso.ok) habilitada = seccionesDeDocumento(await acceso.json().catch(() => null)).includes('comidas');
  if (!habilitada) throw new Fallo(403, 'Cuenta no habilitada');

  if (verificados.size > 200) verificados.clear();
  verificados.set(token, { uid, hasta: Math.min(vence, ahora + 10 * 60_000) });
  return uid;
}

/* ---------- Pedido ---------- */

export interface Imagen {
  tipo: string;
  datos: string;
}

export interface Datos {
  descripcion: string;
  imagenes: Imagen[];
  objetivoProteina: number;
}

export async function leerPedido(pedido: Request): Promise<Datos> {
  const largo = Number(pedido.headers.get('Content-Length') ?? 0);
  if (largo > MAX_CUERPO) throw new Fallo(413, 'Pedido demasiado grande');
  const texto = await pedido.text();
  if (texto.length > MAX_CUERPO) throw new Fallo(413, 'Pedido demasiado grande');

  let v: unknown;
  try {
    v = JSON.parse(texto);
  } catch {
    throw new Fallo(400, 'El pedido no es JSON válido');
  }
  if (typeof v !== 'object' || v === null) throw new Fallo(400, 'Pedido inválido');
  const o = v as Record<string, unknown>;

  const descripcion = typeof o.descripcion === 'string' ? o.descripcion.trim().slice(0, MAX_DESCRIPCION) : '';
  const lista = Array.isArray(o.imagenes) ? o.imagenes : [];
  if (lista.length > MAX_FOTOS) throw new Fallo(400, `Máximo ${MAX_FOTOS} fotos`);

  const imagenes: Imagen[] = lista.map((x) => {
    const im = (typeof x === 'object' && x !== null ? x : {}) as Record<string, unknown>;
    const tipo = typeof im.tipo === 'string' ? im.tipo : '';
    const datos = typeof im.datos === 'string' ? im.datos : '';
    if (!TIPOS.has(tipo)) throw new Fallo(400, 'Formato de foto no admitido');
    if (datos.length > MAX_FOTO) throw new Fallo(413, 'Foto demasiado grande');
    // Comprobaciones baratas: cabecera del formato y nada que pueda romper el JSON
    // (el base64 completo lo valida Anthropic).
    if (!datos.startsWith(FIRMAS[tipo]!) || datos.includes('"') || datos.includes('\\')) throw new Fallo(400, 'Foto inválida');
    return { tipo, datos };
  });

  if (!descripcion && !imagenes.length) throw new Fallo(400, 'Falta la foto o la descripción');
  const obj = typeof o.objetivoProteina === 'number' && o.objetivoProteina >= 40 && o.objetivoProteina <= 400 ? Math.round(o.objetivoProteina) : 130;
  return { descripcion, imagenes, objetivoProteina: obj };
}

/* ---------- Límite diario ---------- */

/** Fecha en Argentina (UTC−3, sin horario de verano). */
function fechaArgentina(ahora = Date.now()): string {
  return new Date(ahora - 3 * 3600_000).toISOString().slice(0, 10);
}

export async function contarUso(env: Entorno, uid: string): Promise<void> {
  if (!env.LIMITES) return;
  const limite = Number(env.LIMITE_DIARIO ?? 40) || 40;
  const clave = `uso:${uid}:${fechaArgentina()}`;
  const usados = Number((await env.LIMITES.get(clave)) ?? 0) || 0;
  if (usados >= limite) throw new Fallo(429, 'Límite diario alcanzado');
  await env.LIMITES.put(clave, String(usados + 1), { expirationTtl: 2 * 86400 });
}

/* ---------- Claude ---------- */

/**
 * Arma el cuerpo para la API de Claude. Las fotos se insertan tal cual (ya se
 * comprobó que no tienen comillas ni barras invertidas) para no gastar CPU
 * volviendo a serializar el base64.
 */
export function armarCuerpo(d: Datos, modelo: string): string {
  const partes: string[] = [];
  d.imagenes.forEach((im, i) => {
    partes.push(JSON.stringify({ type: 'text', text: `Plato ${i + 1}:` }));
    partes.push(`{"type":"image","source":{"type":"base64","media_type":${JSON.stringify(im.tipo)},"data":"${im.datos}"}}`);
  });
  const pedidoTexto = [
    d.imagenes.length > 1 ? `Son ${d.imagenes.length} platos distintos; sumalos todos.` : '',
    d.descripcion ? `Lo que cuenta la persona: ${d.descripcion}` : d.imagenes.length ? 'Estimá lo que se ve en la foto.' : '',
    `Su objetivo de proteína es ${d.objetivoProteina} g por día.`,
  ]
    .filter(Boolean)
    .join('\n');
  partes.push(JSON.stringify({ type: 'text', text: pedidoTexto }));

  return (
    `{"model":${JSON.stringify(modelo)},"max_tokens":1024,` +
    `"system":${JSON.stringify(SISTEMA)},` +
    `"tools":[${JSON.stringify(HERRAMIENTA)}],` +
    `"tool_choice":{"type":"tool","name":"registrar_comida"},` +
    `"messages":[{"role":"user","content":[${partes.join(',')}]}]}`
  );
}

export interface Item {
  n: string;
  por: string;
  p: number;
  c: number;
  g: number;
  k: number;
}

const acotar = (v: unknown, min: number, max: number) => (typeof v === 'number' && Number.isFinite(v) ? Math.min(max, Math.max(min, v)) : null);

/** Toma la llamada a la herramienta de la respuesta y la limpia. */
export function interpretar(respuesta: unknown): { items: Item[]; comentario: string } {
  const contenido = (respuesta as { content?: unknown })?.content;
  const bloque = Array.isArray(contenido) ? contenido.find((b) => b?.type === 'tool_use' && b?.name === HERRAMIENTA.name) : undefined;
  const entrada = (bloque?.input ?? {}) as { items?: unknown; comentario?: unknown };
  const items: Item[] = [];
  for (const x of Array.isArray(entrada.items) ? entrada.items.slice(0, 12) : []) {
    const r = (x ?? {}) as Record<string, unknown>;
    const n = typeof r.n === 'string' ? r.n.trim().slice(0, 80) : '';
    const p = acotar(r.p, 0, 300);
    const k = acotar(r.k, 0, 5000);
    if (!n || p === null || k === null) continue;
    items.push({
      n,
      por: typeof r.por === 'string' ? r.por.trim().slice(0, 60) : '',
      p: Math.round(p * 10) / 10,
      c: Math.round(acotar(r.c, 0, 1000) ?? 0),
      g: Math.round(acotar(r.g, 0, 500) ?? 0),
      k: Math.round(k),
    });
  }
  const comentario = typeof entrada.comentario === 'string' ? entrada.comentario.trim().slice(0, 300) : '';
  return { items, comentario };
}

export async function estimar(d: Datos, env: Entorno): Promise<{ items: Item[]; comentario: string }> {
  const modelo = d.imagenes.length ? env.MODELO_FOTO || MODELO_FOTO : env.MODELO_TEXTO || MODELO_TEXTO;
  let r: Response;
  try {
    r = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: { 'content-type': 'application/json', 'x-api-key': env.ANTHROPIC_API_KEY, 'anthropic-version': '2023-06-01' },
      body: armarCuerpo(d, modelo),
      signal: AbortSignal.timeout(60_000),
    });
  } catch {
    throw new Fallo(504, 'Claude no respondió a tiempo');
  }
  if (!r.ok) {
    // 401/403: clave mal cargada; 429/529: límite o saturación de la API; 400: pedido o foto inválidos.
    const estado = r.status === 429 || r.status === 529 || r.status >= 500 ? 503 : 502;
    throw new Fallo(estado, `Claude respondió ${r.status}`);
  }
  return interpretar(await r.json());
}
