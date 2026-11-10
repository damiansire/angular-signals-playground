# AGENTS.md — Angular Signals (Interactive Introduction)

Guía para agentes (y humanos) que contribuyen a este repo. Es un proyecto
educativo de **Angular 22**: una sola app standalone, signal-first, `OnPush` en
todos lados, estilada con Tailwind. No es una librería ni un monorepo.

## Cómo trabajar

- Cambios chicos y acotados, que se lean como diffs — no reescrituras masivas.
- **Tests antes que UI**: la lógica de dominio (parsers, helpers, transformación
  de datos en `libs/`) se valida como **función pura sobre fixtures**, sin
  `TestBed` ni navegador. La pantalla se prueba aparte.
- Si tocás lógica de dominio, dejá un test que la cubra.
- Antes de dar por terminado un cambio de código, corré lo mismo que CI, sin
  errores ni warnings nuevos (`npm test` a secas queda esperando en modo watch):

  ```bash
  npm run lint && npm run format:check && npm run gate:prosa && npm run test:scripts && npm test -- --watch=false --browsers=ChromeHeadless && npm run build
  ```

  Si un paso falla en CI, el PR no mergea y el deploy a Pages tampoco ocurre:
  `deploy.yml` escucha el resultado de CI, no el push.

- **`gate:prosa` es un ratchet de palabras por pantalla:** explica la demo, no el
  párrafo. Una pantalla puede quedar más corta, nunca más larga: si el gate falla
  porque sumaste texto, recortá. `--update` solo baja la línea base, y
  `--rebaseline` es únicamente para cuando cambia la definición de la métrica.
- Usá siempre sintaxis Angular moderna: `inject()`, control flow (`@if`/`@for`),
  APIs de signals (`signal`/`computed`/`effect`/`input`/`output`/`model`),
  componentes standalone. Nada de `NgModule`.

## Verificación visual

La vista integrada anima con rAF, y eso cuelga a algunas herramientas de captura.
Esto es lo que funciona:

- **Capturá con la pestaña visible.** Con la pestaña oculta el navegador pausa
  el rAF, y un screenshot que espera un cuadro nuevo se queda esperando.
  Cualquier navegador real manejado por CDP sirve (Puppeteer o Playwright,
  incluso en headless).
- **Dev server:** `npm start`, en `http://localhost:4200`. Antes de afirmar que
  corre, chequeá que responda: se cae sin avisar. Y un error de compilación
  transitorio corta el HMR de la pestaña aunque el server se recupere: si "no
  se ven los cambios", primero verificá server y bundle, no el código.
- **Falso bug conocido:** una pestaña en segundo plano pausa `rAF` y
  `scroll-behavior: smooth`. Un "bug de navegación o de scroll" que solo pasa
  con la pestaña oculta no es un bug: verificá con la pestaña visible antes de
  depurar.
- **Cierre de cambio visual = dos chequeos separados y obligatorios:**
  (1) ¿renderiza sin error? y (2) ¿se ve bien compuesto? El segundo exige una
  captura real MIRADA, nunca solo mediciones de DOM. Para colisiones o
  superposición, además de mirar: medí el overlap con
  `getBoundingClientRect()` contra TODOS los vecinos (título, contador, dots,
  órbita), no contra uno solo.
- **Gate de diseño:** todo cambio que toque el motor visual (`molecule-engine`,
  CSS de `integrada-vista/`) cierra con una pasada completa contra
  `DESIGN-CHECKLIST.md`, todos los ítems, ANTES de declararlo bueno. Que quien
  lo hizo diga "quedó bien" no es veredicto.
- **NO verifiques la navegación con eventos SINTÉTICOS.** `btn.click()` y
  `dispatchEvent(new MouseEvent/KeyboardEvent)` disparan el handler pero
  `goToUnit` no avanza, y las mediciones carrean con las animaciones de scroll:
  dan falsos negativos ("el índice no navega") y dejan la instancia en un
  estado inconsistente. Con **input real** (un click de puntero o una rueda por
  CDP) anda a la primera. Clickeá por selector y no por coordenadas de un
  screenshot escalado.
- **Capturá la pantalla entera y recortá después.** Una captura con `clip`
  justo después de un click hace saltar el recorrido al sub-nivel siguiente
  (el `captureBeyondViewport` agranda la página un instante). Y no edites el
  código mientras un barrido mide contra el dev server: un error de compilación
  a mitad de camino pone su overlay oscuro encima y contamina las capturas.
- **Al terminar una revisión, actualizá `DESIGN-CHECKLIST.md`** con cada defecto
  detectado Y resuelto: es la regla del propio archivo, y es lo que evita que
  la familia de defectos vuelva.

