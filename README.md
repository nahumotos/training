# Libreta · Entrenamiento y comidas

Sitio web personal (instalable en el teléfono como app) para seguir el plan de entrenamiento y comidas:
registrar cada serie en el gimnasio, cargar lo que se come, ver el progreso semanal y armar el resumen
para la revisión con el coach. Funciona sin señal y sincroniza cuando vuelve la conexión.

Está pensado para una persona, pero cada cuenta tiene sus propios datos, así que se pueden sumar más
personas (ver «Sumar a otra persona»).

---

## Qué hace

| Pantalla | Para qué sirve |
| --- | --- |
| **Hoy** | Qué entrenamiento toca (con el comodín del sábado), proteína y calorías del día, próxima comida para cargar, vaso de agua con un toque y cómo viene la semana (entrenamientos, días con proteína, pasos, etapa de hábitos). |
| **Rutina** | Los 4 días de la Fase 1 con entrada en calor, superseries, animación de cada ejercicio (posición inicial y final), peso de trabajo y nota por ejercicio. Cada serie se marca al terminarla: queda guardada y arranca el descanso (con ±15 s, aviso sonoro y pantalla encendida). Propone el peso de la última vez y avisa cuándo subir (doble progresión). Historial por ejercicio. |
| **Comidas** | Diario por día con 5 comidas. Se carga desde una lista de ~50 alimentos argentinos (con buscador, categorías, recientes y «Mis alimentos»), a mano (calcula las calorías con los macros) o con **foto o texto analizados por IA** (cada foto es un plato distinto y se suman). Cantidades, quitar con «Deshacer», copiar lo de ayer. Además: agua, pasos, horarios de sueño, energía, peso, cintura, molestias y nota. |
| **Progreso** | Semana por semana: indicadores, proteína y calorías por día, mejores series por ejercicio, peso y cintura, y el **resumen para la revisión** («Copiar resumen» para pegar en el chat de coaching). |
| **Plan** | El plan completo (estrategia, reglas de progresión, hombro, nutrición, movimiento, hábitos, suplementos y seguimiento). |
| **Ajustes** | Nombre, inicio de la rutina, objetivos diarios (con validación), exportar e importar una copia de los datos, instrucciones para instalarla en el iPhone y cerrar sesión. |

---

## Diseño

La idea central es el **disco de pesas**, que en la mesa es el plato. La proteína del día se muestra
como un disco que se llena, con cifras anchas «grabadas». El descanso entre series es un disco que se
vacía, y marcar una serie «carga» el disco. Los colores salen del código de los discos de competición y
siempre significan lo mismo:

| Color | Disco | Significa |
| --- | --- | --- |
| Rojo | 25 kg | Proteína, acciones y series hechas |
| Azul | 20 kg | Calorías (y los días de pierna) |
| Amarillo | 15 kg | Hidratos y el peso de trabajo de cada ejercicio |
| Blanco | 5 kg | Grasas |
| Verde | 10 kg | Objetivo cumplido |

Tiene modo claro y oscuro (sigue al teléfono). Las variables de diseño están en `src/estilos/tokens.css`.

---

## Arquitectura

```
Teléfono / navegador ──► Firebase Hosting (sitio estático + service worker)
        │
        ├──► Firebase Auth (email y contraseña)
        ├──► Cloud Firestore (datos, con caché local para usar sin señal)
        └──► Cloudflare Worker «libreta-ia» ──► API de Claude (estimar comidas)
                    │
                    └── verifica la sesión leyendo permitidos/{uid} en Firestore con el token del usuario
```

- **Sitio estático** (React + TypeScript, compilado con Vite). No hay servidor propio: Firebase Hosting
  sirve los archivos con encabezados de seguridad y caché (`firebase.json`).
- **Datos**: en Firestore, en `users/{uid}/…`. Las reglas (`firestore.rules`) solo dejan entrar a
  cuentas que tengan un documento en `permitidos/{uid}` (lo creás vos a mano) y cada cuenta ve únicamente
  lo suyo. Firestore guarda una copia en el teléfono, así que todo funciona sin señal.
