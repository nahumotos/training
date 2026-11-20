import { AHORA, accesible, expect, test } from './ayuda';
import type { Page, Request } from '@playwright/test';

// Versión con Firebase (configuración falsa de .env.prueba). Los servidores de Google y el
// Worker de IA no se pueden alcanzar desde las pruebas, así que se simulan acá: lo que se
// prueba es el SDK de Firebase real dentro de la app compilada, con la CSP de producción.

const IA = 'https://libreta-ia.prueba.workers.dev';
test.use({
  externosPermitidos: [
    'https://identitytoolkit.googleapis.com/',
    'https://securetoken.googleapis.com/',
    'https://firestore.googleapis.com/',
    // Firestore pide esta imagen para comprobar la conexión cuando falla (permitida en la CSP).
    'https://www.google.com/images/cleardot.gif',
    `${IA}/`,
  ],
  // Firestore no tiene servidor en la prueba: sus avisos de "sin conexión" son esperables.
  ignorarConsola: /@firebase\/firestore|firestore\.googleapis\.com|net::ERR_INTERNET_DISCONNECTED|Failed to load resource/,
});

const EMAIL = 'nahu@ejemplo.com';
const UID = 'uidPrueba123';

function b64url(o: unknown) {
  return Buffer.from(JSON.stringify(o)).toString('base64url');
}

const iat = Math.floor(AHORA.getTime() / 1000);
const ID_TOKEN = [
  b64url({ alg: 'RS256', kid: 'prueba', typ: 'JWT' }),
  b64url({
    iss: 'https://securetoken.google.com/libreta-prueba',
    aud: 'libreta-prueba',
    auth_time: iat,
    user_id: UID,
    sub: UID,
    iat,
    exp: iat + 3600,
    email: EMAIL,
    email_verified: false,
    firebase: { identities: { email: [EMAIL] }, sign_in_provider: 'password' },
  }),
  'firma',
].join('.');

interface Simulacion {
  auth: { url: string; cuerpo: Record<string, unknown> }[];
  ia: Request[];
  respuestaIA: { estado: number; cuerpo: unknown };
}

async function simularGoogle(page: Page): Promise<Simulacion> {
  const s: Simulacion = { auth: [], ia: [], respuestaIA: { estado: 200, cuerpo: {} } };
  await page.route('https://identitytoolkit.googleapis.com/**', async (route) => {
    const req = route.request();
    const cuerpo = (req.postDataJSON() ?? {}) as Record<string, unknown>;
    s.auth.push({ url: req.url(), cuerpo });
    const json = (status: number, body: unknown) =>
      route.fulfill({ status, contentType: 'application/json', headers: { 'Access-Control-Allow-Origin': '*' }, body: JSON.stringify(body) });
    if (req.url().includes('accounts:signInWithPassword')) {
      if (cuerpo.password === 'bloqueada') return json(400, { error: { code: 400, message: 'TOO_MANY_ATTEMPTS_TRY_LATER' } });
      if (cuerpo.password !== 'clave-correcta') return json(400, { error: { code: 400, message: 'INVALID_LOGIN_CREDENTIALS' } });
      return json(200, {
        kind: 'identitytoolkit#VerifyPasswordResponse',
        localId: UID,
        email: EMAIL,
        displayName: '',
        idToken: ID_TOKEN,
        registered: true,
        refreshToken: 'refresco',
        expiresIn: '3600',
      });
    }
    if (req.url().includes('accounts:lookup')) {
      return json(200, {
        kind: 'identitytoolkit#GetAccountInfoResponse',
        users: [
          {
            localId: UID,
            email: EMAIL,
            emailVerified: false,
            providerUserInfo: [{ providerId: 'password', email: EMAIL, federatedId: EMAIL, rawId: EMAIL }],
            lastLoginAt: String(AHORA.getTime()),
            createdAt: String(AHORA.getTime()),
          },
        ],
      });
    }
    if (req.url().includes('accounts:sendOobCode')) return json(400, { error: { code: 400, message: 'EMAIL_NOT_FOUND' } });
    return json(404, { error: { code: 404, message: 'NOT_FOUND' } });
  });
  // Firestore sin servidor: la app trabaja con su caché local, como sin señal.
  await page.route('https://firestore.googleapis.com/**', (route) => route.abort('internetdisconnected'));
  await page.route('https://www.google.com/images/cleardot.gif*', (route) => route.abort('internetdisconnected'));
  await page.route(`${IA}/**`, async (route) => {
    s.ia.push(route.request());
    await route.fulfill({
      status: s.respuestaIA.estado,
      contentType: 'application/json',
      headers: { 'Access-Control-Allow-Origin': 'http://127.0.0.1:4174', Vary: 'Origin' },
      body: JSON.stringify(s.respuestaIA.cuerpo),
    });
  });
  return s;
}

