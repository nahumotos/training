import { accesible, expect, sinDesborde, test } from './ayuda';
import type { Page } from '@playwright/test';

// Cuentas nuevas (registro abierto), elección de rutina, secciones no habilitadas y el
// panel de administración. En el modo demo, la cuenta de siempre (demo@libreta.local, o
// cualquier email que no esté registrado) es la administradora.

const CLAVE = 'clave-larga-1';

async function salir(page: Page) {
  await page.goto('/ajustes');
  await page.getByRole('button', { name: 'Cerrar sesión' }).click();
  await expect(page).toHaveURL(/\/ingresar/);
}

async function registrar(page: Page, email: string, nombre = '') {
  await page.getByRole('button', { name: 'Creá una gratis' }).click();
  const form = page.getByRole('form', { name: 'Crear cuenta' });
  if (nombre) await form.getByLabel('Tu nombre (opcional)').fill(nombre);
  await form.getByLabel('Email').fill(email);
  await form.getByLabel('Contraseña', { exact: true }).fill(CLAVE);
  await form.getByLabel('Repetí la contraseña').fill(CLAVE);
  await form.getByRole('button', { name: 'Crear cuenta' }).click();
}

async function ingresar(page: Page, email: string, clave = CLAVE) {
  await page.getByLabel('Email').fill(email);
  await page.getByLabel('Contraseña').fill(clave);
  await page.getByRole('button', { name: 'Ingresar' }).click();
}

test('crear una cuenta, elegir rutina y entrenar con solo Rutina habilitada', async ({ page }) => {
  await salir(page);

  // Validaciones del registro.
  await page.getByRole('button', { name: 'Creá una gratis' }).click();
  const form = page.getByRole('form', { name: 'Crear cuenta' });
  await expect(form).toBeVisible();
  await accesible(page);
  await form.getByLabel('Email').fill('sofia@ejemplo.com');
  await form.getByLabel('Contraseña', { exact: true }).fill('corta');
  await form.getByLabel('Repetí la contraseña').fill('corta');
  await form.getByRole('button', { name: 'Crear cuenta' }).click();
  await expect(page.getByRole('alert')).toContainText('al menos 8 caracteres');
  await form.getByLabel('Contraseña', { exact: true }).fill(CLAVE);
  await form.getByLabel('Repetí la contraseña').fill('otra-clave-1');
  await form.getByRole('button', { name: 'Crear cuenta' }).click();
  await expect(page.getByRole('alert')).toContainText('Las contraseñas no coinciden');
  // El email de una cuenta que ya existe no se puede volver a registrar.
  await form.getByLabel('Email').fill('demo@libreta.local');
  await form.getByLabel('Repetí la contraseña').fill(CLAVE);
  await form.getByRole('button', { name: 'Crear cuenta' }).click();
  await expect(page.getByRole('alert')).toContainText('Ya hay una cuenta con ese email');
  await page.getByRole('button', { name: 'Ingresá' }).click();

  // La cuenta nueva empieza por elegir su rutina (aunque la sesión anterior haya salido desde Ajustes).
  await registrar(page, 'sofia@ejemplo.com', 'Sofía');
  await expect(page).toHaveURL(/\/rutina$/);
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Elegí tu rutina');

  // En Hoy: todavía sin rutina y con el resto de las secciones cerradas.
  await page.getByRole('link', { name: 'Hoy', exact: true }).click();
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Hola, Sofía');
  const nav = page.getByRole('navigation', { name: 'Principal' });
  await expect(nav.getByRole('link', { name: 'Rutina', exact: true })).toBeVisible();
  for (const s of ['Comidas', 'Progreso', 'Plan']) await expect(nav.getByRole('link', { name: `${s} (no habilitado)` })).toBeVisible();
  await expect(page.getByRole('region', { name: 'Comidas' })).toContainText('No habilitado');
  await expect(page.getByRole('link', { name: 'Administración' })).toHaveCount(0);
  await accesible(page);
  await sinDesborde(page);

  // Elegir la rutina según días y objetivo.
  await page.getByRole('link', { name: 'Elegir mi rutina' }).click();
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Elegí tu rutina');
  await page.getByRole('radio', { name: '3 días' }).check({ force: true });
  await page.getByRole('radio', { name: /Glúteos y piernas/ }).check({ force: true });
  const resultados = page.getByRole('region', { name: 'Rutinas para vos' });
  const primera = resultados.getByRole('article').first();
  await expect(primera.getByRole('heading', { level: 3 })).toHaveText('Glúteos y piernas · 3 días');
  await primera.getByText('Ver los 3 días').click();
  await expect(primera.getByText('Lunes: Glúteo A')).toBeVisible();
  await accesible(page);
  await sinDesborde(page);
  await primera.getByRole('button', { name: 'Elegir esta rutina' }).click();
  await expect(page.getByRole('status').filter({ hasText: 'Rutina elegida: Glúteos y piernas · 3 días' })).toBeVisible();
  await expect(page).toHaveURL(/\/rutina$/);
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Glúteos y piernas · 3 días');
  // Vuelve arriba aunque la dirección no cambie (la elección se hizo en /rutina).
  expect(await page.evaluate(() => window.scrollY)).toBe(0);
  await accesible(page);

  // Hoy (lunes) toca el primer día; se puede registrar una serie.
  await page.getByRole('link', { name: 'Hoy', exact: true }).click();
  await page.getByRole('link', { name: 'Empezar Glúteo A' }).click();
  await expect(page.getByRole('heading', { level: 1 })).toHaveText(/Glúteo A$/);
  const hip = page.getByRole('article', { name: /Hip thrust/ });
  await hip.getByRole('textbox', { name: /^Peso de la serie 1/ }).fill('40');
  await hip.getByRole('textbox', { name: /^Repeticiones de la serie 1/ }).fill('10');
  await hip.getByRole('button', { name: 'Marcar la serie 1 como hecha' }).click();
  await expect(hip.getByRole('button', { name: /Serie 1 hecha/ })).toHaveAttribute('aria-pressed', 'true');
  await page.getByRole('timer').getByRole('button', { name: 'Saltar' }).click();
  await accesible(page);

  // Las secciones cerradas muestran el aviso, también si se entra por la dirección.
  await page.goto('/comidas');
  await expect(page.getByRole('region', { name: 'Comidas no habilitado' })).toBeVisible();
  await accesible(page);
  await page.getByRole('link', { name: 'Ir a mi rutina' }).click();
  await expect(page).toHaveURL(/\/rutina$/);
  await page.goto('/progreso');
  await expect(page.getByRole('region', { name: 'Progreso no habilitado' })).toBeVisible();
  // El panel de administración no existe para esta cuenta.
  await page.goto('/admin');
  await expect(page.getByRole('heading', { level: 1 })).not.toHaveText('Cuentas');

  // Al volver a entrar sigue todo (y la contraseña se comprueba).
  await salir(page);
  await ingresar(page, 'sofia@ejemplo.com', 'otra-clave-1');
  await expect(page.getByRole('alert')).toContainText('no coinciden');
  await ingresar(page, 'sofia@ejemplo.com');
  await page.getByRole('link', { name: 'Hoy', exact: true }).click();
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Hola, Sofía');
  await expect(page.getByRole('region', { name: 'Entrenamiento' })).toContainText('1 de');
});

