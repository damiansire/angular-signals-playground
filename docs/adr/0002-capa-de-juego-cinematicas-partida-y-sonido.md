# 0002. La capa de juego: cinemáticas por capítulo, partida guardada y sonido

## Contexto

El recorrido ya tenía huesos de juego (tres actos, un pico en Resource, un cierre con trofeo,
37 desafíos que "establecen" y enlaces que se sueldan al entender) y un prólogo con historia: tres
naves de RxJS arrastradas fuera del espacio Zone.js, una exploradora que quedó afuera y una
mascota que promete enseñarles las reglas del mundo. Pero una revisión jugando la app como alguien
nuevo (septiembre de 2026) encontró lo que lo separaba de un juego estilo Wagotabi:

- El progreso vivía en memoria: recargar borraba todo lo establecido.
- La historia se cortaba después del prólogo: los doce capítulos no tenían escena.
- El prólogo no decía quién hablaba, y volvía a imponerse entero en cada visita.
- El sonido dependía de `speechSynthesis`: sin voces en español no había voz, el reloj del
  diálogo cambiaba de ritmo según la máquina, y la intro, el prólogo y el Estudio abrían cada uno
  su propio `AudioContext`.

## Decisión

**Partida guardada** (`libs/partida.ts`): `localStorage` bajo `signals-cuaderno` (la clave ya
decidida para "el cuaderno"), versionada y validada contra la forma real del recorrido. Guarda
sub-niveles establecidos (`"concepto/sub"`), cinemáticas vistas y si ya pasó el prólogo. La
regla del enlace no cambia: un concepto queda establecido con un sub-nivel; cada sub-nivel
resuelto se sella aparte en la barra de sub-niveles y en la bitácora.

**Cinemáticas** (`integrada-vista/cinematicas/`): una por capítulo más el final (13). Se juegan
una vez por partida al detenerse en la parada del capítulo, y se vuelven a ver desde la bitácora
o en `/cine/<n>`. El guion es dato (`cinematicas-datos.ts`) con el mismo reloj derivado del
texto que el prólogo, y las reglas de la barra de diseño son tests (ocho palabras por línea, sin
raya, beats declarados, duración máxima). El movimiento es 100 % CSS: el reloj solo enciende
clases `b-<beat>` con `setTimeout`, las entradas son transiciones con resortes resueltos a mano y
convertidos a `linear()` (`libs/resorte.ts`), el iris de entrada y salida es una View Transition,
y cada escena se carga diferida. El final lee la partida: solo se encienden los capítulos
establecidos.

**Bitácora de a bordo**: el repaso decidido ("leer tu propio cuaderno"). Lista los capítulos con
su ley (solo si está establecido), los sub-niveles sellados y el acceso a volver a ver
cinemáticas y el prólogo. No es un examen.

**Sonido** (`libs/sonido.ts`): un director único. Un solo contexto, creado recién con un gesto;
todo sintetizado; nada tira si no hay audio; preferencia única `signals-sonido`; se congela con
la pestaña oculta. Las voces de los personajes son blips con timbre propio (estilo RPG de texto),
que suenan igual en cualquier máquina.

## Lo que se mantiene a propósito

- **No se bloquea el avance** (decisión del 25 y 26 de julio). La consecuencia de no entender es
  la deuda visible (enlaces punteados, final a medias), no una puerta.
- **Silencio al acertar**: establecer un sistema no dispara ningún cartel ni sonido de acierto.
- **La intro "par de Tusi" no se rediseña**: solo cambió la plomería de su audio.

## Consecuencias

- Quien vuelve no ve el prólogo otra vez: entra directo ("continuar partida"). Se puede ver de
  nuevo desde la bitácora.
- Una partida guardada con otra versión del formato arranca de cero en vez de interpretarse mal.
- Agregar un capítulo implica: su cinemática en `cinematicas-datos.ts`, su escena en
  `escenas/` y su entrada en `escenas/index.ts`. Los tests fallan si el guion no cubre 0..11 y el
  final.
