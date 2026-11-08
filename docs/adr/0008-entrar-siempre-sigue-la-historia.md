# 0008. Entrar siempre sigue la historia, y la molécula no es una salida

## Contexto

Con el viaje ([0007](./0007-el-viaje-recorre-los-capitulos-y-la-molecula-queda-como-mapa.md)),
cerrar una hoja llevaba a la molécula, y entrar desde la colina volvía a la molécula si la partida
había quedado ahí. Damian entró con una partida de antes del viaje (2026-11-09) y fue directo a la
molécula: no vio el comienzo ni el viaje, y parecía que la introducción se había borrado. Pidió
que la app sea una sola animación, sin "prólogo" ni "mapa" como lugares aparte, y eligió que la
molécula no aparezca nunca en el camino.

## Decisión

1. **Entrar desde la colina siempre sigue la historia.** Con el comienzo sin ver, lo arranca desde
   donde quedó; con el comienzo visto, sigue el viaje donde quedó (`retomar.ts`). Una partida de
   antes del viaje lo empieza en el capítulo 1. Ninguna partida guardada abre la molécula.
2. **La hoja del viaje no se cierra.** No tiene "Cerrar" y Escape no la cierra; lo único que sigue
   es la página siguiente. Seguir nunca exige resolver nada
   ([0002](./0002-capa-de-juego-cinematicas-partida-y-sonido.md)).
3. **El fin es un lugar de la partida.** Después del final, la historia queda en su último cuadro:
   el final congelado con su última línea, y arriba "Empezar de cero" en lugar de "Saltar". Se
   guarda como el concepto que sigue al último con la página 0, así recargar vuelve ahí y no repite
   la revelación.
4. **La molécula solo se abre con un link** (`?nivel=`). Recargar sin link carga en la colina,
   aunque la partida haya quedado en la molécula.

Reemplaza los puntos 4 y 5 de 0007 en lo que hace a salir de la historia: la molécula sigue en el
código para los links y para repasar, pero ya no es una salida.

## Consecuencias

- La bitácora y "Seguir el viaje" quedan del lado de la molécula, que solo se ve con un link.
- Quien quiera volver a jugar la historia después del fin, empieza de cero.
- Retirar la molécula del todo sigue siendo una reescritura aparte, si algún día hace falta.