- **IA**: el plan gratuito de Firebase (Spark) no permite funciones de servidor, así que el puente a la
  API de Claude es un Worker gratuito de Cloudflare (carpeta `ia-worker/`). La clave de Anthropic vive
  solo ahí, como secreto.
- **Modo demo**: la misma app con los datos en el navegador y la IA simulada. Sirve para desarrollar y
  para las pruebas automáticas sin tocar Firebase.

### Modelo de datos (Firestore)

```
permitidos/{uid}                     ← cuentas habilitadas (solo se crean desde la consola)
users/{uid}                          ← perfil: nombre, inicio de la rutina, objetivos
users/{uid}/dias/{AAAA-MM-DD}        ← comidas, agua, pasos, sueño, energía, peso, cintura, molestias, nota
users/{uid}/sesiones/{fecha_día}     ← series hechas de cada entrenamiento
users/{uid}/notas/{ejercicio}        ← peso de trabajo y nota de cada ejercicio
users/{uid}/alimentos/{id}           ← «Mis alimentos»
users/{uid}/semanas/{lunes}          ← «Qué te costó» de cada semana
```

### Carpetas

```
src/
  app/          estructura general: rutas, marco (barra y navegación), estados de carga, aviso de versión nueva
  pantallas/    Hoy, Rutina, Comidas, Progreso, Plan, Ajustes, Ingreso…
  componentes/  piezas reutilizables: hoja inferior, gráficos, animación de ejercicios, íconos
  estado/       proveedores de sesión y datos, avisos, temporizador de descanso, hooks
  dominio/      lógica pura y probada: fechas, totales, progresión, resumen semanal, validación de datos
  datos/        la rutina de la Fase 1 y la lista de alimentos
  servicios/    almacenes (Firestore y demo), autenticación, cliente de IA
  estilos/      variables de diseño (claro y oscuro) y estilos base
public/         íconos, robots.txt e imágenes de ejercicios (chicas y grandes, WebP)
ia-worker/      Worker de Cloudflare para la IA (con sus propias pruebas)
pruebas/        servidor de prueba y pruebas de punta a punta (Playwright)
```

---

## Tecnologías

| Qué | Por qué |
| --- | --- |
| React 19 + TypeScript (estricto) | Interfaz con mucho estado (series, comidas, temporizador) y tipos para no romper datos. |
| Vite 8 | Compilación rápida y archivos optimizados. |
| React Router 7 | Direcciones reales por pantalla (`/rutina/torso-a`, `/comidas/2026-11-16`). |
| vite-plugin-pwa (Workbox) | Instalable y sin señal: la app, las fuentes y las miniaturas quedan guardadas en el teléfono. |
| Firebase Auth + Firestore + Hosting | Gratis en el plan Spark, sincroniza entre dispositivos y trae caché sin señal. |
| Cloudflare Workers | Servidor mínimo y gratuito (sin tarjeta) para guardar la clave de la IA. |
| API de Claude | Estimación de comidas: Haiku 5.5 para texto, Sonnet 5.5 para fotos. |
| Inter, tipografía variable (@fontsource-variable) | Una sola familia y un solo archivo, parecida a la letra del iPhone, con tamaño óptico para títulos y cifras. Se sirve desde el mismo sitio. |
| Vitest, Playwright, axe-core, ESLint | Pruebas de lógica, de punta a punta, de accesibilidad y revisión de código. |

No hay librerías de gráficos, de estado global ni de estilos: los gráficos son SVG propios y los estilos,
CSS Modules.

---

## Probarlo en tu computadora

Requisitos: Node.js 22 o más nuevo.

```bash
npm install
npm run dev:demo      # modo demo: datos en el navegador e IA simulada
```

