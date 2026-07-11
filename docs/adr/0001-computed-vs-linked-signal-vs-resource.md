# 0001. Cuándo usar computed(), linkedSignal() y resource()

## Contexto

Las 3 primitivas reactivas derivadas de Angular Signals se solapan lo
suficiente como para generar dudas reales al elegir: las tres devuelven un
signal de solo lectura calculado a partir de otras señales. Este playground
las separa en niveles distintos (`level-4-computed`, `level-5-linked-signal`,
`level-6-resource`) precisamente porque la diferencia importa y se presta a
confusión. Este ADR documenta el criterio de elección.

## Decisión: criterio de elección

**`computed()`** — cuando el valor derivado es una función pura y síncrona de
otras señales, sin estado propio que sobreviva a un recálculo. Ejemplo: un
total calculado a partir de una lista de ítems. No se puede escribir
directamente (`set`/`update` no existen) — si hace falta sobreescribir el
valor derivado manualmente, `computed()` ya no alcanza.

**`linkedSignal()`** — cuando el valor derivado necesita comportarse como
`computed()` (se recalcula cuando cambia su fuente) **pero también** necesita
poder sobreescribirse manualmente sin perder la reactividad hacia la fuente.
Caso típico: un selector cuya opción por defecto depende de otra señal, pero
que el usuario puede overridear a mano — y ese override debe resetearse solo
cuando la fuente cambia de verdad, no en cualquier re-render.

**`resource()`** — cuando el valor derivado depende de una operación
**asíncrona** (fetch, IndexedDB, cualquier I/O), no de una transformación pura
en memoria. `resource()` maneja el ciclo de vida completo (loading/error/value)
y cancela la petición en curso si la señal de la que depende (`request`)
cambia antes de que termine — algo que ni `computed()` ni `linkedSignal()`
hacen, porque ninguna de las dos está diseñada para trabajo async.

## Tabla resumen

| | ¿Puede escribirse a mano? | ¿Async? | ¿Se recalcula solo? |
|---|---|---|---|
| `computed()` | No | No | Sí |
| `linkedSignal()` | Sí (preservando reactividad) | No | Sí |
| `resource()` | No directamente (se controla vía `request`) | Sí | Sí, cancela la petición en vuelo |

## Trade-offs descartados

- **Usar `computed()` + un signal aparte para el override manual**: es el
  patrón que `linkedSignal()` reemplaza — requiere sincronizar a mano el
  signal de override con la fuente cada vez que ésta cambia (el bug típico:
  olvidar resetear el override y que quede "pegado" a un valor viejo).
  `linkedSignal()` existe específicamente para no tener que escribir ese
  glue code.
- **Usar `resource()` para transformaciones síncronas**: paga el overhead de
  un ciclo de vida async (loading state, microtask) para algo que podría
  resolverse en el mismo tick con `computed()`.
- **Usar un `effect()` + `signal()` mutable para modelar cualquiera de los
  tres casos**: es el patrón "manual" que las tres primitivas reemplazan;
  Angular recomienda no usar `effect()` para propagar estado derivado (ver la
  guía oficial de Signals) — reservarlo para side-effects reales (logging,
  sincronización con algo fuera del grafo reactivo).

## Consecuencias

Los niveles 4/5/6 de este playground (`level-4-computed`,
`level-5-linked-signal`, `level-6-resource`) quedan como el material de
referencia práctico de esta decisión — cada uno demuestra el caso donde la
primitiva anterior de la lista se queda corta.
