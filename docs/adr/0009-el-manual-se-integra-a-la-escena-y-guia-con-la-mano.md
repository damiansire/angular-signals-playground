# 0009. El manual se integra a la escena y guía con la mano

## Contexto

El manual de a bordo (las cinco leyes del prólogo) y el árbol de Signal Space eran una hoja de papel
crema a pantalla entera encima de la escena. Damian lo vio el 2026-11-09: la mitad de abajo de la
hoja estaba vacía y lo de arriba, apretado. "Clickeá un tag" no decía cuál. No había forma de verlo
hecho, y "← Anterior" aparecía en la primera página. Pidió que quede tan bien como los diálogos del
juego de Japón y que el manual se integre a la pantalla.

## Decisión

1. **El libro de leyes no tiene papel propio.** La escena del prólogo queda detrás, desenfocada y
   oscurecida hacia el medio. La ley va suelta encima, y lo que se toca (la demo, la escena de la
   nave, el desafío) va en papel. Abierto suelto desde la bitácora, el fondo es el cielo del
   prólogo. La hoja del viaje (las etapas de cada capítulo) sigue siendo de papel: es otra pieza.
2. **Cada página dice qué tocar y una mano lo señala.** La demo pasa un selector (`guia`), y la
   mano guía, un guante de papel animado con GSAP, apunta ahí y amaga el toque hasta que alguien lo
   toca. La lógica (qué sigue, dónde cae el dedo, cuándo parar) son funciones puras en
   `guia.logica.ts`.
3. **"▶ Mostrame" lo hace por quien no se anima.** La misma mano toca cada objetivo con un click
   real, hasta que la página no señala nada nuevo. No hay un modo automático aparte: lo que pasa es
   lo mismo que haría el dedo.
4. **"← Anterior" solo aparece si hay a dónde volver.** Pasar de página en el libro desliza la
   página nueva. La hoja que gira queda para el papel del viaje.

## Consecuencias

- Una página nueva del manual tiene que decir su `guia`. Sin ella no hay mano ni "Mostrame".
- "Leer el HTML", el reproductor del árbol de la ley 1, se va: "Mostrame" hace lo mismo con la mano.
- Integrar también la hoja del viaje con este estilo es un cambio aparte.
