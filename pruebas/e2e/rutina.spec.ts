import { accesible, expect, test } from './ayuda';
import type { Page } from '@playwright/test';

const banca = (page: Page) => page.getByRole('article', { name: /Press de banca con barra/ });

test('registrar series: validación, descanso, arrastre de peso y persistencia', async ({ page }) => {
  await page.goto('/rutina/torso-a');
  const ej = banca(page);
  const peso = (n: number) => ej.getByRole('textbox', { name: `Peso de la serie ${n}, en kg por lado` });
  const reps = (n: number) => ej.getByRole('textbox', { name: new RegExp(`^Repeticiones de la serie ${n}`) });

  // Sin repeticiones (y sin una vez anterior) no se puede marcar.
  await ej.getByRole('button', { name: 'Marcar la serie 1 como hecha' }).click();
  await expect(ej.getByRole('alert')).toContainText('Anotá las repeticiones');
  await expect(reps(1)).toBeFocused();

  // Peso inválido.
  await peso(1).fill('abc');
  await reps(1).fill('10');
  await ej.getByRole('button', { name: 'Marcar la serie 1 como hecha' }).click();
  await expect(ej.getByRole('alert')).toContainText('Anotá el peso');

  // Serie válida: queda marcada y arranca el descanso.
  await peso(1).fill('7,5');
  await ej.getByRole('button', { name: 'Marcar la serie 1 como hecha' }).click();
  await expect(ej.getByRole('button', { name: /Serie 1 hecha/ })).toHaveAttribute('aria-pressed', 'true');
  await expect(ej.getByRole('alert')).toHaveCount(0);
  const temporizador = page.getByRole('timer');
  await expect(temporizador).toBeVisible();
  // Descanso del press de banca: 2–3 min → arranca en 2:30.
  const segundos = async () => Number((await temporizador.textContent())?.match(/Quedan (\d+) segundos/)?.[1]);
  const inicio = await segundos();
  expect(inicio).toBeGreaterThanOrEqual(148);
  expect(inicio).toBeLessThanOrEqual(150);
  await temporizador.getByRole('button', { name: 'Sumar 15 segundos' }).click();
  expect(await segundos()).toBeGreaterThanOrEqual(inicio + 12);
  await temporizador.getByRole('button', { name: 'Restar 15 segundos' }).click();
  await temporizador.getByRole('button', { name: 'Restar 15 segundos' }).click();
  expect(await segundos()).toBeLessThanOrEqual(inicio - 15);
  await accesible(page);
  await temporizador.getByRole('button', { name: 'Saltar' }).click();
  await expect(temporizador).toHaveCount(0);

  // Las series siguientes toman el peso de la marcada; la nota de peso se actualiza.
  await expect(peso(2)).toHaveValue('7,5');
  await expect(peso(3)).toHaveValue('7,5');
  await expect(ej.getByText('7,5 kg por lado')).toBeVisible();
  await expect(ej.getByText('total 35 kg')).toBeVisible();

  await reps(2).fill('9');
  await ej.getByRole('button', { name: 'Marcar la serie 2 como hecha' }).click();
  await page.getByRole('timer').getByRole('button', { name: 'Saltar' }).click();
  await expect(page.getByRole('progressbar', { name: 'Series hechas hoy' })).toHaveAttribute('aria-valuenow', '2');

  // Al recargar sigue todo.
  await page.reload();
  await expect(ej.getByRole('button', { name: /Serie 1 hecha/ })).toHaveAttribute('aria-pressed', 'true');
  await expect(ej.getByRole('button', { name: /Serie 2 hecha/ })).toHaveAttribute('aria-pressed', 'true');
  await expect(reps(1)).toHaveValue('10');
  await expect(reps(2)).toHaveValue('9');
  await expect(peso(3)).toHaveValue('7,5');

  // Corregir una serie ya hecha (al salir del campo) y que se guarde.
  await reps(1).fill('8');
  await reps(1).blur();
  await page.reload();
  await expect(reps(1)).toHaveValue('8');

  // Desmarcar: deja los valores escritos para volver a marcar.
  await ej.getByRole('button', { name: /Serie 2 hecha/ }).click();
  await expect(ej.getByRole('button', { name: 'Marcar la serie 2 como hecha' })).toHaveAttribute('aria-pressed', 'false');
  await expect(reps(2)).toHaveValue('9');
  await expect(page.getByRole('progressbar', { name: 'Series hechas hoy' })).toHaveAttribute('aria-valuenow', '1');

  // Terminar el entrenamiento.
  await page.getByRole('button', { name: 'Terminar entrenamiento' }).click();
  await expect(page).toHaveURL('/rutina');
  await expect(page.getByRole('status')).toContainText('Entrenamiento guardado: 1 de 21 series');
  await page.goto('/rutina/torso-a');
  await expect(page.getByRole('button', { name: 'Volver a la rutina' })).toBeVisible();

  // Hoy lo cuenta en la semana.
  await page.goto('/');
  await expect(page.getByRole('listitem').filter({ hasText: /^\d+\/\d+ entrenamientos$/ })).toHaveText('1/4 entrenamientos');
});

