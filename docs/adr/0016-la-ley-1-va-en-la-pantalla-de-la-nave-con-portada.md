# 0016. La ley 1 va en la pantalla de la nave, con portada

## Contexto

En la ley 1 ("El HTML es un árbol de nodos") el árbol de nodos quedaba en la consola de abajo, junto
al código, lejos de la pantalla de la nave que lo dibuja. Damian lo vio el 2026-11-11 a 3440 de
ancho y pidió sacar la barra de abajo y poner código, árbol y render en la pantalla misma; que la
ley sea la portada del manual, con un botón para abrir la demo; y repensar dónde van "Siguiente",
"Mostrame", el título y los pasos, ahora que abajo no hay nada.

## Decisión

1. **La consola va adentro de la pantalla de la nave**, en tres columnas: el código, el árbol y lo
   que se dibuja. La nave va en un carril a la izquierda, en su propio SVG. Sin franja abajo.
2. **La página abre con una portada** en esa pantalla: la ley grande, lo que le dice a la nave, el
   árbol ya armado creciendo desde la raíz y "Leer". "Leer" achica la portada, agranda la pantalla
   hasta la demo y la nave salta.
3. **Cada cosa en su lugar:** la ley va en la barra de título de la pantalla, con las marcas del
   libro a la derecha. Los dos pasos y "▶ Mostrame" los dice la nave, en un globo que salta al
   cambiar de paso. "← Bitácora/Anterior" va como pestaña sobre el borde de abajo de la pantalla.
   Reemplaza, para las páginas en la pantalla, el lugar que les daba
   [0014](./0014-el-libro-deja-seguir-con-la-pagina-cumplida.md) (la fila de los pasos). Cuándo
   aparece "Siguiente" no cambia.
4. **"Siguiente" es seguir viaje** (pedido por Damian el 2026-11-11): un botón de vidrio
   translúcido que late debajo de la nave. Tocarlo hace salir volando a la nave por la derecha, por
   delante de la pantalla, y recién ahí el libro pasa de hoja; la página siguiente la recibe desde
   la izquierda (`VueloDeLaNave`, que cualquier escena con nave sabe atender). La página pone sus
   propios botones (`pasar`, `atras`, `siguiente` en `DatosDeLaPagina`) en vez del `pie` del libro.
   Las flechas del teclado siguen pasando de hoja sin vuelo.
5. **Solo la ley 1, por ahora** (`enPantalla` y `portada` en `app-pagina-del-manual`). Las otras
   cinco páginas siguen con la consola abajo hasta que Damian vea esta.

## Consecuencias

- Pasar otra página a la pantalla es prender `enPantalla` (y `portada`, con su dibujo en
  `[portada]`) y que su escena deje la pantalla de la nave a la página, como `escena-arbol` con
  `render`.
- La portada se ve cada vez que se monta la página: no se guarda que ya se leyó.
