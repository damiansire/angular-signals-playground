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

## Mapa del repo → scope de commit

Cada área de `src/app/` mapea a un scope de commit. Usá el scope del área que
realmente tocás; no inventes scopes nuevos.

| Directorio              | Qué contiene                                              | Scope        |
| ----------------------- | -------------------------------------------------------- | ------------ |
| `src/app/signals/`      | Los niveles de aprendizaje (0–11) y sus sub-niveles      | `signals`    |
| `src/app/lab/`          | Signals Lab: bench-frame, hub e instrumentos             | `lab`        |
| `src/app/components/`   | Componentes de feature (sidebar, histories, trees…)      | `components` |
| `src/app/components-atom/` | Bloques atómicos de UI (button, code, input, title…)  | `atom`       |
| `src/app/components-draw/` | Componentes de dibujo/visualización                   | `draw`       |
| `src/app/layouts/`      | Layouts de página reutilizables                          | `layouts`    |
| `src/app/libs/`         | Helpers agnósticos del framework (p.ej. parser de HTML)  | `libs`       |
| `src/app/interfaces/`   | Tipos TypeScript compartidos                             | `interfaces` |
| Routing / arranque      | `app.routes.ts`, `app.config.ts`, navegación            | `routing`    |
| Config / tooling        | tsconfig, eslint, angular.json, package.json, CI         | `config`     |
| README / docs           | Documentación                                            | `docs`       |

## Commits

- **Conventional commits, en español.** Formato: `type(scope): resumen`.
- Tipos válidos: `feat`, `fix`, `refactor`, `perf`, `test`, `docs`, `chore`.
- `scope` debe ser uno de la columna **Scope** de la tabla de arriba (lista
  cerrada). Si un cambio cruza varias áreas, partilo en commits atómicos.
- El mensaje describe **solo el cambio**. Header ≤ 100 caracteres.
- Sin atribución a herramientas ni `Co-Authored-By`.

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

| Script            | Para qué                                            |
| ----------------- | --------------------------------------------------- |
| `npm start`       | Dev server con HMR en `http://localhost:4200`       |
| `npm run build`   | Build de producción a `dist/angular-examples`       |
| `npm run watch`   | Rebuild en cada cambio (configuración development)   |
| `npm test`        | Tests unitarios (Karma + Jasmine)                   |
| `npm run lint`    | Lint con ESLint + `angular-eslint`                  |
