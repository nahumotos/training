import { accesible, expect, test } from './ayuda';

test('cerrar sesión, validar el ingreso y volver a entrar', async ({ page }) => {
  await page.goto('/ajustes');
  await page.getByRole('button', { name: 'Cerrar sesión' }).click();
  await expect(page).toHaveURL(/\/ingresar/);
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Tu rutina, tus comidas y tu progreso, en un solo lugar');
  await accesible(page);

  // Las páginas privadas llevan al ingreso.
  await page.goto('/comidas');
  await expect(page).toHaveURL(/\/ingresar/);

  // Recuperar sin email.
  await page.getByRole('button', { name: 'Olvidé mi contraseña' }).click();
  await expect(page.getByRole('alert')).toContainText('Escribí tu email');

  // Datos incorrectos.
  await page.getByLabel('Email').fill('nahu@ejemplo.com');
  await page.getByLabel('Contraseña').fill('123');
  await page.getByRole('button', { name: 'Ingresar' }).click();
  await expect(page.getByRole('alert')).toContainText('El email o la contraseña no coinciden.');

  // Recuperar con email: mensaje neutro (no revela si la cuenta existe).
  await page.getByRole('button', { name: 'Olvidé mi contraseña' }).click();
  await expect(page.getByText(/Si el email tiene una cuenta/)).toBeVisible();

  await page.getByLabel('Contraseña').fill('una-clave-larga');
  await page.getByRole('button', { name: 'Ingresar' }).click();
  await expect(page.getByRole('heading', { level: 1 })).toHaveText(/Lunes 16 de noviembre/);

  // La sesión sigue al recargar.
  await page.reload();
  await expect(page.getByRole('heading', { level: 1 })).toHaveText(/Lunes 16 de noviembre/);
});

test('sin señal: la app abre desde la caché y guarda lo que se carga', async ({ page, context }) => {
  await page.goto('/');
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
  // Espera a que el service worker termine de instalarse (guarda la app en la caché).
  await expect.poll(() => page.evaluate(async () => (await navigator.serviceWorker.ready).active?.state)).toBe('activated');
  // Desde la próxima carga, el service worker atiende la página.
  await page.reload();
  expect(await page.evaluate(() => Boolean(navigator.serviceWorker.controller))).toBe(true);
  // Visitar una pantalla con imágenes antes de cortar la señal.
  await page.goto('/rutina/torso-a');
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible();

  await context.setOffline(true);
  await page.reload();
  await expect(page.getByRole('heading', { level: 1 })).toHaveText(/Torso A/);
  await expect(page.getByText(/Sin señal|sin conexión/i).first()).toBeVisible();

  // Navegar a otra pantalla (carga diferida) sin señal.
  await page.goto('/progreso');
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Cómo vas');
  await page.goto('/comidas');
  await page.getByRole('region', { name: 'El resto del día' }).getByRole('button', { name: 'Sumar un vaso de agua' }).click();

  // La IA avisa que necesita conexión.
  await page.getByRole('button', { name: /Agregar al almuerzo/ }).click();
  await page.getByRole('dialog').getByRole('tab', { name: 'Foto o texto' }).click();
  await page.getByRole('dialog').getByLabel('Contá qué comiste y cuánto').fill('fideos');
  await page.getByRole('dialog').getByRole('button', { name: 'Calcular' }).click();
  await expect(page.getByRole('dialog').getByRole('alert')).toContainText(/conexión/);
  await page.getByRole('dialog').getByRole('button', { name: 'Listo' }).click();

  await context.setOffline(false);
  await page.reload();
  await expect(page.getByRole('region', { name: 'El resto del día' }).getByRole('status')).toHaveText('0,25 L');
});
