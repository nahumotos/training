import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

// Nombre visible de la app. Para cambiarlo, cambiá también src/config.ts e index.html.
const NOMBRE = 'Libreta';

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'prompt',
      injectRegister: false,
      includeAssets: ['favicon.svg', 'apple-touch-icon.png', 'robots.txt'],
      manifest: {
        name: `${NOMBRE} · Entrenamiento y comidas`,
        short_name: NOMBRE,
        description: 'Rutina del gimnasio, diario de comidas y seguimiento del plan.',
        lang: 'es-AR',
        start_url: '/',
        scope: '/',
        display: 'standalone',
        orientation: 'portrait',
        background_color: '#EDF0F2',
        theme_color: '#14181C',
        icons: [
          { src: '/icono-192.png', sizes: '192x192', type: 'image/png' },
          { src: '/icono-512.png', sizes: '512x512', type: 'image/png' },
          { src: '/icono-maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
      workbox: {
        // El esqueleto de la app y las miniaturas de ejercicios quedan disponibles sin señal.
        globPatterns: ['**/*.{js,css,html,svg,png,woff2}', 'ejercicios/chico/*.webp'],
        navigateFallback: '/index.html',
        navigateFallbackDenylist: [/^\/__\//],
        cleanupOutdatedCaches: true,
        runtimeCaching: [
          {
            // Las animaciones grandes se guardan la primera vez que se abren.
            urlPattern: ({ url }) => url.pathname.startsWith('/ejercicios/grande/'),
            handler: 'CacheFirst',
            options: {
              cacheName: 'ejercicios-grandes',
              expiration: { maxEntries: 80, maxAgeSeconds: 60 * 60 * 24 * 180 },
            },
          },
        ],
      },
    }),
  ],
  build: {
    target: 'es2022',
    // Mapas de código para depurar en local; no se publican (ver firebase.json → ignore).
    sourcemap: 'hidden',
    // El SDK de Firebase (Auth + Firestore con caché sin señal) pesa ~640 kB sin comprimir
    // (~190 kB gzip) y no se puede achicar sin perder el modo sin señal.
    chunkSizeWarningLimit: 700,
    rolldownOptions: {
      output: {
        // Firebase es la dependencia más pesada: va en su propio archivo para que el
        // navegador la guarde en caché aunque cambie el código de la app.
        manualChunks: (id) => (id.includes('node_modules/firebase') || id.includes('node_modules/@firebase') ? 'firebase' : undefined),
      },
    },
  },
});
