# 0010. La hoja del viaje habla como el libro de leyes

## Contexto

Con [0009](./0009-el-manual-se-integra-a-la-escena-y-guia-con-la-mano.md), el libro de leyes dejó de
ser una hoja de papel encima de la escena, pero la hoja del viaje (las etapas de cada capítulo)
siguió siendo el rectángulo crema a pantalla entera, con media hoja vacía debajo de cada pantalla.
Damian pidió integrarla también (2026-11-09). Al revisarla apareció otro defecto: la pista de Angie
no se veía nunca en el viaje.

## Decisión

1. **Una sola hoja, sin papel propio.** El manual, Signal Space y el viaje comparten la base: la
   cabecera, el título y los carteles del pie van sueltos sobre el cielo. Afuera del prólogo el cielo
   es el del prólogo, casi opaco y con estrellas, en lugar de un velo gris sobre el mapa.
2. **En el viaje, la pantalla va en una tarjeta de papel.** Cada pantalla de etapa es una de las de
   la molécula y no tiene las tarjetas de `app-pagina-del-manual`. Entera va en una tarjeta con el
   borde de tinta del manual, centrada en el alto cuando es corta. El desafío va en su recuadro
   punteado adentro.
3. **Pasar de página siempre desliza la página nueva.** La hoja de papel que giraba se va del todo.
4. **La pista de Angie aparece en la hoja** cuando la página ya asentó.

Reemplaza el punto 1 de 0009 en lo que dice del viaje.

## Consecuencias

- Lo que el libro de leyes tiene de propio (la escena del prólogo desenfocada detrás, la mesa que se
  estira hasta el pie) queda en `prologo__manual--libro`; lo del viaje, en `prologo__manual--viaje`.
- Una pantalla de la molécula que se monte en la hoja se ve en papel sin tocarla.
