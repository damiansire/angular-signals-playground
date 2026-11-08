# 0005. La partida guarda dónde quedó la historia, y se puede empezar de cero desde cualquier lado

## Contexto

Con la historia continua (ADR 0003) los niveles numerados dejan de ser la forma de ubicarse. Hasta
acá, lo único que retomaba un lugar era la URL (`?nivel=X&sub-nivel=Z`): recargar sin ella volvía a
la colina, y el prólogo se jugaba entero cada vez. La partida guardaba qué se estableció y qué
cinemáticas se vieron, pero no dónde estaba quien juega. Empezar de cero existía solo al pie de la
bitácora. Damian lo pidió el 9 de noviembre de 2026: puntos dentro de la historia para que al
recargar se siga desde el mismo lugar, y un botón para resetear el progreso.

## Decisión

**La partida guarda un punto** (`punto` en `libs/partida.ts`), que puede ser uno de tres lugares:

- **Una línea del prólogo** de `PUNTOS_DEL_PROLOGO`: el comienzo de cada tramo, que son la anomalía,
  el minijuego, el manual, Adentro, la voz, "El caos es orden" y el pacto. El prólogo avisa al
  pasar por cada uno (`alPasarPunto`).
- **La construcción de Tusi**: el prólogo terminado o salteado.
- **Un lugar del recorrido**: el átomo o el sub-nivel donde estaba.

Al cargar se retoma así (`retomar.ts`, funciones puras con sus tests):

- **Un link** con `?nivel=` manda sobre lo guardado.
- **En el recorrido**, abre directo ahí, como un link.
- **En el prólogo**, se pasa por el aviso de auriculares (el toque desbloquea el audio) y la colina,
  y al entrar el prólogo arranca en ese punto. Un punto antes del minijuego o del manual los vuelve
  a abrir: recargar a mitad de una hoja es no haberla terminado.
- **Con el prólogo pasado**, entrar va directo a la construcción.

Un punto que no encaja con la forma de hoy se descarta y la historia arranca del principio. El
formato no cambia de versión: una partida sin punto se lee como `null`.

**"Empezar de cero" está a la vista** en la barra del recorrido, en el HUD del prólogo y en la colina
(una ficha al lado de sonido y pausa, solo si hay algo guardado). Pide un segundo toque que caduca a
los 4 s, como el de la bitácora. Borra la partida y recarga sin la query, porque con `?nivel=` en la
barra el link reabría el mismo lugar que se acababa de borrar.

## Consecuencias

- `?prologo=<línea>` sigue siendo solo de desarrollo. El motor ya no lo filtra: arrancar desde una
  línea es también cómo se retoma.
- Cada etapa nueva de la historia suma sus puntos. Si una migración corre conceptos o sub-niveles,
  el punto del recorrido se pierde igual que sus ids.
- Reemplaza a "quien vuelve ve el prólogo entero" de ADR 0002 y 0003: ahora sigue donde quedó.
