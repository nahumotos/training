// Íconos de trazo, dibujados para esta app sobre una grilla de 24 px con trazo de 1,75 px
// y puntas redondeadas, todos del mismo estilo (sin rellenos). Heredan el color del texto.

const TRAZOS = {
  // Navegación
  hoy: (
    <>
      <rect x="3.5" y="5" width="17" height="15.5" rx="3" />
      <path d="M3.5 10h17M8 3v4M16 3v4M8 14.5h.01M12 14.5h.01M16 14.5h.01" />
    </>
  ),
  rutina: (
    <>
      <rect x="4.75" y="6.5" width="3.5" height="11" rx="1.25" />
      <rect x="15.75" y="6.5" width="3.5" height="11" rx="1.25" />
      <path d="M8.25 12h7.5M2.75 10v4M21.25 10v4" />
    </>
  ),
  comidas: (
    <>
      <circle cx="13" cy="12" r="5.75" />
      <circle cx="13" cy="12" r="2.75" />
      <path d="M3.5 4v4.25a1.25 1.25 0 0 0 2.5 0V4M4.75 4v16M21.5 4c-1.4.8-2.25 2.6-2.25 5.25 0 1.4.75 2 2.25 2V20" />
    </>
  ),
  progreso: <path d="M4 20h16M7 16v-4M12 16V6M17 16V9.5" />,
  plan: (
    <>
      <path d="M7 3h7l4 4v13a1 1 0 0 1-1 1H7a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1z" />
      <path d="M14 3v4h4M9.5 12h5M9.5 16h5" />
    </>
  ),
  ajustes: (
    <>
      <path d="M4 7h9M17 7h3M4 17h3M11 17h9" />
      <circle cx="15" cy="7" r="2" />
      <circle cx="9" cy="17" r="2" />
    </>
  ),

  // Acciones
  izquierda: <path d="m15 18-6-6 6-6" />,
  derecha: <path d="m9 18 6-6-6-6" />,
  abajo: <path d="m6 9 6 6 6-6" />,
  lapiz: (
    <>
      <path d="M4 20h4L19 9a2.1 2.1 0 0 0-4-4L4 16z" />
      <path d="m13.5 6.5 4 4" />
    </>
  ),
  camara: (
    <>
      <path d="M4 8.5A1.5 1.5 0 0 1 5.5 7h2l1.5-2h6l1.5 2h2A1.5 1.5 0 0 1 20 8.5v9a1.5 1.5 0 0 1-1.5 1.5h-13A1.5 1.5 0 0 1 4 17.5z" />
      <circle cx="12" cy="12.5" r="3.25" />
    </>
  ),
  check: <path d="m5 12.5 4.5 4.5L19 7.5" />,
  mas: <path d="M12 5v14M5 12h14" />,
  menos: <path d="M5 12h14" />,
  cerrar: <path d="M6 6l12 12M18 6 6 18" />,
  ampliar: <path d="M15 3h6v6M9 21H3v-6M21 3l-7 7M3 21l7-7" />,
  copiar: (
    <>
      <rect x="8" y="8" width="12" height="12" rx="2.5" />
      <path d="M16 8V5.5A1.5 1.5 0 0 0 14.5 4h-9A1.5 1.5 0 0 0 4 5.5v9A1.5 1.5 0 0 0 5.5 16H8" />
    </>
  ),
  descargar: <path d="M12 4v11M7 10l5 5 5-5M4 20h16" />,
  subir: <path d="M12 20V9M7 14l5-5 5 5M4 4h16" />,

  // Estado y datos
  sinSenal: (
    <>
      <path d="M2 8.5a15 15 0 0 1 20 0M5.5 12a10 10 0 0 1 13 0M9 15.5a5 5 0 0 1 6 0M12 19h.01M3 3l18 18" />
    </>
  ),
  persona: (
    <>
      <circle cx="12" cy="7.5" r="3.5" />
      <path d="M4.5 20c1-4 4-6 7.5-6s6.5 2 7.5 6" />
    </>
  ),
  series: <path d="M5 19v-3M10 19v-7M15 19v-10M20 19V5" />,
  fuego: <path d="M12 21c3.6 0 6-2.4 6-5.8 0-3.7-2.6-6.1-4.2-8.7-.4 1.9-1.3 3.1-2.6 3.8.3-2.7-.8-5.2-3.2-7.3.2 3-1.6 4.9-2.9 6.8A7.3 7.3 0 0 0 6 15.2C6 18.6 8.4 21 12 21z" />,
  gota: <path d="M12 3.5c3 3.6 6 7.1 6 10.6a6 6 0 0 1-12 0c0-3.5 3-7 6-10.6z" />,
  pasos: <path d="M9 13.5c-1.9 0-3-1.9-3-4.75S7.1 4 9 4s3 2.4 3 4.75-1.1 4.75-3 4.75zM15 20c-1.9 0-3-1.9-3-4.75s1.1-4.75 3-4.75 3 2.4 3 4.75S16.9 20 15 20z" />,
  luna: <path d="M19.5 14.5A7.75 7.75 0 1 1 9.5 4.5a6.25 6.25 0 0 0 10 10z" />,
  rayo: <path d="M13 3 5 13.5h6L10 21l8-10.5h-6z" />,
  balanza: (
    <>
      <rect x="4" y="4" width="16" height="16" rx="4" />
      <path d="M8.5 10a5 5 0 0 1 7 0M12 10l1.25-1.75" />
    </>
  ),
  reloj: (
    <>
      <circle cx="12" cy="13.5" r="7.25" />
      <path d="M12 10v3.5l2.25 1.75M9.5 3h5" />
    </>
  ),
  disco: (
    <>
      <circle cx="12" cy="12" r="8.5" />
      <circle cx="12" cy="12" r="2.5" />
    </>
  ),
  libro: (
    <>
      <path d="M4 5.5A1.5 1.5 0 0 1 5.5 4H11v16H5.5A1.5 1.5 0 0 1 4 18.5z" />
      <path d="M20 5.5A1.5 1.5 0 0 0 18.5 4H13v16h5.5a1.5 1.5 0 0 0 1.5-1.5z" />
    </>
  ),
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
      strokeWidth="1.75"
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
