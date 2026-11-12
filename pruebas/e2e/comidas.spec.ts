import { fileURLToPath } from 'node:url';
import { accesible, expect, test } from './ayuda';
import type { Page } from '@playwright/test';

const archivo = (n: string) => fileURLToPath(new URL(`./archivos/${n}`, import.meta.url));
const resumen = (page: Page) => page.getByRole('region', { name: 'Resumen del día' });

async function abrir(page: Page, comida: RegExp) {
  await page.getByRole('button', { name: comida }).click();
  const hoja = page.getByRole('dialog');
  await expect(hoja).toBeVisible();
  return hoja;
}

test('cargar desde la lista, cambiar la cantidad, quitar y deshacer', async ({ page }) => {
  await page.goto('/comidas');
  const hoja = await abrir(page, /Agregar al desayuno/);
  await accesible(page);
  await hoja.getByRole('searchbox', { name: 'Buscar alimento' }).fill('huevo');
  await expect(hoja.getByRole('listitem')).toHaveCount(2);
  await hoja.getByRole('button', { name: /^Huevo duro o revuelto/ }).click();
  await hoja.getByRole('button', { name: 'Sumar cantidad' }).click();
  await expect(hoja.getByRole('button', { name: 'Agregar · 9 g · 120 kcal' })).toBeVisible();
  await hoja.getByRole('button', { name: 'Sumar cantidad' }).click();
  await hoja.getByRole('button', { name: 'Agregar · 12 g · 160 kcal' }).click();
  await expect(page.getByRole('status').filter({ hasText: 'Agregado: Huevo duro o revuelto ×2' })).toBeVisible();

  // Una búsqueda sin resultados avisa.
  await hoja.getByRole('searchbox', { name: 'Buscar alimento' }).fill('zzzz');
  await expect(hoja.getByRole('listitem')).toHaveCount(0);
  await expect(hoja.getByText(/No lo encontré/)).toBeVisible();

  // Filtro por categoría.
  await hoja.getByRole('searchbox', { name: 'Buscar alimento' }).fill('');
  await hoja.getByRole('button', { name: 'Lácteos' }).click();
  await expect(hoja.getByRole('button', { name: 'Lácteos' })).toHaveAttribute('aria-pressed', 'true');
  await expect(hoja.getByRole('button', { name: /^Leche entera/ })).toBeVisible();
  await expect(hoja.getByRole('button', { name: /^Huevo frito/ })).toHaveCount(0);
  await hoja.getByRole('button', { name: /^Leche entera/ }).click();
  await hoja.getByRole('button', { name: /^Agregar · 8 g/ }).click();
  await hoja.getByRole('button', { name: 'Listo' }).click();
  await expect(hoja).toBeHidden();

  const desayuno = page.getByRole('region', { name: 'Desayuno' });
  await expect(desayuno.getByRole('button', { name: /Huevo duro o revuelto\s*×2/ })).toBeVisible();
  await expect(resumen(page)).toContainText('20 de 130 g');
  await expect(resumen(page)).toContainText('315 de 2.300–2.500 kcal');

  // Cambiar la cantidad desde el diario.
  await desayuno.getByRole('button', { name: /^Leche entera/ }).click();
  await desayuno.getByRole('button', { name: 'Restar cantidad' }).click();
  await expect(resumen(page)).toContainText('16 de 130 g');

  // Quitar y deshacer.
  await desayuno.getByRole('button', { name: 'Quitar Leche entera' }).click();
  await expect(desayuno.getByRole('button', { name: /^Leche entera/ })).toHaveCount(0);
  const aviso = page.getByRole('status').filter({ hasText: 'Quitado: Leche entera' });
  await aviso.getByRole('button', { name: 'Deshacer' }).click();
  await expect(desayuno.getByRole('button', { name: /^Leche entera\s*×0,5/ })).toBeVisible();

  await page.reload();
  await expect(desayuno.getByRole('button', { name: /^Leche entera/ })).toBeVisible();
  await expect(resumen(page)).toContainText('16 de 130 g');

  // Hoy refleja lo cargado.
  await page.goto('/');
  await expect(page.getByRole('region', { name: 'Comidas de hoy' })).toContainText('16 de 130 g');
  await expect(page.getByRole('link', { name: 'Cargar almuerzo' })).toBeVisible();
});

