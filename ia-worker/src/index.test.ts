import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import worker from './index';
import { armarCuerpo, interpretar, type AlmacenKV, type Entorno } from './logica';

const PROYECTO = 'libreta-prueba';
const ORIGEN = 'https://libreta-prueba.web.app';
const JPEG = '/9j/' + 'A'.repeat(400);

function b64url(o: unknown): string {
  const bytes = new TextEncoder().encode(JSON.stringify(o));
  return btoa(String.fromCharCode(...bytes))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
}

let contador = 0;
/** Token con la forma de uno de Firebase (la firma la "verifica" el Firestore simulado). */
function token(carga: Record<string, unknown> = {}): string {
  contador++;
  return [
    b64url({ alg: 'RS256' }),
    b64url({
      aud: PROYECTO,
      iss: `https://securetoken.google.com/${PROYECTO}`,
      sub: 'uid123',
      exp: Math.floor(Date.now() / 1000) + 3600,
      n: contador,
      ...carga,
    }),
    'firma',
  ].join('.');
}

function kvMemoria(): AlmacenKV & { datos: Map<string, string> } {
  const datos = new Map<string, string>();
  return { datos, get: async (k) => datos.get(k) ?? null, put: async (k, v) => void datos.set(k, v) };
}

const env = (extra: Partial<Entorno> = {}): Entorno => ({
  ANTHROPIC_API_KEY: 'sk-prueba',
  FIREBASE_PROYECTO: PROYECTO,
  ORIGENES: `${ORIGEN}, https://otro.example/`,
  ...extra,
});

function pedido(cuerpo: unknown, opciones: { token?: string | null; origen?: string | null; metodo?: string; ruta?: string } = {}): Request {
  const h = new Headers({ 'Content-Type': 'application/json' });
  const o = opciones.origen === undefined ? ORIGEN : opciones.origen;
  if (o) h.set('Origin', o);
  const t = opciones.token === undefined ? token() : opciones.token;
  if (t) h.set('Authorization', `Bearer ${t}`);
  const metodo = opciones.metodo ?? 'POST';
  return new Request(`https://libreta-ia.workers.dev${opciones.ruta ?? '/estimar'}`, {
    method: metodo,
    headers: h,
    body: metodo === 'POST' ? (typeof cuerpo === 'string' ? cuerpo : JSON.stringify(cuerpo)) : undefined,
  });
}

const respuestaClaude = {
  content: [
    {
      type: 'tool_use',
      name: 'registrar_comida',
      input: {
        items: [
          { n: 'Milanesa de carne', por: '1 mediana (150 g)', p: 30.04, c: 18, g: 22, k: 395.6 },
          { n: '', por: 'x', p: 1, c: 1, g: 1, k: 1 },
          { n: 'Puré', por: '1 taza', p: 4, c: 35, g: 8, k: 230 },
        ],
        comentario: 'Buena proteína.',
      },
    },
  ],
};

type DocSimulado = { estado: number; cuerpo?: unknown };

/**
 * fetch simulado: Firestore (permisos de la cuenta) y la API de Claude.
 * `firestore` es la respuesta de las tres lecturas; `docs` cambia la de una colección.
 */
function simularFetch(
  opciones: { firestore?: number; docs?: Partial<Record<'permitidos' | 'admins' | 'accesos', DocSimulado>>; claude?: number; cuerpoClaude?: unknown } = {},
) {
  const llamadas: { url: string; init?: RequestInit }[] = [];
  const f = vi.fn(async (url: string | URL | Request, init?: RequestInit) => {
    const u = String(url);
    llamadas.push({ url: u, init });
    if (u.startsWith('https://firestore.googleapis.com/')) {
      const coleccion = u.split('/documents/')[1]?.split('/')[0] as 'permitidos' | 'admins' | 'accesos';
      const doc = opciones.docs?.[coleccion];
      return new Response(JSON.stringify(doc?.cuerpo ?? {}), { status: doc?.estado ?? opciones.firestore ?? 200 });
    }
    if (u === 'https://api.anthropic.com/v1/messages') {
      return new Response(JSON.stringify(opciones.cuerpoClaude ?? respuestaClaude), { status: opciones.claude ?? 200 });
    }
    throw new Error(`fetch inesperado: ${u}`);
  });
  vi.stubGlobal('fetch', f);
  return llamadas;
}

