# 0015. Con una partida guardada, el aviso de auriculares sigue directo donde quedó

## Contexto

Con la partida que guarda dónde quedó la historia
([0005](./0005-la-partida-guarda-donde-quedo-la-historia.md)), recargar pasaba por el aviso de
auriculares, la colina y "Hacé click para iniciar las aventuras", y recién ahí seguía. El aviso
existe para conseguir el gesto que el navegador exige para dejar sonar; la colina es el principio
de la historia. Quien vuelve a una partida empezada veía dos pantallas de arranque y la despedida
de Angie antes de llegar adonde estaba. Damian pidió el 2026-11-11 que, con partida guardada, el
click del aviso lleve directo ahí.

## Decisión

**Con algo para retomar, el toque del aviso entra a la historia sin pasar por la colina**
(`despuesDelAviso` en `retomar.ts`). El toque desbloquea el sonido con la preferencia que tenga el
aviso, se saltea la prueba de un oído al otro y el alejarse desde el ojo, y la pantalla de inicio se
desvanece entera, con el aviso todavía encima, mientras entra la historia: el comienzo desde su
línea, o el viaje donde quedó. El destino es el mismo que elige `entradaDeLaHistoria` al entrar desde
la colina.

"Algo para retomar" es lo que no arrancaría la historia del principio: una línea del comienzo que el
guion todavía tiene, o el comienzo visto. Sin partida, o con una que arrancaría del principio (una
línea que ya no existe, un punto en la molécula sin el comienzo visto), el aviso lleva a la colina
como hasta ahora.

Reemplaza en 0005 "en el prólogo, se pasa por el aviso de auriculares y la colina", y en 0008 que
recargar sin link "carga en la colina": carga en el aviso, que sigue directo.

## Consecuencias

- Con partida guardada, la colina y su ficha de "Empezar de cero" no se ven. En el comienzo sigue
  en su HUD, y al final del viaje en el último cuadro; en las hojas del viaje no hay ninguno a la
  vista hasta llegar al fin. Queda pendiente darle un lugar ahí o en el aviso mismo.
- La despedida de la colina (la radio, el sol, Angie hecha luz) se ve una sola vez, la primera.
- Un link con `?nivel=` sigue mandando: abre la molécula sin aviso.