Abrí la dirección que muestra (por defecto http://localhost:5173). Para usar tu Firebase en local,
creá `.env.local` (ver más abajo) y corré `npm run dev`.

| Comando | Qué hace |
| --- | --- |
| `npm run dev` / `npm run dev:demo` | Servidor de desarrollo (con Firebase / en modo demo). |
| `npm run build` | Compila el sitio para publicar (carpeta `dist/`). |
| `npm run check` | Revisión de código, tipos y pruebas de lógica. |
| `npm run test:e2e` | Compila el modo demo y la versión con Firebase y corre las pruebas de punta a punta. |

---

## Publicarlo (Firebase, plan gratuito)

1. **Proyecto**: entrá a <https://console.firebase.google.com>, «Crear un proyecto» (Analytics no hace falta).
2. **Ingreso**: *Authentication → Comenzar → Correo electrónico/contraseña → Habilitar*.
   En *Users → Agregar usuario* creá tu cuenta (email y contraseña). Copiá el **UID** que aparece.
3. **Base de datos**: *Firestore Database → Crear base de datos → modo producción*. Ubicación sugerida:
   `southamerica-east1` (San Pablo, la más cercana). **La ubicación no se puede cambiar después.**
4. **Habilitar tu cuenta**: en *Firestore → Datos → Iniciar colección*, ID de colección `permitidos`,
   ID del documento = tu **UID**, y un campo cualquiera (por ejemplo `nombre`: `Nahu`).
5. **Datos de la app web**: *Configuración del proyecto → Tus apps → Web (`</>`)*, registrala como
   «Libreta» y copiá los valores a un archivo `.env.local` en la raíz (podés partir de `.env.ejemplo`):

   ```
   VITE_FIREBASE_API_KEY=...
   VITE_FIREBASE_AUTH_DOMAIN=TU-PROYECTO.firebaseapp.com
   VITE_FIREBASE_PROJECT_ID=TU-PROYECTO
   VITE_FIREBASE_APP_ID=...
   VITE_IA_URL=          # se completa en el paso de la IA (opcional)
   ```

   Estos valores identifican el proyecto y no son secretos: la protección está en las reglas.
6. **Publicar**:

   ```bash
   npm install -g firebase-tools
   firebase login
   cp .firebaserc.ejemplo .firebaserc     # y poné el ID de tu proyecto
   npm run build
   firebase deploy --only hosting,firestore
   ```

   El sitio queda en `https://TU-PROYECTO.web.app`. `firestore` publica también las reglas.
7. Entrá con tu email y contraseña. Arrancás con todo vacío; en *Ajustes* podés poner tu nombre y
   revisar los objetivos.

### Recomendado

- *Authentication → Configuración*: si tu proyecto muestra la opción para desactivar que se creen cuentas
  desde la app, desactivala. Aunque no lo hagas, una cuenta nueva no puede leer ni guardar nada si no
  está en `permitidos`.
- Comprobá las reglas en *Firestore → Reglas → Zona de pruebas*: un `get` a `users/TU-UID/dias/2026-11-16`
  autenticado con tu UID debe permitirse; con otro UID, o a `permitidos/OTRO-UID`, debe negarse.

### Sumar a otra persona

Creá su usuario en *Authentication* y un documento `permitidos/{su UID}`. Sus datos quedan separados de
los tuyos. Si cambia la rutina para esa persona, hoy la rutina está en el código (`src/datos/rutinaFase1.ts`).

---

## Cálculo de comidas con IA (opcional)

Sin esto la app funciona igual; solo no aparece la pestaña «Foto o texto».

1. **Clave de Anthropic**: en <https://platform.claude.com>, creá una API key. La API se paga por uso
   con crédito precargado: **esto sí requiere un medio de pago en Anthropic**. Poné un límite de gasto
   mensual en la consola.
2. **Cloudflare** (gratis, sin tarjeta): creá una cuenta en <https://dash.cloudflare.com>.
3. **Worker**:

   ```bash
   cd ia-worker
   npm install
   npx wrangler login
   # Editá wrangler.toml: FIREBASE_PROYECTO y ORIGENES (las direcciones de tu sitio).
   npx wrangler secret put ANTHROPIC_API_KEY     # pegá la clave
   npm run deploy
   ```

   Te devuelve una dirección como `https://libreta-ia.TU-SUBDOMINIO.workers.dev`.
4. Poné esa dirección en `VITE_IA_URL` de `.env.local`, y volvé a compilar y publicar
   (`npm run build && firebase deploy --only hosting`).
5. *Opcional, límite diario por persona*: `npx wrangler kv namespace create LIMITES`, pegá el id en
   `wrangler.toml` (sección comentada) y `npm run deploy`. Por defecto, 40 cálculos por día.

**Costo aproximado** (precios de la API a noviembre de 2026: Sonnet 5.5 USD 2 / 10 y Haiku 5.5
USD 0,10 / 0,50 por millón de tokens de entrada / salida): una comida con una foto ronda
**USD 0,01**; con texto, menos de USD 0,001. Cuatro comidas por día con foto: alrededor de
**USD 1 por mes**.

Si la CSP bloquea al Worker porque usás un dominio propio en vez de `workers.dev`, agregalo a
`connect-src` en `firebase.json`.

---

## Pruebas

```bash
npm run check                 # ESLint + TypeScript + 26 pruebas de lógica (Vitest)
npm run test:e2e              # 71 pruebas de punta a punta (Playwright, Chromium; 1 es de teclado y solo corre en escritorio)
cd ia-worker && npm run check # tipos + 24 pruebas del Worker + empaquetado de prueba de Wrangler
```

Las pruebas de punta a punta corren sobre el sitio compilado, servido con los mismos encabezados que
Firebase Hosting (incluida la CSP), en tamaño de teléfono y de escritorio, con la fecha fija en el lunes
16/11/2026. Fallan ante cualquier error de consola, violación de la CSP o pedido a otro sitio. Cubren:

- cada pantalla: carga, sin scroll horizontal (320, 390, 768 y 1280 px) y accesibilidad con axe-core,
  en modo claro y oscuro;
- rutina: validaciones, marcar y corregir series, descanso, arrastre de peso, recarga, semana siguiente,
  notas, animaciones y entrada en calor;
- comidas: lista, cantidades, quitar y deshacer, manual con validación, «Mis alimentos», IA por texto y
  por fotos (simulada), cancelar, copiar de ayer y el resto del día;
- objetivos, inicio de la rutina, exportar e importar (incluidos archivos inválidos), progreso y copiar
  el resumen;
- ingreso y salida, y uso **sin señal** con el service worker;
- la **versión con Firebase**: el SDK real dentro de la app compilada, con los servidores de Google y el
  Worker simulados en la red (ingreso, errores en castellano, guardado en la caché local de Firestore,
  pedidos al Worker con el token y sus errores).

---

## Seguridad

- Solo entran las cuentas en `permitidos`; cada una ve solo sus datos (`firestore.rules`).
- El Worker exige la sesión de Firebase, comprueba el permiso en Firestore con ese token, acepta solo
  los orígenes configurados, limita tamaño y cantidad de fotos y no guarda nada.
- La clave de la IA nunca llega al navegador.
- CSP estricta (solo scripts y estilos propios), `X-Frame-Options`, `nosniff`, `Referrer-Policy`,
  `Permissions-Policy`.
- Todo lo que entra de afuera (Firestore, archivos importados, respuestas de la IA) se valida y se acota.
- El sitio no se indexa en buscadores (`noindex` y `robots.txt`).
- Antes de cargar lo guardado, la app no deja editar (así un toque apurado no pisa los datos de otro
  dispositivo).

---

## Limitaciones conocidas

- **No se probó contra los servicios reales**: Firebase, Cloudflare y la API de Claude no son accesibles
  desde el entorno donde se desarrolló. Lo que sí se probó: el SDK de Firebase dentro de la app con los
  servidores simulados, el Worker en el runtime local de Cloudflare (`wrangler dev`) hasta la consulta a
  Firestore, y su lógica con pruebas. La primera vez que lo publiques, verificá ingreso, guardado y la IA.
- Las **reglas de Firestore** no se pudieron correr en el emulador: comprobalas en la Zona de pruebas.
- `npm audit` marca avisos moderados en herramientas de desarrollo (Workbox y dependencias de compilación);
  no llegan al sitio publicado (`npm audit --omit=dev`: 0).
- La rutina está en el código: para la Fase 2 hay que editar `src/datos/rutinaFase1.ts` (o pedírmelo).
- La integración con Apple Salud quedó afuera, como acordamos.

---

Fotos de los ejercicios: [Free Exercise DB](https://github.com/yuhonas/free-exercise-db) (dominio
público). Tipografía Archivo (SIL Open Font License).