test('versión con Firebase: ingreso, errores de Auth, datos locales y cálculo con IA', async ({ page }) => {
  const sim = await simularGoogle(page);

  await page.goto('/');
  await expect(page).toHaveURL(/\/ingresar/);
  await accesible(page);

  // Contraseña incorrecta y demasiados intentos: mensajes en castellano.
  await page.getByLabel('Email').fill(EMAIL);
  await page.getByLabel('Contraseña').fill('otra-clave');
  await page.getByRole('button', { name: 'Ingresar' }).click();
  await expect(page.getByRole('alert')).toHaveText('El email o la contraseña no coinciden.');
  await page.getByLabel('Contraseña').fill('bloqueada');
  await page.getByRole('button', { name: 'Ingresar' }).click();
  await expect(page.getByRole('alert')).toHaveText('Demasiados intentos. Esperá unos minutos o restablecé la contraseña.');

  // "Olvidé mi contraseña" no revela si el email tiene cuenta.
  await page.getByRole('button', { name: 'Olvidé mi contraseña' }).click();
  await expect(page.getByText(/Si el email tiene una cuenta/)).toBeVisible();

  await page.getByLabel('Contraseña').fill('clave-correcta');
  await page.getByRole('button', { name: 'Ingresar' }).click();
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Lunes 16 de noviembre');
  const ingreso = sim.auth.find((a) => a.url.includes('signInWithPassword') && a.cuerpo.password === 'clave-correcta');
  expect(ingreso?.url).toContain('key=clave-de-prueba');
  expect(ingreso?.cuerpo).toMatchObject({ email: EMAIL, returnSecureToken: true });

  // Primera vez en este dispositivo y sin poder leer los permisos: abre solo con la rutina.
  await expect(page.getByRole('region', { name: 'Comidas' })).toContainText('No habilitado');
  await expect(page.getByRole('link', { name: 'Elegir mi rutina' })).toBeVisible();
  await page.goto('/comidas');
  await expect(page.getByRole('region', { name: 'Comidas no habilitado' })).toBeVisible();
  await accesible(page);

  // Un dispositivo que ya conoce el acceso de la cuenta (acá, una cuenta anterior al registro
  // abierto) abre con ese acceso aunque no haya señal.
  await page.evaluate((uid) => localStorage.setItem(`libreta-acceso-${uid}`, JSON.stringify({ admin: false, anterior: true, secciones: [] })), UID);
  await page.goto('/');
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Lunes 16 de noviembre');
  await expect(page.getByRole('link', { name: /^Empezar / })).toBeVisible();

  // Escritura con Firestore sin servidor: se ve al instante y queda pendiente de sincronizar.
  await page.getByRole('button', { name: /Vaso de agua · 0 L/ }).click();
  await expect(page.getByRole('button', { name: /Vaso de agua · 0,25 L/ })).toBeVisible();
  await expect(page.getByRole('banner')).toContainText(/Guardando…|Sin conexión/);
  // Y sobrevive a una recarga (caché persistente de Firestore en el navegador).
  await page.reload();
  await expect(page.getByRole('button', { name: /Vaso de agua · 0,25 L/ })).toBeVisible();

  // Cálculo con IA: va al Worker con el token de la sesión.
  await page.goto('/comidas');
  await page.getByRole('button', { name: /Agregar al almuerzo/ }).click();
  const hoja = page.getByRole('dialog');
  await hoja.getByRole('tab', { name: 'Foto o texto' }).click();
  await hoja.getByLabel('Contá qué comiste y cuánto').fill('2 milanesas con puré');
  sim.respuestaIA = {
    estado: 200,
    cuerpo: {
      items: [
        { n: 'Milanesa', por: '2 medianas', p: 48, c: 36, g: 30, k: 610 },
        { n: 'Puré', por: '1 plato', p: 5, c: 45, g: 8, k: 260 },
      ],
      comentario: 'Bien de proteína.',
    },
  };
  await hoja.getByRole('button', { name: 'Calcular' }).click();
  await expect(hoja.getByRole('table')).toBeVisible();
  await expect(hoja.getByText('Bien de proteína.')).toBeVisible();
  const pedido = sim.ia.at(-1)!;
  expect(pedido.url()).toBe(`${IA}/estimar`);
  expect(pedido.method()).toBe('POST');
  expect(await pedido.headerValue('authorization')).toBe(`Bearer ${ID_TOKEN}`);
  expect(pedido.postDataJSON()).toEqual({ descripcion: '2 milanesas con puré', imagenes: [], objetivoProteina: 130 });

  // Errores del Worker, con mensajes claros.
  for (const [estado, mensaje] of [
    [429, 'Llegaste al límite de cálculos por hoy'],
    [403, 'Tu cuenta no tiene habilitado el cálculo con IA'],
    [401, 'Tu sesión venció'],
    [503, 'No se pudo calcular'],
  ] as const) {
    sim.respuestaIA = { estado, cuerpo: { error: 'x' } };
    await hoja.getByRole('button', { name: 'Calcular' }).click();
    await expect(hoja.getByRole('alert')).toContainText(mensaje);
  }

  // Una respuesta con datos inválidos no rompe nada: se descartan.
  sim.respuestaIA = { estado: 200, cuerpo: { items: [{ n: '', p: 'x' }, { n: 'Pan', por: '1', p: 5, c: 30, g: 1, k: 150 }, 'basura'], comentario: 42 } };
  await hoja.getByRole('button', { name: 'Calcular' }).click();
  await expect(hoja.getByRole('table').getByRole('row')).toHaveCount(2);

  // Cerrar sesión.
  await hoja.getByRole('button', { name: 'Listo' }).click();
  await page.goto('/ajustes');
  await expect(page.getByRole('region', { name: 'Cuenta' })).toContainText(EMAIL);
  await page.getByRole('button', { name: 'Cerrar sesión' }).click();
  await expect(page).toHaveURL(/\/ingresar/);
});
