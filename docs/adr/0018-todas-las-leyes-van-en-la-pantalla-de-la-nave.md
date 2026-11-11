# 0018. Todas las leyes van en la pantalla de la nave, con portada

## Contexto

[0016](./0016-la-ley-1-va-en-la-pantalla-de-la-nave-con-portada.md) pasó solo la ley 1 a la
pantalla de la nave, "hasta que Damian vea esta" (punto 5). La vio con la ley sobre el cielo
([0017](./0017-la-ley-va-sobre-el-cielo-tambien-en-la-pantalla.md)) y el 2026-11-11 pidió
aplicarlo a todas las leyes, con portada.

## Decisión

Reemplaza el punto 5 de 0016; lo demás de 0016 y 0017 sigue.

1. **Las seis leyes van en la pantalla de la nave**: las cinco del manual y la 6, el árbol de
   Signal Space. Ninguna tiene consola abajo. En la pantalla van el código y "correr" a la
   izquierda, y lo que la escena dibuja a la derecha, en el `render` de la página.
2. **Cada ley abre con una portada**: un dibujo de lo que muestra su pantalla (los instrumentos de
   la 2, el pipeline de la 3, el panel con el lugar olvidado de la 4, la cerca con la anomalía
   afuera de la 5, la caja del valor con sus hilos de la 6), la ley grande y "Leer".
3. **La lámina ya no dibuja la pantalla**: dibuja el cielo, lo que vive en él (las estelas de la
   3) y la nave en su carril, y traza el haz. Lo de la pantalla lo dibuja en el `render` que le
   pasa la página. La cerca de Zone.js rodea la app de la pantalla, no a la nave; la caja del
   valor de la 6 va debajo del árbol, entre sus dos lectores.

## Consecuencias

- `EscenaDelManual` reúne lo que antes repetía cada lámina: el cielo, la nave en su SVG, el haz,
  la mirada hacia la pantalla (`mirarLaPantalla`) y las chispas del festejo. Cada lámina implementa
  `armar(render, cielo)`.
- Se van `pintarPantalla`, `cieloAngosto` y `alCambiarDeTamano`: sin la pantalla en la lámina, no
  hay nada que encuadrar en angosto. En el celular la pantalla va debajo de la nave, sin haz.
- Una ley nueva entra igual: `enPantalla`, `portada` con su dibujo y una lámina que dibuje en
  `render`.