test('la semana siguiente propone el peso de la última vez y sugiere progresar', async ({ page }) => {
  await page.goto('/rutina/torso-a');
  const ej = banca(page);
  for (const n of [1, 2, 3]) {
    if (n === 1) await ej.getByRole('textbox', { name: 'Peso de la serie 1, en kg por lado' }).fill('10');
    await ej.getByRole('textbox', { name: new RegExp(`^Repeticiones de la serie ${n}`) }).fill('10');
    await ej.getByRole('button', { name: `Marcar la serie ${n} como hecha` }).click();
  }
  await expect(ej.getByRole('button', { name: /Serie 3 hecha/ })).toBeVisible();

  // Una semana después.
  await page.clock.setSystemTime(new Date('2026-11-23T10:00:00-03:00'));
  await page.reload();
  await expect(ej.getByText(/Última vez · /)).toBeVisible();
  await expect(ej.getByText('Subí 1,25 kg por lado').or(ej.getByText(/^Subí /))).toBeVisible();
  await expect(ej.getByRole('textbox', { name: 'Peso de la serie 1, en kg por lado' })).toHaveValue('10');
  // Con reps vacías se usan las de la vez anterior.
  await expect(ej.getByRole('textbox', { name: /^Repeticiones de la serie 1/ })).toHaveAttribute('placeholder', '10');
  await ej.getByRole('button', { name: 'Marcar la serie 1 como hecha' }).click();
  await expect(ej.getByRole('textbox', { name: /^Repeticiones de la serie 1/ })).toHaveValue('10');
  await ej.getByRole('button', { name: 'Técnica e historial' }).click();
  await expect(ej.getByText('Últimas veces')).toBeVisible();
});

test('editar el peso de trabajo y la nota de un ejercicio', async ({ page }) => {
  await page.goto('/rutina/torso-a');
  const ej = banca(page);
  await ej.getByRole('button', { name: 'Editar' }).click();
  await ej.getByLabel(/Peso de trabajo/).fill('diez');
  await ej.getByRole('button', { name: 'Guardar' }).click();
  await expect(ej.getByRole('alert')).toContainText('Escribí el peso con números');
  await ej.getByLabel(/Peso de trabajo/).fill('12,5');
  await ej.getByLabel('Nota').fill('Agarre en la marca');
  await ej.getByRole('button', { name: 'Guardar' }).click();
  await expect(ej.getByText('12,5 kg por lado')).toBeVisible();
  await expect(ej.getByText('Agarre en la marca')).toBeVisible();
  await expect(ej.getByRole('textbox', { name: 'Peso de la serie 1, en kg por lado' })).toHaveValue('12,5');
  await page.reload();
  await expect(ej.getByText('Agarre en la marca')).toBeVisible();
});

test('ver cómo se hace un ejercicio carga las imágenes', async ({ page }) => {
  await page.goto('/rutina/torso-a');
  const ej = banca(page);
  await ej.getByRole('button', { name: /^Ver cómo se hace/ }).click();
  await expect(ej.getByRole('button', { name: /^Ocultar cómo se hace/ })).toHaveAttribute('aria-expanded', 'true');
  const imagenes = ej.locator('figure img, [id$="-anim"] img');
  await expect(imagenes.first()).toBeVisible();
  // Las imágenes se cargan al quedar a la vista (carga diferida).
  await imagenes.first().scrollIntoViewIfNeeded();
  await expect
    .poll(() => imagenes.evaluateAll((els) => els.length > 0 && els.every((e) => (e as HTMLImageElement).complete && (e as HTMLImageElement).naturalWidth > 0)))
    .toBe(true);
});

test('la entrada en calor se abre y recuerda el estado', async ({ page }) => {
  await page.goto('/rutina/torso-a');
  const calor = page.locator('details', { hasText: 'Entrada en calor' });
  await calor.locator('summary').click();
  await expect(calor).toHaveAttribute('open', '');
  await page.reload();
  await expect(calor).toHaveAttribute('open', '');
});