test('"Cargar almuerzo" desde Hoy abre la hoja de esa comida', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('link', { name: 'Cargar desayuno' }).click();
  await expect(page.getByRole('dialog', { name: 'Agregar al desayuno' })).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(page.getByRole('dialog')).toBeHidden();
  await expect(page).toHaveURL('/comidas');
});

test('carga manual con validación y "Mis alimentos"', async ({ page }) => {
  await page.goto('/comidas');
  const hoja = await abrir(page, /Agregar a la merienda/);
  await hoja.getByRole('tab', { name: 'Manual' }).click();
  await hoja.getByRole('button', { name: 'Agregar' }).click();
  // Sin datos: marca el primer campo con error, le pasa el foco y explica qué falta.
  await expect(hoja.getByLabel('Alimento', { exact: true })).toBeFocused();
  await expect(hoja.getByLabel('Alimento', { exact: true })).toHaveAttribute('aria-invalid', 'true');
  await expect(hoja.getByLabel('Alimento', { exact: true })).toHaveAccessibleDescription('Poné el nombre del alimento.');
  await accesible(page);

  await hoja.getByLabel('Alimento', { exact: true }).fill('Yogur proteico');
  await hoja.getByLabel('Porción').fill('1 pote (160 g)');
  await hoja.getByLabel('Proteína (g)').fill('15');
  await hoja.getByLabel('Calorías (kcal)').fill('-5');
  await hoja.getByRole('button', { name: 'Agregar' }).click();
  await expect(hoja.getByLabel('Calorías (kcal)')).toBeFocused();
  await expect(hoja.getByLabel('Calorías (kcal)')).toHaveAttribute('aria-invalid', 'true');
  await expect(hoja.getByLabel('Alimento', { exact: true })).toHaveAttribute('aria-invalid', 'false');

  // Sin calorías: se calculan con los macros.
  await hoja.getByLabel('Calorías (kcal)').fill('');
  await hoja.getByLabel('Hidratos (g)').fill('10,5');
  await hoja.getByLabel('Grasas (g)').fill('2');
  await hoja.getByRole('button', { name: 'Agregar' }).click();
  await hoja.getByRole('button', { name: 'Listo' }).click();

  const merienda = page.getByRole('region', { name: 'Merienda' });
  await expect(merienda.getByRole('button', { name: /^Yogur proteico/ })).toContainText('120 kcal');

  // Queda en Mis alimentos para la próxima.
  // La hoja recuerda la última forma de carga usada.
  const hoja2 = await abrir(page, /Agregar a la cena/);
  await expect(hoja2.getByRole('tab', { name: 'Manual' })).toHaveAttribute('aria-selected', 'true');
  await hoja2.getByRole('tab', { name: 'Lista' }).click();
  await hoja2.getByRole('button', { name: 'Mis alimentos' }).click();
  await expect(hoja2.getByRole('button', { name: /^Yogur proteico/ })).toBeVisible();
  // Y se puede borrar con confirmación.
  await hoja2.getByRole('button', { name: /^Yogur proteico/ }).click();
  await hoja2.getByRole('button', { name: 'Borrar' }).click();
  await hoja2.getByRole('button', { name: 'Sí, borrar' }).click();
  await expect(hoja2.getByRole('button', { name: /^Yogur proteico/ })).toHaveCount(0);
});

