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
- Antes de dar por terminado un cambio de código, dejá el build/lint en verde:
  `npm run build`, `npm run lint` y `npm test` sin errores ni warnings nuevos.
- Usá siempre sintaxis Angular moderna: `inject()`, control flow (`@if`/`@for`),
  APIs de signals (`signal`/`computed`/`effect`/`input`/`output`/`model`),
  componentes standalone. Nada de `NgModule`.

## Verificación visual

La vista integrada anima sin parar (rAF y SMIL), y eso cuelga a algunas
herramientas de captura. Esto es lo que funciona:

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
- **Al terminar una revisión, actualizá `DESIGN-CHECKLIST.md`** con cada defecto
  detectado Y resuelto: es la regla del propio archivo, y es lo que evita que
  la familia de defectos vuelva.

## Antes de construir features visuales grandes

- **Alcance completo primero:** si el pedido es "integrar/migrar X", inventariá
  el universo real (p.ej. `app.routes.ts` para los sub-niveles) y confirmá el
  alcance en una frase ANTES de programar el primer caso. Un ejemplo-muestra no
  define el alcance.
- **Referencia visual externa** (neal.fun, ncase.me, etc.): desambiguá elemento
  por elemento qué se traslada, y confirmalo en el issue o el PR.
- **"Que se sienta X" se traduce a lista escrita de anti-patrones** antes de
  implementar (ver la sección de gramática de modal en `DESIGN-CHECKLIST.md`).
- **Syncs bidireccionales** (URL↔estado, navegación↔UI): especificá y testeá
  AMBAS direcciones antes de declarar cerrado; un test mínimo por dirección.

## Mapa del repo → scope de commit

Cada área de `src/app/` mapea a un scope de commit. Usá el scope del área que
realmente tocás; no inventes scopes nuevos.

| Directorio                 | Qué contiene                                                                          | Scope        |
| -------------------------- | ------------------------------------------------------------------------------------- | ------------ |
| `src/app/integrada-vista/` | Vista integrada: recorrido molécula de los 12 niveles, entrada por defecto (ruta `/`) | `integrada`  |
| `src/app/practice/`        | Ejemplos aplicados para usar lo aprendido (`/practica/*`)                             | `practice`   |
| `src/app/signals/`         | Los niveles de aprendizaje (0–11) y sus sub-niveles                                   | `signals`    |
| `src/app/components/`      | Componentes de feature (histories, trees, forms…)                                     | `components` |
| `src/app/components-atom/` | Bloques atómicos de UI (button, code, input, title…)                                  | `atom`       |
| `src/app/components-draw/` | Componentes de dibujo/visualización                                                   | `draw`       |
| `src/app/layouts/`         | Layouts de página reutilizables                                                       | `layouts`    |
| `src/app/libs/`            | Helpers agnósticos del framework (p.ej. parser de HTML)                               | `libs`       |
| `src/app/interfaces/`      | Tipos TypeScript compartidos                                                          | `interfaces` |
| `src/app/studio/`          | Estudio de cinemáticas: editor de autor del guion del prólogo (`/studio`, solo dev)   | `studio`     |
| Routing / arranque         | `app.routes.ts`, `app.config.ts`, navegación                                          | `routing`    |
| Config / tooling           | tsconfig, eslint, angular.json, package.json, CI                                      | `config`     |
| README / docs              | Documentación                                                                         | `docs`       |

## Commits

- **Conventional commits, en español.** Formato: `type(scope): resumen`.
- Tipos válidos: `feat`, `fix`, `refactor`, `perf`, `test`, `docs`, `chore`.
- `scope` debe ser uno de la columna **Scope** de la tabla de arriba (lista
  cerrada). Si un cambio cruza varias áreas, partilo en commits atómicos.
- El mensaje describe **solo el cambio**. Header ≤ 100 caracteres.
- Sin atribución a herramientas ni `Co-Authored-By`.

## Contribuciones

Repo educativo personal. Se aceptan PRs de: **bugfixes**, **nuevas lecciones o
sub-niveles** de la API de signals, y **mejoras de documentación**. NO se aceptan
reescrituras masivas ni cambios de stack (Angular signals-first es deliberado).
Todo PR pasa el mismo gate que CI: lint + format:check + tests en verde.

## Do NOT (anti-over-engineering)

- No agregues abstracciones para operaciones de una sola vez.
- No comentes ni anotes código que no tocaste en este cambio.
- No agregues manejo de errores para escenarios imposibles.
- No diseñes para requisitos hipotéticos: resolvé lo que hay.
- No mezcles refactor + feature en el mismo commit.

## Convenciones de código

- **Change detection:** todos los componentes usan
  `ChangeDetectionStrategy.OnPush`. El estado que alimenta la vista vive en
  **signals**; los pocos casos que no (p.ej. estado del menú dirigido por eventos
  del router) llaman `markForCheck()` explícitamente.
- **Standalone components** con `imports` explícito.
- Preferí parsing AST/estructurado sobre regex para manipulación compleja de
  archivos o código.
- Antes de implementar algo, buscá un ejemplo equivalente ya presente en el
  codebase y seguí su estilo.
- **Nombres por dominio, no por mecanismo:** un componente o un signal se
  nombra por lo que significa en el playground (`signalLevel`, `benchFrame`),
  no por su tipo interno.
- **Los comentarios explican el PORQUÉ, nunca el QUÉ:** si un comentario
  parafrasea la línea de abajo, se borra o se renombra la variable.
- **Fail-fast en los pocos bordes async:** si se agrega un fetch de datos o un
  timer (p.ej. en `signals/level-6-resource/` o `level-10-debounced/`), va con
  timeout o cleanup explícito (`effect` con `onCleanup`, no un `setTimeout`
  suelto).
- `public/preview.jpeg` es la captura real que abre el README y también la
  `og:image`: si cambia la vista integrada, hay que regenerarla.

## Scripts

| Script                 | Para qué                                           |
| ---------------------- | -------------------------------------------------- |
| `npm start`            | Dev server con HMR en `http://localhost:4200`      |
| `npm run build`        | Build de producción a `dist/angular-examples`      |
| `npm run watch`        | Rebuild en cada cambio (configuración development) |
| `npm test`             | Tests unitarios (Karma + Jasmine)                  |
| `npm run lint`         | Lint con ESLint + `angular-eslint`                 |
| `npm run gate:prosa`   | Presupuesto de prosa por pantalla (ratchet)        |
| `npm run test:scripts` | Tests de los scripts de gate (`node --test`)       |

En CI corren `lint`, `format:check`, `test:scripts`, `gate:prosa`, `test` y el
build de producción. Si uno falla, el PR no mergea y el deploy a Pages tampoco
ocurre: `deploy.yml` escucha el resultado de CI, no el push.
