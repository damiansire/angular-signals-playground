# Recorrido: de la colina al epílogo

La historia de punta a punta, etapa por etapa, con cada uno de los 40 desafíos ubicados. El canon
(quién es quién y el bucle) está en el [README](./README.md); lo que falta decidir, en
[pendientes](./pendientes.md).

Los ids entre comillas invertidas son las líneas del guion de hoy: `casa-*`, `anom-*`, `dentro-*`,
`voz-*`, `reclamo-*`, `orden-*` y `leccion-*` en `src/app/integrada-vista/prologo-guion.ts`, y
`c0-*` a `c12-*` en `src/app/integrada-vista/cinematicas/cinematicas-datos.ts`. Los desafíos se
nombran como en las rutas de hoy (`signalsRoutesTree` en `src/app/app.routes.ts`): concepto y
sub-nivel, contando el sub-nivel desde 1.

## Principios

- **No existe "Nivel N".** Quien juega ve lugares y momentos de la historia, no un temario.
- **Cada concepto entra cuando la historia lo necesita**, y cada desafío es un aparato del mundo (una
  caja, una baliza, un repetidor), no un ejercicio suelto.
- **Propuesta:** la primera interacción llega antes de los 60 segundos. Hoy hay que pasar el aviso,
  la colina, el prólogo (3 min 17 s, 60 líneas) y el par de Tusi antes del primer desafío.
- **Siguen las reglas del guion** (`REGLAS_GUION` en `cinematica-guion.ts`): ocho palabras por línea
  en pantalla, sin raya, y el reloj derivado del texto (`armarReloj` en `prologo-guion.ts`).
- **Siguen las reglas de juego de
  [ADR 0002](../adr/0002-capa-de-juego-cinematicas-partida-y-sonido.md)**: silencio al acertar y,
  salvo lo que se decida sobre el final, no se bloquea el avance.

## Mapa

| Etapa                    | Qué pasa                                                                                                                                              | Desafíos       |
| ------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------- | -------------- |
| La colina                | Desde el sol: "Esto es demasiado caótico." Angie contesta, piensa "Así que… Ellos ya están aquí…" y "Entonces… La hora ha llegado…", y se vuelve luz  | —              |
| Volver a casa            | Las cuatro naves y sus deseos. La exploradora, ya con los colores de Angie, los apura                                                                 | —              |
| La anomalía              | Los atrae, y "¡Activen todos los operadores!" abre el minijuego. Funciona, pero el tirón es más rápido. La exploradora queda afuera                   | 3 nuevos       |
| El manual de a bordo     | "¡Rápido, el manual de a bordo!": cinco páginas en la cabina                                                                                          | 0/1 a 0/5      |
| Adentro                  | Caos y esquives, hasta "Esto es demasiado caótico."                                                                                                   | —              |
| La voz y Angie           | El mismo intercambio de la colina, ahora desde la cabina. Llegan sus luces, "El caos es orden", el par de Tusi, el pacto, y Signal Space con su árbol | 0/6            |
| Arco I · Aprender a leer | La caja que avisa · La molécula punteada · La baliza · Las coordenadas gemelas                                                                        | 1/1 a 4/2 (15) |
| Arco II · La banda vieja | El mapa de rutas · La transmisión · El repetidor · Los pipes se traducen                                                                              | 5/1 a 8/4 (13) |
| Arco III · La verdad     | La antena · La tormenta · Quien lee, avisa (penúltima etapa: la revelación)                                                                           | 9/1 a 11/1 (6) |
| La salida                | Desafío final de signals y RxJS. La tripulación pone sus operadores, Angie pone signals                                                               | nuevo          |
| Epílogo                  | La colina, todos juntos                                                                                                                               | —              |

## La apertura

### La colina

Es lo primero que se ve, y es un adelanto: pasa al mismo tiempo que la llegada de la voz en el
prólogo, contada desde el lado de Angie.

1. Mañana en la colina. Angie, sentada en la piedra, mira el sol con melancolía, como hoy.
2. Desde el sol, lejano: "Esto es demasiado caótico." Es el capitán, adentro de la anomalía.
3. Angie contesta en voz alta: "Supongo que sí… Desde su perspectiva puede ser caótico."
4. Piensa: "Así que… Ellos ya están aquí…"
5. Piensa: "Entonces… La hora ha llegado…"
6. Se desarma en luz, y las luces van al sol, como hoy.

Los pasos 2 y 3 dicen exactamente lo mismo que en "La voz y Angie": así, cuando la tripulación los
dice, se reconocen. Cada línea la pasa quien juega con un toque, como los pensamientos. No hay cartel
de "Un rato antes…": el prólogo arranca directo, como antes (H6).

