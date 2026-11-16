import { readFile, writeFile } from 'node:fs/promises';
import { accesible, expect, test } from './ayuda';

test('cambiar los objetivos: validación, guardado y efecto en el diario', async ({ page }) => {
  await page.goto('/ajustes');
  const form = page.getByRole('form', { name: 'Objetivos diarios' });
  const proteina = form.getByRole('group', { name: 'Proteína (g por día)' });
  await proteina.getByLabel('Mínimo').fill('150');
  await form.getByRole('button', { name: 'Guardar objetivos' }).click();
  // El mínimo no puede superar al objetivo.
  await expect(form.getByRole('alert').or(form.locator('.error')).first()).toBeVisible();
  await expect(proteina.getByLabel('Mínimo')).toHaveAttribute('aria-invalid', 'true');
  await accesible(page);

  await proteina.getByLabel('Objetivo').fill('150');
  await proteina.getByLabel('Mínimo').fill('140');
  await proteina.getByLabel('Máximo').fill('160');
  await form.getByRole('button', { name: 'Guardar objetivos' }).click();
  await expect(page.getByRole('status').filter({ hasText: 'Objetivos guardados' })).toBeVisible();

  await page.goto('/comidas');
  await expect(page.getByRole('region', { name: 'Resumen del día' })).toContainText('0 de 150 g');
  await page.reload();
  await expect(page.getByRole('region', { name: 'Resumen del día' })).toContainText('0 de 150 g');

  // Volver a los del plan.
  await page.goto('/ajustes');
  await expect(proteina.getByLabel('Objetivo')).toHaveValue('150');
  await form.getByRole('button', { name: 'Volver a los del plan' }).click();
  await expect(proteina.getByLabel('Objetivo')).toHaveValue('130');
  await form.getByRole('button', { name: 'Guardar objetivos' }).click();
  await page.goto('/');
  await expect(page.getByRole('region', { name: 'Comidas de hoy' })).toContainText('0 de 130 g');
});

test('cambiar el inicio de la rutina mueve la semana del plan', async ({ page }) => {
  await page.goto('/ajustes');
  const form = page.getByRole('form', { name: 'Perfil y rutina' });
  // Datos no válidos: no se guardan y cada campo dice qué corregir.
  await form.getByLabel('Nombre').fill('21 313123 123');
  await form.getByLabel('Inicio de la rutina').fill('9999-12-01');
  await form.getByRole('button', { name: 'Guardar' }).click();
  await expect(form.getByLabel('Nombre')).toBeFocused();
  await expect(form.getByLabel('Nombre')).toHaveAccessibleDescription('El nombre va solo con letras y espacios, hasta 30 caracteres.');
  await expect(form.getByLabel('Inicio de la rutina')).toHaveAttribute('aria-invalid', 'true');
  await expect(form.getByLabel('Inicio de la rutina')).toHaveAccessibleDescription(/Elegí una fecha entre el 1\/1\/2020 y el 16\/11\/2027/);
  await expect(page.getByRole('status').filter({ hasText: 'Guardado' })).toHaveCount(0);
  await accesible(page);
  await form.getByLabel('Nombre').fill('Nahu');
  await form.getByLabel('Inicio de la rutina').fill('2026-11-16');
  await form.getByRole('button', { name: 'Guardar' }).click();
  await expect(page.getByRole('status').filter({ hasText: 'Guardado' })).toBeVisible();
  await page.goto('/');
  await expect(page.getByRole('region', { name: 'Entrenamiento' })).toContainText('Semana 1 del plan');
});

test('exportar e importar una copia de los datos', async ({ page, browser }, info) => {
  // Datos de ejemplo: una comida y una serie.
  await page.goto('/comidas');
  await page.getByRole('button', { name: /Agregar al almuerzo/ }).click();
  await page.getByRole('dialog').getByRole('searchbox').fill('pechuga');
  await page.getByRole('dialog').getByRole('button', { name: /^Pechuga de pollo/ }).click();
  await page.getByRole('dialog').getByRole('button', { name: /^Agregar ·/ }).click();
  await page.getByRole('dialog').getByRole('button', { name: 'Listo' }).click();
  await page.goto('/rutina/torso-a');
  const banca = page.getByRole('article', { name: /Press de banca con barra/ });
  await banca.getByRole('textbox', { name: /^Repeticiones de la serie 1/ }).fill('10');
  await banca.getByRole('button', { name: 'Marcar la serie 1 como hecha' }).click();
  await expect(banca.getByRole('button', { name: /Serie 1 hecha/ })).toBeVisible();

  // Exportar.
  await page.goto('/ajustes');
  const descarga = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Exportar copia' }).click();
  const archivo = await descarga;
  expect(archivo.suggestedFilename()).toBe('libreta-2026-11-16.libreta.json');
  const ruta = info.outputPath('copia.libreta.json');
  await archivo.saveAs(ruta);
  const copia = JSON.parse(await readFile(ruta, 'utf8'));
  expect(copia).toMatchObject({ formato: 'libreta', version: 1 });
  expect(copia.dias).toHaveLength(1);
  expect(copia.dias[0].comidas.almuerzo[0]).toMatchObject({ n: 'Pechuga de pollo', p: 31 });
  expect(copia.sesiones).toHaveLength(1);
  await expect(page.getByRole('status').filter({ hasText: 'Exportados 1 días y 1 entrenamientos' })).toBeVisible();

  // Importar en otro navegador (sin datos).
  const otro = await browser.newContext({ locale: 'es-AR', timezoneId: 'America/Argentina/Buenos_Aires' });
  const p2 = await otro.newPage();
  await p2.clock.install({ time: new Date('2026-11-16T10:00:00-03:00') });
  await p2.clock.resume();
  await p2.goto('/ajustes');
  const entrada = p2.getByLabel('Importar una copia');

  // Archivos inválidos: se rechazan con un mensaje claro.
  const roto = info.outputPath('roto.json');
  await writeFile(roto, '{esto no es json');
  await entrada.setInputFiles(roto);
  await expect(p2.getByText('El archivo no es un JSON válido.')).toBeVisible();
  const ajeno = info.outputPath('ajeno.json');
  await writeFile(ajeno, JSON.stringify({ hola: 'mundo' }));
  await entrada.setInputFiles(ajeno);
  await expect(p2.getByRole('group', { name: 'Confirmar importación' })).toHaveCount(0);

  await entrada.setInputFiles(ruta);
  const confirmar = p2.getByRole('group', { name: 'Confirmar importación' });
  await expect(confirmar).toContainText('1 días, 1 entrenamientos');
  await confirmar.getByRole('button', { name: 'Importar' }).click();
  await expect(p2.getByRole('status').filter({ hasText: 'Importados 1 días, 1 entrenamientos' })).toBeVisible();
  await p2.goto('/comidas');
  await expect(p2.getByRole('region', { name: 'Almuerzo' }).getByRole('button', { name: /^Pechuga de pollo/ })).toBeVisible();
  await p2.goto('/rutina/torso-a');
  await expect(p2.getByRole('article', { name: /Press de banca con barra/ }).getByRole('button', { name: /Serie 1 hecha/ })).toBeVisible();
  await otro.close();
});

