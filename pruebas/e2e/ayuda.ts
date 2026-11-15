import AxeBuilder from './axe';
import { expect, test as base, type Page } from '@playwright/test';

/** Lunes de la semana 2 del plan (empieza el 9/11/2026): toca Torso A. */
export const AHORA = new Date('2026-11-16T10:00:00-03:00');

interface Extras {
  /** Errores de consola, de página y violaciones de la política de seguridad (CSP). */
  problemas: string[];
  /** Mensajes de consola esperables en una prueba (nunca se ignoran los de CSP). */
  ignorarConsola: RegExp | null;
  /** Otros sitios a los que la app puede hacer pedidos en una prueba. */
  externosPermitidos: string[];
}

/**
 * `page` con la fecha fija, y control de que no haya errores de consola, violaciones
 * de CSP ni pedidos a otros sitios (el modo demo no usa la red).
 */
export const test = base.extend<Extras>({
  ignorarConsola: [null, { option: true }],
  externosPermitidos: [[], { option: true }],
  // eslint-disable-next-line no-empty-pattern -- Playwright exige desestructurar los fixtures.
  problemas: async ({}, usar) => {
    await usar([]);
  },
  page: async ({ page, problemas, baseURL, ignorarConsola, externosPermitidos }, usar) => {
    await page.addInitScript(() => {
      document.addEventListener('securitypolicyviolation', (e) => {
        console.error(`CSP: ${e.violatedDirective} ${e.blockedURI} en ${e.sourceFile}:${e.lineNumber}:${e.columnNumber}`);
      });
    });
    page.on('console', (m) => {
      if (m.type() !== 'error') return;
      const t = m.text();
      if (ignorarConsola?.test(t) && !/Content Security Policy|^CSP:/.test(t)) return;
      problemas.push(`consola: ${t}`);
    });
    page.on('pageerror', (e) => problemas.push(`página: ${e.message}`));
    page.on('request', (r) => {
      const url = r.url();
      const propio = url.startsWith(baseURL!) || url.startsWith('blob:') || url.startsWith('data:');
      if (!propio && !externosPermitidos.some((x) => url.startsWith(x))) problemas.push(`pedido externo: ${url}`);
    });
    await page.clock.install({ time: AHORA });
    await page.clock.resume();
    await usar(page);
    expect(problemas, 'errores durante la prueba').toEqual([]);
  },
});

export { expect };

/** Ancho del contenido mayor que la pantalla = scroll horizontal no deseado. */
export async function sinDesborde(page: Page) {
  const r = await page.evaluate(() => ({ contenido: document.documentElement.scrollWidth, ventana: document.documentElement.clientWidth }));
  expect(r.contenido, 'scroll horizontal').toBeLessThanOrEqual(r.ventana);
}

/** Revisión automática de accesibilidad (axe-core): sin problemas graves ni críticos. */
export async function accesible(page: Page) {
  // Se revisa el estado final: se espera a que terminen las transiciones de entrada.
  await page.waitForFunction(() =>
    document.getAnimations().every((a) => a.playState !== 'running' || a.effect?.getTiming().iterations === Number.POSITIVE_INFINITY),
  );
  const r = await new AxeBuilder(page).analizar();
  const graves = r.filter((v) => v.impact === 'serious' || v.impact === 'critical');
  expect(graves.map((v) => `${v.id}: ${v.help} → ${v.nodes.map((n) => n.target.join(' ')).join(', ')}`)).toEqual([]);
}