Está hecho (2026-11-08). El texto vive una sola vez, en
`src/app/integrada-vista/intercambio-del-sol.ts`, y lo toman la colina y el guion del prólogo. La voz
del sol suena con los blips del capitán y su globo tiene el borde cortado de las transmisiones; el
de Angie es un globo de diálogo, no una nube.

### Volver a casa

Es el acto 0 del prólogo, sin cambios de fondo: las cuatro naves, los deseos (`casa-volver`,
`casa-familia`, `casa-helado`), el deseo cortado (`casa-unas`), la exploradora que los apura
(`casa-apuren`) y "Siempre tan aguafiestas." (`linea-msxheigk`). La exploradora ya lleva los colores
de Angie.

### La anomalía y el minijuego de operadores

Es el acto 1 hasta la orden del capitán: `anom-que-pasa`, `anom-sin-control`, `anom-atraidos` y
"¡Activen todos los operadores de RxJS, rápido!" (`anom-rxjs`). Ahí se abre el minijuego: tres
huecos cortos, uno por nave, para **completar el hueco** eligiendo el operador (J2).

El minijuego reusa `ManipulableChallenge` (`src/app/libs/manipulable-challenge.ts`). El hueco es la
perilla, las opciones son sus posiciones, y la primera es la rota, como en los 40 desafíos de hoy.
Cada hueco entra en el `SHAPE` actual: una perilla, hasta dos lecturas y hasta seis renglones de
código.

Está hecho (2026-11-08), en `src/app/integrada-vista/operadores-del-prologo.ts`:

| Nave    | Hueco              | Código                                    | Opciones, la rota primero                                                                                             | Lectura      |
| ------- | ------------------ | ----------------------------------------- | --------------------------------------------------------------------------------------------------------------------- | ------------ |
| Capitán | Corregir el rumbo  | `lecturas$.pipe(▢(p => p - deriva))`      | `filter` (usa la cuenta para filtrar, no corrige) · `tap` (hace la cuenta y la tira) · `map`                          | desvío       |
| Nave A  | Acumular el empuje | `empuje$.pipe(▢((vel, e) => vel + e, 0))` | `reduce` (emite recién al completar, y el motor no completa) · `map` (su segundo argumento es el índice) · `scan`     | velocidad    |
| Nave B  | Sensores saturados | `sensores$.pipe(▢(100), map(corregir))`   | `debounceTime` (en una ráfaga que no para, no emite nunca) · `bufferTime` (`corregir` recibe listas) · `throttleTime` | correcciones |

La historia se frena en la orden, con la escena viva, y espera. El hueco aparece en una hoja en el
centro, sobre un velo, con la orden del capitán debajo. La hoja dice qué es cada nombre del código,
qué tiene que salir y la meta de la lectura. Cada hueco se puede saltear, así que nunca traba (ADR
0002), y no hay cartel de acierto: cuando el código queda sano, la hoja se aparta, la nave dispara su
operador y la anomalía contesta con un golpe. Angie todavía no puede intervenir, así que la ayuda al
fallar la da otra nave: dice qué hizo el operador elegido, nunca cuál es el bueno.

| Hueco              | Ayuda la… | Qué dice al fallar                                                        |
| ------------------ | --------- | ------------------------------------------------------------------------- |
| Corregir el rumbo  | Nave A    | `filter` solo decide si la lectura pasa · `tap` hace la cuenta y la tira  |
| Acumular el empuje | Nave B    | `reduce` avisa recién cuando el motor se apaga · `map` no guarda nada     |
| Sensores saturados | Capitán   | `debounceTime` espera un silencio que no llega · `bufferTime` arma listas |

Quien arranca el prólogo más adelante con `?prologo=` no pasa por el minijuego.

Cada hueco resuelto se nota en la nave, pero el tirón crece más rápido: "Los pipes están recargando
energía." (`anom-pipes`) y "No funcionará, es demasiado lento." (`anom-lento`). Que los operadores
funcionen y no alcancen es la idea: el problema no es RxJS, es que el mundo cambió. `debounceTime`
vuelve en "La tormenta", donde sí es la respuesta.

Después, la exploradora queda afuera: de `expl-que-pasa` a `expl-vuelvan`.

### El manual de a bordo

Mientras se acercan, el capitán pide: "¡Rápido, el manual de a bordo!" (línea nueva). Es el libro de
la nave en el espacio Zone.js, y explica cómo funciona su pantalla en casa. Sus cinco páginas son los
desafíos 1 a 5 de la Introducción de hoy, con la estética de la cabina y a modo de estudio:

