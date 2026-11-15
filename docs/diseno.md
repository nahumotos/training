# Sistema de diseño «Nativa»

Guía de referencia para mantener la coherencia visual. Los valores viven en
`src/estilos/tokens.css`; los patrones comunes, en `src/estilos/base.css`.

## Idea

La app tiene que sentirse como una del iPhone: fondo gris de sistema, tarjetas
blancas sin sombra, una sola letra y anillos de color para lo que se mide
(proteína y calorías, uno dentro del otro, como los de la app de actividad).
Todo lo demás es tranquilo y ordenado, para que se lea de un vistazo entre
series o mientras comés.

## Tema claro y oscuro

- Por defecto sigue al sistema. Se puede elegir a mano con el botón de luna o
  sol de la barra superior, o en Ajustes → Apariencia (Automático, Claro,
  Oscuro). La elección se guarda en el dispositivo (`localStorage`, clave
  `libreta-tema`), no en la cuenta.
- `public/tema.js` pone `data-tema="claro|oscuro"` en `<html>` antes de pintar,
  para que no parpadee; `src/estado/tema.ts` lo mantiene al día.
- Los colores del modo oscuro se definen en `:root[data-tema='oscuro']`.

## Color (siempre con el mismo significado)

| Token | Uso |
| --- | --- |
| `--rosa` | Proteína (anillos, barras), pestaña activa |
| `--acento` | Botón principal y series hechas (con texto blanco) |
| `--acento-texto` | Enlaces y textos rosas (contraste AA en los dos temas) |
| `--azul-vivo` | Calorías y agua (anillos, íconos) |
| `--azul` | Texto azul |
| `--amarillo` | Hidratos, notas de peso, calorías arriba del rango |
| `--blanco-disco` | Grasas |
| `--verde-vivo` / `--bien` | Objetivo cumplido (anillo y texto) |
| `--torso` / `--pierna` | Círculo de cada día de la rutina |

## Tipografía

Inter variable con tamaño óptico (peso 100–900). Una sola familia:

| Uso | Tamaño | Peso |
| --- | --- | --- |
| Título de pantalla | 34 px (28 en pantallas chicas) | 800 |
| Título de sección | 19 px | 700 |
| Texto | 16 px | 400–500 |
| Secundario | 13–14 px | 500 |
| Cifras destacadas (`.grabado`) | 20–40 px | 700, números de ancho parejo |

Sin mayúsculas sostenidas ni etiquetas espaciadas.

## Espacio y forma

- Escala de 4 px: 4, 8, 12, 16, 20, 24, 32, 40 (`--e-1` … `--e-8`).
- Radios: tarjeta 16 px, bloque interno 14 px, botón 12 px, control chico
  10 px, píldora 999 px.
- Tarjetas blancas (gris oscuro en modo oscuro) sobre el fondo, sin borde ni
  sombra. Sombra solo en lo que flota (descanso, hoja, avisos).
- Barra superior y barra de pestañas translúcidas, pegadas arriba y abajo.
  Desde 960 px las pestañas pasan a una barra lateral.

## Anillos (`src/componentes/Anillos.tsx`)

- Uno dentro del otro, el primero afuera. Pista del mismo color al 18 %.
- Se ponen verdes al llegar al objetivo y ámbar si se pasan del rango.
- Una muesca marca el mínimo recomendado de proteína.
- Chicos (34–36 px) para los indicadores de la semana y de Progreso.

## Movimiento

- Las pantallas entran con un fundido corto (220 ms). Entrar a un día de la
  rutina desliza la pantalla desde la derecha y volver la desliza hacia la
  derecha (`src/app/EnlaceDeslizante.tsx`), con las barras quietas.
- Los anillos se llenan al aparecer y, cuando cambia el valor, avanzan desde
  donde estaban. Las cifras de proteína y calorías cuentan hasta el valor
  nuevo (`src/componentes/Cifra.tsx`). Al llegar al objetivo el anillo brilla
  una vez.
- Marcar una serie: el círculo hace «pop» y suelta una onda.
- El descanso se vacía de forma continua y la barra late al terminar.
- Respuesta al tocar en botones, filas, tarjetas de día y pestañas.
- Todo se desactiva con «reducir movimiento».

## Pantallas anchas

Desde 1200 px, Hoy, Comidas y Progreso usan dos columnas; Rutina, Plan y
Ajustes se mantienen en una columna de lectura.