beforeEach(() => {
  vi.spyOn(console, 'error').mockImplementation(() => undefined);
});
afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe('CORS y rutas', () => {
  it('rechaza orígenes que no están en la lista', async () => {
    simularFetch();
    const r = await worker.fetch(pedido({ descripcion: 'x' }, { origen: 'https://malo.example' }), env());
    expect(r.status).toBe(403);
    expect(r.headers.get('Access-Control-Allow-Origin')).toBeNull();
  });

  it('rechaza pedidos sin origen', async () => {
    simularFetch();
    const r = await worker.fetch(pedido({ descripcion: 'x' }, { origen: null }), env());
    expect(r.status).toBe(403);
  });

  it('responde la verificación previa (OPTIONS) del navegador', async () => {
    const r = await worker.fetch(pedido(null, { metodo: 'OPTIONS' }), env());
    expect(r.status).toBe(204);
    expect(r.headers.get('Access-Control-Allow-Origin')).toBe(ORIGEN);
    expect(r.headers.get('Access-Control-Allow-Headers')).toContain('Authorization');
  });

  it('acepta un origen de la lista aunque tenga barra final en la configuración', async () => {
    const r = await worker.fetch(pedido(null, { metodo: 'OPTIONS', origen: 'https://otro.example' }), env());
    expect(r.status).toBe(204);
  });

  it('404 en otras rutas y 405 con otros métodos', async () => {
    simularFetch();
    expect((await worker.fetch(pedido({}, { ruta: '/otra' }), env())).status).toBe(404);
    expect((await worker.fetch(pedido(null, { metodo: 'GET' }), env())).status).toBe(405);
  });
});

describe('sesión', () => {
  it('401 sin token', async () => {
    const llamadas = simularFetch();
    const r = await worker.fetch(pedido({ descripcion: 'x' }, { token: null }), env());
    expect(r.status).toBe(401);
    expect(llamadas).toHaveLength(0);
  });

  it('401 con token vencido, de otro proyecto o mal formado, sin consultar a nadie', async () => {
    const llamadas = simularFetch();
    for (const t of [token({ exp: 1000 }), token({ aud: 'otro' }), token({ iss: 'https://otro' }), token({ sub: '../x' }), 'a.b.c']) {
      const r = await worker.fetch(pedido({ descripcion: 'x' }, { token: t }), env());
      expect(r.status).toBe(401);
    }
    expect(llamadas).toHaveLength(0);
  });

  it('401 si Firestore rechaza el token (firma inválida)', async () => {
    simularFetch({ firestore: 401 });
    const r = await worker.fetch(pedido({ descripcion: 'x' }), env());
    expect(r.status).toBe(401);
  });

  it('403 si la cuenta no tiene ningún permiso (no existen sus documentos)', async () => {
    const llamadas = simularFetch({ firestore: 404 });
    const r = await worker.fetch(pedido({ descripcion: 'x' }), env());
    expect(r.status).toBe(403);
    expect(llamadas.some((l) => l.url.includes('api.anthropic.com'))).toBe(false);
  });

  it('consulta permitidos, admins y accesos de la cuenta con el token del usuario', async () => {
    const llamadas = simularFetch();
    const t = token();
    await worker.fetch(pedido({ descripcion: 'x' }, { token: t }), env());
    const fs = llamadas.filter((l) => l.url.startsWith('https://firestore'));
    const base = `https://firestore.googleapis.com/v1/projects/${PROYECTO}/databases/(default)/documents`;
    expect(fs.map((l) => l.url)).toEqual([`${base}/permitidos/uid123`, `${base}/admins/uid123`, `${base}/accesos/uid123`]);
    for (const l of fs) expect(new Headers(l.init?.headers).get('Authorization')).toBe(`Bearer ${t}`);
  });

  it('calcula para una cuenta administradora aunque no esté en permitidos', async () => {
    simularFetch({ firestore: 404, docs: { admins: { estado: 200 } } });
    const r = await worker.fetch(pedido({ descripcion: 'x' }), env());
    expect(r.status).toBe(200);
  });

  it('calcula si un admin le habilitó Comidas, y no si le habilitó otra sección', async () => {
    const conComidas = { fields: { secciones: { arrayValue: { values: [{ stringValue: 'progreso' }, { stringValue: 'comidas' }] } } } };
    simularFetch({ firestore: 404, docs: { accesos: { estado: 200, cuerpo: conComidas } } });
    expect((await worker.fetch(pedido({ descripcion: 'x' }, { token: token({ sub: 'conComidas' }) }), env())).status).toBe(200);

    const sinComidas = { fields: { secciones: { arrayValue: { values: [{ stringValue: 'progreso' }] } } } };
    simularFetch({ firestore: 404, docs: { accesos: { estado: 200, cuerpo: sinComidas } } });
    expect((await worker.fetch(pedido({ descripcion: 'x' }, { token: token({ sub: 'sinComidas' }) }), env())).status).toBe(403);

    simularFetch({ firestore: 404, docs: { accesos: { estado: 200, cuerpo: { fields: {} } } } });
    expect((await worker.fetch(pedido({ descripcion: 'x' }, { token: token({ sub: 'vacio' }) }), env())).status).toBe(403);
  });

  it('503 si Firestore falla al leer los permisos', async () => {
    simularFetch({ docs: { accesos: { estado: 500 } } });
    const r = await worker.fetch(pedido({ descripcion: 'x' }, { token: token({ sub: 'otraCuenta' }) }), env());
    expect(r.status).toBe(503);
  });

  it('no vuelve a consultar Firestore con un token ya verificado', async () => {
    const llamadas = simularFetch();
    const t = token();
    await worker.fetch(pedido({ descripcion: 'x' }, { token: t }), env());
    const antes = llamadas.filter((l) => l.url.startsWith('https://firestore')).length;
    await worker.fetch(pedido({ descripcion: 'y' }, { token: t }), env());
    expect(antes).toBe(3);
    expect(llamadas.filter((l) => l.url.startsWith('https://firestore'))).toHaveLength(3);
  });
});