| Página | Hoy                                                      | Qué le dice a la tripulación                                         |
| ------ | -------------------------------------------------------- | -------------------------------------------------------------------- |
| 1      | "El HTML es un árbol de nodos." (`html-to-tree`)         | La pantalla de la nave es un árbol                                   |
| 2      | "El DOM está vivo." (`dom-is-alive`)                     | Cambiar un nodo cambia la pantalla                                   |
| 3      | "No todo cambio cuesta lo mismo." (`dom-to-pixel`)       | Algunos cambios frenan la pantalla                                   |
| 4      | "A mano, te olvidás un lugar." (`manual-sync-pain`)      | Por eso el panel sigue marcando la velocidad vieja                   |
| 5      | "Zone.js revisa todo el árbol." (`old-change-detection`) | Pero Zone.js solo ve lo que parchea, y la anomalía no está parcheada |

La página 5 desemboca en "Debería ser imposible. Esto contradice todas las leyes del espacio
Zone.js." (`anom-leyes`).

Está hecho (2026-11-09), en `src/app/integrada-vista/manual-de-a-bordo.ts`. La línea nueva es
`anom-manual`, entre `anom-velocidad` y `anom-leyes`. La historia se frena al final de la orden, con
la escena viva, y el manual se abre en una hoja de papel sobre el velo. Cada página monta la pantalla
de hoy entera (la demo y su desafío), cargada diferida, con lo que le dice a la tripulación arriba.
Se puede ir y volver, y "Cerrar el manual" en la página 5 sigue con `anom-leyes`. No pide resolver
nada para avanzar (ADR 0002). Las cinco pantallas salieron de la molécula: la Introducción queda con
un solo sub-nivel, "El signal avisa quién lo lee.", que pasa a la historia con La voz y Angie.

El manual también se abre suelto desde la bitácora, sin la escena: así lo lee quien salteó el
prólogo, y cualquiera que quiera volver a una página.

### Adentro

Es el acto 2, más corto: de `dentro-vivos` a `dentro-rendicion`. Cierra con "Esto es demasiado
caótico." (`dentro-caotico`), la línea que ya se escuchó desde el sol.

### La voz y Angie

1. La voz contesta lo mismo que en la colina: "Supongo que sí… Desde su perspectiva puede ser
   caótico."
2. "¿Escucharon eso?" (`react-escucharon`) y "¿Quién ha hablado?" (`react-quien`).
3. Llegan las luces de la colina y chocan, y Angie aparece. Hoy el choque cae en
   `reclamo-quien-eres`.
4. "El caos es orden." y su tesis (`orden-caos-es-orden`, `orden-no-comprenden`,
   `orden-malinterpretado`), con el par de Tusi como demostración: dos círculos de movimiento
   uniforme.
5. El pacto, de `leccion-entiendes` a `leccion-reglas`. Con el lore nuevo, "No puedo intervenir con
   ustedes." es el bucle.
6. Angie les presenta Signal Space y les muestra cómo se actualiza el árbol: el desafío 6 de la
   Introducción de hoy, "El signal avisa quién lo lee." (`signals-change-detection`). Es el mismo
   árbol de la página 5, pero ahora se encienden solo los dos nodos que leen el valor: en casa se
   revisaban 7, en Signal Space se revisan 2.

## El cuerpo: tres arcos

La meta de la tripulación cambia en el camino, y eso ordena los arcos: primero entender el mundo para
moverse, después comunicarse con la exploradora, y al final, la verdad.

Cada etapa lleva qué quiere la tripulación, la ley (la de hoy, de `cinematicas-datos.ts`), el objeto
de mundo (sacado de las cinemáticas actuales), el giro y la pista que siembra.

### Arco I · Aprender a leer

Angie enseña las reglas básicas, y la tripulación quiere entender el mundo para poder moverse.

| Etapa                   | Ley                                                   | Objeto                       | Giro                                                        | Pista                               | Desafíos            |
| ----------------------- | ----------------------------------------------------- | ---------------------------- | ----------------------------------------------------------- | ----------------------------------- | ------------------- |
| La caja que avisa       | Un valor avisa solo a quien lo lee.                   | La caja ámbar                | El panel de una nave se entera del cambio y el de otra no   | —                                   | Signals, 1/1 a 1/7  |
| La molécula punteada    | Un derivado no se toca: sigue a su fuente.            | La molécula punteada         | "Rumbo es velocidad más viento": la suma a mano queda vieja | —                                   | Computed, 2/1 a 2/3 |
| La baliza               | El que actúa repite cuando cambia lo que leyó.        | La baliza coral              | Salir a hacer algo deja rastro                              | —                                   | Effects, 3/1 a 3/3  |
| Las coordenadas gemelas | Antes de avisar, el valor compara: ¿cambió de verdad? | Las coordenadas y la balanza | "¿Idénticas para quién?"                                    | Angie nombra el helado de chocolate | Igualdad, 4/1 y 4/2 |

