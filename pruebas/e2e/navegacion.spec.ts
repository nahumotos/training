import { accesible, expect, sinDesborde, test } from './ayuda';

const RUTAS = [
  { ruta: '/', titulo: /Lunes 16 de noviembre/ },
  { ruta: '/rutina', titulo: /Torso \/ Pierna/ },
  { ruta: '/rutina/torso-a', titulo: /Torso A/ },
  { ruta: '/rutina/pierna-b', titulo: /Pierna B/ },
  { ruta: '/comidas', titulo: /Lunes 16 de noviembre/ },
  { ruta: '/progreso', titulo: /Cómo vas/ },
  { ruta: '/plan', titulo: /.+/ },
  { ruta: '/ajustes', titulo: /Tu cuenta y tus objetivos/ },
];

test.describe('cada pantalla', () => {
  for (const { ruta, titulo } of RUTAS) {
    test(`${ruta}: carga, sin scroll horizontal y accesible`, async ({ page }) => {
      await page.goto(ruta);
      await expect(page.getByRole('heading', { level: 1 })).toHaveText(titulo);
      await expect(page).toHaveTitle(/Libreta/);
      await sinDesborde(page);
      await accesible(page);
    });
  }

  test('en tablet (768 px) tampoco hay scroll horizontal', async ({ page }) => {
    await page.setViewportSize({ width: 768, height: 1024 });
    for (const { ruta } of RUTAS) {
      await page.goto(ruta);
      await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
      await sinDesborde(page);
    }
  });

  test('en un teléfono chico (320 px) tampoco hay scroll horizontal', async ({ page }) => {
    await page.setViewportSize({ width: 320, height: 640 });
    for (const { ruta } of RUTAS) {
      await page.goto(ruta);
      await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
      await sinDesborde(page);
    }
  });
});

test('la navegación principal lleva a cada sección y marca la actual', async ({ page }) => {
  await page.goto('/');
  const nav = page.getByRole('navigation', { name: 'Principal' });
  for (const [enlace, url] of [
    ['Rutina', '/rutina'],
    ['Comidas', '/comidas'],
    ['Progreso', '/progreso'],
    ['Plan', '/plan'],
    ['Hoy', '/'],
  ] as const) {
    await nav.getByRole('link', { name: enlace }).click();
    await expect(page).toHaveURL(url);
    await expect(nav.getByRole('link', { name: enlace })).toHaveAttribute('aria-current', 'page');
  }
});

test('el enlace "Saltar al contenido" lleva el foco al contenido', async ({ page, isMobile }) => {
  test.skip(isMobile, 'Prueba de teclado: solo en escritorio');
  await page.goto('/');
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
  await page.keyboard.press('Tab');
  const saltar = page.getByRole('link', { name: 'Saltar al contenido' });
  await expect(saltar).toBeFocused();
  await page.keyboard.press('Enter');
  await expect(page.locator('#contenido')).toBeFocused();
});

test('una dirección que no existe muestra la página 404', async ({ page }) => {
  await page.goto('/no-existe');
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
  await expect(page.getByRole('link', { name: /Hoy|inicio/i }).first()).toBeVisible();
  await accesible(page);
});

test('el día de rutina inexistente no rompe la app', async ({ page }) => {
  await page.goto('/rutina/no-existe');
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
});

test('una fecha inválida o futura en Comidas no rompe la app', async ({ page }) => {
  await page.goto('/comidas/2026-99-99');
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
  await page.goto('/comidas/2030-01-01');
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
});