## Antes de construir features visuales grandes

- **Alcance primero:** ante "integrar/migrar X", inventariá el universo real
  (p.ej. `app.routes.ts`) y confirmalo en una frase antes del primer caso.
- **Referencia visual externa:** confirmá elemento por elemento qué se traslada.
- **"Que se sienta X"** se traduce a una lista escrita de anti-patrones (ver la
  gramática de modal en `DESIGN-CHECKLIST.md`).
- **Syncs bidireccionales** (URL↔estado, navegación↔UI): al menos un test por
  dirección.
- **Historia:** el canon (quién es quién y el bucle de Angie), el recorrido por
  etapas y lo que falta cerrar están en [`docs/historia/`](./docs/historia/README.md).
  Leelo antes de tocar guiones, cinemáticas o el orden de los conceptos.

## Mapa del repo → scope de commit

Cada área de `src/app/` mapea a un scope de commit. Usá el scope del área que
realmente tocás; no inventes scopes nuevos.

| Directorio                 | Qué contiene                                                                            | Scope        |
| -------------------------- | --------------------------------------------------------------------------------------- | ------------ |
| `src/app/integrada-vista/` | Vista integrada: prólogo, viaje por los 11 capítulos y la molécula como mapa (ruta `/`) | `integrada`  |
| `src/app/practice/`        | Ejemplos aplicados para usar lo aprendido (`/practica/*`)                               | `practice`   |
| `src/app/signals/`         | Los niveles de aprendizaje (0–11) y sus sub-niveles                                     | `signals`    |
| `src/app/components/`      | Componentes de feature (histories, trees, forms…)                                       | `components` |
| `src/app/components-atom/` | Bloques atómicos de UI (button, code, input, title…)                                    | `atom`       |
| `src/app/components-draw/` | Componentes de dibujo/visualización                                                     | `draw`       |
| `src/app/layouts/`         | Layouts de página reutilizables                                                         | `layouts`    |
| `src/app/libs/`            | Helpers agnósticos del framework (p.ej. parser de HTML)                                 | `libs`       |
| `src/app/interfaces/`      | Tipos TypeScript compartidos                                                            | `interfaces` |
| Routing / arranque         | `app.routes.ts`, `app.config.ts`, navegación                                            | `routing`    |
| Config / tooling           | tsconfig, eslint, angular.json, package.json, CI                                        | `config`     |
| README / docs              | Documentación                                                                           | sin scope    |

## Commits

- **Conventional commits, en español.** Formato: `type(scope): resumen`.
- Tipos válidos: `feat`, `fix`, `refactor`, `perf`, `test`, `docs`, `chore`.
- `scope` debe ser uno de la columna **Scope** de la tabla de arriba (lista
  cerrada); la documentación va sin scope (`docs: …`). Si un cambio cruza varias
  áreas, partilo en commits atómicos.
- No mezcles refactor y feature en el mismo commit.
- El mensaje describe **solo el cambio**. Header ≤ 100 caracteres.
- Sin atribución a herramientas ni `Co-Authored-By`.

## Contribuciones

Qué PRs se aceptan y cuáles no está en [CONTRIBUTING.md](./CONTRIBUTING.md). En
corto: nada de reescrituras masivas ni cambios de stack.

## Convenciones de código

- **Change detection:** `OnPush` en todos los componentes (lo exige ESLint). El
  estado de la vista vive en **signals**; los pocos casos que no (p.ej. el menú
  dirigido por eventos del router) llaman `markForCheck()`.
- **Nombres por dominio, no por mecanismo:** un componente o un signal se
  nombra por lo que significa en el playground (`signalLevel`, `benchFrame`),
  no por su tipo interno.
- **Los comentarios explican el PORQUÉ, nunca el QUÉ:** si un comentario
  parafrasea la línea de abajo, se borra o se renombra la variable.
- **Fail-fast en los pocos bordes async:** si se agrega un fetch de datos o un
  timer (p.ej. en `signals/level-6-resource/` o `level-10-debounced/`), va con
  timeout o cleanup explícito (`effect` con `onCleanup`, no un `setTimeout`
  suelto).
- `public/preview.jpeg` es la captura real que abre el README: si cambia la vista
  integrada, hay que regenerarla. La `og:image` es otra, `public/tarjeta-social.jpg`,
  la colina con el título del juego y Angie con capa (`capa.svg`), capturada con
  `docs/tarjeta-social/capturar.mjs`:
  si cambia la colina o el título, hay que regenerarla.
