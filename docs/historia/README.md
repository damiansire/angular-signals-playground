# La historia: canon

Lo que es verdad en el mundo de _Las aventuras de Angie por el SignalVerso_. Este archivo manda: si
un guion, una escena o un comentario lo contradice, se corrige el otro, o se discute acá primero.

- [Recorrido](./recorrido.md): la historia de la colina al epílogo, etapa por etapa, con los 40
  desafíos ubicados.
- [Pendientes](./pendientes.md): lo que falta cerrar, cada punto con su propuesta.
- [ADR 0003](../adr/0003-historia-continua-angie-es-la-exploradora.md): la decisión de pasar de
  niveles a una historia continua.

Estado: borrador vivo, decidido con Damian el 2026-11-08. Lo marcado como **propuesta** todavía no
está decidido.

## La historia en un párrafo

Cuatro naves vuelven a casa por el espacio Zone.js. Una anomalía arrastra a tres hacia Signal Space;
la cuarta, la exploradora, queda afuera. Adentro no sirve ningún operador de RxJS, y una voz les dice
que lo que ven como caos es armonía. La voz toma cuerpo: es Angie, y les enseña las reglas del mundo.
La tripulación aprende e intenta comunicarse con la exploradora. Al final descubre que Angie _es_ la
exploradora: entró a buscarlos, el mundo la dejó mucho antes, y los esperó. Con lo que aprendieron, y
con ella ya libre de ayudar, escapan del caos y se quedan a vivir en su mundo.

## El SignalVerso

Es el universo entero, y tiene dos lugares:

| Lugar               | Qué es                          | Cómo funciona                                                                                                                                                                                 |
| ------------------- | ------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Espacio Zone.js** | Casa: de donde vienen las naves | Zone.js revisa todo el árbol después de cada evento, y ahí funcionan los operadores de RxJS. RxJS son las herramientas, no el lugar                                                          |
| **Signal Space**    | El mundo de Angie               | Sigue reglas: nadie revisa todo, quien lee avisa. Con ojos de Zone.js se ve como caos (moléculas, partículas que casi los matan); desde el ángulo correcto es armonía (la colina, los dos círculos de Tusi) |

**Propuesta:** el sol de la colina es la anomalía vista desde Signal Space. Desde la armonía, el caos
brilla como un sol. Por eso de ahí llega la voz del capitán, y por eso ahí van las luces de Angie.

## Personajes

| Quién          | En el guion              | Qué lo define                                                                                                                       |
| -------------- | ------------------------ | ----------------------------------------------------------------------------------------------------------------------------------- |
| Capitán        | `cap`                    | Da las órdenes y hace las preguntas que abren cada concepto ("¿Y quién le avisó a la pantalla?")                                     |
| Nave A         | `naveA`                  | "Extraño a mi familia." y el deseo que quedó cortado: "Y yo quiero unas…". Es la que le dice "Siempre tan aguafiestas" a la exploradora |
| Nave B         | `naveB`                  | "Yo quiero comer helado de chocolate."                                                                                              |
| La exploradora | `nave4`                  | La impaciente: "¡Oigan! Dejen de desear y apúrense, van muy lento." Queda afuera de la anomalía                                      |
| Angie          | `voz`, después `mascota` | La gema que espera en la colina, y es la exploradora. Habla tranquila, enseña sin apurar y no dice quién es hasta la penúltima etapa |

Angie es **ella**.

La exploradora era la impaciencia; Angie es la paciencia que le dejó la espera. Por ese cambio la
tripulación no la reconoce: tiene otra forma (en Signal Space es una gema, no una nave) y otro
carácter. Lo único que no cambió son los colores: desde el 2026-11-08, la nave de la exploradora
lleva la paleta de Angie, en el prólogo y en las cinemáticas.

## La línea de tiempo: el bucle

Las dos columnas cuentan la misma historia, cada una desde un lado. Para la tripulación pasan minutos
entre la anomalía y la voz; para la exploradora pasa muchísimo tiempo.

