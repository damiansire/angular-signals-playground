# 0028. El final se resuelve para escapar

## Contexto

[ADR 0002](./0002-capa-de-juego-cinematicas-partida-y-sonido.md) decidió que ningún desafío bloquea
el avance: cada uno se puede saltear. Con la historia continua, el desafío final es la salida de
Signal Space, y Damian quiere que haya que resolverlo para escapar (J3 de
[pendientes](../historia/pendientes.md)). Saltearlo dejaría la salida sin causa: escapan porque
juntaron lo que aprendieron, no porque tocaron "Seguir".

## Decisión

1. **El escape pasa al resolver el desafío final.** Es la única excepción a la regla de ADR 0002;
   el resto del viaje se sigue pudiendo saltear.
2. **Nunca es un muro: Angie ayuda un poco más con cada intento.** Es la primera vez que puede
   intervenir (regla 4 del bucle en el [canon](../historia/README.md)), así que la ayuda es suya y
   crece de a un paso:
   1. al primer intento fallido dice qué hizo la pieza elegida, como las naves en el minijuego;
   2. al segundo señala el renglón donde está el problema;
   3. al tercero deja solo dos opciones en ese hueco.
3. **Sigue el silencio al acertar** (ADR 0002): no hay cartel. El sistema sano mueve la nave hacia
   el borde, y el último hueco abre la salida.

## Consecuencias

- El final no se puede ver sin resolver el desafío. Quien abre `/cine/12` desde la URL lo sigue
  viendo, porque esa ruta no pasa por la partida.
- El desafío concreto (qué sistema, qué huecos y de quién es cada uno) está en el
  [recorrido](../historia/recorrido.md), en "La salida".
- Con movimiento reducido, la ayuda de Angie va igual: es texto, no animación.
