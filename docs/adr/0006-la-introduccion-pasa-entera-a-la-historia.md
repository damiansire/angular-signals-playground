# 0006. La Introducción pasa entera a la historia, y el capítulo es un nombre, no una posición

## Contexto

Con el manual de a bordo (2026-11-09), los sub-niveles 0/1 a 0/5 salieron de la molécula y la
Introducción quedó con uno solo: "El signal avisa quién lo lee." El recorrido por etapas
([docs/historia](../historia/recorrido.md)) lo ubica en "La voz y Angie": Angie les muestra Signal
Space y cómo se actualiza su árbol. Damian lo pidió como parte de la primera etapa de la historia
continua: los ejercicios entran a la cinemática como el manual, y los niveles numerados dejan de
existir ([0003](./0003-historia-continua-angie-es-la-exploradora.md)).

Sacar el último sub-nivel deja vacío el concepto 0, así que el concepto entero sale de la molécula.
Hasta acá la posición en la molécula era a la vez el número de capítulo: de ella salían la
cinemática, el color, el número del riel, el `?nivel=` de la URL y los ids de la partida.

## Decisión

1. **El árbol entra al prólogo.** Después del pacto, el capitán dice que su pantalla sigue marcando
   la velocidad vieja, la Nave B pregunta "¿Y quién le avisó a la pantalla?" y Angie contesta
   "Aquí nadie revisa todo. Miren el árbol." Ahí la historia se frena, como con el manual, y se abre
   la misma hoja con la pantalla de antes (`arbol-de-signal-space.ts`), ahora con el formato de las
   páginas del manual y una lámina propia: la caja del valor manda el aviso solo por los hilos de
   quien lo lee. La hoja dice "Signal Space" y la ley es la 6, después de las cinco del manual.
   Sigue "Guarden esa pregunta. Los acompaña todo el viaje." No pide resolver nada para seguir
   ([0002](./0002-capa-de-juego-cinematicas-partida-y-sonido.md)). La bitácora lo abre suelto.
2. **La cinemática del capítulo 0 se retira.** Su pregunta y su "Guarden esa pregunta" son las
   líneas nuevas del prólogo. La escena 00 se borra.
3. **El capítulo es un nombre.** Signals sigue siendo el capítulo 1 y Zoneless el 11, con su
   cinemática, su color y su número en el riel y la bitácora. La posición en la molécula va aparte
   (`CAPITULO_DE_CONCEPTO` en `molecule-engine.ts`, atado por un test al `path` de cada concepto en
   `signalsRoutesTree`).
4. **`?nivel=` es el número de capítulo.** Los links que ya andaban siguen abriendo el mismo lugar.
   `?nivel=0` ya no existe: se ignora, y manda lo guardado.
5. **La partida pasa a la versión 3** y se traduce: los ids y el punto del recorrido se corren un
   concepto, lo de la Introducción se descarta y la cinemática 0 también.

## Consecuencias

- El recorrido arranca en Signals, que toma el lugar de entrada de la molécula: el átomo del
  centro.
- El final sigue dibujando los doce átomos de antes: recibe lo establecido por número de capítulo,
  con el 0 siempre puesto, porque ya lo cuenta la historia.
- Un desafío resuelto en una hoja del prólogo ya no se anota en el recorrido. Antes caía en el
  concepto que hubiera en pantalla.
- Reemplaza a la nota de [0005](./0005-la-partida-guarda-donde-quedo-la-historia.md) de que si una
  migración corre conceptos, el punto del recorrido se pierde: ahora se traduce como los ids.
