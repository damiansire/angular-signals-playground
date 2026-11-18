# 0026. Los inputs de las pantallas usan Signal Forms

## Contexto

Solo la página 7/4 usaba `@angular/forms/signals`. Las otras ocho pantallas con inputs repetían a
mano el mismo puente: `[value]` más `(input)` con `$any($event.target).value`, o un `viewChild` para
leer el DOM al apretar un botón.

## Decisión

1. **Todo input de una pantalla se enlaza con `[formField]`.** Si el input edita un signal que la
   demo ya muestra, el modelo es ese mismo signal: `form(this.query)`. El código que enseña cada
   pantalla no cambia.
2. **Lo que se confirma con un botón usa un borrador aparte** (`basic-form`, `writable-signals`): el
   input escribe en el borrador y el botón lo pasa al signal de la demo.
3. **Un input numérico se modela como `number | null`.** Angular escribe `null` al vaciarlo, y con
   texto que no puede interpretar (`1e`) deja el modelo como estaba y marca el campo inválido: por
   eso el rechazo mira `invalid()` y no solo el valor.

## Consecuencias

- El bundle inicial no cambia (715,37 kB). `@angular/forms/signals` queda en un chunk diferido de
  61 kB (15 kB transferidos), compartido por las pantallas con inputs.
- El chunk se baja antes de la página 7/4: la primera pantalla que lo pide es la 1/5.
- `FormField` solo escribe en el DOM cuando el valor enlazado cambia entre dos renders. Un test que
  tipea y limpia sin renderizar en el medio ve el input sin limpiar, aunque en la app funcione.
