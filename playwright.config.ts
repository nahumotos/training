import { defineConfig, devices } from '@playwright/test';

// Pruebas de punta a punta sobre la versión compilada en modo demo (datos en el
// navegador, IA simulada), servida con los mismos encabezados que Firebase Hosting.
//   npm run test:e2e
const PUERTO = 4173;
// Versión con Firebase y configuración falsa: los servidores de Google se simulan en la prueba.
const PUERTO_FIREBASE = 4174;
const SOLO_FIREBASE = /produccion\.spec\.ts/;

export default defineConfig({
  testDir: 'pruebas/e2e',
  outputDir: 'pruebas/e2e/resultados',
  fullyParallel: true,
  forbidOnly: Boolean(process.env.CI),
  retries: 0,
  reporter: [['list'], ['json', { outputFile: 'pruebas/e2e/resultados/informe.json' }]],
  use: {
    baseURL: `http://127.0.0.1:${PUERTO}`,
    locale: 'es-AR',
    timezoneId: 'America/Argentina/Buenos_Aires',
    // Sin traza por defecto: al grabarla, Playwright lee las vistas previas (blob:) desde la
    // página y eso choca con la CSP de la app (connect-src). Para depurar: --trace on.
    trace: 'off',
    screenshot: 'only-on-failure',
  },
  projects: [
    { name: 'movil', testIgnore: SOLO_FIREBASE, use: { ...devices['Pixel 7'], locale: 'es-AR', timezoneId: 'America/Argentina/Buenos_Aires' } },
    { name: 'escritorio', testIgnore: SOLO_FIREBASE, use: { viewport: { width: 1280, height: 800 } } },
    { name: 'firebase', testMatch: SOLO_FIREBASE, use: { ...devices['Pixel 7'], locale: 'es-AR', timezoneId: 'America/Argentina/Buenos_Aires', baseURL: `http://127.0.0.1:${PUERTO_FIREBASE}` } },
  ],
  webServer: [
    {
      command: `node pruebas/servidor.mjs dist-demo ${PUERTO}`,
      url: `http://127.0.0.1:${PUERTO}`,
      reuseExistingServer: !process.env.CI,
    },
    {
      command: `node pruebas/servidor.mjs dist-prueba ${PUERTO_FIREBASE}`,
      url: `http://127.0.0.1:${PUERTO_FIREBASE}`,
      reuseExistingServer: !process.env.CI,
    },
  ],
});