test('calcular con IA desde texto (simulada en modo demo) y editar antes de agregar', async ({ page }) => {
  await page.goto('/comidas');
  const hoja = await abrir(page, /Agregar al almuerzo/);
  await hoja.getByRole('tab', { name: 'Foto o texto' }).click();
  await hoja.getByRole('button', { name: 'Calcular' }).click();
  await expect(hoja.getByRole('alert')).toContainText('Sacá una foto o escribí qué comiste');

  await hoja.getByLabel('Contá qué comiste y cuánto').fill('2 milanesas de pollo al horno con puré');
  await hoja.getByRole('button', { name: 'Calcular' }).click();
  await expect(hoja.getByRole('button', { name: 'Calculando…' })).toBeDisabled();
  const tabla = hoja.getByRole('table');
  await expect(tabla).toBeVisible();
  await expect(hoja.getByRole('img', { name: /Proteína \d+ %/ })).toBeVisible();

  // Un valor inválido bloquea "Agregar todo".
  const prot = tabla.getByRole('textbox', { name: /^Proteína de / });
  await prot.fill('mucho');
  await expect(hoja.getByRole('button', { name: /^Agregar todo/ })).toBeDisabled();
  await prot.fill('40');
  await expect(hoja.getByRole('button', { name: /^Agregar todo · 40 g/ })).toBeEnabled();
  await accesible(page);
  await hoja.getByRole('button', { name: /^Agregar todo/ }).click();
  await hoja.getByRole('button', { name: 'Listo' }).click();
  await expect(resumen(page)).toContainText('40 de 130 g');
});

test('calcular con IA desde fotos: cada foto es un plato distinto y se suman', async ({ page }) => {
  await page.goto('/comidas');
  const hoja = await abrir(page, /Agregar a la cena/);
  await hoja.getByRole('tab', { name: 'Foto o texto' }).click();

  // Un archivo que no es imagen se rechaza con un aviso.
  await hoja.locator('input[type="file"]').setInputFiles(archivo('no-es-imagen.jpg'));
  await expect(hoja.getByRole('alert')).toContainText('No pude abrir una de las fotos');

  await hoja.locator('input[type="file"]').setInputFiles([archivo('plato-1.jpg'), archivo('plato-2.jpg')]);
  await expect(hoja.getByRole('img', { name: /^Foto \d de la comida$/ })).toHaveCount(2);
  await expect(hoja.getByText('Cada foto cuenta como un plato distinto, y se suman todos.')).toBeVisible();
  // Las fotos se achican antes de enviarlas (lado mayor 1280 px).
  const tamanos = await hoja.getByRole('img', { name: /^Foto \d de la comida$/ }).evaluateAll((els) => els.map((e) => Math.max((e as HTMLImageElement).naturalWidth, (e as HTMLImageElement).naturalHeight)));
  expect(tamanos).toEqual([1280, 1280]);

  await hoja.getByRole('button', { name: 'Quitar la foto 2' }).click();
  await expect(hoja.getByRole('img', { name: /^Foto \d de la comida$/ })).toHaveCount(1);
  await hoja.locator('input[type="file"]').setInputFiles(archivo('plato-2.jpg'));
  await hoja.getByRole('button', { name: 'Es frito' }).click();
  await expect(hoja.getByRole('button', { name: 'Es frito' })).toHaveAttribute('aria-pressed', 'true');

  await hoja.getByRole('button', { name: 'Calcular' }).click();
  await expect(hoja.getByRole('table')).toBeVisible();
  await expect(hoja.getByRole('table').getByRole('row')).toHaveCount(5); // encabezado + 2 platos × 2 alimentos
  await expect(hoja.getByText(/puede haber un error del 20 al 30/)).toBeVisible();
  await hoja.getByRole('button', { name: /^Sacar Papas hervidas en salsa \(plato 2\)/ }).click();
  await hoja.getByRole('button', { name: /^Agregar todo/ }).click();
  await hoja.getByRole('button', { name: 'Listo' }).click();
  const cena = page.getByRole('region', { name: 'Cena' });
  await expect(cena.getByRole('listitem')).toHaveCount(3);
  await expect(resumen(page)).toContainText('110 de 130 g');
});

test('cancelar un cálculo en curso', async ({ page }) => {
  await page.goto('/comidas');
  const hoja = await abrir(page, /Agregar al almuerzo/);
  await hoja.getByRole('tab', { name: 'Foto o texto' }).click();
  await hoja.getByLabel('Contá qué comiste y cuánto').fill('fideos con tuco');
  await hoja.getByRole('button', { name: 'Calcular' }).click();
  await hoja.getByRole('button', { name: 'Cancelar' }).click();
  await expect(hoja.getByRole('button', { name: 'Calcular' })).toBeEnabled();
  await page.waitForTimeout(600);
  await expect(hoja.getByRole('table')).toHaveCount(0);
});