describe('validación del pedido', () => {
  it('rechaza JSON inválido, pedidos vacíos y demasiadas fotos', async () => {
    simularFetch();
    expect((await worker.fetch(pedido('{no es json'), env())).status).toBe(400);
    expect((await worker.fetch(pedido({ descripcion: '   ' }), env())).status).toBe(400);
    const cinco = Array.from({ length: 5 }, () => ({ tipo: 'image/jpeg', datos: JPEG }));
    expect((await worker.fetch(pedido({ imagenes: cinco }), env())).status).toBe(400);
  });

  it('rechaza formatos no admitidos y datos que no son la imagen declarada', async () => {
    simularFetch();
    expect((await worker.fetch(pedido({ imagenes: [{ tipo: 'image/gif', datos: 'R0lGOD' }] }), env())).status).toBe(400);
    expect((await worker.fetch(pedido({ imagenes: [{ tipo: 'image/jpeg', datos: 'iVBORw0KGgo' }] }), env())).status).toBe(400);
  });

  it('no deja inyectar JSON a través del base64', async () => {
    const llamadas = simularFetch();
    const datos = `/9j/AAA","model":"otro-modelo`;
    const r = await worker.fetch(pedido({ imagenes: [{ tipo: 'image/jpeg', datos }] }), env());
    expect(r.status).toBe(400);
    expect(llamadas.some((l) => l.url.includes('anthropic'))).toBe(false);
    const r2 = await worker.fetch(pedido({ imagenes: [{ tipo: 'image/jpeg', datos: '/9j/AA\\u0022' }] }), env());
    expect(r2.status).toBe(400);
  });

  it('413 si una foto es demasiado grande', async () => {
    simularFetch();
    const r = await worker.fetch(pedido({ imagenes: [{ tipo: 'image/jpeg', datos: '/9j/' + 'A'.repeat(2_000_001) }] }), env());
    expect(r.status).toBe(413);
  });
});

