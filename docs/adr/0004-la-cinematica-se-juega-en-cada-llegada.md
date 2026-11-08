# 0004. La cinemática del capítulo se juega en cada llegada

## Contexto

El ADR 0002 decidió que cada cinemática se juega una vez por partida: al verla o saltearla con Esc
quedaba guardada en `localStorage` y no volvía sola. Jugando el recorrido (9 de noviembre de 2026),
Damian vio que las cinemáticas a veces aparecían y a veces no, y lo tomó por un bug. La regla era
invisible: nada en pantalla dice que una cinemática ya se gastó.

## Decisión

La cinemática de un capítulo se abre **cada vez que el jugador llega a la parada de su átomo**,
aunque ya la haya visto. Llegar es venir desde otro capítulo (o entrar al recorrido).

Se mantiene:

- **La espera de 650 ms**: pasar de largo por un capítulo no la abre.
- **Adentro de un sub-nivel no se abre**: un deep-link a un ejercicio no se interrumpe.
- **Salir de un sub-nivel al átomo del mismo capítulo no es llegar**: no la repite, salvo que todavía
  no se haya visto nunca (lo que ya pasaba antes).
- **El final se juega una vez**, al establecer el último concepto.
- **La partida sigue guardando las vistas**: la bitácora las marca y el final las usa.

## Consecuencias

- Ir y volver entre dos capítulos repite la cinemática de cada uno. Esc la saltea en el momento.
- Reemplaza la frase "se juegan una vez por partida" del ADR 0002.
