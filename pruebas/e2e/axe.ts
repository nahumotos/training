import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import type { Page } from '@playwright/test';

const fuente = readFileSync(createRequire(import.meta.url).resolve('axe-core/axe.min.js'), 'utf8');

export interface Violacion {
  id: string;
  impact: string | null;
  help: string;
  nodes: { target: string[] }[];
}

/**
 * Corre axe-core en la página. Se inyecta con evaluate (no con una etiqueta
 * <script>) para no chocar con la política de seguridad de la app.
 */
export default class AxeBuilder {
  constructor(private page: Page) {}
  async analizar(): Promise<Violacion[]> {
    await this.page.evaluate(fuente);
    return this.page.evaluate(async () => {
      const axe = (window as unknown as { axe: { run: (c: Document, o: object) => Promise<{ violations: Violacion[] }> } }).axe;
      const r = await axe.run(document, { runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'best-practice'] } });
      return r.violations.map((v) => ({ id: v.id, impact: v.impact, help: v.help, nodes: v.nodes.map((n) => ({ target: n.target })) }));
    });
  }
}
