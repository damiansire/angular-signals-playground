# 0012. El comienzo se juega también en el celular

## Contexto

Abajo de 700 px de ancho, el prólogo se terminaba solo, como con movimiento reducido. La regla venía
de cuando el comienzo era solo una cinemática ([0007](./0007-el-viaje-recorre-los-capitulos-y-la-molecula-queda-como-mapa.md)).
Con la Introducción adentro ([0006](./0006-la-introduccion-pasa-entera-a-la-historia.md)), saltearlo
también salteaba el minijuego de operadores, el manual de a bordo y el árbol de Signal Space. El
2026-11-10 Damian abrió la app en el iPhone y fue directo al capítulo 1: las naves y la Introducción
no estaban ([0011](./0011-una-partida-vieja-retoma-el-comienzo-desde-el-manual.md) resolvió otra
causa, la de Opera).

## Decisión

El prólogo se juega a cualquier ancho. Solo el movimiento reducido lo termina. Lo que no entraba en
un celular se ajusta ahí, sin cambiar el escritorio:

- Los rótulos de operador dibujados en el SVG tienen un tamaño mínimo en pantalla. Con un rótulo
  agrandado, el nombre se apaga antes, para que nunca se vean dos a la vez.
- El libro de leyes, que en una pantalla grande entra entero, en el celular scrollea. Arranca
  debajo de los botones del prólogo y avisa "más abajo".

## Consecuencias

- En un celular vertical la escena ocupa una franja de unos 220 px de alto: se sigue, pero chica.
  Una cámara que siga la acción queda para después.
- Con movimiento reducido el comienzo todavía se saltea entero, y con él la Introducción (T11).
