# 0013. Sin movimiento, el comienzo se juega quieto

## Contexto

Con movimiento reducido (`prefers-reduced-motion`), el prólogo se terminaba solo, y con él el
minijuego de operadores, el manual de a bordo y el árbol de Signal Space: la Introducción entera
(T11 en `docs/historia/pendientes.md`). Después de [0012](./0012-el-comienzo-se-juega-tambien-en-el-celular.md)
era la última forma de llegar al capítulo 1 sin pasar por ella. En el iPhone basta con tener
prendido "Reducir movimiento".

## Decisión

Con movimiento reducido el prólogo se abre igual, pero su reloj no corre: salta de parada en parada
(el minijuego, el manual, el árbol) con la escena quieta y la línea que pide cada una. Al cerrar la
última, el prólogo termina y sigue el viaje. Los resortes no avanzan, así que nada se sacude, y un
acierto del minijuego muestra el nombre del operador al lado de la nave, sin dispararlo. Si la
preferencia cambia a mitad del prólogo, el reloj pasa a saltar desde donde está.

## Consecuencias

- Las líneas entre paradas no se leen con movimiento reducido: la historia de las naves se pierde,
  la Introducción no.
- Si se suma otra parada al comienzo, entra en `paradasPendientes` para que el modo quieto la
  juegue.
