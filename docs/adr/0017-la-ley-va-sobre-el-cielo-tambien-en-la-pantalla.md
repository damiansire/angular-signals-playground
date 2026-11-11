# 0017. La ley va sobre el cielo también con la consola en la pantalla

## Contexto

[0016](./0016-la-ley-1-va-en-la-pantalla-de-la-nave-con-portada.md) puso la ley 1 en la barra de
título de la pantalla de la nave. Damian la vio el 2026-11-11 al lado de la ley 3 y le pareció un
modal: un recuadro que encerraba la ley, el código, el árbol y el render, separado del cielo. La 3
se veía natural: la ley suelta arriba, y la pantalla unida a la nave por un haz.

## Decisión

Reemplaza el punto 3 de 0016 en lo que dice de la ley; lo demás de 0016 sigue.

1. **La ley va suelta sobre el cielo, arriba a la izquierda**, como en todas las leyes, con lo que
   le dice a la nave y las marcas del libro debajo. La pantalla ya no tiene barra de título.
2. **La pantalla es la que proyecta la nave**: el mismo marco que `pintarPantalla` y un haz desde
   la nariz hasta su borde, que traza la escena. Adentro, código, árbol y render van sobre el
   vidrio, sin caja propia.

## Consecuencias

- Una página que pase a la pantalla (`enPantalla`) recibe la ley sobre el cielo y el haz sin hacer
  nada más, si su escena traza el haz como `escena-arbol`.
