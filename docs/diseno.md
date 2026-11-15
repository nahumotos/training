# Sistema de diseño «Disco» (v2)

Guía de referencia para mantener la coherencia visual. Los valores viven en
`src/estilos/tokens.css`; los patrones comunes, en `src/estilos/base.css`.

## Idea

El disco de pesas, que en la mesa es el plato, es el elemento propio de la app:
la proteína es un disco que se llena, el descanso un disco que se vacía y marcar
una serie «carga» el disco. Todo lo demás es tranquilo y ordenado, para que se
lea de un vistazo entre series o mientras comés.

Referencias revisadas: Hevy (registro de series en tarjetas, descanso flotante,
hojas inferiores), MacroFactor (panel diario con tendencias y registro de comidas
por momentos del día) y guías de UX para apps de fitness (controles grandes,
acciones en rojo/naranja y progreso en azul/verde, modo oscuro).

## Color (siempre con el mismo significado)

| Token | Disco | Uso |
| --- | --- | --- |
| `--rojo` / `--acento` | 25 kg | Proteína, acción principal, series hechas |
| `--azul` | 20 kg | Calorías, días de pierna |
| `--amarillo` | 15 kg | Hidratos, peso de trabajo (notas) |
| `--blanco-disco` | 5 kg | Grasas |
| `--verde` / `--bien` | 10 kg | Objetivo cumplido |

Texto rojo sobre fondo rojo suave: `--acento-texto` (contraste AA).

## Tipografía

Archivo variable (peso 100–900, ancho 62–125 %). Una sola familia:

| Uso | Tamaño | Peso | Ancho |
| --- | --- | --- | --- |
| Título de pantalla | 30–34 px | 750 | 112 % |
| Título de sección | 18 px | 700 | 100 % |
| Texto | 16 px | 400–500 | 100 % |
| Secundario | 13–14 px | 500 | 100 % |
| Cifras «grabadas» | 20–44 px | 800 | 125 % |

Sin mayúsculas sostenidas ni etiquetas espaciadas.

## Espacio y forma

- Escala de 4 px: 4, 8, 12, 16, 20, 24, 32, 40 (`--e-1` … `--e-8`).
- Radios por jerarquía: panel 22 px, bloque interno 16 px, control 12–14 px,
  píldora 999 px.
- Paneles blancos sobre gris con un filete apenas visible; sombra solo en lo
  que flota (barra de pestañas, descanso, hoja, avisos).

## Movimiento

- Una entrada suave por pantalla (220 ms), respuesta al toque en todos los
  botones (escala 0,98) y la hoja que sube. Nada se mueve solo, salvo el disco
  al llenarse.
- Todo se desactiva con «reducir movimiento».

## Pantallas anchas

Desde 1200 px, Hoy, Comidas y Progreso usan dos columnas; Rutina, Plan y
Ajustes se mantienen en una columna de lectura.
