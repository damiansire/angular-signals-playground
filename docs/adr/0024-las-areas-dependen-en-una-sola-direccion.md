# 0024. Las áreas dependen en una sola dirección, y el lint lo hace cumplir

## Contexto

`AGENTS.md` describía qué contiene cada área de `src/app/`, pero no quién puede importar a quién.
La dirección existía solo como costumbre, y ya tenía tres roturas que nadie había decidido:

- **Un ciclo entre el arranque y la vista.** `app.routes.ts` importaba `IntegradaVistaComponent` y
  la vista importaba `signalsRoutesTree` de `app.routes.ts`. Funcionaba porque el árbol recién se
  lee al construir el componente, no por diseño: mover una lectura al nivel del módulo lo rompía.
- **La práctica dependía de la historia.** `practice/cart/` importaba de `integrada-vista/` el tipo
  de una línea y la función que la parte en palabras, y su spec las reglas del guion.
- **Las reglas de una línea estaban copiadas cuatro veces** (la cinemática, el spec del viaje, el
  del manual y el del carrito) y el partido en palabras dos. Cada copia nombraba el problema a su
  manera, así que una regla nueva había que acordarse de sumarla en cuatro lugares.

## Decisión

1. **Una sola dirección**, de la base hacia la historia. Cada área importa solo de las que tiene
   debajo:

   | Área               | Importa de                                                    |
   | ------------------ | ------------------------------------------------------------- |
   | `libs`             | nadie (ni Angular, ni RxJS, ni GSAP)                          |
   | `interfaces`       | nadie                                                         |
   | `components-draw`  | `libs`                                                        |
   | `components-atom`  | `libs`, `interfaces`, `components-draw`                       |
   | `components`       | `libs`, `interfaces`, `components-draw`, `components-atom`    |
   | `layouts`          | `libs`, `interfaces`, `components-atom`                       |
   | `signals`          | todas las anteriores                                          |
   | `practice`         | las mismas que `signals`; no conoce a `signals` ni a la vista |
   | `integrada-vista`  | todas menos `practice`                                        |
   | arranque (`app.*`) | todas; ninguna lo importa a él                                |

2. **El mapa vive en `eslint.config.js`** (`PUEDE_IMPORTAR`) y `npm run lint` falla si un import lo
   cruza. Los specs de `libs/` quedan afuera de la regla: los desafíos se prueban contra los
   sistemas reales de `signals/`, que son sus fixtures.
3. **`signalsRoutesTree` pasa a `signals/signals-routes-tree.ts`.** Nunca generó rutas: es el árbol
   de conceptos, y es de `signals/`. `app.routes.ts` queda solo con las rutas del router.
4. **Las reglas de una línea pasan a `libs/guion.ts`**: `REGLAS_DE_LINEA`, `palabrasDe`,
   `palabrasDeLinea` y `problemasDeLinea`, que nombra cada regla rota. `REGLAS_GUION` de las
   cinemáticas las incluye y suma las propias de un capítulo (cantidad de líneas, duración).
5. **`LineaDelViaje` pasa al lado de `QuienDelViaje`**, en `components-draw/tripulacion/`: es lo
   que dice una nave, y lo usan el viaje y la práctica.

## Consecuencias

- Sumar una flecha al mapa es una decisión de arquitectura: se cambia `PUEDE_IMPORTAR` y esta tabla
  en el mismo commit.
- Lo que necesitan dos áreas que no se conocen baja a `libs/` (si es lógica pura) o a
  `components-draw/` (si dibuja).
- Los specs del viaje, del manual y del carrito ahora informan la regla rota con el mismo texto que
  las cinemáticas, y chequean las cuatro reglas (el del manual sigue chequeando dos).
- El comportamiento no cambia: es una mudanza de módulos.
