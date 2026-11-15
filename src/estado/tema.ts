import { useSyncExternalStore } from 'react';

/**
 * Tema claro u oscuro. Por defecto sigue al sistema; si se elige uno a mano, queda guardado
 * en este dispositivo (no viaja con la cuenta). public/tema.js aplica lo mismo antes de pintar
 * la página, para que no parpadee.
 */
export type PreferenciaTema = 'auto' | 'claro' | 'oscuro';
export type Tema = 'claro' | 'oscuro';

const CLAVE = 'libreta-tema';
/** Color de la barra del navegador y del sistema en cada tema (igual al fondo de la app). */
const COLOR_BARRA: Record<Tema, string> = { claro: '#f2f2f7', oscuro: '#000000' };

const consulta = typeof window !== 'undefined' && window.matchMedia ? window.matchMedia('(prefers-color-scheme: dark)') : null;

function leer(): PreferenciaTema {
  try {
    const v = localStorage.getItem(CLAVE);
    return v === 'claro' || v === 'oscuro' ? v : 'auto';
  } catch {
    return 'auto';
  }
}

const resolver = (p: PreferenciaTema): Tema => (p === 'auto' ? (consulta?.matches ? 'oscuro' : 'claro') : p);

let estado = { preferencia: leer(), tema: 'claro' as Tema };
const oyentes = new Set<() => void>();

function aplicar(preferencia: PreferenciaTema) {
  const tema = resolver(preferencia);
  if (typeof document !== 'undefined') {
    document.documentElement.dataset.tema = tema;
    for (const m of document.querySelectorAll('meta[name="theme-color"]')) m.setAttribute('content', COLOR_BARRA[tema]);
  }
  if (estado.preferencia !== preferencia || estado.tema !== tema) {
    estado = { preferencia, tema };
    for (const f of oyentes) f();
  }
}

aplicar(estado.preferencia);

// Si el sistema cambia de claro a oscuro (por ejemplo, de noche), se acompaña cuando está en automático.
consulta?.addEventListener('change', () => {
  if (estado.preferencia === 'auto') aplicar('auto');
});
// Otra pestaña abierta cambió el tema.
if (typeof window !== 'undefined') {
  window.addEventListener('storage', (e) => {
    if (e.key === CLAVE) aplicar(leer());
  });
}

export function elegirTema(preferencia: PreferenciaTema) {
  try {
    if (preferencia === 'auto') localStorage.removeItem(CLAVE);
    else localStorage.setItem(CLAVE, preferencia);
  } catch {
    // Sin almacenamiento (modo privado estricto): el cambio vale hasta cerrar la página.
  }
  aplicar(preferencia);
}

export function useTema() {
  return useSyncExternalStore(
    (f) => {
      oyentes.add(f);
      return () => {
        oyentes.delete(f);
      };
    },
    () => estado,
  );
}