test('el admin habilita secciones a una cuenta y le llegan al instante', async ({ page }) => {
  await salir(page);
  await registrar(page, 'lucas@ejemplo.com');
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Elegí tu rutina');

  // Cambiar de rutina desde Rutina (con confirmación, porque ya tiene una al elegir otra).
  await page.getByRole('radio', { name: '4 días' }).check({ force: true });
  await page.getByRole('radio', { name: /Ganar fuerza/ }).check({ force: true });
  await page.getByRole('region', { name: 'Rutinas para vos' }).getByRole('button', { name: 'Elegir esta rutina' }).first().click();
  await expect(page).toHaveURL(/\/rutina$/);
  await page.getByRole('link', { name: 'Cambiar de rutina' }).click();
  await page.getByRole('radio', { name: '2 días' }).check({ force: true });
  const otra = page.getByRole('region', { name: 'Rutinas para vos' }).getByRole('article').first();
  const nombreOtra = (await otra.getByRole('heading', { level: 3 }).textContent())!;
  await otra.getByRole('button', { name: 'Elegir esta rutina' }).click();
  await otra
    .getByRole('group', { name: `Confirmar ${nombreOtra}` })
    .getByRole('button', { name: 'Confirmar' })
    .click();
  await expect(page.getByRole('heading', { level: 1 })).toHaveText(nombreOtra);

  // Entra la cuenta administradora.
  await salir(page);
  await ingresar(page, 'demo@libreta.local', 'cualquiera');
  await page.getByRole('banner').getByRole('link', { name: 'Administración' }).click();
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Cuentas');
  const fila = page.getByRole('listitem', { name: 'lucas@ejemplo.com' });
  await expect(fila.getByRole('switch', { name: 'Rutina' })).toBeChecked();
  await expect(fila.getByRole('switch', { name: 'Rutina' })).toBeDisabled();
  await expect(fila.getByRole('switch', { name: 'Comidas' })).not.toBeChecked();
  // La propia cuenta admin ve todo y no se puede cambiar.
  const propia = page.getByRole('listitem', { name: 'demo@libreta.local' });
  await expect(propia).toContainText('Admin');
  await expect(propia.getByRole('switch', { name: 'Comidas' })).toBeDisabled();
  await accesible(page);
  await sinDesborde(page);

  // Buscar y habilitar Comidas y Progreso.
  await page.getByLabel('Buscar por email o nombre').fill('lucas');
  await expect(page.getByText('1 de 2 cuentas')).toBeVisible();
  await fila.getByRole('switch', { name: 'Comidas' }).click({ force: true });
  await expect(page.getByRole('status').filter({ hasText: 'Comidas habilitado para lucas@ejemplo.com' })).toBeVisible();
  await fila.getByRole('switch', { name: 'Progreso' }).click({ force: true });
  await expect(fila.getByRole('switch', { name: 'Comidas' })).toBeChecked();
  await expect(fila.getByRole('switch', { name: 'Progreso' })).toBeChecked();
  await expect(fila.getByRole('switch', { name: 'Plan' })).not.toBeChecked();

  // La cuenta ahora ve Comidas y Progreso, pero no Plan.
  await salir(page);
  await ingresar(page, 'lucas@ejemplo.com');
  await page.getByRole('link', { name: 'Hoy', exact: true }).click();
  const nav = page.getByRole('navigation', { name: 'Principal' });
  await expect(nav.getByRole('link', { name: 'Comidas', exact: true })).toBeVisible();
  await expect(nav.getByRole('link', { name: 'Progreso', exact: true })).toBeVisible();
  await expect(nav.getByRole('link', { name: 'Plan (no habilitado)' })).toBeVisible();
  await expect(page.getByRole('region', { name: 'Comidas de hoy' })).toBeVisible();
  await page.getByRole('button', { name: /Vaso de agua · 0 L/ }).click();
  await expect(page.getByRole('button', { name: /Vaso de agua · 0,25 L/ })).toBeVisible();
  await page.goto('/progreso');
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Cómo vas');
  await accesible(page);
});