### Arco II · La banda vieja

La meta cambia: hay algo en la banda vieja, y la tripulación quiere comunicarse con la exploradora.

| Etapa                 | Ley                                                     | Objeto                              | Giro                                                                                               | Pista                         | Desafíos                     |
| --------------------- | ------------------------------------------------------- | ----------------------------------- | -------------------------------------------------------------------------------------------------- | ----------------------------- | ---------------------------- |
| El mapa de rutas      | Podés pisar un derivado; su fuente lo reinicia.         | El mapa de rutas                    | Eligen a mano una ruta hacia el borde donde se oye la banda                                        | A Angie se le escapa "lentos" | Linked, 5/1 y 5/2            |
| La transmisión        | Un dato que viaja tiene estado: cargando, error, valor. | El estado en viaje y los paquetes   | El pico del viaje: la primera transmisión de la exploradora, "…cap… ¿me… reciben?…" (`c6-reciben`) | Angie calla                   | Resource, 6/1 a 6/3          |
| El repetidor          | Un aparato recibe por un borde, avisa por otro.         | El repetidor                        | Arman un aparato para hablar con la exploradora                                                    | Angie sabe la frecuencia      | Inputs y outputs, 7/1 a 7/4  |
| Los pipes se traducen | Pantalla y streams también se leen como valores.        | Los pipes en la esclusa y el puente | "No los tiren. Se traducen." (`c8-traducen`): sus operadores vuelven a servir                      | —                             | Queries e interop, 8/1 a 8/4 |

### Arco III · La verdad

| Etapa            | Ley                                                | Objeto                              | Giro                                                                                                          | Pista                                                   | Desafíos                |
| ---------------- | -------------------------------------------------- | ----------------------------------- | ------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------- | ----------------------- |
| La antena        | Para medir la pantalla, esperá a que esté pintada. | La antena del repetidor             | Apuntan el repetidor: hay que medir después de pintar                                                         | —                                                       | After render, 9/1 y 9/2 |
| La tormenta      | Ante una ráfaga de avisos, actuá cuando se calme.  | La ráfaga en la banda               | La exploradora habla a pedazos: "¡sector ocho!" (`c10-sector`)                                                | "Ella todavía no terminó de hablar." (`c10-no-termino`) | Debounce, 10/1 a 10/3   |
| Quien lee, avisa | Nadie revisa todo el árbol: quien lee, avisa.      | El árbol completo; Zone.js se apaga | **Penúltima etapa.** Responden la pregunta del viaje ("¿Quién le avisó a la pantalla?") y llega la revelación | —                                                       | Zoneless, 11/1          |

#### La revelación (borrador)

La banda por fin está limpia. La exploradora, desde afuera, avisa que va a entrar. El borrador ya
cumple las reglas del guion (ocho palabras por línea, sin raya):

| Quién       | Línea                                    |
| ----------- | ---------------------------------------- |
| Exploradora | No los encuentro. Voy a entrar.          |
| Nave A      | ¡No! ¡Quedate afuera!                    |
| Angie       | Va a entrar igual.                       |
| Capitán     | ¿Cómo lo sabés?                          |
| Angie       | Porque entré.                            |
| Nave A      | ¿Exploradora?                            |
| Angie       | Llegué antes que ustedes. Mucho antes.   |
| Angie       | No podía decirlo. Ella tenía que entrar. |
| Nave A      | Siempre tan aguafiestas.                 |

## La salida

Es el desafío final: un sistema que mezcla signals y RxJS, para completar con varios huecos. La
tripulación pone lo suyo (operadores) y Angie lo suyo (signals): "Nada de lo suyo sobra" (`c8-reves`)
deja de ser consejo y pasa a ser la salida. Angie, ya libre, interviene por primera vez: "Ahora sí
puedo intervenir." (línea nueva).

Toma de 6/2 (`rxResource`), de 8/2 (`toSignal`, `toObservable` y `untracked`) y de 10/1
(`debounceTime` con `switchMap`), y vuelven los operadores del minijuego: los que al principio no
alcanzaban, ahora funcionan traducidos a signals. El sistema concreto está en
[pendientes](./pendientes.md).

