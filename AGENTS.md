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

## Verificación visual (receta de esta máquina, no re-tantear)

Destilado de la autopsia de sesiones del 09 al 16 de julio 2026: el entorno de
verificación se redescubrió desde cero en 5 sesiones distintas. Esta es la vía
que funciona; no volver a explorar alternativas ya descartadas.

- **NO uses el Browser pane (`mcp__Claude_Browser__computer` screenshot) con
  esta app.** La animación rAF continua + pestaña oculta lo cuelga (timeout de
  30s, reproducido en 5 sesiones). Máximo 1 intento; si falla, cambiá de vía
  sin insistir y sin devolverle la prueba al usuario.
- **Vía que funciona:** `chrome-devtools` o `claude-in-chrome` (extensión
  conectada). Si `claude-in-chrome` da "not connected", pedile a Damian una
  sola vez que conecte la extensión y seguí por ahí.
- **Dev server:** config `signals-play-dev` en `.claude/launch.json` (ya
  existe, no crear otra). Antes de afirmar que corre, chequeá salud
  (`preview_logs` o curl a `localhost:4200`). Se cae silencioso. Y ojo: un
  error de compilación transitorio corta el HMR de la pestaña del usuario
  aunque el server se recupere; si dice "no veo cambios", primero verificá
  server + bundle, no el código.
- **Falso bug conocido:** la pestaña oculta del pane pausa `rAF` y
  `scroll-behavior: smooth`. Un "bug de navegación/scroll" que solo pasa en el
  pane NO es un bug real: verificá en browser real antes de gastar debugging.
- **Cierre de cambio visual = dos chequeos separados y obligatorios:**
  (1) ¿renderiza sin error? y (2) ¿se ve bien compuesto? El segundo exige
  captura real MIRADA (o el agente `design-reviewer`), nunca solo mediciones
  de DOM. Para colisiones/superposición, además de mirar: medí overlap
  numérico con `getBoundingClientRect()` contra TODOS los vecinos (título,
  contador, dots, órbita), no contra uno solo.
- **Gate de diseño:** todo cambio que toque el motor visual (`molecule-engine`,
  CSS de `integrada-vista/`) cierra con una pasada de `design-reviewer` contra
  `DESIGN-CHECKLIST.md` ANTES de declararlo bueno. La palabra del propio
  agente ("quedó hermoso") no es veredicto.
- **NO verifiques la navegación con eventos SINTÉTICOS** (2026-07-24, costó ~15
  round-trips). `btn.click()` y `dispatchEvent(new MouseEvent/KeyboardEvent)`
  disparan el handler pero `goToUnit` no avanza, y las mediciones carrean con
  las animaciones de scroll: dan FALSOS NEGATIVOS ("el índice no navega") y
  dejan la instancia en un estado inconsistente. Con **input REAL** (click de
  puntero de chrome-devtools/claude-in-chrome, o rueda real) anda a la primera.
  Ojo también con las coordenadas: el screenshot fluctúa (1456/1512/1520 px)
  mientras el viewport real es 1920 → clickeá por `uid`/`ref`, o escalá por
  `screenshotW / innerWidth`, si no le errás al elemento.
- **Al terminar una review, actualizá el `DESIGN-CHECKLIST.md`** con cada defecto
  detectado Y resuelto (es la regla del propio archivo, y es lo que evita que la
  familia de defectos vuelva). Si la review se entregó como artefacto, ese
  artefacto también se actualiza al aplicar los fixes: un reporte que quedó en
  "roto" cuando ya está arreglado desinforma.

## Antes de construir features visuales grandes

- **Alcance completo primero:** si el pedido es "integrar/migrar X", inventariá
  el universo real (p.ej. `app.routes.ts` para los sub-niveles) y confirmá el
  alcance en una frase ANTES de programar el primer caso. Un ejemplo-muestra no
  define el alcance.
- **Referencia visual externa** (neal.fun, ncase.me, etc.): desambiguá elemento
  por elemento qué se traslada, con `AskUserQuestion` si hace falta.
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

## Estándar nivel mundial

Piso transversal de `/fragua` (`fellow-standard.md` del corpus) + reglas del
stack Angular (`~/.claude/tools/_audit-tools/refs/angular/`). Este repo ya
cumple la mayoría por construcción (signals-first, OnPush, standalone, tests
antes que UI, anti-over-engineering explícito arriba) — lo que sigue es lo que
falta o hay que sostener:

- **Nombres por dominio, no por mecanismo** (ítem a): un componente/signal se
  nombra por lo que significa en el playground (`signalLevel`, `benchFrame`),
  no por su tipo interno.
- **Comentarios explican el PORQUÉ, nunca el QUÉ** (ítem b): si un comentario
  parafrasea la línea de abajo, se borra o se renombra la variable en su lugar.
- **README con prueba visible** (ítem k) — **RESUELTO (2026-07-17)**: el README
  lidera con una captura real de la vista integrada (`public/preview.jpeg`), que
  también sirve de `og:image`. Captura tomada vía `chrome-devtools` (el Browser
  pane cuelga con esta app, ver la receta de verificación arriba).
- **Fail-fast en los pocos boundaries async** (ítem i): si se agrega fetch de
  datos o timers (p.ej. en `signals/level-6-resource/` o `level-10-debounced/`),
  van con timeout/cleanup explícito (`effect` con `onCleanup`, no un `setTimeout`
  suelto).

Gap de corpus: ninguno para este stack — `refs/angular/` tiene notas
distiladas (`from-ngrx-platform`, `from-angular-components`,
`signals-templates-cd`, `di-and-signals-internals`) que ya informan las
convenciones de arriba.
