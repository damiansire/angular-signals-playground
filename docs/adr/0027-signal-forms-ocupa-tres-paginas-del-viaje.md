# 0027. Signal Forms ocupa tres páginas del viaje

## Contexto

La página 7/4 enseña `form()`, los validadores y `[formField]`, pero la documentación de Angular
dedica buena parte de Signal Forms a dos ideas que no aparecían: las reglas que dependen del modelo
y el envío con validación asíncrona.

## Decisión

1. **Dos páginas nuevas al final del capítulo 7.** La 7/5 enseña `disabled`, `hidden` y `validate`
   entre campos. La 7/6 enseña `submit()`, `validateAsync` y `debounce`.
2. **Van después de la 7/4 y no antes de ninguna existente**, para que los índices del progreso
   guardado sigan valiendo.
3. **Cada página se aprende tocándola.** Sin párrafo de entrada: los controles encienden en el
   código la regla que despiertan.
4. **La 7/6 usa `ignoreValidators: 'none'`.** El valor por defecto, `'pending'`, deja salir el envío
   mientras la validación asíncrona sigue corriendo, y ese es el error que plantea su desafío.

## Consecuencias

- El viaje pasa de 40 a 42 desafíos, y 4 líneas nuevas de voz.
- Quien ya pasó el capítulo 7 solo ve las páginas nuevas si vuelve a ese capítulo.
- La verificación del canal es simulada con un timer cancelable: la página no depende de la red.