test('progreso: resumen de la semana, gráficos y copiar para la revisión', async ({ page, context, browserName }) => {
  // Datos: una comida, una serie y un peso.
  await page.goto('/comidas');
  await page.getByRole('button', { name: /Agregar al desayuno/ }).click();
  await page.getByRole('dialog').getByRole('searchbox').fill('huevo duro');
  await page.getByRole('dialog').getByRole('button', { name: /^Huevo duro/ }).click();
  await page.getByRole('dialog').getByRole('button', { name: /^Agregar ·/ }).click();
  await page.getByRole('dialog').getByRole('button', { name: 'Listo' }).click();
  const resto = page.getByRole('region', { name: 'El resto del día' });
  await resto.getByLabel('Peso (kg)').fill('78');
  await resto.getByLabel('Peso (kg)').blur();
  await page.goto('/rutina/torso-a');
  const banca = page.getByRole('article', { name: /Press de banca con barra/ });
  await banca.getByRole('textbox', { name: /^Repeticiones de la serie 1/ }).fill('9');
  await banca.getByRole('button', { name: 'Marcar la serie 1 como hecha' }).click();
  await expect(banca.getByRole('button', { name: /Serie 1 hecha/ })).toBeVisible();

  await page.goto('/progreso');
  await expect(page.getByRole('heading', { level: 2, name: /Semana del 16 al 22 de noviembre/ })).toBeVisible();
  const kpis = page.getByRole('region', { name: 'Resumen de la semana' });
  await expect(kpis).toContainText('Entrenamientos');
  await expect(kpis).toContainText('1 de 4');
  await expect(page.getByRole('region', { name: 'Peso y cintura' }).getByRole('figure').first()).toBeVisible();
  await expect(page.getByRole('region', { name: 'Cargas por ejercicio' })).not.toContainText('Todavía no registraste');

  // Semana anterior y vuelta.
  await page.getByRole('button', { name: 'Semana anterior' }).click();
  await expect(page.getByRole('heading', { level: 2, name: /Semana del 9 al 15 de noviembre/ })).toBeVisible();
  await page.getByRole('button', { name: 'Semana siguiente' }).click();
  await expect(page.getByRole('button', { name: 'Semana siguiente' })).toBeDisabled();

  // "Qué te costó" se guarda solo y entra en el resumen.
  const nota = page.getByLabel('Qué te costó esta semana');
  await nota.fill('La merienda con proteína');
  await expect(page.getByLabel('Vista previa')).toHaveValue(/QUÉ ME COSTÓ: La merienda con proteína/);
  await page.waitForTimeout(900);
  await page.reload();
  await expect(nota).toHaveValue('La merienda con proteína');

  // El borrador de una semana no pasa a otra.
  await page.getByRole('button', { name: 'Semana anterior' }).click();
  await expect(page.getByLabel('Qué te costó esta semana')).toHaveValue('');
  await page.getByRole('button', { name: 'Semana siguiente' }).click();
  await expect(page.getByLabel('Qué te costó esta semana')).toHaveValue('La merienda con proteína');

  // Copiar.
  test.skip(browserName !== 'chromium', 'Permisos de portapapeles solo en Chromium');
  await context.grantPermissions(['clipboard-read', 'clipboard-write']);
  await page.getByRole('button', { name: 'Copiar resumen' }).click();
  await expect(page.getByRole('status').filter({ hasText: 'Resumen copiado' })).toBeVisible();
  const copiado = await page.evaluate(() => navigator.clipboard.readText());
  expect(copiado).toContain('Resumen semanal · Semana del 16 al 22 de noviembre');
  expect(copiado).toContain('Press de banca con barra: 5 kg por lado × 9');
  expect(copiado).toContain('QUÉ ME COSTÓ: La merienda con proteína');
});
