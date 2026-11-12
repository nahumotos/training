// Íconos de trazo, dibujados para esta app. Heredan el color del texto.

const TRAZOS = {
  hoy: <><rect x="3.5" y="5" width="17" height="15" rx="2" /><path d="M3.5 10h17M8 3v4M16 3v4" /><circle cx="12" cy="15" r="1.6" fill="currentColor" stroke="none" /></>,
  rutina: <><path d="M2.5 12h19" /><rect x="5" y="6.5" width="2.6" height="11" rx="1" fill="currentColor" /><rect x="16.4" y="6.5" width="2.6" height="11" rx="1" fill="currentColor" /><path d="M8.6 9.5v5M15.4 9.5v5" /></>,
  comidas: <><circle cx="12" cy="13" r="6.5" /><circle cx="12" cy="13" r="3" /><path d="M3 4v5a2 2 0 0 0 2 2v9M21 4c-1.5 1-2 3-2 5s1 2 2 2v9" /></>,
  progreso: <><path d="M4 20V10M10 20V4M16 20v-7M22 20H2" /></>,
  plan: <><path d="M6 3h9l4 4v14H6z" /><path d="M14 3v5h5M9 12h7M9 16h7" /></>,
  ajustes: <><circle cx="12" cy="12" r="3" /><path d="M12 2v3M12 19v3M4.2 4.2l2.1 2.1M17.7 17.7l2.1 2.1M2 12h3M19 12h3M4.2 19.8l2.1-2.1M17.7 6.3l2.1-2.1" /></>,
  izquierda: <path d="m15 18-6-6 6-6" />,
  derecha: <path d="m9 18 6-6-6-6" />,
  abajo: <path d="m6 9 6 6 6-6" />,
  lapiz: <><path d="M4 20h4L19 9l-4-4L4 16v4z" /><path d="m13.5 6.5 4 4" /></>,
  camara: <><path d="M4 8h3l2-3h6l2 3h3v11H4z" /><circle cx="12" cy="13" r="3.5" /></>,
  check: <path d="m5 12.5 4.5 4.5L19 7.5" />,
  mas: <path d="M12 5v14M5 12h14" />,
  menos: <path d="M5 12h14" />,
  cerrar: <path d="M6 6l12 12M18 6 6 18" />,
  sinSenal: <><path d="M2 8.5a15 15 0 0 1 20 0M5.5 12a10 10 0 0 1 13 0M9 15.5a5 5 0 0 1 6 0" /><circle cx="12" cy="19" r="1" fill="currentColor" /><path d="M3 3l18 18" /></>,
  ampliar: <path d="M15 3h6v6M9 21H3v-6M21 3l-7 7M3 21l7-7" />,
  copiar: <><rect x="8" y="8" width="12" height="12" rx="2" /><path d="M16 8V5a1 1 0 0 0-1-1H5a1 1 0 0 0-1 1v10a1 1 0 0 0 1 1h3" /></>,
  descargar: <><path d="M12 4v11M7 10l5 5 5-5" /><path d="M4 20h16" /></>,
  subir: <><path d="M12 20V9M7 14l5-5 5 5" /><path d="M4 4h16" /></>,
  persona: <><circle cx="12" cy="7" r="3.5" /><path d="M4.5 20c1-4 4-6 7.5-6s6.5 2 7.5 6" /></>,
  series: <path d="M5 19v-3M10 19v-7M15 19v-10M20 19V5" />,
} as const;

export type NombreIcono = keyof typeof TRAZOS;

export function Icono({ nombre, tam = 22, titulo }: { nombre: NombreIcono; tam?: number; titulo?: string }) {
  return (
    <svg
      width={tam}
      height={tam}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden={titulo ? undefined : true}
      role={titulo ? 'img' : undefined}
      focusable="false"
    >
      {titulo && <title>{titulo}</title>}
      {TRAZOS[nombre]}
    </svg>
  );
}