describe('estimación', () => {
  it('usa el modelo de texto sin fotos y el de fotos con fotos', async () => {
    const llamadas = simularFetch();
    await worker.fetch(pedido({ descripcion: '2 milanesas' }), env());
    await worker.fetch(pedido({ imagenes: [{ tipo: 'image/jpeg', datos: JPEG }] }), env());
    const modelos = llamadas.filter((l) => l.url.includes('anthropic')).map((l) => JSON.parse(String(l.init?.body)).model);
    expect(modelos).toEqual(['claude-haiku-5-5', 'claude-sonnet-5-5']);
  });

  it('manda la clave solo a la API de Claude, y fuerza la herramienta', async () => {
    const llamadas = simularFetch();
    await worker.fetch(pedido({ descripcion: 'x' }), env());
    const claude = llamadas.find((l) => l.url.includes('anthropic'))!;
    const h = new Headers(claude.init?.headers);
    expect(h.get('x-api-key')).toBe('sk-prueba');
    expect(h.get('anthropic-version')).toBe('2023-06-01');
    const cuerpo = JSON.parse(String(claude.init?.body));
    expect(cuerpo.tool_choice).toEqual({ type: 'tool', name: 'registrar_comida' });
    const fs = llamadas.find((l) => l.url.includes('firestore'))!;
    expect(new Headers(fs.init?.headers).get('x-api-key')).toBeNull();
  });

  it('devuelve los alimentos limpios y descarta los inválidos', async () => {
    simularFetch();
    const r = await worker.fetch(pedido({ descripcion: 'milanesa con puré' }), env());
    expect(r.status).toBe(200);
    expect(r.headers.get('Access-Control-Allow-Origin')).toBe(ORIGEN);
    expect(r.headers.get('Cache-Control')).toBe('no-store');
    expect(await r.json()).toEqual({
      items: [
        { n: 'Milanesa de carne', por: '1 mediana (150 g)', p: 30, c: 18, g: 22, k: 396 },
        { n: 'Puré', por: '1 taza', p: 4, c: 35, g: 8, k: 230 },
      ],
      comentario: 'Buena proteína.',
    });
  });

  it('503 si la API está saturada y 502 si rechaza el pedido; sin filtrar detalles', async () => {
    simularFetch({ claude: 529 });
    const r1 = await worker.fetch(pedido({ descripcion: 'x' }), env());
    expect(r1.status).toBe(503);
    simularFetch({ claude: 401 });
    const r2 = await worker.fetch(pedido({ descripcion: 'x' }), env());
    expect(r2.status).toBe(502);
    expect(JSON.stringify(await r2.json())).not.toContain('sk-');
  });

  it('500 si falta configurar la clave', async () => {
    simularFetch();
    const r = await worker.fetch(pedido({ descripcion: 'x' }), env({ ANTHROPIC_API_KEY: '' }));
    expect(r.status).toBe(500);
  });
});

describe('límite diario (KV)', () => {
  it('cuenta los usos y corta al llegar al límite', async () => {
    const llamadas = simularFetch();
    const kv = kvMemoria();
    const e = env({ LIMITES: kv, LIMITE_DIARIO: '2' });
    expect((await worker.fetch(pedido({ descripcion: 'a' }), e)).status).toBe(200);
    expect((await worker.fetch(pedido({ descripcion: 'b' }), e)).status).toBe(200);
    expect((await worker.fetch(pedido({ descripcion: 'c' }), e)).status).toBe(429);
    expect(llamadas.filter((l) => l.url.includes('anthropic'))).toHaveLength(2);
    expect([...kv.datos.keys()][0]).toMatch(/^uso:uid123:\d{4}-\d{2}-\d{2}$/);
  });
});

describe('armarCuerpo', () => {
  it('produce JSON válido con cada foto como un plato', () => {
    const cuerpo = JSON.parse(
      armarCuerpo(
        {
          descripcion: 'Con "salsa" y \\ barra',
          imagenes: [
            { tipo: 'image/jpeg', datos: JPEG },
            { tipo: 'image/png', datos: 'iVBORw0KGgoAAAA' },
          ],
          objetivoProteina: 130,
        },
        'modelo-x',
      ),
    );
    expect(cuerpo.model).toBe('modelo-x');
    const c = cuerpo.messages[0].content;
    expect(c.map((b: { type: string }) => b.type)).toEqual(['text', 'image', 'text', 'image', 'text']);
    expect(c[1].source).toEqual({ type: 'base64', media_type: 'image/jpeg', data: JPEG });
    expect(c[4].text).toContain('Son 2 platos distintos');
    expect(c[4].text).toContain('Con "salsa" y \\ barra');
    expect(c[4].text).toContain('130 g');
  });

  it('arma el cuerpo de 4 fotos grandes en poco tiempo de CPU', () => {
    const grande = '/9j/' + 'A'.repeat(400_000);
    const d = { descripcion: 'x', imagenes: Array.from({ length: 4 }, () => ({ tipo: 'image/jpeg', datos: grande })), objetivoProteina: 130 };
    const t = performance.now();
    const cuerpo = armarCuerpo(d, 'm');
    const ms = performance.now() - t;
    expect(cuerpo.length).toBeGreaterThan(1_600_000);
    expect(ms).toBeLessThan(5);
  });
});

describe('interpretar', () => {
  it('tolera respuestas sin herramienta o con valores fuera de rango', () => {
    expect(interpretar({})).toEqual({ items: [], comentario: '' });
    expect(interpretar({ content: [{ type: 'text', text: 'hola' }] })).toEqual({ items: [], comentario: '' });
    const r = interpretar({
      content: [{ type: 'tool_use', name: 'registrar_comida', input: { items: [{ n: 'x', por: 1, p: 999, c: -3, g: 'mucho', k: 10 }], comentario: 5 } }],
    });
    expect(r).toEqual({ items: [{ n: 'x', por: '', p: 300, c: 0, g: 0, k: 10 }], comentario: '' });
  });
});
