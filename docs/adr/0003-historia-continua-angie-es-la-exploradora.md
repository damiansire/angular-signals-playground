# 0003. Una historia continua en vez de niveles, y Angie es la exploradora

## Contexto

Hoy el recorrido es una secuencia fija: el aviso de auriculares, la colina con Angie, el prólogo de
las naves, el par de Tusi y la molécula de 12 conceptos con 40 desafíos, con una cinemática por
capítulo y el final. Al repensar la historia (noviembre de 2026), Damian marcó tres cosas:

- **La apertura es pasiva.** El prólogo dura 3 min 17 s (60 líneas) sin más interacción que tocar
  las naves, y el primer desafío llega recién después del par de Tusi.
- **Los niveles se leen como un temario.** Cada concepto tiene su cinemática, pero entre una y otra
  la historia no avanza: el número de nivel ordena más que la trama.
- **Angie y la exploradora no tienen nada que ver entre sí.** La melancolía de Angie en la colina no
  tiene causa, y la exploradora desaparece entre el prólogo y el capítulo 6.

## Decisión

1. **Una historia continua.** Los niveles numerados de 0 a 11 dejan de existir como tales: los
   conceptos entran de a poco, como etapas de una sola historia. La UI de los niveles, el recorrido
   molécula y las cinemáticas por capítulo se rehacen. La lógica de los desafíos y sus tests se
   conservan.
2. **Angie es la exploradora, con un bucle temporal.** Entra a buscarlos, Signal Space la deja mucho
   antes en su tiempo, y los espera en la colina. No puede intervenir hasta que su yo de afuera entre.
   Eso pasa en la penúltima etapa, y es la revelación.
3. **La apertura se juega.** Hay un minijuego de operadores de RxJS cuando la anomalía los atrae, el
   manual de a bordo con los desafíos 1 a 5 de la Introducción, y Angie muestra el árbol del 6.
4. **El final** es un problema que mezcla signals y RxJS. Angie, ya libre, los ayuda a escapar, y el
   epílogo los deja viviendo en su mundo.
5. **Nombres.** El SignalVerso es el universo, y contiene el espacio Zone.js (casa) y Signal Space
   (el mundo de Angie). El libro de la nave es el manual de a bordo.
6. **Los minijuegos son para completar el hueco**, sobre el mismo `ManipulableChallenge` de los
   desafíos.
7. **La exploradora lleva la paleta de Angie** en el prólogo y en las cinemáticas, desde este mismo
   cambio.

El canon, el recorrido por etapas y lo que falta cerrar están en
[docs/historia](../historia/README.md).

## Lo que se mantiene a propósito

- **Silencio al acertar** y **un solo director de sonido**
  ([0002](./0002-capa-de-juego-cinematicas-partida-y-sonido.md)).
- **Las reglas del guion**: ocho palabras por línea, sin raya, y el reloj derivado del texto.
- **La colina y el aviso de auriculares**, que ya tienen la estética nueva.
- **Las poses de Angie que no son de frente salen de su modelo 3D**; no se dibujan a mano.
- **No se bloquea el avance** (0002), salvo lo que se decida sobre el desafío final.

## Consecuencias

- Reemplaza en parte a 0002: las cinemáticas y la bitácora por capítulo. Su consecuencia "quien
  vuelve no ve el prólogo" ya no era cierta desde el 2026-11-08 (commit `c675989`).
- Hay código y tests atados a la forma de 0 a 11: `RAW`, `signalsRoutesTree`, las cinemáticas de 0
  a 12, la partida, la URL y el gate de prosa. La lista está en los pendientes de la historia.
- El reemplazo va por etapas y no como una reescritura de una sola vez (`CONTRIBUTING.md`): cada
  etapa nueva retira lo que reemplaza.
- Agregar una etapa implica escribirla primero en el recorrido.