## Epílogo

La colina otra vez, ahora con todos. Helado de chocolate y el deseo que quedó cortado (falta decidir
qué era). Angie ya no mira el sol con melancolía. "Este mundo también es casa." (`c12-casa`).

## Los 40 desafíos

| Etapa                   | Desafíos de hoy                                                                                                                                                                                    |
| ----------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| El manual de a bordo    | 0/1 El HTML es un árbol de nodos. · 0/2 El DOM está vivo. · 0/3 No todo cambio cuesta lo mismo. · 0/4 A mano, te olvidás un lugar. · 0/5 Zone.js revisa todo el árbol.                             |
| La voz y Angie          | 0/6 El signal avisa quién lo lee.                                                                                                                                                                  |
| La caja que avisa       | 1/1 Variables (repaso pre-signals) · 1/2 Qué es un signal · 1/3 Tipos de signal · 1/4 Leer un signal: el getter () · 1/5 Writable Signal · 1/6 Update Signal · 1/7 Read-only signals: asReadonly() |
| La molécula punteada    | 2/1 Computed signals · 2/2 Dependencias dinámicas · 2/3 Perezoso y memoizado                                                                                                                       |
| La baliza               | 3/1 Dependencias del effect · 3/2 Intervalo filtrado · 3/3 Limpieza con onCleanup                                                                                                                  |
| Las coordenadas gemelas | 4/1 Igualdad por defecto (Object.is) · 4/2 Función equal custom                                                                                                                                    |
| El mapa de rutas        | 5/1 linkedSignal: reinicio con la fuente · 5/2 linkedSignal: preservar si sigue válida                                                                                                             |
| La transmisión          | 6/1 resource(): loader con Promise · 6/2 rxResource(): stream de RxJS · 6/3 httpResource(): pedir por URL                                                                                          |
| El repetidor            | 7/1 input() y output() basados en signals · 7/2 model(): binding two-way con [(value)] · 7/3 input.required() y transform · 7/4 Formularios con signals                                            |
| Los pipes se traducen   | 8/1 viewChild() como signal · 8/2 toSignal() · toObservable() · untracked() · 8/3 viewChildren() como signal · 8/4 contentChild() y contentChildren()                                              |
| La antena               | 9/1 afterRenderEffect(): medir el DOM · 9/2 effect((onCleanup) => …)                                                                                                                               |
| La tormenta             | 10/1 Debounce con RxJS · 10/2 Debounce a mano (effect + onCleanup) · 10/3 debounced() nativo                                                                                                       |
| Quien lee, avisa        | 11/1 Change detection sin Zone.js                                                                                                                                                                  |

Son 6 + 15 + 13 + 6 = 40. Los desafíos que quizá conviene mover o juntar están en
[pendientes](./pendientes.md).

## Lo que se reusa y lo que se rehace

| Se reusa                                                                      | Por qué                                                                  |
| ----------------------------------------------------------------------------- | ------------------------------------------------------------------------ |
| `libs/manipulable-challenge.ts`, los 12 `*-systems.ts` y su barrido de los 40 | Son la lógica de cada desafío, ya probada como función pura              |
| `libs/cd-tree.ts`                                                             | El árbol de las páginas 5 y 6 y de Quien lee, avisa                      |
| `libs/partida.ts`                                                             | El guardado, con una versión nueva                                       |
| `libs/sonido.ts`, `libs/resorte.ts`, `libs/muelle.ts`, `libs/rastros.ts`      | El sonido, los resortes, el reloj de muelles y los rastros de los toques |
| `armarReloj` (`prologo-guion.ts`) y `REGLAS_GUION` (`cinematica-guion.ts`)    | El reloj derivado del texto y las reglas del guion                       |
| Las naves del prólogo, la colina, el aviso, `mascota-viva` y el par de Tusi   | Ya son la estética nueva                                                 |
| La ley de cada capítulo                                                       | Son las reglas que Angie promete enseñar                                 |

| Se rehace                                    | Por qué                                         |
| -------------------------------------------- | ----------------------------------------------- |
| `molecule-engine.ts` (el recorrido molécula) | Es la UI de los niveles                         |
| Las 40 pantallas de los desafíos             | Pasan a ser aparatos del mundo                  |
| `cinematicas/escenas/`                       | Las cinemáticas por capítulo pasan a ser etapas |
| La bitácora, `/cine/<n>` y la URL `?nivel=`  | Están atadas a la forma de 0 a 11               |