| La tripulación                                                                                    | La exploradora, después Angie                                                                                                                                                         |
| ------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Vuelven a casa con la exploradora                                                                 | Vuelve a casa con ellos y los apura                                                                                                                                                   |
| La anomalía los arrastra a Signal Space                                                           | Queda afuera y los ve irse                                                                                                                                                            |
| Adentro hay caos y no sirve ningún operador                                                       | Desde afuera, intenta comunicarse                                                                                                                                                     |
| Escuchan una voz: "Supongo que sí…"                                                               | Ya es Angie y está en la colina. Escucha desde el sol "Esto es demasiado caótico", contesta, piensa "Ellos ya están aquí…" y "La hora ha llegado…", y va hacia ellos hecha luz      |
| Angie aparece frente a ellos y les enseña las reglas                                              | Les enseña sin decir quién es: no puede intervenir                                                                                                                                    |
| Reciben transmisiones de la exploradora desde afuera                                              | Su yo de afuera transmite. Angie sabe qué dice y cómo termina cada mensaje                                                                                                            |
| **Penúltima etapa:** la exploradora avisa que va a entrar, y Angie dice "Porque entré."           | Su yo de afuera entra. Signal Space la deja mucho antes en su tiempo, y ahí empieza la espera en la colina. El bucle se cierra                                                         |
| El desafío final: escapar del caos                                                                | Ya puede intervenir, y los ayuda                                                                                                                                                      |
| Epílogo: viven en su mundo                                                                        | Ya no espera a nadie                                                                                                                                                                  |

## Las reglas del bucle

1. **Angie no puede intervenir antes de que su yo de afuera entre.** Si los saca antes, su yo de
   afuera nunca entraría, y ella nunca habría estado ahí para sacarlos. Eso significan "No puedo
   intervenir con ustedes." y "Ustedes deben seguir su curso natural." (`leccion-no-intervengo`,
   `leccion-curso`).
2. **Sabe todo lo que la exploradora dijo y va a decir**, porque lo vivió.
3. **No se revela**: no da su nombre de exploradora ni cuenta de dónde viene.
4. **Después de la revelación, ya puede ayudar.** El final es la primera vez que interviene.

## Por qué la melancolía

En la colina, Angie mira el sol con una melancolía que hasta ahora no tenía causa. Ahora la tiene:
los esperó sola muchísimo tiempo, sabe todo lo que va a pasar, y va a tener que verlos intentar
comunicarse con la amiga que tienen al lado, sin poder decírselo.

## Pistas sembradas

Permiten adivinar la revelación antes de que llegue. Ninguna lo dice; juntas lo cuentan.

- **Los colores.** La nave de la exploradora tiene la paleta de Angie.
- **"Lentos".** Es la muletilla de la exploradora: "van muy lento" (`casa-apuren`), "Salgan de una
  vez, lentos." (`c12-lentos`). A Angie se le escapa una vez.
- **El helado.** Angie nombra el helado de chocolate, que nadie le contó.
- **El silencio.** Cuando llega la primera transmisión de la exploradora, Angie calla.
- **La frecuencia.** Angie sabe la frecuencia del repetidor que arman para hablar con la exploradora.
- **"Ella todavía no terminó de hablar."** (`c10-no-termino`): sabe cómo termina el mensaje.

## Frases que ya existen y cambian de sentido

Con el lore nuevo, varias líneas del guion actual se leen distinto la segunda vez:

| Línea                                             | Dónde                               | Lo que significa ahora                                  |
| ------------------------------------------------- | ----------------------------------- | ------------------------------------------------------- |
| "Siempre tan aguafiestas."                        | `linea-msxheigk`, `c12-helado`      | Era un reproche; en la revelación vuelve como cariño    |
| "No puedo intervenir con ustedes."                | `leccion-no-intervengo`             | No es una regla del mundo: es el bucle                  |
| "…dejar atrás lo que conocen y creen correcto."   | `leccion-dejar-atras`, `c11-atras`  | Ella ya lo hizo: dejó de ser nave                       |
| "Ella todavía no terminó de hablar."              | `c10-no-termino`                    | Lo sabe porque es ella                                  |
| "Este mundo también es casa."                     | `c12-casa`                          | El epílogo: se quedan                                   |

## Nombres

| Nombre               | Qué es                                                                                      |
| -------------------- | ------------------------------------------------------------------------------------------- |
| SignalVerso          | El universo entero. Es el título de la colina: "Las aventuras de Angie por el SignalVerso"  |
| Espacio Zone.js      | Casa                                                                                        |
| Signal Space         | El mundo de Angie                                                                           |
| El manual de a bordo | El libro de la nave: cómo funciona su pantalla en casa                                      |
| La voz               | Angie antes de tomar cuerpo: `voz` en el guion, sin nombre ni caja                          |
| Angie                | Su nombre en la caja de diálogo                                                             |
| Exploradora          | Como la llama la tripulación                                                                |