test('copiar la comida de ayer y navegar entre días', async ({ page }) => {
  // Ayer: cargar el desayuno.
  await page.goto('/comidas');
  await page.getByRole('link', { name: 'Día anterior' }).click();
  await expect(page).toHaveURL('/comidas/2026-11-15');
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Domingo 15 de noviembre');
  const hoja = await abrir(page, /Agregar al desayuno/);
  await hoja.getByRole('searchbox').fill('café con leche');
  await hoja.getByRole('button', { name: /^Café con leche/ }).click();
  await hoja.getByRole('button', { name: /^Agregar ·/ }).click();
  await hoja.getByRole('button', { name: 'Listo' }).click();

  // Hoy: aparece "Copiar lo de ayer".
  await page.getByRole('link', { name: 'Día siguiente' }).click();
  await expect(page).toHaveURL('/comidas');
  const desayuno = page.getByRole('region', { name: 'Desayuno' });
  await desayuno.getByRole('button', { name: /^Copiar lo de ayer: Café con leche/ }).click();
  await expect(desayuno.getByRole('button', { name: /^Café con leche, sin azúcar/ })).toBeVisible();
  await expect(page.getByRole('link', { name: 'Día siguiente' })).toHaveCount(0);

  // Los recientes muestran lo cargado.
  const hoja2 = await abrir(page, /Agregar a la merienda/);
  await expect(hoja2.getByRole('button', { name: 'Recientes' })).toBeVisible();
});

test('el resto del día: agua, pasos, horarios, energía, peso y nota se guardan', async ({ page }) => {
  await page.goto('/comidas');
  const resto = page.getByRole('region', { name: 'El resto del día' });
  await resto.getByRole('button', { name: 'Sumar un vaso de agua' }).click();
  await resto.getByRole('button', { name: 'Sumar un vaso de agua' }).click();
  await expect(resto.getByRole('status')).toHaveText('0,5 L');
  await resto.getByLabel('Pasos').fill('8500');
  await resto.getByLabel('Te acostaste').fill('23:30');
  await resto.getByLabel('Te levantaste').fill('07:15');
  await resto.getByRole('button', { name: 'Energía 4 de 5' }).click();
  await expect(resto.getByRole('button', { name: 'Energía 4 de 5' })).toHaveAttribute('aria-pressed', 'true');
  await resto.getByLabel('Peso (kg)').fill('300');
  await resto.getByLabel('Peso (kg)').blur();
  await expect(resto.getByRole('alert')).toBeVisible();
  await resto.getByLabel('Peso (kg)').fill('78,4');
  await resto.getByLabel('Molestias').fill('hombro derecho, 2 de 10');
  await resto.getByLabel('Nota del día').fill('Buen día');
  await resto.getByLabel('Nota del día').blur();
  await expect(resto.getByRole('alert')).toHaveCount(0);

  await page.reload();
  await expect(resto.getByRole('status')).toHaveText('0,5 L');
  await expect(resto.getByLabel('Pasos')).toHaveValue('8500');
  await expect(resto.getByLabel('Te acostaste')).toHaveValue('23:30');
  await expect(resto.getByLabel('Te levantaste')).toHaveValue('07:15');
  await expect(resto.getByRole('button', { name: 'Energía 4 de 5' })).toHaveAttribute('aria-pressed', 'true');
  await expect(resto.getByLabel('Peso (kg)')).toHaveValue('78,4');
  await expect(resto.getByLabel('Molestias')).toHaveValue('hombro derecho, 2 de 10');
  await expect(resto.getByLabel('Nota del día')).toHaveValue('Buen día');

  // El vaso de agua de Hoy suma en el mismo día.
  await page.goto('/');
  await page.getByRole('button', { name: /Vaso de agua · 0,5 L/ }).click();
  await expect(page.getByRole('button', { name: /Vaso de agua · 0,75 L/ })).toBeVisible();
});
