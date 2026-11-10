# 0014. El libro deja seguir con la página cumplida

## Contexto

En el libro de leyes (el manual de a bordo y el árbol de Signal Space), "Siguiente página" estaba
siempre, en una fila propia al pie de la consola. Damian lo vio el 2026-11-11: se podía pasar sin
hacer nada, y la fila solo existía para ese botón. Pidió que aparezca en verde cuando el jugador
cumple la página, en otro lugar.

[0002](./0002-capa-de-juego-cinematicas-partida-y-sonido.md) dice que no se bloquea el avance.

## Decisión

1. **"Siguiente" aparece recién con la página cumplida** (los dos pasos de la consola hechos), en
   el verde de los pasos hechos y en el lugar de "▶ Mostrame", en la fila de los pasos. La flecha →
   del teclado sigue la misma regla. "← Anterior" va en esa fila, a la izquierda.
   (El lugar se reemplaza en las páginas en la pantalla de la nave por
   [0016](./0016-la-ley-1-va-en-la-pantalla-de-la-nave-con-portada.md): pestañas sobre su borde.)
2. **Una página cumplida queda cumplida** mientras la vista viva: volver a ella no obliga a hacerla
   de nuevo.
3. **No es una puerta**: "Mostrame" resuelve cualquier página, así que el avance de 0002 sigue sin
   bloquearse. Lo que cambia es que pasar de página pide haber visto la ley funcionar.
4. Las etapas del viaje (las pantallas de cada capítulo) no cambian: su "Siguiente" está siempre.

## Consecuencias

- La página avisa que se cumplió con `alCumplir`, del token `PAGINA_DEL_MANUAL`, cuando su
  `resuelta` pasa a `true`. Una página nueva del libro tiene que tener un `resuelta` que llegue.
- Releer el libro desde la bitácora en otra visita pide cumplir cada página de nuevo (o
  "Mostrame"): lo cumplido no se guarda en la partida.
