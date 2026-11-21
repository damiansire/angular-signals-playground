# Guion paso a paso: todo el recorrido de la vista integrada

Foto del 2026-11-22 (commit `7511c10`). Va desde el primer cuadro de `/` hasta el último cuadro del
final: el aviso de auriculares, la colina, el prólogo con sus tres hojas (el minijuego, el manual y
el árbol), las 11 etapas del viaje, la revelación y el final. `/practica/*` queda afuera porque no
es parte del recorrido.

## Cómo se hizo

Se hizo leyendo el código, sin jugar. Los textos salen de los datos con `node scripts/guion.mjs` y
están en el anexo [guion-textos-todo-2026-11-22.md](./guion-textos-todo-2026-11-22.md). Ahí están
también el código roto y sano de cada desafío y las líneas sin voz. La coreografía la escribieron
siete lectores en paralelo, una parte cada uno, con archivo y línea. Lo que no se pudo confirmar va
marcado *(no lo pude confirmar)*. Los tiempos salen de correr `armarReloj` y los relojes de las
cinemáticas sobre el guion real, a velocidad normal y sin tocar.

## Lo más importante que apareció

Cada punto está verificado en el código, leyendo dónde se define y dónde se usa.

1. **En el final no está la exploradora.** Su nave sólo se ve con el beat `nave4-entra`, y ninguna
   línea del final (12) lo enciende. Los beats de una cinemática salen sólo de su apertura y sus
   líneas (`cinematica.component.ts:360-361`), así que no pasan de la revelación al final. En el
   final completo salen tres naves y no cuatro. En el incompleto, el paso de «ir hacia la salida»
   también cuelga de `nave4-entra`, y la tripulación termina avanzando de espaldas hacia la salida
   mientras el capitán dice «Todavía no. / Este mundo también es casa.» (`escena-12.component.ts:556-661`,
   `cinematicas-datos.ts:487-544`).
2. **Entre el prólogo y la cinemática 1 aparece una pantalla congelada que ya no tiene sentido.** El
   prólogo se oculta sin fundido y debajo queda la pantalla del par de Tusi sin arrancar. La vista
   le pasa un `alEntrar` que nunca llama a `startBuild` (`integrada-vista.component.ts:817`,
   `intro-tusi.ts:452`). Se ve «Se está formando algo · 1 de 8 líneas», quieto, y el iris de la
   cinemática 1 se abre encima.
3. **Retomar el prólogo después de recargar dispara de golpe lo que ya pasó.** `arrancar` vacía
   `dichas` (`prologo-anomalia.ts:2052`), y los efectos de una sola vez se disparan con `t >= hito`
   (`:1349-1367`). Según el punto, en el primer cuadro suenan juntos el «¡pop!» del helado, los 12
   disparos con sus soplidos, los tirones, el salto y el choque. Además, se arranca 0,3 s antes de la
   línea guardada (`:2249`) y entre líneas hay 0,22 s, así que la línea anterior se vuelve a decir
   entera y su voz se pisa con la siguiente.
4. **En las cinemáticas, tocar ▸ antes de que termine una voz las encima.** `avanzar()` no calla la
   voz que suena y `hablar()` reproduce la siguiente sin cortar la anterior
   (`cinematica.component.ts:257-282`, `libs/sonido.ts:460-474`). En la colina pasa lo contrario: el
   triangulito «tocá para seguir» aparece cuando el texto terminó de escribirse, pero el toque recién
   pasa cuando termina la voz. Un toque en ese hueco «completa», corta la voz a la mitad
   (`sonido().callar()`) y no pasa (`inicio-angie.ts:253-255`, `:547-551`). Hace falta otro toque.
5. **Con movimiento reducido se pierde casi toda la historia de la apertura.** La colina se saltea
   entera (`inicio-angie.ts:652`). El prólogo salta de parada en parada (`saltoQuieto`): no se ve
   ni se oye nada entre el comienzo y el minijuego, ni entre el manual y «Miren el árbol.». Así,
   «Guarden esa pregunta» pide guardar una pregunta que nunca se hizo.
6. **Se usan cosas antes de enseñarlas.** El código sano de 1/1 ya usa `total.set(total() + 1)`,
   pero el getter llega en 1/4 y `set` en 1/5. 1/2 se arregla dentro de un `effect` (capítulo 3) y
   1/3 rompe con un `computed` (capítulo 2). 8/1 se arregla con `afterRenderEffect`, que se enseña
   en 9/1 (`queries-systems.ts:22`).
7. **La pista de la frecuencia no cierra.** Angie dice «Pásenle la ciento cuarenta y dos»
   (`cinematicas-datos.ts:260`). En la escena, la ficha dice 88 y el cambio es a 104
   (`escena-07.component.ts:148-165`), y el dial de 7/5 va de 88 a 108, así que 142 no entra. Angie
   además dice esa línea antes de aparecer en escena.
8. **Angie se llama «Mascota» en todas las cinemáticas** (`cinematica.component.ts:46`), también
   cuando dice «Porque entré.». En el prólogo se llama «Angie».
9. **Varias líneas de la tripulación no dicen lo que enseña la página, o repiten la cinemática.** En
   1/3 se pregunta «¿Qué cosas entran en la caja?» y la página enseña escribibles contra solo
   lectura. 6/1, 6/3 y 8/2 festejan algo distinto de lo que se arregló (en 8/2 el arreglo es
   `untracked` y se festeja `toSignal`). Las llegadas a 5/1 y 7/1 repiten, con el mismo mp3, la línea
   que acaba de sonar en la cinemática.
10. **La documentación de la historia describe cosas que ya no existen.** `docs/historia/recorrido.md`
    y `docs/sonido.md` nombran la bitácora, el mapa y la molécula (retirados por ADR 0019 y 0021).
    Dicen que el manual se abre en una hoja de papel con «Cerrar el manual» y que no pide resolver
    nada. Dicen también que el prólogo dura 3 min 17 s con 60 líneas: hoy son 67 líneas y 4 min 21 s
    de reloj. Quien saltea el prólogo no tiene dónde leer el manual ni el árbol.

## Cómo fluye el aprendizaje

1. **La primera decisión llega a los 29 s del prólogo, y después vienen 3 min 30 s de sólo mirar.**
   Antes del minijuego hay que pasar el aviso, la cámara (5,6 s sin tocar), los cuatro globos de la
   colina y 29 s de prólogo. Es mejor de lo que dice `recorrido.md`, pero hay otro tramo peor: del
   cierre del manual (`anom-leyes`) a «Miren el árbol.» hay 48 líneas en las que no se elige ni se
   hace nada. Tocar sólo hace reaccionar a las naves (parte 4, pasos 1 a 10).
2. **Lo del minijuego no vuelve.** Se arreglan `map`, `tap` y `filter`, y en la ráfaga de enseguida
   las naves disparan otros siete operadores, ninguno de esos tres y ninguno explicado (parte 2,
   paso 14). Esos operadores tampoco vuelven en el viaje. «La salida», el desafío final que los
   juntaba con signals, está diseñado pero no existe.
3. **Los 36 desafíos del viaje tienen el mismo formato y casi siempre se resuelven igual:** girar
   una vez una perilla de dos posiciones y accionar (33 de 39 contando los tres del minijuego, según
   el anexo). Con eso se puede acertar probando, sin entender. Nada traba (`puedeSeguir` siempre
   verdadero), y para el final completo alcanza una página por etapa, 11 de 36
   (`integrada-vista.component.ts:867-869`). ¿Es la idea?
4. **Hay páginas que repiten sin traer nada nuevo.** 6/2 es la misma pantalla que 6/1, con el mismo
   CSS: sólo cambia el código del costado. La limpieza de un effect se enseña tres veces (3/2, 3/3 y
   9/2). En 7/3 el `transform` nunca se ve trabajar porque la demo ya pasa números y booleanos.
5. **El manual se presenta y no vuelve.** No hay bitácora. Quien recarga después del manual lo
   vuelve a hacer entero desde la página 1, porque lo cumplido no se guarda. Quien lo saltea no tiene
   dónde leerlo.
6. **El registro cambia de «tú» a «vos» sin regla.** La historia habla de «tú» («¿Tú entiendes este
   mundo?», «si lo miras desde el ángulo correcto»), y en la misma escena se oye «¡Esquivá, rápido!».
   Las páginas y las tarjetas van en voseo («Tocá», «Corré», «Hacelo signal»). Se suman rótulos en
   inglés (`Name`, `Surname`, `ShowCount`, `Ground`/`Air`/`Sea`) y la errata «queriados» de 8/3.
   ¿Cuál es el registro que querés?
7. **Hay saltos en la continuidad de la historia.** El repetidor cambia de cuerpo entre la cinemática
   7 y la 8, y en la 8 cambia el orden de las naves. «El caos es orden» y «…partículas siguiendo las
   reglas» se dicen sobre un fondo vacío, porque el patrón se apaga con el choque y vuelve recién al
   final (parte 4). El silencio de Angie en la cinemática 6, que es una pista, no se nota: Angie
   simplemente no está en escena.

## Preguntas para Damian

No son errores: son decisiones de diseño que el guion deja a la vista.

- ¿Nada debería trabar, y alcanza una página por etapa para el final completo?
- ¿Tú o vos? ¿Para la historia, para las páginas o para las dos?
- ¿El manual y el árbol se tienen que poder volver a leer? Hoy no hay desde dónde.
- ¿El minijuego tendría que conectarse con la ráfaga y con el final?
- ¿Cuánto tiempo de sólo mirar es aceptable después del manual?

## La coreografía

### Parte 1 · El arranque y la colina

Desde que se abre `/` por primera vez, sin partida guardada, hasta que arranca la primera línea del prólogo (`casa-volver`). Todo sale del código de `integrada-vista/` (orquestador, `inicio-angie.*`, `aviso-auriculares/`, `intro-tusi.*`), de `components-draw/mascota-viva/` y de `libs/sonido.ts`.

#### Reglas que valen para toda esta parte

- **Nada suena antes de tu primer toque.** El navegador no abre el audio sin un gesto. El toque del aviso es ese gesto: si elegiste sonido, ahí se destraba (`aviso-auriculares.component.ts:262-264`). La preferencia de sonido se guarda entre visitas y vale para toda la app.
- **Nada de esta parte se guarda en la partida.** El primer punto guardado es `anom-que-pasa`, ya dentro del prólogo (`puntos-del-prologo.ts:11`). Si recargas en el aviso, en la colina o en las primeras líneas del prólogo, vuelves a empezar desde el aviso. Sólo se recuerdan el sonido y la pausa del fondo.
- **Los globos de la colina se escriben de a una letra, a 38 ms por letra** (`TECLA_MS`, `inicio-angie.ts:212`). El globo entra primero entero y después se llena: el del sol y el de Angie empiezan a escribirse a los 0,16 s y la nube de pensamiento a los 0,42 s (`inicio-angie.css:795-801`).
- **Un toque sobre un globo** (`toque-de-dialogo.ts:40-46`, `inicio-angie.ts:531-565`):
  - Si el globo está a medio escribir **o su voz todavía suena**, el toque lo completa: todas las letras saltan a la vista y se corta lo que suena (`sonido().callar()`).
  - Si ya está escrito y la voz terminó, el toque pasa al siguiente globo.
  - Después de completar hay 350 ms de respiro en los que el toque no hace nada.
  - Con teclado: Enter o Espacio en cualquier lado de la página.
  - Los toques en las fichas de arriba a la izquierda no pasan el globo.
- **El triangulito rosa que late** abajo a la derecha del globo es el «tocá para seguir». Aparece cuando el texto terminó de escribirse, más 0,9 s en la nube o 0,3 s en los globos de diálogo. (Ojo: con voz grabada, a veces aparece antes de que el toque pueda pasar; ver «Cosas raras», C1.)
- **Las voces:**
  - Los dos pensamientos de Angie suenan sólo con su grabación (`colina-presiente`, `colina-decide`). Sin grabación quedan mudos; nunca suenan con blips (`inicio-angie.ts:591-594`).
  - La frase del sol y la respuesta de Angie se dicen en voz alta. Suenan con las grabaciones del prólogo (`dentro-caotico`, voz del capitán, y `voz-supongo`) si ya bajaron. Si no bajaron, suenan con blips: los del capitán (`cap`) y los de Angie (`mascota`) (`inicio-angie.ts:240-255, 575-585`).
  - Las cuatro grabaciones se piden recién al entrar, mientras suena la radio (`inicio-angie.ts:674-678`).
- **Lector de pantalla:** cada globo se repite en un párrafo oculto con `aria-live` (`.ini__dicho`), porque el dibujo está oculto para el lector.
- **Movimiento reducido** (`prefers-reduced-motion`):
  - El aviso no hace la cámara.
  - En la colina, el título y el llamado ya están puestos.
  - Al tocar para entrar se va directo al prólogo, sin radio, sin charla y sin noche (`inicio-angie.ts:652`). Ver «Cosas raras», C3.
- **La pausa del fondo** (la segunda ficha de la colina) congela los bucles infinitos: nubes, juncos, sol, aura y ola del llamado. Las animaciones finitas las termina de golpe (`pausa-del-fondo.ts:54-79`). Se recuerda entre visitas.

---

###### 0. La carga (antes del aviso)
*Dónde:* la pestaña del navegador, en `/`.
1. **Al abrir (sin tocar)**
   - *Se ve:* primero la página en blanco: `index.html` no tiene pantalla de carga, sólo `<app-root>`. Cuando Angular monta la vista, aparece de golpe un telón liso de noche: un degradé azul oscuro que abajo pasa a malva (`.ini__telon`, `inicio-angie.css:1185-1197`).
   - *Pasa:* el telón tapa la colina, que ya está dibujada debajo, mientras baja el código diferido del aviso (`@defer (on immediate)`, `integrada-vista.component.html:534-545`). Cuando llega, el aviso reemplaza al telón sin transición.
   - *Se oye:* nada.
   - *Si el arranque falla:* si `arrancar()` tira una excepción, una pantalla crema fija tapa todo con «El recorrido no pudo arrancar», una línea de explicación y el botón «Recargar» (`integrada-vista.component.html:4-13`, `boot-fallo.css`).
   - *Sin JavaScript:* se ve sólo «Este recorrido necesita JavaScript» y un párrafo (`index.html:70-79`).

###### 1. El aviso de auriculares
*Dónde:* la noche de antes del alba, a pantalla entera, encima de la colina.
- **Fondo:** degradé de azul noche a malva, 70 estrellas que titilan cada 4 s y las más grandes brillan en cruz. Cada 11 s cruza una estrella fugaz (la primera a los 3 s). Abajo hay siluetas de lomas.
- **Centro:** Angie parada, con auriculares rosas (copas con «L» y «R») y lentes de sol, sobre un halo rosa que respira y un charco de luz bajo los pies.
- **Debajo de Angie:** el título «Ponete **auriculares** y subí el **volumen**», con las dos palabras en rosa. Más abajo, la invitación: un cursor que hace click con dos anillos y la frase «Hacé click en cualquier lado para continuar», recorrida por una ola de letras doradas cada 2,6 s. En pantallas táctiles la frase es «Tocá en cualquier lado para continuar», con un punto rosa que late en lugar del cursor.
- **Arriba a la derecha:** la ficha «Sonido», con un parlante. Si nunca apagaste el sonido, arranca prendida.
- **Atrás:** la colina no se dibuja (`visibility: hidden`) y está `inert`.
- **Foco:** queda en la invitación, así que alcanza con Enter.

1. **Al llegar (sin tocar)**
   - *Se ve:* Angie se mueve como si oyera música por los auriculares. Cada 0,6 s cabecea, cada medio compás se mece hacia un lado, marca el pulso con un pie y en el primer tiempo levanta las cejas (`escuchar.ts`, `aviso-auriculares.component.ts:192-196`). De las copas laten ondas suaves y salen notas doradas, alternando izquierda y derecha. Cada 4,6 s un destello cruza los lentes.
   - *Se oye:* nada. La música que ella «oye» es sólo de dibujo.
2. **(Opcional) Tocas «Sonido»**
   - *Pasa:* la ficha cambia a «Sin sonido» con una cruz sobre el parlante. Las copas se apagan (pierden color) y se van las ondas, las notas y el halo. A Angie se le corta la música: vuelve a su reposo, se vuelca un poco y se le caen las cejas. Desde ahí tiene vida propia: mira su lamparita, mira alrededor, cambia el peso, da un saltito, se estira o saluda cada 1,6 a 4,2 s.
   - *Si la vuelves a prender:* da un saltito y retoma el compás desde el primer tiempo.
   - Este toque no avanza (`aviso-auriculares.component.ts:248-260`).
3. **Toque en cualquier lado, con sonido**
   - Si el toque cae sobre Angie, además le sale una palabrita («¡ay!», «¡jaja!»…) con chispas.
   - *Pasa:*
     - La invitación y la ficha de sonido se desvanecen.
     - Suena la prueba (`planDeLaPrueba`): una cajita de música en re mayor.
     - A los 0 s, en el oído izquierdo: la copa L da un golpe elástico, salen ondas y notas de ese lado, aparece «Izquierda…» en dorado y Angie se vuelca a la izquierda.
     - A los 0,46 s, a la derecha: aparece «…derecha» y Angie se vuelca a la derecha.
     - A los 0,98 s, en los dos oídos: un acorde arpegiado, «¡Listo!», Angie salta, los lentes destellan fuerte y el halo estalla.
     - A los 1,46 s empieza la cámara (paso 2).
   - *Se oye:* las ocho notas de la prueba, paneadas de izquierda a derecha y después al centro.
   - *Dice:* «Izquierda…» / «…derecha» / «¡Listo!».
4. **Toque en cualquier lado, sin sonido**
   - *Pasa:* no hay prueba. La cámara empieza enseguida (paso 2).
   - *Se oye:* nada.

*Para seguir:* sólo tocar. La ficha de sonido es opcional.

###### 2. La cámara sale del ojo de Angie
*Dónde:* del aviso a la colina. No se puede tocar: el aviso queda `pointer-events: none`.
1. **Sin tocar (dura 5,6 s)** (`aviso-auriculares.ts`: `SE_CIERRA_MS` 1700, `ALEJARSE_MS` 4200, la cámara arranca a los 1,4 s)
   - *Se ve:*
     1. El título y la palabra del lado se apagan en 0,45 s.
     2. El aviso entero se aleja: se achica y su borde se redondea en un círculo blando que se cierra en el centro de la pantalla, hasta quedar en una mota.
     3. La pantalla queda del negro del ojo de Angie.
     4. A los 1,2 s la colina empieza a dibujarse debajo, todavía tapada.
     5. A los 1,4 s la cámara arranca dentro del ojo izquierdo de la Angie de la colina y se aleja con entrada y salida suaves: el ojo, la cara, Angie sentada en la piedra y por último la colina entera.
     - Mientras dura, Angie no parpadea, y los bucles del paisaje quedan quietos en su pose.
   - *Pasa:* al llegar, los bucles vuelven a moverse, el aviso se oculta y la colina se vuelve tocable. Entonces el aviso le avisa a la vista que llegó (`llego` → `alLlegarALaColina` → `revelar()`).
   - *Se oye:* el final de la prueba, si sonaba. Después nada.

###### 3. La colina, de mañana
*Dónde:* la colina a pantalla entera.
- **Paisaje:**
  - Cielo turquesa que aclara a crema, con tres nubes blancas que derivan despacio (16 s).
  - Lomas lejanas y la colina verde, con matas de pasto y flores sueltas.
  - Juncos oscuros en los dos bordes, que se mecen con viento.
  - Arriba a la derecha, el sol: gira en 70 s, los rayos se estiran en ola y respira.
- **Angie:** sentada de frente en una piedra gris en la cima, con las piernas colgando, mirando hacia el sol, melancólica. Sin auriculares ni lentes. Su lamparita tiene un aura dorada que late cada 2,4 s.
- **Arriba a la izquierda:** dos fichas redondas color crema, el parlante (sonido) y la pausa. Su texto aparece en un globito sólo al apuntarlas.

1. **Al llegar (sin tocar)** (`revelar()`, `inicio-angie.css:333-404, 526-528`)
   - *Se ve:*
     - A los 1,1 s el título empieza a caer letra por letra, cada 55 ms. Cada letra cae girada y chica y rebota a su lugar. Son dos renglones: «Las aventuras de Angie» / «por el **SignalVerso**», con «SignalVerso» en rosa; la última letra se asienta cerca de los 3,6 s. Desde los 4,2 s, «SignalVerso» se mece cada 5 s.
     - A los 3,1 s sube la bajada palabra por palabra, desenfocada y aclarándose: «Una introducción interactiva a los Signals».
     - A los 3,9 s llega abajo el llamado, letra clara con contorno verde: el cursor hace click, una ola dorada recorre «Hacé click para iniciar las aventuras» y salta una chispa ✦ que gira. En pantallas táctiles dice «Tocá para iniciar las aventuras».
     - Angie tiene vida propia sentada: mira su idea, mira alrededor, mira lejos o balancea los pies cada 1,6 a 4,2 s. Sus ojos siguen al puntero.
   - *Se oye:* la música de la colina (`musica-de-la-colina.ts`), una vuelta lenta de 16 s en re menor que se repite: re menor 9, si♭ maj7, sol m7 y la sus4. Encima, una cajita que baja de a tres notas por acorde. Si no hay sonido, la música espera, y si lo prendes con la ficha, empieza ahí.
2. **Toques antes de que termine de entrar el llamado (antes de los 4,5 s)**
   - *Pasa:* tocar el cielo suelta chispas doradas. Tocar el pasto deja una onda verde y chispas verdes. Los dos sacuden un poco a Angie (`emitirImpacto`). Tocar a Angie le saca una palabrita y la hace rebotar.
   - **No entra:** la entrada está frenada hasta que termina la animación del llamado (`inicio-angie.ts:455-467`).
   - *Se oye:* nada propio, sólo la música.
3. **(Opcional) Las fichas**
   - El parlante dice «Sonido activado · tocá para silenciar» o «Sonido silenciado · tocá para activar».
   - La pausa dice «Animaciones activas · tocá para pausar» o «Animaciones en pausa · tocá para reanudar».
   - No entran.
4. **Toque en cualquier lado (desde los 4,5 s): entrar**
   - Vale el cielo, el pasto, Angie, el llamado o la lamparita. Con teclado: Tab hasta la lamparita (botón «Entrar») y Enter. Un arrastre de más de 8 px no cuenta.
   - *Pasa* (`despedir()`, `inicio-angie.ts:645-668`):
     - El título y la bajada suben y se desvanecen en 0,28 s. Las fichas y el llamado se apagan.
     - El aura se apaga y la lamparita se prende de golpe: un destello blanco que crece y se va (0,5 s), con una onda dorada y 12 chispas.
     - Angie deja de moverse sola.
     - El sol pasa por delante de todo.
   - *Se oye:* la música de la colina se apaga en 2,4 s mientras entra un fondo grave en re, quieto: la música del presentimiento, que sigue hasta la noche.
   - Después de 0,24 s, sola: el paso 4.

*Para seguir:* tocar en cualquier lado cuando ya está el llamado.

###### 4. Angie: «Así que… Ellos ya están aquí…» (`colina-presiente`)
*Dónde:* la colina, todavía de día. El sol arriba a la derecha y Angie en la piedra.
1. **Al llegar (sin tocar)**
   - *Se ve:* del sol salen anillos de radio cortados (punteados), de a cuatro, uno cada 0,6 s. Cada uno crece hasta 4,6 veces y se apaga en 2,4 s, temblando con interferencia.
   - *Se oye:* se prende una radio con estática de fondo, chasquidos sueltos y silbidos que suben y bajan como un dial que busca. Cada anillo suena con un tono que cae y tiembla.
   - *Pasa:* 1,1 s después, sobre la cabeza de Angie salen dos burbujitas, de la chica a la grande (0 y 0,12 s), y después la nube (0,24 s), con un rebote elástico.
     - La frase se escribe a partir de los 0,42 s: «Así que… Ellos ya están aquí».
     - Los tres puntos se prenden de a uno: 0,2, 0,45 y 0,7 s después de la última letra.
     - Hacia los 2,2 s aparece el triangulito.
   - *Se oye:* además de la radio, un acorde de re menor 9 y una cajita que baja (la, fa, mi, re). Suena el pensamiento grabado de Angie (3,2 s), si ya bajó. Si llega tarde, suena cuando llega (`decirGrabada`). La radio sigue de fondo.
   - *Dice (piensa):* «Así que… Ellos ya están aquí…»
2. **Toque**
   - Antes de los ~3,6 s (lo que dura la voz más 0,4 s), el toque completa la nube y **corta la voz**.
   - Después, el toque pasa al paso 5.

*Para seguir:* tocar.

###### 5. El sol (capitán, por radio): «Esto es demasiado caótico.»
*Dónde:* la colina. El globo cuelga abajo a la izquierda del sol.
1. **Al pasar (sin tocar)**
   - *Se ve:* la nube de Angie se encoge y se va (0,2 s). La estática se apaga en 0,5 s. Los anillos del sol siguen saliendo, pero ahora enteros y quietos, sin temblor: la señal ya está sintonizada.
   - *Pasa:* con un rebote aparece el globo del sol. Es crema semitransparente, con borde punteado anaranjado y letra cursiva, y un pico que apunta al sol. Se escribe desde los 0,16 s; el triangulito aparece hacia los 1,3 s.
   - *Se oye:* cada anillo suena ahora con un tono limpio y más suave. La línea es la grabación `dentro-caotico`, la voz del capitán (3,1 s). Si no bajó, suenan blips del capitán. Sigue el acorde del presentimiento.
   - *Dice:* «Esto es demasiado caótico.»
2. **Toque**
   - Antes de los ~3,5 s, el toque completa el globo y corta la voz. Después, pasa al paso 6.

###### 6. Angie le contesta: «Supongo que sí… / Desde su perspectiva puede ser caótico.»
*Dónde:* la colina. El globo va sobre la cabeza de Angie.
1. **Al pasar (sin tocar)**
   - *Se ve:* el globo del sol se encoge y se va. Los anillos de radio se desvanecen en 0,8 s y dejan de sonar.
   - *Pasa:* aparece sobre Angie un globo de diálogo blanco, con borde verde grueso y pico hacia su cabeza, en dos renglones. Se escribe desde los 0,16 s; el triangulito aparece hacia los 2,2 s, al final del segundo renglón.
   - *Se oye:* la grabación `voz-supongo` (5,7 s), la misma de «la voz» del prólogo. Si no bajó, suenan blips de Angie.
   - *Dice:* «Supongo que sí… / Desde su perspectiva puede ser caótico.»
2. **Toque**
   - Antes de los ~6,1 s, el toque completa el globo y corta la voz.
   - Después, el toque **manda la respuesta al sol** (`enviarAlSol`, `inicio-angie.ts:601-634`):
     - El globo se condensa en su centro: se achica hasta un punto, brillando rosa (0,38 s).
     - De ese punto nace una sola luz rosa grande, que respira y sale disparada hacia el sol con una estela que crece (≈1,8 s).
     - El sol la recibe: late (1,18×) y deja una onda dorada con 8 chispas.
   - Mientras viaja la luz, los toques no hacen nada.
   - *Se oye:* nada nuevo. Sigue el acorde del presentimiento.

###### 7. Angie: «Así que… La hora ha llegado…» (`colina-decide`)
*Dónde:* la colina, que empieza a atardecer.
1. **Al llegar (sin tocar)**
   - *Se ve:* un velo de atardecer (lila arriba, rosa y durazno abajo) tiñe todo en 1,2 s; la colina queda dorada. Angie sonríe: se le levantan las cejas y la boca se abre en sonrisa. La nube vuelve a salir igual que en el paso 4, ahora con la segunda frase; la primera queda oculta en la misma nube.
   - *Se oye:* cambia el acorde a si♭ mayor 7/9 y la cajita sube (la, do, re). Suena la grabación `colina-decide` (4,2 s).
   - *Dice (piensa):* «Así que… La hora ha llegado…»
2. **Toque**
   - Antes de los ~4,6 s, el toque completa la nube y corta la voz. Después, pasa al paso 8.

###### 8. Angie se vuelve luz, cae la noche y empieza el prólogo
*Dónde:* la colina al atardecer. Desde acá no hay nada que tocar.
1. **Al pasar (sin tocar)** (`inicio-angie.ts:713-846`)
   - *Se oye:* el acorde pasa a la suspendida (la sus) y una cajita sube nota por nota, cada 0,32 s, «hacia el sol». El fondo grave se apaga en 5 s.
   - *Se ve, en orden:*
     1. La nube se va. A los 0,22 s Angie toma impulso: se aplasta y se estira (0,38 s).
     2. Estallido: una onda blanca y 12 chispas blancas desde su centro. Su sombra se borra (0,42 s).
     3. Las piezas de su dibujo salen disparadas hacia afuera y un poco hacia arriba, girando hasta ±80° (0,9 s), y quedan flotando a la deriva (0,65 s). Son las que se ven sentada de frente, una docena aprox. (el número exacto no lo pude confirmar). En un celular no se salen de la pantalla: quedan a 24 px del borde.
     4. Cuando frenan, empieza la noche: un velo azul oscuro baja en 3 s, más oscuro arriba, y la colina queda en silueta. Las estrellas se prenden de a una, con un destellito al nacer (desde 1 s después), y después titilan.
     5. A los 0,65 s las piezas, de a una cada 95 ms, se cargan de luz: se inflan y brillan en rosa, dorado, blanco o rosa claro (0,26 s). Después se condensan en un punto (0,2 s), y de ese punto nace una luz que respira y vuela al sol con una estela que se estira y acelera (≈1,8 s). Cada luz que llega hace latir al sol.
     6. Cuando llega la última luz (≈3 s después), entra un negro casi total (#07080c, 0,6 s). Encima, en el sol, un destello enorme crema y rosa se abre y se apaga (0,8 s), mientras el sol desaparece. La piedra se queda; ya no se ve.
   - *Pasa:*
     - Termina la despedida y la pantalla de inicio llama a `entrar()` (`intro-tusi.ts:451-460`).
     - Como no hay partida, `alEntrar` abre el prólogo desde el principio (`integrada-vista.component.ts:817-838`). Recién en ese momento se pide el código del prólogo (`import('./prologo-anomalia')`, `:716`).
     - Al mismo tiempo, la pantalla de inicio se funde a transparente en 0,5 s (`.gone`).
     - Cuando llega el código, el prólogo se destapa encima: el mismo negro, z-index 30. Su reloj arranca de 0 con la primera línea, `casa-volver`, del Capitán: «Al fin es hora de volver a casa.»
   - *Se oye:* la cola de la suspendida. Las voces del prólogo se piden recién al montar el prólogo.

*Para seguir:* nada; es automático.

---

#### Si ya hay partida guardada, o se entra con `?nivel=` o `?prologo=`

Lo decide `despuesDelAviso` / `entradaDeLaHistoria` (`retomar.ts`), con la partida que carga `arrancar()` (`integrada-vista.component.ts:782-788`).

- **Siempre se ve primero el aviso de auriculares.** Con algo para retomar, el aviso cambia:
  - Arriba a la izquierda aparece la ficha «Empezar de cero», en espejo con «Sonido».
  - El toque ya no hace la prueba ni la cámara, y no hay colina (ADR 0015): aplica tu elección de sonido, destraba el audio y la pantalla de inicio entera, con el aviso adentro, se funde en 0,5 s (`seguirDondeQuedo`, `aviso-auriculares.component.ts:213-227`).
  - No suena la música de la colina, ni la charla con el sol, ni la despedida.
- **Partida a mitad del prólogo** (el último punto pasado es una línea de `PUNTOS_DEL_PROLOGO`): el prólogo arranca 0,3 s antes de esa línea (`prologo-anomalia.ts:2248-2249`). El minijuego, el manual o el árbol que quedaron atrás no se repiten; si el punto es justo el de antes de uno de ellos, ese se vuelve a abrir.
- **Partida en el viaje, o prólogo ya visto:** el toque lleva al viaje donde quedaste (`viajar()`). Si estabas en la cinemática de un capítulo, la ves entera de nuevo; si estabas en una página, se abre la hoja en esa página. Al final de la historia se ve el último cuadro del final.
- **Una partida vieja que arrancaría el prólogo del principio** (una línea guardada que ya no es punto) no tiene dónde retomar: pasa por aviso y colina como la primera vez. Es el único caso en que la colina muestra su tercera ficha, «Empezar de cero».
- **`?nivel=X` / `?nivel=X&sub-nivel=Z`:** si X es un capítulo del viaje, se guarda como lugar del viaje y le gana a lo que hubiera guardado (`:785-788`). Entonces el aviso va en modo «retomar» y el toque lleva a la cinemática del capítulo X (sólo `nivel`) o a la página Z de su hoja, sin cinemática; Z se recorta al máximo. Un X que no es etapa del viaje (el 0, o algo inválido) se ignora y manda la partida.
- **`?prologo=<id de línea>`** (sólo en desarrollo, `isDevMode()`):
  - No saltea nada antes del prólogo. Sin partida pasas igual por aviso, cámara, colina y despedida, y recién al entrar el prólogo arranca desde esa línea (cualquier id, no sólo los puntos; `:735`).
  - Si la partida está en el viaje, se ignora.
  - Si la partida está a mitad del prólogo, el aviso retoma directo y la línea del link le gana a la guardada.
- **«Empezar de cero»** (en el aviso o en la colina): el primer toque cambia a «¿Borrar todo?» (en la colina, «¿Borrar todo? Tocá otra vez») en rojo durante 4 s. Un segundo toque borra la partida y recarga `/` sin query: aviso y colina como la primera vez.

### Parte 2 · El prólogo, de «Al fin es hora de volver a casa» hasta que se abre el manual

Líneas `casa-volver` … `anom-rxjs`, el minijuego de operadores (3 huecos), `anom-pipes` … `anom-manual`. Termina cuando se prende la pantalla del manual: el manual mismo y `anom-leyes` en adelante son de otra parte (el manual va ANTES de `anom-leyes` y de las `expl-*`).

Tiempos: segundos desde que arranca el prólogo, a velocidad normal y sin pausas, sacados de `armarReloj()` (`prologo-guion.ts:355`) y `anclajesDe`/`momentosDe` corridos sobre el guion real.

#### Reglas que valen para toda esta parte

- **El prólogo es una película con reloj, no un diálogo por toques.** Las líneas entran solas según `armarReloj` (`prologo-guion.ts:355`): cada una dura lo que cuesta leerla (16 caracteres/s, mínimo 0,95 s) o lo que dura su voz grabada si es más, más 0,28 s de entrada y 0,25 s de salida, y entre una y otra hay 0,22 s de aire. **Tocar no avanza, no completa ni acelera nada**: `toque-de-dialogo.ts` (completar/pasar) se usa solo en la colina y en las cinemáticas, no acá.
- **No hay botón de saltar la intro ni de velocidad.** El motor los soporta (`.prologo__skip`, `.prologo__speed`, `prologo-anomalia.ts:281-285`) pero la plantilla ya no los tiene (`integrada-vista.component.html:603-668`); el comentario dice que quedan para los tests. La barra de arriba a la izquierda tiene tres íconos redondos de 44 px: **Pausa** (también la barra espaciadora), **Sonido** y **Pantalla completa**; arriba a la derecha, **Empezar de cero** (pide «¿Seguro? Se borra todo» antes de borrar).
- **Lo único que se juega en esta parte es el minijuego.** Lo demás corre solo. Las únicas dos paradas de la historia son el minijuego (29,41 s) y el manual (50,83 s).
- **Qué hace un toque en la escena** (`alTocar`, `prologo-anomalia.ts:1795`): sobre una nave, la nave se tuerce hacia el lado contrario, salta, se aplasta y la antena se bambolea; aparece una palabrita donde tocaste («¡ey!», «¡piloto a bordo!», «¡la pintura!», «¡estoy manejando!»; si insistes más de 4 veces seguidas, «¡basta!», «¡ya va!», «¡uf!»), chispas del color de su antena y un «pip». Sobre el cielo: chispas blancas azuladas, un pip agudo, un empujoncito a las naves cercanas, y las que están a menos de 700 unidades miran ese punto 0,9 s. Durante el minijuego el velo tapa la escena y no se la puede tocar.
- **La caja de diálogo:** abajo al centro, oscura y casi opaca, con el nombre arriba en mayúsculas monoespaciadas y un puntito brillante de su color (Capitán amarillo `#ffd27a`, Nave A lila `#cbb8ff`, Nave B salmón `#ffb59a`, Exploradora rosa `#ff8ac9`), y la frase en letra grande y negrita. Entra subiendo 26 px desde abajo y creciendo de 0,86 a 1 con un rebote (0,28 s) y se desvanece en los últimos 0,25 s (`pintarDialogo`, `prologo-anomalia.ts:1425-1429`). El código entre comillas invertidas se ve como código (verde agua, monoespaciada).
- **Quién habla se nota en la escena:** la nave que toma la palabra da un saltito con aplastón y la antena se sacude (`tomaLaPalabra`, `:1060`), le salen ondas de sonido que laten y la luz de la antena titila mientras dura su línea (`:1208-1210`). Las demás la miran (`miradaDe`, `:1128`).
- **Voces:** todas las líneas de esta parte tienen voz grabada de Gemini (Capitán `es-419-podcaster-3`, Nave A `assistant-1`, Nave B `assistant-9`, Exploradora `csagent-7`, `docs/voces.md:88-91`). Se piden todas al montar el prólogo (`:310`). Si un mp3 todavía no llegó o no entra en la ventana, esa línea suena con blips del timbre de su personaje (`libs/sonido.ts:460`). La voz arranca con la caja y no espera a nada.
- **Pausa** congela todo: la escena, Angie y el zumbido, y corta la voz que está sonando (`alternarPausa`, `:2106`). Esconder la pestaña pausa solo y vuelve solo.
- **Música:** el prólogo no tiene música en este tramo. Lo que suena son las voces, los efectos de cada gag y, desde los 17,1 s, un zumbido grave (diente de sierra a 46 Hz con filtro) que crece a medida que la anomalía se acerca (`pintarAudio`, `:1334-1347`).
- **Cámara:** en pantalla apaisada se ve la escena entera, compuesta en 1600×900 con la anomalía en el centro. En una pantalla vertical la cámara se recorta a lo que piden las naves y el centro, y se desliza despacio siguiéndolas (`moverCamara`, `:912`).
- **Desde dónde se retoma** (`puntos-del-prologo.ts`): si recargas, vuelves 0,3 s antes del último de estos puntos que pasaste: `anom-que-pasa` (20,3 s), `anom-rxjs` (29,1 s) o `anom-manual` (48,5 s). Por eso el minijuego y el manual vuelven a abrirse si recargas antes de terminarlos (y el minijuego también si recargas después, ver «Cosas raras»).
- **Con movimiento reducido** (`prefers-reduced-motion`) el reloj no corre: salta directo de parada en parada (`saltoQuieto`, `prologo-escena.ts:38`). En esta parte eso significa que se abre directamente el minijuego y después directamente el manual, sin las líneas de en medio.

#### El prólogo

###### 1. `casa-volver` — Capitán: «Al fin es hora de volver a casa.»
*Dónde:* el espacio, de noche. El fondo es casi negro (el mismo de la noche de la colina, sin costura) y baja a índigo y violeta; una nebulosa violeta abajo a la izquierda y otra verde agua arriba a la derecha; unas 260 estrellitas que titilan en tres grupos y 16 estrellas grandes en cruz. A la derecha, la casa: un planeta naranja con anillo y lucecitas de ciudad en su lado de noche. En el centro, la anomalía como un punto de luz entre las estrellas (halo, un disco de tres brazos ámbar y verde que gira, dos anillos punteados, un núcleo que late). A la izquierda, la formación en cuña mirando a la derecha: el **Capitán** adelante (casco crema, banderita naranja en la antena), **Nave A** (lila) atrás arriba y **Nave B** (salmón) atrás abajo; más adelante y más arriba, la **Exploradora** (magenta). Todas con su llama encendida y piloto con ojos y cejas.
1. **Al llegar (sin tocar)** — *Se ve:* el prólogo aparece de golpe, sin fundido (`mostrar`, `:2075`). Todo deriva despacio con profundidad: las estrellas lejanas casi quietas, las grandes un poco más rápido, rocas a media distancia pasando hacia la izquierda y siluetas oscuras de rocas en primer plano (con borde violeta) pasando más rápido todavía. La formación avanza sin apuro hacia la derecha, respirando (sube y baja), y la Exploradora va y viene adelante, impaciente (`exploradora`, `prologo-escena.ts:213`). *Pasa:* a los 0,8 s entra la caja del Capitán; el Capitán da su saltito y le salen ondas. *Se oye:* el Capitán (2,9 s). *Dice:* «Al fin es hora de volver a casa.» La caja dura hasta los 4,2 s.
*Para seguir:* nada; corre solo.

###### 2. `casa-familia` — Nave A: «Extraño a mi familia.»
1. **Sin tocar (4,5 s)** — *Se ve:* la caja de Nave A. A los 0,2 s de su línea, un **corazón rosa** sale de Nave A con rebote y sube unos 90 puntos mientras se desvanece (2,2 s, `pintarGags`, `:1218`). Las otras naves la miran. *Se oye:* Nave A (1,7 s). Hasta los 6,7 s.

###### 3. `casa-helado` — Nave B: «Yo quiero comer helado de chocolate.»
1. **Sin tocar (7,0 s)** — *Se ve:* a los 0,25 s aparece sobre Nave B un **globo de pensamiento** (dos burbujitas y una nube) con un cucurucho de dos bochas de chocolate y una cereza, que entra con rebote (0,32 s) y queda flotando y meciéndose. Nave B lo mira hacia arriba (`miradaDe`, `:1125`) hasta que revienta en el paso 5. *Se oye:* Nave B (2,4 s). Hasta los 9,9 s.

###### 4. `casa-unas` — Nave A: «Y yo quiero unas papas fritas…»
1. **Sin tocar (10,1 s)** — *Se ve:* sobre Nave A, otro globo igual con un cucurucho rojo de papas fritas en abanico, que entra con rebote. Ahora flotan los dos globos. *Se oye:* Nave A (2,3 s). Su caja sigue hasta los 13,0 s, pero a los 12,5 la interrumpen.

###### 5. `casa-apuren` — Exploradora: «¡Oigan! Dejen de desear y apúrense, van muy lento.»
1. **Sin tocar (12,5 s, pisando a Nave A medio segundo)** — *Se ve:* la única superposición del guion: dos cajas lado a lado, Nave A a la izquierda y la Exploradora a la derecha. La Exploradora **se da vuelta y viene a buscarlos**: retrocede unas 330 unidades hacia la cuña bajando un poco y vuelve a su lugar (1,9 s, `prologo-escena.ts:215-220`); la nariz mira a la izquierda al ir y a la derecha al volver. A los 13,4 s (la mitad de la vuelta) el viento de su pasada **sacude a las tres naves** (`impacto`, `:1757`), **revienta el helado** (crece un 35 % y desaparece en 0,22 s, con chispas crema y la palabra «¡pop!») y **aplasta las papas** (se achatan y se apagan en 0,2 s). A los 13,0 s se apaga la caja de Nave A y la de la Exploradora se corre al centro. *Se oye:* la Exploradora (3,6 s); a los 12,75 s un «fshhh» de viento (`ruido`, `:1349`) y a los 13,4 s un pip agudo del pop. Hasta los 16,6 s.

###### 6. `linea-msxheigk` — Nave A: «Siempre tan aguafiestas.»
1. **Sin tocar (16,8 s)** — *Se ve:* Nave A pone **cara de harta** (cejas hacia abajo, ojos entrecerrados) durante su línea y 0,9 s más (`animoDe`, `:1086`). A los 17,1 s **empieza el temblor**: las tres naves de la cuña tiemblan cada vez más (sube en 1,8 s) y pasan a **cara de susto** (cejas arriba, ojos grandes); dejan de mirarse entre ellas y miran al centro, a la anomalía; la Exploradora (que no tiembla) mira al Capitán. *Se oye:* Nave A (2,5 s); desde los 17,1 s el zumbido grave arranca en cero y empieza a crecer. Hasta los 19,8 s.
2. **Al terminar la línea (19,8 s, sin tocar)** — *Pasa:* **arranca el arrastre** (`formacionAfuera`, `prologo-escena.ts:168`): la cuña deja de cruzar y empieza a caer hacia el centro, muy lento al principio y cada vez más rápido, achicándose, estirándose a lo largo y con la llama más grande. Las estrellas empiezan a curvarse hacia el centro, la anomalía empieza a crecer y su disco a girar más rápido. La Exploradora, a la que la anomalía no agarra, se aleja hacia arriba a la derecha durante 9 s y queda ahí, mirando.

###### 7. `anom-que-pasa` — Capitán: «Esperen… ¿qué está sucediendo?»
1. **Sin tocar (20,3 s, después de 0,3 s de silencio extra)** — *Se ve:* la caja del Capitán; las naves tiemblan y derivan. *Se oye:* el Capitán (2,5 s). Hasta los 23,3 s. *Pasa:* la partida guarda este punto para retomar.

###### 8. `anom-sin-control` — Nave A: «No tengo control de los sistemas.»
1. **Sin tocar (23,6 s)** — *Se ve:* la **llama de Nave A tose**: se apaga y prende a tirones durante la línea y 1,2 s más, y de su cola salen **cinco bocanadas de humo gris**, una cada 0,42 s, que suben, crecen y se disipan en 1,3 s (`:1265-1279`, `:1697-1698`). *Se oye:* Nave A (2,0 s). Hasta los 26,2 s.

###### 9. `anom-atraidos` — Nave B: «Estamos siendo atraídos.»
1. **Sin tocar (26,4 s)** — *Se ve:* la caja de Nave B; nada nuevo en la escena salvo que el arrastre y el temblor siguen creciendo. *Se oye:* Nave B (2,0 s). Hasta los 28,9 s.

###### 10. `anom-rxjs` — Capitán: «¡Activen todos los operadores de RxJS, rápido!» ⏸
1. **Sin tocar (29,1 s)** — *Se ve:* la caja del Capitán con la orden; el Capitán da su saltito. *Se oye:* empieza la voz del Capitán (4,3 s). *Pasa:* la partida guarda este punto.
2. **A los 0,3 s de la orden (29,41 s, sin tocar) — la historia se frena** (`ESPERA_OPERADORES`, `prologo-anomalia.ts:1860`). *Se ve:* un **velo oscuro** (radial, más negro en los bordes) cae sobre la escena en 0,3 s; la caja con la orden sube por encima del velo y queda a la vista, quieta y completa, todo el minijuego (`prologo-anomalia.css:328`). Entra la hoja del primer hueco (ver abajo). La escena detrás queda congelada en ese instante. *Se oye:* la voz del Capitán sigue diciendo la orden encima de la hoja (le quedan unos 4 s); el zumbido grave sigue sonando bajo todo el minijuego; no hay música.

##### ⏸ El minijuego de operadores

*Dónde:* sobre el velo, al centro, entre la barra de arriba y la caja de la orden: una **hoja de papel crema** con una franja de 6 px arriba del color de la nave que pide el arreglo. Es la misma hoja para los tres huecos: cambia el contenido, no se cierra y reabre (`hoja-del-hueco.component.ts`).

Cómo es la hoja (vale para los tres):
- **Cabeza:** el retrato de la nave (una navecita que flota y con la llama que tiembla), su nombre en su color, el título del hueco, «1 de 3» a la derecha y, debajo, el **encargo** con una diana: qué tiene que salir. «Saltar →» arriba a la derecha.
- **Juego:** primero la leyenda de los nombres del código (`v` = la velocidad que entra…). Debajo, «Desafío · tocá el código» y el bloque de 4 renglones de código; el renglón del operador es un botón. Un **óvalo naranja dibujado a mano** se traza alrededor del operador (0,45 s) y late; una **flecha naranja con «tocá acá»** lo señala desde abajo y se balancea, hasta que cambias el operador por primera vez. Abajo, la barra de prueba: las dos lecturas en gris (0 y 0), la **Meta** con su diana al lado, y el botón principal oscuro con la acción.
- **Operadores · tocá uno para usarlo:** tres botones con dibujo animado y una frase: `map` (una pastilla «10» entra a una máquina con engranaje y sale «20»: «Cambia cada valor por el resultado de la cuenta.»), `tap` (un ojo mira pasar la pastilla «10», que sigue igual: «Mira cada valor, hace algo aparte y lo deja pasar igual.»), `filter` (gotas que pasan un colador y una que rebota: «Deja pasar solo los valores donde la cuenta da verdadero.»). El que está puesto dice «en el código».
- **Lo que hacen los toques** (`manipulable-system.component.ts`, `libs/manipulable-challenge.ts`): tocar el operador en el código lo cambia al siguiente de los tres (cicla); tocar un botón del panel lo pone directo. Cambiar el operador vuelve las lecturas a 0 en gris, borra la ayuda y retraza el óvalo. Tocar la acción corre el código una vez: las lecturas se ponen **rojas** si no da la meta o **verdes** si la da. Si dio mal, aparece en la hoja la **ayuda de otra nave** (con su nombre y su color, entrando con un rebote): dice qué hizo el operador equivocado, nunca cuál es el bueno (`ayuda-del-hueco.ts:25`). Angie no ayuda: todavía no intervino.
- **Al acertar** (`alArreglarHueco`, `integrada-vista.component.ts:355`): no hay cartel ni sonido (ADR 0002). La hoja y el velo se apartan (se desvanecen en 0,25 s) y **la nave dispara su operador**: una bola de luz blanca y verde sale de su casco con el nombre del operador en letras grandes del color de su antena, viaja hacia la derecha y se apaga (1,5 s); chispas en la nave, la nave retrocede con un aplastón y a los 0,42 s un golpe sacude a las tres (`arreglado`, `prologo-anomalia.ts:1929`). A los 1,4 s vuelve la hoja (y el velo) con el hueco siguiente.
- **Saltar →** pasa al hueco siguiente sin disparo. Nada traba: se pueden saltar los tres.

###### 11. Capitán · Duplicar la velocidad (`map`)
*Dónde:* la hoja entra subiendo 12 px y creciendo, con un rebote (0,32 s); franja y nombre amarillos; «1 de 3»; recibe el foco.
1. **Al llegar (sin tocar)** — *Se ve:* encargo: «Al motor tiene que llegar `v * 2`.». Nombres: `v` la velocidad que entra; `v * 2` el doble. Código: `const turbo$ = velocidad$.pipe(` / `tap((v) => v * 2),` / `);` / `motor.acelerar(turbo$);`, con el óvalo y la flecha sobre `tap`. Lecturas «entra 0», «al motor 0» en gris. Meta: «el doble». Botón: «leer la velocidad». En el panel, `tap` dice «en el código».
2. **Toque «leer la velocidad» con `tap`** — *Se ve:* entra 10, al motor 10, en rojo. Aparece la ayuda de **Nave A**: «`tap` hace la cuenta y la tira. Al motor llega la misma velocidad.» (Cada toque más suma 10 a lo que entra.)
3. **Toque en el operador (o en un botón del panel)** — *Pasa:* `tap` → `filter` → `map` → `tap`… Las lecturas vuelven a 0 en gris, la ayuda se va, la flecha desaparece y el óvalo se retraza. Con `filter` y la acción: entra 10, al motor 10 en rojo, y Nave A: «`filter` usa la cuenta para decidir si pasa. Pasa, pero igual que entró.»
4. **Toque «leer la velocidad» con `map`** — *Se ve:* entra 10, al motor 20 en verde y el rótulo «Desafío · sano», apenas un instante: la hoja se aparta enseguida. *Pasa:* el **Capitán dispara `map`** (rótulo amarillo). *Se oye:* nada (acertar es en silencio); el zumbido sigue.
*Para seguir:* elegir `map` y tocar «leer la velocidad», o «Saltar →».

###### 12. Nave A · Ver la velocidad (`tap`)
*Lo que cambia:* la hoja vuelve (fundido de 0,25 s, sin el rebote de entrada) con franja y nombre lila y «2 de 3». Encargo: «El panel la muestra y el motor la recibe igual.» Nombre: `panel.mostrar(v)` la pone en el panel, y no devuelve nada. Código con `map((v) => panel.mostrar(v)),` y `motor.acelerar(vista$);`. Lecturas «panel» y «al motor». Meta: «los dos iguales». Vuelve la flecha. Orden del operador al tocarlo: `map` → `filter` → `tap`.
1. **«leer la velocidad» con `map`** — panel 10, al motor 0 en rojo; ayuda de **Nave B**: «`map` manda al motor lo que devuelve `mostrar`, y no devuelve nada.»
2. **Con `filter`** — panel 10, al motor 0 en rojo; Nave B: «`filter` deja pasar si `mostrar` da verdadero, y no da nada: no pasa ninguna.»
3. **Con `tap`** — panel 10, al motor 10 en verde; **Nave A dispara `tap`** (rótulo rosa).

###### 13. Nave B · Sacar el agua (`filter`)
*Lo que cambia:* franja y nombre salmón, «3 de 3». Encargo: «Al motor tiene que llegar solo combustible.» Nombres: `c` lo que trae la carga: combustible o agua; `c === 'combustible'` verdadero si es combustible. Código con `tap((c) => c === 'combustible'),` y `motor.cargar(limpio$);`. Lecturas «combustible» y «agua». Meta: «agua 0». Botón: «cargar el tanque». Orden: `tap` → `map` → `filter`.
1. **«cargar el tanque» con `tap`** — combustible 2, agua 1 en rojo; ayuda del **Capitán**: «`tap` mira la carga y la deja pasar entera, con agua y todo.»
2. **Con `map`** — combustible 0, agua 0 en rojo; Capitán: «`map` cambia cada carga por la respuesta: al motor llegan `true` y `false`.»
3. **Con `filter`** — combustible 2, agua 0 en verde; **Nave B dispara `filter`** (rótulo rojo). A los 1,4 s el velo y la hoja se van del todo (sin animación de salida: ya estaban transparentes) y **la historia sigue sola**.

###### 14. `anom-rxjs` (sigue) — la ráfaga de operadores
1. **Al cerrar el minijuego (sin tocar; 29,5 s del reloj)** — *Se ve:* la caja de la orden sigue a la vista hasta los 35,3 s. A los 0,1 s arranca la **ráfaga**: siete disparos, uno cada 0,76 s, alternando naves (Capitán `switchMap`, Nave A `retry`, Nave B `mergeMap`, Capitán `catchError`, Nave A `concatMap`, Nave B `takeUntil`, Capitán `debounceTime`). Cada uno es una bola de luz verde agua con su nombre en monoespaciada que sale del casco de su nave hacia la anomalía, abriéndose en abanico, y **se apaga a mitad de camino** con un anillito que se expande («pff»), 1,4 s de vuelo (`proyectiles`, `prologo-escena.ts:478`). Cada nave que dispara retrocede con un aplastón. *Se oye:* por cada disparo un pip cuadrado que cae de tono, y 0,9 s después un soplido corto. Hasta los 35,5 s.

###### 15. `anom-pipes` — Nave A: «Los pipes están recargando energía.»
1. **Sin tocar (35,5 s)** — *Se ve:* la caja de Nave A (se queda 4,6 s a propósito). A los 0,3 s, **cinco disparos con el rótulo `pipe`**, uno cada 0,62 s (Nave A, Nave B, Capitán, Nave A, Nave B), igual que la ráfaga: se apagan antes de llegar. *Se oye:* Nave A (2,1 s), y los pips y soplidos de cada disparo. Hasta los 40,1 s.

###### 16. `anom-lento` — Nave B: «No funcionará, es demasiado lento.»
1. **Sin tocar (40,4 s)** — *Se ve:* la caja de Nave B; la cuña sigue cayendo, ya más chica y más estirada, y la anomalía más grande. *Se oye:* Nave B (2,8 s). Hasta los 43,7 s.

###### 17. `anom-fuerza` — Capitán: «¿Qué es esta fuerza…?»
1. **Sin tocar (43,9 s)** — *Pasa:* **primer tirón**: al empezar la línea, las tres naves dan un **salto hacia el centro** y se estiran (`:1758-1771`); la anomalía **late** (crece un 14 % y vuelve, y el núcleo se agranda, en menos de medio segundo). *Se oye:* un golpe grave (52 Hz, 0,8 s) y el Capitán (2,0 s). Hasta los 46,4 s.

###### 18. `anom-velocidad` — Capitán: «Esta velocidad…»
1. **Sin tocar (46,6 s)** — *Pasa:* **segundo tirón**, más fuerte que el primero (empuje 360 en vez de 240), con el mismo latido de la anomalía. *Se oye:* un golpe más grave (46 Hz) y el Capitán (1,1 s). Hasta los 48,3 s.

###### 19. `anom-manual` — Capitán: «¡Rápido, el manual de a bordo!» ⏸
1. **Sin tocar (48,5 s)** — *Se ve:* la caja del Capitán; no hay tirón en esta línea (el tercero va con `anom-leyes`, después del manual). En este momento la cuña está más o menos a un tercio del camino al centro, al 70 % de su tamaño, temblando fuerte; la anomalía va por la mitad de su crecimiento. *Se oye:* el Capitán (1,9 s). *Pasa:* la partida guarda este punto.
2. **A los 50,83 s (sin tocar) — la historia se frena y se abre el manual** (`ESPERA_MANUAL`, `prologo-anomalia.ts:1864`). *Se ve:* la caja de diálogo desaparece (ya iba por el 60 % de su fundido; `.prologo--manual` la oculta, `manual-de-a-bordo.css:48`). La cámara **se zambulle en la pantalla de la nave**: la escena se agranda de 1 a 1,7 mientras sube un **negro** que la tapa entera (0,48 s); cuando la primera página ya está montada, la pantalla **se prende como una tele vieja**: un punto de luz, una raya horizontal, la imagen quemada de blanco que se asienta (0,62 s, `tele-del-manual.ts:34`). La barra de íconos queda por encima. *Se oye:* arranca la música para estudiar (Fa mayor, lenta; *no lo pude confirmar si entra con fundido*) y el zumbido se va en 1,2 s. Con el negro puesto la escena deja de dibujarse. **Acá termina esta parte.**

### Parte 3 · El manual de a bordo (5 páginas) y el árbol de Signal Space (0/6)

Desde que se abre la hoja del manual (al final de `anom-manual`) hasta `anom-leyes`, y desde la hoja del árbol (al final de `leccion-arbol`) hasta `leccion-guarden`. Sacado del código; las rutas son relativas a `src/app/`.

#### Reglas que valen para toda esta parte

- **Cuándo se frena la historia.** El motor del prólogo para su reloj 150 ms antes del final de la línea que abre la hoja (`ESPERA_MANUAL = M.manual - 150`, `ESPERA_ARBOL = M.arbol - 150`, `integrada-vista/prologo-anomalia.ts:1864` y `:1868`; `M.manual`/`M.arbol` son el `t1` de `anom-manual` y `leccion-arbol`, `prologo-escena.ts:123-124`). Ahí pide la hoja y espera a que se cierre. No hay botón para saltar el prólogo (`prologo-anomalia.ts:298-302`) ni Escape que cierre la hoja: se sale sólo por la última página.
- **Cómo se entra (la tele).** Las dos hojas se abren igual (`tele-del-manual.ts`): la cámara se acerca a la escena (el SVG del prólogo escala de 1 a 1,7 en 0,48 s, rápido y frenando) mientras sube un negro opaco (0,48 s). Los globos de diálogo desaparecen al instante (`.prologo--manual .prologo__dialogo { visibility: hidden }`, `manual-de-a-bordo.css:48`). Cuando la primera página ya está montada, la pantalla se prende como una tele vieja (0,62 s): un punto de luz, una raya horizontal, la imagen entera quemada de blanco que se asienta. Si la página no carga en 4 s, se prende igual. Desde que el negro tapa todo, la escena de atrás deja de dibujarse.
- **Cómo se sale.** Al tocar el botón de la última página, la nave sale volando, la pantalla se apaga al revés (0,44 s: se quema, se cierra en raya, en punto, nada), el negro se va (0,32 s) y la historia sigue desde donde se frenó. El foco vuelve al botón de pausa.
- **La pantalla.** La hoja ocupa toda la ventana, con el cielo nocturno de la lámina de borde a borde, esquinas redondeadas y un reflejo apenas visible (el vidrio visto desde adentro, `manual-de-a-bordo.css:323`). Arriba sigue la barra del juego (pausa, sonido, pantalla completa y «empezar de cero»).
- **Cada página tiene dos momentos** (`manual/pagina-del-manual.component.html`):
  - **Portada:** en el medio de la pantalla de la nave, un dibujo que se arma con rebotes (las piezas llegan de a una, 0,11 s entre cada una, y después flotan), «Ley N», el título grande, la frase de la nave en cursiva, las marcas del libro («MANUAL DE A BORDO», un punto por página: los leídos en crema, el actual largo y dorado, y «N de 5») y los botones «← Anterior» (desde la página 2) y «Leer →» (cartel dorado de papel, torcido). A la izquierda, la nave del capitán flota sobre el cielo, sin globo.
  - **Demo (después de «Leer»):** la portada se achica y sube (0,28 s), la pantalla crece con rebote hasta el tamaño de la demo (0,45 s), la ley «Ley N» y su título bajan sobre el cielo arriba a la izquierda, con la frase de la nave debajo, y las columnas de la consola entran una tras otra desde abajo. A los 0,55 s aparece el globo de la nave, arriba de ella: los pasos **1** (probar) y **2** (arreglar), el de ahora en tinta oscura y el que falta en gris, y un cartel dorado «▶ Mostrame». Un haz de luz tenue (10 %) une la nariz de la nave con su pantalla a los 0,9 s. La pestaña «← Anterior» cuelga del borde de abajo de la pantalla.
- **La mano guía.** Un guante de papel señala lo próximo que hay que tocar. Entra 1,2 s después, para que primero se lea la ley, y amaga un toque cada 1,1 s con una onda dorada hasta que lo tocas (`manual/mano-guia.component.ts`). **«Mostrame»** hace los toques por ti, con la misma mano y clics reales, y se detiene cuando la página queda resuelta (`pagina-del-manual.component.ts:226`). Con «Mostrame» se resuelve cualquier página.
- **Pasar de página.** «Siguiente página →» **aparece recién con la página cumplida** (`puedeSeguir`, `integrada-vista.component.ts:405`; ADR 0014). Llega como un vidrio verde con un salto (0,5 s), y después late, lo cruza un brillo y sus tres flechas corren hacia la derecha. Está debajo de la nave. Al tocarlo, el globo y el botón se van hacia la derecha, la nave se echa atrás, prende el motor a fondo y sale por la derecha (unos 0,84 s; el libro espera como mucho 1,6 s). La página nueva entra deslizándose 48 px desde la derecha (0,42 s), y su nave llega volando desde la izquierda, frena y se sacude. «← Anterior» no tiene vuelo: la página entra desde la izquierda. Una página que vuelves a abrir arranca de cero (portada y demo sin tocar), pero queda cumplida: después de «Leer» ya está «Siguiente».
- **Teclado.** La hoja toma el foco al cambiar de página. → y ← pasan de página si el foco no está dentro de la demo (→ sólo con la página cumplida). ↑ ↓ RePág AvPág Inicio Fin y la barra espaciadora desplazan la hoja. Escape no hace nada. La barra espaciadora no pausa la historia mientras la hoja está abierta.
- **La nave como personaje.** Cambia de cara según lo que pasa (tranquila, atenta, preocupada, contenta) y mira lo que se dibuja en su pantalla. Si la tocas, se queja con un texto que sube: «¡ey!», «¡piloto a bordo!», «¡la pintura!», y a partir del quinto toque seguido, «¡basta!» (`manual/nave-del-manual.ts:400-416`). Al resolver la página salta y le saltan estrellitas.
- **Lo que suena.** Ninguna línea de las páginas tiene voz: la ley, la frase de la nave, los pasos y las quejas se leen. Acertar no hace ruido (ADR 0002).
  - **Manual:** al abrirse arranca la música para estudiar (`musica-del-manual.ts`: fa mayor, cuatro acordes de 6 s en bucle de 24 s, notas sueltas que cambian en cada vuelta, sin percusión). El zumbido de la anomalía se va con un fundido de 1,2 s. Al cerrarse, la música se apaga en 1,5 s.
  - **Árbol:** no tiene música. Sigue sonando bajito el zumbido de adentro de la anomalía, a propósito (`docs/sonido.md:62-63`; `prologo-anomalia.ts:1894-1897`).
- **Celular (≤ 760 px de ancho o ≤ 500 px de alto).** La nave va arriba, el globo debajo y la pantalla al final. Una pastilla «más abajo ↓» avisa que la hoja sigue, y sin el vidrio de las esquinas.
- **Movimiento reducido.** Sin tele (el negro está desde el primer cuadro), sin rebotes ni vuelos. El prólogo salta de parada en parada, pero el manual y el árbol se abren igual (`prologo-anomalia.ts:1871-1881`).
- **Recargar con la hoja abierta.** Retoma desde `anom-manual` (o desde `leccion-pantalla` para el árbol): el capitán vuelve a decir la orden y el manual se abre desde la página 1, con todas las páginas sin cumplir (`puntos-del-prologo.ts`; lo cumplido no se guarda).

---

#### ⏸ El manual de a bordo

###### 0. Se abre el manual
*Dónde:* el prólogo, dentro de la anomalía, con las cuatro naves arrastradas. El globo del capitán dice «¡Rápido, el manual de a bordo!».
1. **Al llegar (sin tocar)** — *Se ve:* a 150 ms del final de la orden la historia se frena. Desaparece el globo, la cámara se acerca a la escena y sube el negro (0,48 s). La pantalla se prende como una tele (0,62 s) y queda la portada de la Ley 1. *Se oye:* la voz grabada del capitán termina su línea. El zumbido de la anomalía se apaga en 1,2 s y entra la música para estudiar.

###### 1. Página 1 · El HTML es un árbol de nodos.
*Dónde:* la pantalla de la nave, en portada. El dibujo es un árbol de siete nodos de colores (`main` arriba; `section` y `article`; `h2`, `p`, `h3`, `p` abajo) que crece desde la raíz: cada rama se traza y su nodo llega con un rebote. Debajo: «Ley 1», «El HTML es un árbol de nodos.», «La pantalla de la nave es un árbol.», las marcas «MANUAL DE A BORDO ●○○○○ 1 de 5» y «Leer →». No hay «Anterior».
1. **Toque 1 · «Leer»** — *Se ve:* entra la demo (ver Reglas). La nave salta de gusto (saltito de 14) y a los 0,6 s, atenta, mira hacia el código. La pantalla tiene tres columnas (`html-to-tree.component.html`):
   - **El HTML:** `<main>`, `<section>`, `<h2>Intro</h2>`, `<p>Un ejemplo</p>`, `</section>`, `<article></article>`, y después, sangrados como si fueran de `<article>`, `<h3>Título</h3>`, `<p>Texto</p>` y `</main>`. Los tags que abren se ven dorados y con subrayado punteado. El `</article>` equivocado se ve gris, como un cierre más: no se delata.
   - **El árbol de nodos:** al principio sólo la raíz, punteada.
   - **Lo que se dibuja:** el marco y los paneles, punteados y vacíos.

   El globo dice «1 Tocá los tags. / 2 Mové el `</article>`.» con «▶ Mostrame». A los 1,2 s la mano señala `<main>`.
2. **Toques 2 a 8 · cada tag que abre** (en cualquier orden; la mano los pide en orden de lectura: main, section, h2, p, article, h3, p; «Mostrame» espera 0,9 s entre uno y otro):
   - *Se ve:* el tag se pone blanco y su renglón se marca en lila con un destello dorado. En el árbol aparece el nodo, con los ancestros que faltan punteados. En la pantalla de la nave nace su pieza con un rebote, donde la pone la sangría, y sube un rótulo `<tag>` que se va a los 0,7 s. La nave se sacude y mira la pieza.
   - *Pasa (el bug):* `<article>` queda como una tira vacía. Al tocar `<h3>` y el último `<p>`, la pieza nace dentro de `article`, se cae con rebote al fondo del marco y aparece un recuadro rojo punteado. El rótulo y el renglón se ponen rojos, la rama del árbol va roja y cuelga de `main`. La nave se preocupa.
   - Al tocar el último tag se enciende el paso 2 (el globo salta), el `</article>` se vuelve dorado y aparece la pista «Mantené el click y arrastrá, o usá ↑ ↓.» (en pantalla táctil, «Mantené apretado y arrastrá.»). La mano pasa a señalar el cierre.
3. **Toque 9 · mover el `</article>`** — se puede tocarlo (salta a su lugar, después del párrafo), arrastrarlo (el renglón donde caería se marca con una línea dorada) o moverlo con ↑ ↓ de a un renglón. *Se ve:*
   - El cierre se pone verde.
   - El árbol se parte en dos, «antes» arriba y «después» abajo, con halo en los nodos que cambian de padre.
   - En la nave, el panel `article` crece y las piezas caídas suben a él con rebote. El aviso rojo se va.
   - A los 0,8 s la nave salta, le saltan estrellitas y su llama se alarga.
   - Los dos pasos quedan tachados y aparece «Siguiente página ›››».

   Tocar otra vez el cierre lo devuelve a su lugar viejo.
4. **Toque 10 · «Siguiente página»** — la nave sale volando y entra la página 2.
*Para seguir:* tocar los siete tags y mover el cierre, o «Mostrame».

###### 2. Página 2 · El DOM está vivo.
*Dónde:* la portada tiene tres instrumentos: un letrero «Contador», `#count` con un «1» y `#status` con una luz verde. Una ficha `#count` traza una curva hacia el suyo. Frase de la nave: «Cambiar un nodo cambia la pantalla.» Marcas «2 de 5», con «← Anterior» y «Leer →».
1. **Toque 1 · «Leer»** — *Se ve:* la consola muestra tres renglones: `querySelector('#count').textContent = '1'`, `querySelector('#status').textContent = 'activo'` y `querySelector('#titulo').textContent = 'Listo'`. El selector `'#titulo'` es el hueco, dorado y con subrayado punteado. Debajo, «▶ correr». En la pantalla de la nave hay tres instrumentos rotulados con su selector: `h1` (dice «Contador»), `#count` (dice 0) y `#status` (dice «inactivo», con una lámpara gris). Globo: «1 Corré. / 2 Cambiá `'#titulo'`.» La mano señala «correr».
2. **Toque 2 · «correr»** — *Se ve:*
   - De la nariz de la nave salen tres fichas con su selector, una cada 0,32 s, en arco por arriba del haz.
   - `#count` llega a su instrumento, que late, y pasa a 1. `#status` llega, dice «activo» y la lámpara se pone verde.
   - `#titulo` busca por la pantalla de un lado a otro, no encuentra su rótulo, se vuelve `null` en rosa, cae debajo de la pantalla con rebote y se queda ahí.
   - En el código aparece `// null` al lado del renglón. La nave mira lo caído, preocupada. Se enciende el paso 2 y la mano señala el selector.
3. **Toque 3 · el selector** — rota a `'h1'` y el renglón se pone verde. Al volver a tocar sigue `'.titulo'` (otra vez `null`) y después `'#titulo'`.
4. **Toque 4 · «correr»** — las tres fichas llegan; el título cambia a «Listo». A los ~1,6 s la nave salta con estrellitas y aparece «Siguiente página». («Mostrame» espera 2,2 s entre toques.)
5. **Toque 5 · «Siguiente página».**
*Para seguir:* correr, cambiar el selector a `'h1'` y volver a correr.

###### 3. Página 3 · No todo cambio cuesta lo mismo.
*Dónde:* la portada muestra el pipeline en fila (DOM, style, layout, paint, composite). Layout y paint están punteados bajo el rótulo «capas caras», y las demás estaciones, encendidas en verde. Frase de la nave: «Algunos cambios frenan la pantalla.»
1. **Toque 1 · «Leer»** — *Se ve:* la nave vuela: detrás pasan estelas de corrido (bucle de 4,8 s). En la consola está `function cuadro(t) {`, el hueco `nave.style.left = t + 'px';`, `requestAnimationFrame(cuadro);` y `}`, con «▶ correr» abajo. En la pantalla, el pipeline va en vertical, con «capas caras» marcado en rojo punteado. Al lado de DOM dice `left` y el veredicto gris es «¿?». Globo: «1 Corré. / 2 Cambiá la propiedad.»
2. **Toque 2 · «correr»** — *Se ve:* un trazo rojo con un pulso baja por todas las estaciones, que se encienden al llegar el trazo. Aparece el veredicto «caro» en rojo, con un rebote. Las estelas pasan a los tirones (10 saltos por vuelta), la nave se preocupa y se traba. Se enciende el paso 2.
3. **Toques 3 en adelante · el hueco y «correr»** — cada toque al hueco rota la propiedad. La pantalla vuelve a quieta con «¿?» y la nave vuela tranquila. *Lo que muestra cada una al correrla:*

   | Propiedad | Veredicto | Trazo | Estelas | Nave |
   |---|---|---|---|---|
   | `nave.textContent = t;` | «caro» | rojo | a tirones | se traba |
   | `nave.style.color = tono(t);` | «medio» | ámbar, saltea layout | 28 tirones | se traba un poco |
   | `nave.style.transform = 'translateX(…)';` | «barato» | verde, por el carril de la izquierda por encima de las capas caras: style → composite | de corrido | saltito |

   Con `transform` el hueco se pone verde apenas aparece, antes de correr. La mano obliga a pasar por las cuatro, pero alcanza con rotar tres veces y correr una. Con `transform` corrida, la nave festeja y aparece «Siguiente página».
4. **Último toque · «Siguiente página».**
*Para seguir:* llegar a `transform` y correrla.

###### 4. Página 4 · A mano, te olvidás un lugar.
*Dónde:* la portada es un panel con tres filas: `#count 3`, `#mult2 No` y `#mult3 No`, esta última en rojo con su marca. Un lápiz descansa al lado. Frase de la nave: «Por eso el panel marca la velocidad vieja.»
1. **Toque 1 · «Leer»** — *Se ve:* la consola muestra `function increment() {`, `count++`, `querySelector('#count').textContent = count` y el hueco `// falta #mult2 y #mult3`, con el botón «increment()». El panel de la nave tiene `#count 0`, `#mult2 Sí` y `#mult3 Sí` (los dos en verde) y el lápiz abajo a la derecha. Globo: «1 Sumá y mirá el panel. / 2 Completá el handler y sumá.»
2. **Toque 2 · «increment()»** — *Se ve:* el lápiz va a `#count`, garabatea y escribe 1 (el número late) y vuelve a su lugar. `#mult2` y `#mult3` siguen diciendo «Sí», pero se ponen rojos con una marca que titila: quedaron viejos (1 no es múltiplo de 2 ni de 3). La nave mira el primero, preocupada. Se enciende el paso 2.
3. **Toque 3 · el hueco** — se escriben las dos líneas que faltaban, en verde. Tocarlo otra vez las borra. El panel no cambia todavía.
4. **Toque 4 · «increment()»** — el lápiz pasa por los tres: `#count 2`, `#mult2 Sí` (verde) y `#mult3 No`. Nada en rojo. La nave festeja y aparece «Siguiente página».
5. **Toque 5 · «Siguiente página».**
*Para seguir:* completar el handler y volver a sumar.

###### 5. Página 5 · Zone.js revisa todo el árbol.
*Dónde:* la portada muestra una cerca punteada «zone» con el árbol revisado adentro (los nodos se encienden por pisos) y afuera, a la izquierda, una estrella rosa (la anomalía). Frase de la nave: «Zone.js solo ve lo que parchea.» Marcas «5 de 5».
1. **Toque 1 · «Leer»** — *Se ve:* la consola muestra el hueco `requestIdleCallback(() => {`, después `this.total++;` y `});`, con «▶ correr». En la pantalla de la nave, la cerca «zone» rodea el árbol de siete nodos y una lectura `total 0` / `0/7`. Afuera de la cerca, la anomalía rosa gira y late sin parar. Globo: «1 Corré. / 2 Cambiá la API.»
2. **Toque 2 · «correr»** — *Se ve:* un punto rosa corre por debajo de la cerca, de derecha a izquierda, sube hasta la anomalía y revienta, y la anomalía parpadea. Ningún nodo se revisa. La lectura queda en `0` pero en rojo, con marca titilante, y `0/7`: el valor ya es 1 y la pantalla no se enteró. La nave mira la anomalía, preocupada. Se enciende el paso 2.
3. **Toque 3 · el hueco** — rota a `setTimeout(() => {` y se pone verde (parcheada). Después siguen `addEventListener('click', …)`, `fetch(url).then(…)` y `Promise.resolve().then(…)`, todas parcheadas, y otra vez `requestIdleCallback`.
4. **Toque 4 · «correr»** — una ficha dorada con el nombre de la API baja desde arriba y entra a la cerca hasta la raíz. Una barra dorada barre el árbol de arriba abajo (0,6 s), y los nodos se encienden en verde, piso por piso, con un pulso. La lectura pasa a `2` y `7/7` en verde. La nave sigue el barrido con la mirada y después festeja. Aparece **«Seguir la historia ›››»**.
5. **Toque 5 · «Seguir la historia»** — la nave sale volando y la pantalla se apaga (ver Reglas).
*Para seguir:* cambiar a una API parcheada y volver a correr.

###### 6. Se cierra el manual → `anom-leyes`
1. **Al volver (sin tocar)** — *Se ve:* se va el negro y vuelve la escena de la anomalía donde estaba. *Se oye:* la música se apaga en 1,5 s y vuelve el zumbido en 1,2 s. Sigue el capitán: «Debería ser imposible. Esto contradice todas las leyes del espacio Zone.js.», que es el tercer tirón: suena un golpe grave (`prologo-anomalia.ts:1350-1352`).

---

#### ⏸ El árbol de Signal Space

###### 7. Se abre el árbol
*Dónde:* dentro de Signal Space, con Angie y las naves. Angie acaba de decir «Aquí nadie revisa todo. Miren el árbol.».
1. **Al llegar (sin tocar)** — *Se ve:* la historia se frena y entra la misma tele que en el manual. *Se oye:* no hay música. El zumbido bajo de adentro de la anomalía sigue.

###### 8. 0/6 · El signal avisa quién lo lee.
*Dónde:* la portada es el mismo árbol, con una caja ámbar debajo y un hilo hasta cada uno de los dos `<p>` (verdes). Debajo: «Ley 6», «El signal avisa quién lo lee.», «Aquí solo se entera quien lee.», las marcas sólo con «SIGNAL SPACE» (sin puntos ni «1 de 1») y «Leer →».
1. **Toque 1 · «Leer»** — *Se ve:* la consola muestra el hueco `let total = 0;` y `total++;`, con «▶ correr». En la pantalla de la nave no hay cerca: arriba, la lectura «revisados 0/7»; en el medio, el árbol; abajo, la caja ámbar con un 0 y dos hilos punteados que corren hacia los dos `<p>`. Globo: «1 Corré. / 2 Hacelo signal.»
2. **Toque 2 · «correr»** — *Se ve:* la caja se aplasta y salta, y el árbol entero se pinta de rosa a magenta, piso por piso: el barrido «como en casa». La nave se preocupa y se traba. A los 0,55 s la lectura dice `7/7`. La caja dice 1. Se enciende el paso 2.
3. **Toque 3 · el hueco** — pasa a `const total = signal(0);`, en verde, y el renglón de abajo cambia a `total.update((t) => t + 1);`. Tocarlo otra vez vuelve a `let`.
4. **Toque 4 · «correr»** — *Se ve:*
   - La caja salta y el árbol vuelve a oscuro.
   - Dos chispas doradas suben por los hilos (0,55 s, una 0,08 s después de la otra), y los dos `<p>` destellan en dorado y quedan verdes.
   - A los 0,8 s la lectura dice `2/7`. La caja dice 2.
   - La nave pasa a contenta y da un saltito, y después el festejo con estrellitas.

   Aparece **«Seguir ›››»** («Mostrame» espera 1,6 s entre toques.)
5. **Toque 5 · «Seguir»** — la nave sale volando, la pantalla se apaga y vuelve Signal Space. Angie: «Guarden esa pregunta. Los acompaña todo el viaje.» (`leccion-guarden`).
*Para seguir:* declarar el valor como signal y volver a correr.

---

#### Nota: el manual suelto desde la bitácora

**Hoy no existe.** La palabra «bitácora» no aparece en ningún lugar de `src/`. ADR 0019 dice que la bitácora quedaba del lado de la molécula y «ya no se abre». La hoja «suelta» (`manualSuelto`) sólo la usa `leerEtapa` (`integrada-vista.component.ts:978`), que siempre pasa un libro con `concepto` (una etapa del viaje): el libro de leyes nunca se abre suelto. Tampoco un link `?nivel=0` lo trae, porque el capítulo 0 no está en `ETAPAS_DEL_VIAJE` (`viaje.ts:17`) y `conceptoDeCapitulo(0)` da `null`. Quien saltea o termina el prólogo no tiene cómo volver a leer el manual ni el árbol. Quedaron ramas muertas para ese caso:
- `encenderLaTele(hoja, null)` cuando `manualSuelto()` (`integrada-vista.component.ts:624`, `tele-del-manual.ts:58`).
- El CSS de `.manual-suelto .prologo__manual--libro` (`manual-de-a-bordo.css:317`, `:349`).
- El comentario «suena… en la historia y suelto» (`integrada-vista.component.ts:424`).

### Parte 4 · Adentro, la voz y Angie (del cierre del manual al comienzo del viaje)

Líneas `anom-leyes` → `frase-angulo`, más la salida del prólogo hacia la Cinemática 1. Todo sacado de
`prologo-guion.ts`, `prologo-escena.ts`, `prologo-anomalia.ts`, `prologo-anomalia.css`,
`integrada-vista.component.ts/.html`, `intro-tusi.ts/.css`, `tele-del-manual.ts`, `mascota-viva` y
`libs/sonido.ts`.

Los segundos (`t`) son los del reloj del prólogo (`armarReloj`), que se calculó corriendo el guion real.
Ese reloj **se frena** en el minijuego, en el manual y en el árbol: el tiempo que pasa leyendo no
cuenta. A velocidad ×1, la parte va de `t = 50,8 s` (vuelve del manual) a `t = 260,8 s` (fin), unos
**3 min 30 s de mirar**, más lo que se tarde en el árbol.

#### Reglas que valen para toda esta parte

- **Nada de esta parte se pasa tocando.** El prólogo corre solo, con su reloj. La barra del juego no
  tiene «Saltar» ni «Velocidad» (`prologo-anomalia.ts:298-302`: solo los usan los tests). Lo que hay:
  arriba a la izquierda **Pausa**, **Sonido** y **Pantalla completa** (íconos redondos de 44 px);
  arriba a la derecha **Empezar de cero**, que pide un segundo toque («¿Seguro? Se borra todo»). La
  barra espaciadora pausa y reanuda. La rueda, el arrastre y las flechas/AvPág no hacen nada
  (`alDesplazar`, `alTeclado`).
- **Qué hace un toque en la escena** (`alTocar`, `prologo-anomalia.ts:1795`): no acelera ni salta.
  - Sobre una nave: la nave se tuerce y salta (golpea más arriba que abajo), suelta chispas de su
    color, suena un «pip» y aparece una palabra: «¡ey!», «¡piloto a bordo!», «¡la pintura!», «¡estoy
    manejando!»; después de 4 o 5 toques seguidos se harta: «¡basta!», «¡ya va!», «¡uf!».
  - Sobre el cielo: chispas (blanco azulado afuera, ámbar adentro, ámbar oscuro sobre el papel del
    final), un «pip» agudo y un empujoncito a las naves cercanas, que miran el lugar tocado durante
    0,9 s.
  - Sobre Angie (desde que nace): dice algo según dónde la tocan («¡ay!», «¡la frente!» arriba;
    «¡idea!», «¡clic!» en la lamparita; «¡jaja!», «¡cosquillas!» en la panza; «¡mis pies!», «¡hop!»
    abajo) y se sacude; de tanto tocarla se harta («¡basta!») y se marea («me mareo…»). Arrastrándola
    se estira y al soltarla cae (`mascota-viva.component.ts:408-470`).
- **La caja de diálogo** (abajo al centro, casi opaca, violeta oscuro): arriba el nombre en mayúsculas
  y monoespaciada con un punto de color (Capitán amarillo, Nave A lila, Nave B salmón, Exploradora y
  Angie rosa), abajo la frase. Entra en 0,28 s subiendo 26 px y creciendo de 0,86 a 1 con un rebote;
  se va con un fundido de 0,25 s. Cuando dos hablan a la vez hay dos cajas lado a lado: Nave A a la
  izquierda, Nave B a la derecha. Angie habla en serif (Fraunces); el código (`switchMap`) va en una
  pastilla monoespaciada verde agua.
- **La voz sin cuerpo y el grito** no van en caja: van arriba, sin nombre (ver cada paso).
- **Quién habla se ve en la escena:** al empezar su línea, la nave da un saltito (sube, se aplasta y
  la antena latiguea) y mientras habla le laten las ondas y la luz de la antena. Angie, cuando ya
  tiene cuerpo, rebota un poco en cada línea suya.
- **Voces:** todas las líneas de esta parte tienen voz grabada de Gemini menos el grito (`anom-grito`,
  blips a propósito, `docs/sonido.md:73`). La voz y Angie usan la misma voz (`docs/voces.md:92`). Si
  la grabación no llegó a bajar o no entra en su ventana, suenan blips con el timbre del personaje. La
  línea dura lo que su voz (o lo que cuesta leerla, si es más); el toque nunca la acorta.
- **Pausar corta la voz y no la repite:** la pausa (o esconder la pestaña) llama a `callar()`, y al
  reanudar la línea en curso ya está marcada como dicha (`dichas`), así que sigue muda hasta la
  siguiente.
- **Fondo sonoro:** el zumbido grave de la anomalía (sierra de 46 Hz filtrada) crece afuera hasta el
  salto; adentro queda bajito (la mitad) y se apaga con el papel del final. Cada golpe (tirón, salto,
  bala, choque, acorde) suena una sola vez.
- **Caras:** de `t = 17,1 s` hasta el choque las naves están asustadas (cejas arriba, ojos grandes);
  desde que habla la voz hasta 1,6 s después del choque, sorprendidas; después, tranquilas, salvo lo
  que dice cada paso.
- **Movimiento reducido** (`prefers-reduced-motion`): esta parte casi no se ve. Ver «Cosas raras».
- **Retomar:** recargar vuelve al último punto guardado de esta lista: `dentro-vivos`, `voz-supongo`,
  `orden-caos-es-orden`, `leccion-entiendes`, `leccion-pantalla`, `leccion-guarden`
  (`puntos-del-prologo.ts`). Arranca 0,3 s antes de esa línea.

---

###### 1. Vuelve la escena: «Debería ser imposible» (`anom-leyes`)
*Dónde:* afuera, en el espacio. Cielo azul noche con nebulosas violeta y verde, estrellas que titilan,
rocas que pasan, el planeta-casa con anillo a la derecha. En el centro la anomalía (halo, disco con
tres brazos que gira, anillos punteados, núcleo blanco que late), ya del 60 % de su tamaño final. Las
tres naves en cuña (el capitán adelante) a un tercio del camino hacia el centro, más chicas (73 %),
temblando, estiradas hacia la anomalía, con cara de susto y mirando el centro. La exploradora arriba a
la derecha, adelantando y frenando, mirando al capitán.

1. **Al volver del manual (sin tocar)** — *Se ve:* el manual se apaga como una tele vieja: la página
   se quema de brillo, se cierra en una raya horizontal y en un punto (0,44 s); el negro se va en
   0,32 s y aparece la escena, que vuelve a dibujarse desde ese momento (`tele-del-manual.ts:112`).
   La caja de «¡Rápido, el manual de a bordo!» todavía está a medio irse y termina de apagarse en
   0,15 s. *Se oye:* la música del manual se apaga en 1,5 s y el zumbido vuelve en 1,2 s.
   - **A los 0,4 s (`t = 51,2`)** — el tercer tirón, el más fuerte: la anomalía late (crece un 14 % y
     el núcleo se infla), las tres naves dan un tirón hacia el centro y se aplastan. *Se oye:* un
     golpe grave (40 Hz, 0,8 s). *Dice:* **Capitán:** «Debería ser imposible. Esto contradice todas
     las leyes del espacio Zone.js.» (6,4 s).
   - Mientras tanto, sin pausa: las naves siguen arrastradas hacia el centro, cada vez más rápido y
     más chicas, y el temblor crece; las estrellas se curvan hacia el centro.

###### 2. La exploradora queda afuera (`expl-que-pasa` → `expl-vuelvan`)
*Dónde:* lo mismo; la exploradora sigue arriba a la derecha, sola: la anomalía no la agarra.
1. **Sin tocar** — cuatro líneas seguidas de la **Exploradora** (caja con nombre rosa), cada una con su
   saltito:
   - `t = 57,8` «¿Qué les pasa?» · `t = 59,8` «¿Por qué no responden?» · `t = 62,4` «¿Por qué van
     hacia ahí?» · `t = 64,7` «¡No! Vuelvan al espacio de Zone.js, están yendo a un espacio
     desconocido.» (5,9 s).
   - `t = 70,8` **Capitán:** «Los sistemas no responden a tiempo. Estamos perdiendo el control.»
     (5,9 s). Las naves ya están casi en el centro, chiquitas.
   *Pasa:* nada nuevo entra; la exploradora no se acerca ni se va. La escena sólo sigue apretando.

###### 3. El grito y el salto (`anom-grito`)
*Dónde:* las tres naves llegando al núcleo, del tamaño de un punto.
1. **Sin tocar (`t = 76,9`)** — *Se ve:* «¡Ahhhh!» grande en el medio de la pantalla (40 % de alto,
   letra de 40 a 84 px), sin caja ni nombre, que entra rebotando desde el 60 % de su tamaño y tiembla.
   Las naves giran una vuelta entera (dos para un lado, una para el otro) y se estiran. *Se oye:* blips
   de sierra de los tres a la vez (no hay voz grabada).
   - `t = 78,2 a 78,7` — las naves se desvanecen en el núcleo.
   - `t = 78,4` — la anomalía «traga»: crece nueve veces en 0,7 s, el disco y los anillos se disuelven
     y queda solo la luz, que llena la pantalla. A la vez las estrellas se estiran en rayas hacia
     afuera (el salto, pico en `t = 79,0`) con un destello blanco-ámbar. La exploradora se apaga en
     0,4 s (`t = 78,7 a 79,1`): es la última vez que se la ve en el prólogo.
   - *Se oye (`t = 78,7`):* el salto: una ráfaga de ruido que sube de grave a agudo (1,1 s) con un
     golpe grave de 70 Hz.

###### 4. Adentro: «Estamos vivos…» y la bala (`dentro-vivos` → `dentro-nunca-visto`)
*Dónde:* adentro de la anomalía. Detrás del destello aparece (en 0,7 s, desde `t = 78,85`) un fondo
violeta oscuro que baja a vino, con una luz cálida en el centro, polvo de puntitos ámbar y verdes que
deriva y manchas desenfocadas grandes en primer plano. En el centro, el patrón: 12 líneas finas
cruzadas y 24 bolas (ámbar y verde) que van y vienen cada una a su ritmo; la cámara se les acerca en
2,2 s hasta verlas enormes (×2,8). Caos.
1. **Sin tocar** — *Pasa:* a `t = 79,6` reaparecen las tres naves arriba a la izquierda, en cuña,
   creciendo desde cero en 0,7 s. *(Por el muelle de giro que quedó en 360°, deberían desenroscar una
   vuelta al aparecer; no lo pude confirmar en pantalla.)* Flotan a la deriva y **esquivan de verdad**:
   se apartan de cada bola que les pasa cerca y miran a la más cercana.
   - `t = 79,9` **Nave A:** «Estamos vivos…»
   - `t = 81,7` — **la bala:** una bola ámbar grande con estela cruza en diagonal, de abajo a la
     derecha hacia arriba a la izquierda, pasando por donde están las naves (1,6 s); todas la miran y
     la que roza recibe un golpe. *Se oye:* un silbido de ruido (0,9 s).
   - `t = 82,0` — dos cajas a la vez: **Nave A** «¡Esquivá, rápido!» (izquierda) y **Nave B**
     «¡Cuidado!» (derecha), cada una con su voz, superpuestas.
   - `t = 84,1` **Nave B:** «¿Qué es esto?» · `t = 85,8` **Nave A:** «No lo sé, nunca había visto
     nada como esto.»

###### 5. Adentro: «debemos escapar» hasta «demasiado caótico» (`dentro-escapemos` → `dentro-caotico`)
*Dónde:* lo mismo, las naves esquivando arriba a la izquierda.
1. **Sin tocar** —
   - `t = 89,6` **Capitán:** «Sea lo que sea, debemos escapar. Rápido.» — *Pasa:* las tres se lanzan
     hacia adelante (a la derecha y un poco arriba, casi un quinto del ancho) en 1,1 s.
   - `t = 94,1` **Nave A:** «Apenas puedo esquivar las partículas. No me pidas escapar.» — *Pasa:*
     frenan de golpe (0,5 s), vuelven a su lugar y se aplastan.
   - `t = 98,4` **Nave B:** «`switchMap` no funciona, tampoco puedo usar los pipes.» (`switchMap` en
     pastilla de código).
   - `t = 103,0` **Capitán:** «Ningún operador de RxJS sirve a este nivel.»
   - `t = 107,6` **Capitán:** «Aunque intentemos escapar, con tantas moléculas será imposible.»
   - `t = 112,9` **Capitán:** «Esto es demasiado caótico.» — la misma frase (y la misma grabación) que
     se oyó desde el sol en la colina.

###### 6. La voz (`voz-supongo` → `voz-circulos`)
*Dónde:* adentro; nada cambia de golpe.
1. **Sin tocar** —
   - `t = 116,7` *Se ve:* arriba (13 % de alto), sin caja ni nombre, en serif dorada con brillo, en
     dos renglones: «Supongo que sí… / Desde su perspectiva puede ser caótico.» Entra con un fundido
     lento (0,7 s). *Se oye:* la voz de Angie (la misma grabación que contestó en la colina). *Pasa:*
     desde acá las caras pasan a sorpresa y los pilotos buscan de dónde vino la voz, con la mirada de
     un lado al otro. Y, casi sin que se note, las bolas empiezan a juntarse en dos nubes (las ámbar a
     la izquierda del centro, las verdes a la derecha); las líneas del patrón se van borrando con eso.
   - `t = 123,2` **Nave A:** «¿Escucharon eso?» · `t = 125,8` **Nave B:** «¿Quién ha hablado?»
   - `t = 128,6` la voz, arriba: «Pero desde la mía… / todo está en armonía.»
   - `t = 133,4` la voz, arriba: «Dos hermosos círculos de movimiento uniforme, / y una melodía
     espléndida.» (8,6 s). *Se ve:* por esta altura las dos nubes ya son dos «átomos»: un núcleo
     (ámbar uno, verde el otro) con tres órbitas elípticas que giran en sentidos opuestos; las líneas
     del patrón ya no se ven (`t ≈ 131,7`).

###### 7. El reclamo y el choque: aparece Angie (`reclamo-*`)
*Dónde:* adentro; los dos átomos a los costados del centro, las naves arriba a la izquierda.
1. **Sin tocar** —
   - `t = 142,3` dos cajas a la vez: **Nave A** «¿Melodía?» y **Nave B** «¿Círculos?».
   - `t = 144,1` **Capitán:** «¿Estás loco?» — el capitán frunce las cejas (enojado) hasta el final
     del reclamo. *Pasa:* desde `t = 144,8` los dos átomos se acercan al centro (1,4 s).
   - `t = 146,0` **Capitán:** «¿Quién eres?»
   - **`t = 146,2`, el choque:** los átomos se juntan en el centro; destello blanco (0,3 s), una onda
     circular clara que se abre hasta salirse de la pantalla (0,9 s) y empuja a las naves. Las bolas
     desaparecen. *Se oye:* un golpe de ruido que baja (0,5 s) con un bajo de 58 Hz. *Pasa:* **Angie
     nace del choque**: la misma Angie de la colina (HTML encima del dibujo) aparece en el centro
     chiquita y crece de golpe con un resorte que se pasa y vuelve (0,5 s); sube un poco (1,4 s) y
     queda flotando y respirando. A los 0,9 s, con vida propia, saluda (su primera ocurrencia;
     `mascota-viva.component.ts:631`), salvo que en la colina se haya pausado la vida de fondo. Las
     naves la miran y, desde `t = 146,7`, la rodean en 1,9 s: dos a su izquierda (el capitán y la Nave A,
     mirando a la derecha) y la Nave B a su derecha, mirando a la izquierda (`RONDA`,
     `prologo-escena.ts:360`).
   - `t = 147,7` **Nave A:** «Esas moléculas casi nos matan.»
   - `t = 150,7` **Capitán:** «Es lo más caótico que vivimos en nuestras vidas…» · `t = 154,8`
     **Capitán:** «…y tú, tan tranquilo, lo llamas armonioso.»

###### 8. «El caos es orden» (`orden-*`)
*Dónde:* adentro, fondo violeta-vino sin patrón: sin bolas ni líneas (se fueron con el choque). Angie
flotando en el centro, las tres naves en ronda mirándola.
1. **Sin tocar** — tres líneas de **Angie** (caja con nombre «ANGIE» en rosa, frase en serif), y en
   cada una Angie rebota:
   - `t = 159,4` «El caos es orden.» · `t = 162,3` «Un orden que no comprenden…» · `t = 165,7` «Lo
     que ustedes ven como caos es un orden malinterpretado.»
   *Pasa:* nada en el dibujo acompaña la tesis: el patrón vuelve recién en el paso 11 (ver «Cosas
   raras»).

###### 9. El pacto (`leccion-entiendes` → `leccion-particulas`)
*Dónde:* lo mismo.
1. **Sin tocar** —
   - `t = 172,5` **Capitán:** «¿Tú entiendes este mundo?» · `t = 175,6` **Nave B:** «Sácanos de
     aquí.»
   - `t = 177,5` **Angie:** «No puedo intervenir con ustedes.» · `t = 180,6` «Ustedes deben seguir su
     curso natural.»
   - `t = 184,6` **Nave A:** «¿Y nos dejarás aquí tirados?» — la Nave A pone cara triste (hasta 1,4 s
     después).
   - `t = 187,3` **Angie:** «No… Los ayudaré a comprender el mundo.» · `t = 192,2` «Pero si saldrán
     de aquí o no, dependerá de ustedes…» · `t = 197,5` «Y de si tienen la capacidad de dejar atrás
     lo que conocen y creen correcto.» (6,3 s)
   - `t = 204,1` **Capitán:** «Estamos listos para lo que sea.» — cara decidida. · `t = 207,1`
     **Nave B:** «¿Qué debemos hacer?»
   - `t = 209,1` **Angie:** «Lo más importante es entender que este mundo sigue reglas.» ·
     `t = 215,8` «Eso que ustedes llaman caos no era más que armonía…» · `t = 221,0` «…partículas
     siguiendo las reglas.»

###### 10. Signal Space: la pregunta y el árbol (`leccion-pantalla` → `leccion-arbol`, ⏸ árbol)
*Dónde:* lo mismo.
1. **Sin tocar** —
   - `t = 224,8` **Capitán:** «Nuestra pantalla sigue marcando la velocidad vieja.»
   - `t = 229,0` **Nave B:** «¿Y quién le avisó a la pantalla?»
   - `t = 231,7` **Angie:** «Aquí nadie revisa todo. Miren el árbol.»
   - **`t = 236,2`, se frena la historia:** con la voz ya terminada y la caja a medio irse (60 %), se
     abre la hoja «Signal Space» (ley 6, «El signal avisa quién lo lee.») como el manual: la escena se
     acerca ×1,7 mientras sube el negro (0,48 s) y la pantalla se prende en un punto, una raya y la
     imagen, con un fogonazo (0,62 s). Con la hoja tapando todo, la escena deja de dibujarse y Angie se
     duerme (sin vida propia). *Se oye:* no hay música de estudio (es sólo del manual); el zumbido
     bajito de adentro **sigue sonando** debajo de la hoja.
*Para seguir:* el árbol es otra parte. Se sale con **«Seguir»**, el botón de la última (única)
página, que aparece cuando la página se da por cumplida (`puedeSeguir`,
`integrada-vista.component.ts:405`).

###### 11. Vuelta del árbol y la frase (`leccion-guarden`, `frase-*`)
*Dónde:* adentro, Angie en el centro y las naves en ronda, como se dejaron.
1. **Toque en «Seguir» (del árbol)** — *Se ve:* la hoja se apaga como una tele (0,44 s) y el negro se
   va (0,32 s). El foco del teclado vuelve al botón de Pausa. La escena retoma desde donde quedó,
   Angie se despierta y la caja de «Miren el árbol.» termina de irse.
   - A los 0,4 s (`t = 236,6`) **Angie:** «Guarden esa pregunta. Los acompaña todo el viaje.»
   - Silencio de 0,8 s y `t = 243,2` **Angie:** «Hasta lo que parece más complejo e inalcanzable…» ·
     `t = 248,4` «…se vuelve fácil y predecible si lo miras desde el ángulo correcto.» (5,8 s; el
     paso siguiente arranca 1,4 s antes de que termine).

###### 12. El orden: el par de Tusi (cola del prólogo, sin texto)
*Dónde:* el mismo cuadro, que se transforma.
1. **Sin tocar (desde `t = 252,8`)** —
   - *Se ve:* el fondo se aclara hasta un papel crema (3,4 s); la viñeta se va. Las tres naves salen
     volando hacia arriba a la derecha, achicándose, y se desvanecen (3,2 s). Angie se corre abajo a
     la izquierda y se achica un tercio (2,6 s). El patrón vuelve: la cámara se aleja desde muy cerca
     hasta verlo entero (3,2 s), las 12 líneas se redibujan **de a una** (3,6 s, ahora en gris cálido)
     y en cada una renacen sus dos bolas; desde `t = 253,4` las bolas se sincronizan (3 s) y lo que
     era caos queda en el par de Tusi; desde `t = 255,4` se dibujan los **dos círculos**, ámbar y
     verde, que giran (2 s). Con el papel, la barra de arriba y las cajas pasan a tinta oscura sobre
     claro.
   - *Se oye (`t = 255,4`):* el acorde final, cuatro notas senoidales escalonadas cada 0,16 s
     (220, 277, 330 y 440 Hz: la mayor), de 2,2 s cada una. El zumbido ya se fue con el papel.
   - `t = 258,2` aparece abajo al centro, en tinta oscura, «Angular Signals» (fundido de 1,4 s).
   - `t = 260,6` se apaga la barra de controles (0,3 s).

###### 13. Del prólogo al viaje
*Dónde:* el papel con el par de Tusi y el título.
1. **Sin tocar (`t = 260,8`)** — *Pasa:* el prólogo termina (`terminar()`): se callan las voces, el
   zumbido va a cero y el prólogo **desaparece de golpe** (`hidden`, sin fundido). Se guarda la partida
   como «prólogo visto» y arranca el viaje (`viajar()`, `integrada-vista.component.ts:827-830`).
   - *Se ve en el corte:* lo que había debajo, la pantalla del «par de Tusi» de antes, **quieta**: fondo
     crema verdoso, una sola línea con sus dos puntos, arriba «Se está formando algo ● ○ ○ ○ ○ ○ ○ ○ 1
     de 8 líneas», abajo «Las cosas son sencillas si las analizás por partes», el título «Angular
     Signals», «Esta página es scrolleable» con un mouse dibujado, abajo a la izquierda la mascota
     estática con el globo «Hasta en lo más caótico hay un orden, si sabes cómo funciona.» y abajo a la
     derecha la botonera 🔊 ↻ ⏸ «vel ×1». Nada se construye: el gatillo de esa construcción ya no lo
     llama nadie. Dura lo que tardan en bajar los datos de las cinemáticas, el reproductor y la escena
     del capítulo *(cuánto, no lo pude confirmar)*.
   - *Después:* la **Cinemática 1** («La caja que avisa · El que avisa») se abre con un **iris**: un
     círculo que crece desde el centro de la pantalla (0,68 s) sobre esa pantalla congelada. Adentro:
     barras de cine, la tarjeta del capítulo en el centro (a los 2,4 s se va a un rincón y queda el
     rótulo en la barra de arriba, con «Saltar Esc»), las naves y la caja ámbar; suena el efecto del
     título. Con la pausa de la vida de fondo puesta, no hay iris: aparece de una. La cinemática en
     sí es de otra parte.

### Parte 5 · El viaje, arco I: las cinemáticas 1 a 4 y las páginas 1/1 a 4/2

Las rutas son relativas a `src/app/`, salvo `docs/` y `public/`, que van desde la raíz del repo.

#### Reglas que valen para toda esta parte

##### Cómo entras y cómo retomas

- El viaje recorre los conceptos en orden (`integrada-vista/viaje.ts`, `ETAPAS_DEL_VIAJE`). Cada concepto es una **cinemática** seguida de una **hoja** con sus páginas. Arma el bucle `viajar()`, en `integrada-vista.component.ts:906-936`:
  - el lugar `pagina < 0` es la cinemática;
  - con 0 o más, es una página de la hoja.
- **Cada lugar se guarda en la partida** (localStorage) y se escribe en la barra con `replaceState` (`url-sync.ts`):
  - en la cinemática, `?nivel=1`;
  - en una página, `?nivel=1&sub-nivel=3`.
- **Si recargas a mitad de una etapa,** `entradaDeLaHistoria` te deja en el lugar guardado: la cinemática si `pagina === -1`, la hoja en esa página si no. La cinemática no se repite.
- **Saltear una cinemática** cuenta igual que terminarla: `alTerminarCinematica` guarda `conCinematica` y sigue (`integrada-vista.component.ts:874-884`).

##### Cómo se ve y se juega una cinemática

**Dónde:** un diálogo modal a pantalla completa sobre el cielo nocturno, con la escena en un lienzo 16:9. Arriba hay una barra de cine con el rótulo y «Saltar Esc»; abajo, otra con la caja de diálogo y el botón ▸.

**Al abrir (sin tocar):**
1. Entran las dos barras de cine. Mientras tanto se carga la escena.
2. Un iris se abre en 680 ms (View Transition).
3. Suena el efecto «titulo», un acorde de la menor, y las voces se cargan de antemano.
4. En el centro aparece una tarjeta con el nombre de la etapa y el título de la cinemática. El título se subraya con un trazo.

**El reloj de la cinemática:** un `setTimeout` por evento, sin rAF (`cinematicas/cinematica.component.ts`).

| Cuándo | Qué pasa |
|---|---|
| t = 0 | beat «abre» |
| 120 + i·520 ms | cada beat de la apertura |
| 2,4 s | «titulo-rincon»: la tarjeta del centro se va hacia arriba y el subtítulo pasa a la barra de arriba |
| desde `max(1500, 120 + n·520)` ms | las líneas de diálogo, una tras otra |
| 1,4 s después de la última línea | la cinemática se cierra sola |

- **Tiempo de cada línea:** se queda en pantalla `max(950 ms, largo del texto/16 s, duración de la voz) + 530 ms`. Entre una línea y la siguiente quedan 220 ms de aire, más el `hueco` si la línea tiene uno.
- **Cómo se escribe una línea:**
  - la caja de diálogo muestra el retrato y el nombre de quien habla;
  - las palabras entran una por una, cada 42 ms, y cada una tarda 520 ms en asentarse;
  - cuando habla Angie, el nombre dice **«MASCOTA»** (`cinematica.component.ts:47`): se ve la imagen `angular-mascot-idea.svg` y la frase va en serif cursiva.
- **Qué suena:**
  - cada línea suena con su voz grabada de Gemini, si ya cargó y entra en el tiempo de la línea; si no, suenan blips;
  - todas las líneas de las cinemáticas 1 a 4 tienen grabación (`integrada-vista/voces-grabadas.ts:87-115`);
  - cada beat que no es el del título suena con el tono «beat».
- **Los beats de la escena** se encienden cuando arranca la línea que los lleva; el esqueleto los marca con `· beat …`.

**Tus toques en la cinemática:**
- **▸, Enter, espacio o flecha derecha:**
  - con la línea a medio escribir, la completa: las palabras saltan a su lugar;
  - si el toque anterior acaba de completarla (hace menos de 350 ms), no hace nada;
  - si la línea ya estaba entera, suena «toque» y salta a la línea siguiente, con los beats del medio ya aplicados;
  - en la última línea, cierra la cinemática.
- **Tocar la escena no avanza.** Solo cuenta el botón ▸ (o las teclas).
- **El toque no espera a la voz.** Si saltas antes de que termine, la voz siguiente arranca encima de la anterior: está en «Cosas raras».
- **Saltar:** el botón «Saltar» o Escape callan todo, suena «cierre» y el iris se cierra en 460 ms.
- **Pestaña oculta o pausa del fondo:** todo se congela. Con movimiento reducido, la escena queda quieta.

**Común a las cuatro escenas:**
- al fondo hay moléculas lejanas, punteadas;
- con el beat `naves`, las tres naves entran desde la izquierda (−32cqw, giradas −6°, escalonadas cada 120 ms) y después flotan;
- con el beat `mascota`, Angie sube con un rebote abajo a la derecha (x84, y64).

##### Cómo se abre la hoja y qué pasa al llegar a una página

**Dónde:** al cerrarse la cinemática se abre la **hoja**:
- aparece en 0,3 s de opacidad (`prologo-velo`), sobre papel crema con degradé (`.manual-suelto--viaje`);
- todo lo de atrás queda inerte;
- la colina deja de dibujarse y de sonar (`colinaTapada`);
- en las hojas del viaje **no hay música**: según `docs/sonido.md:62-63`, solo la lleva el manual de a bordo.

**De arriba abajo** (`integrada-vista.component.html:674-820`):
- **Cabecera:** barra oscura pegada arriba (#1b1813) con:
  - el nombre de la etapa, en mono y mayúsculas;
  - el link «Practicá», a `/practica/carrito`, que te saca de la historia (línea 699);
  - un punto por página: crema las leídas, largo y dorado (#f2c27a) el de la página actual;
  - el contador «N de M».
- **Título de la página:**
  - un h2 serif con un trazo de acento que se dibuja en 0,9 s, a partir de los 0,2 s (`viaje-cine.css`, `etapa-trazo`);
  - el trazo se dibuja una sola vez por etapa (está en «Cosas raras»).
- **La tripulación**, a la derecha del título (`components-draw/tripulacion/`):
  - las tres naves en formación;
  - a la derecha, el objeto de la etapa (`objetos-del-mundo.ts`).
- **La página**, debajo: el componente real del nivel, montado en `.subhost`.
  - Su h1 propio queda oculto (`styles.css:350`).
  - Excepciones que sí se ven: los paneles «Clicks» y «Calculated Signals», y el h1 del formulario básico (`styles.css:638` y `:743`).
- **Pie:** barra oscura con:
  - el **diálogo de la tripulación**: el retrato de la nave en un círculo con borde de su color, el nombre en mono («Capitán», «Nave A» o «Nave B») y la frase;
  - los botones;
  - el aviso «más abajo ↓» cuando la página tiene más para scrollear. Se apaga solo en los últimos 3rem de scroll (`manual-de-a-bordo.css:194-199`).
- **Angie de pista:** flota a la derecha, encima del pie (96 px), con la pastilla «tocame».

**Al llegar a una página (sin tocar),** según `montarPagina` (`integrada-vista.component.ts:607-682`):
1. **La hoja se acomoda:** vuelve arriba y toma el foco.
2. **Entra la página:** se desliza 48 px y aparece en 420 ms. Al avanzar viene desde la derecha; al volver, desde la izquierda.
3. **Habla la tripulación**, con la línea de llegada (`decir`, línea 455):
   - la antena de la nave que habla titila cinco veces (0,4 s, ida y vuelta) y la nave da un saltito;
   - su retrato rebota (0,45 s);
   - las palabras entran una por una, desde los 120 ms y cada 55 ms (0,26 s cada una).
4. **Se oye** la voz grabada de esa línea. Todas las líneas de llegada y de resolver del arco I tienen mp3 en `public/voces/viaje/`. Sin grabación, la línea se lee en silencio.
5. **Las naves entran volando** (−700 px, 0,7 s con rebote) solo si llegaste avanzando desde otra página de la misma etapa. En la primera página de una etapa ya están quietas.
6. **Aparece Angie de pista** cuando la página asentó: 0,9 s, invisible hasta el 70 %.

**Toques que valen en cualquier página:**
- **Tocar a Angie de pista:** abre un globo con tres chips, que son las tarjetas del esqueleto:
  - Concepto;
  - Qué hacer;
  - Qué observar.
- **Tocar o mover el mouse sobre la página:** las naves miran hacia ahí. Con un toque, una de ellas pega un respingo, por turnos (`tocarLaEtapa` y `mirarLaEtapa`).
- **Teclado** (`teclaDelManual`):
  - las flechas izquierda y derecha pasan de página, salvo con el foco dentro de la página;
  - arriba/abajo, RePág/AvPág, Inicio/Fin y espacio scrollean;
  - Escape no hace nada.

##### Cómo se juega un desafío de perilla

En cada página, debajo de la demo, hay un desafío (`components-atom/manipulable-system`, con la lógica en `libs/manipulable-challenge.ts`).

**Cómo se ve:**
- un rótulo «DESAFÍO · TOCÁ EL CÓDIGO»;
- a la izquierda, el código (34rem);
- a la derecha, las lecturas en serif grande y un botón con el verbo de la acción, en mono y con borde fino;
- en el código, la **perilla** es el pedazo con subrayado punteado ámbar (#b8791f); al pasar el puntero se pinta crema.

**El código arranca roto,** en la posición mala de la perilla.

**Toques:**
- **Tocar la perilla:** gira a la posición siguiente, que es otro texto en ese renglón, y la corrida vuelve a empezar: acciones en cero y lecturas en el arranque. Si hay más de dos posiciones, vuelve a la primera después de la última.
- **Tocar el botón:** hace la acción una vez.

**Cómo se ven las lecturas:**
- **En gris:** todavía no hiciste las acciones necesarias para saber si funciona (`accionesParaSaber`, la cantidad de acciones de la solución más corta).
- **En rojo** (#a03a26): averiado. Si la página tiene ayuda (en el viaje siempre), aparece una Angie chiquita con «Esa no era. Mirá la lectura.» en cursiva gris (360 ms).
- **En verde** (#2f6b4f): sano. El rótulo pasa a «DESAFÍO · SANO».
  - **Al sanar no hay cartel.** El componente dispara el evento `sistema-establecido` solo en el paso a sano.
  - Si rompes la perilla y lo vuelves a sanar, se dispara otra vez.

**Al resolver (sin tocar),** según `alEstablecerEnLaHoja` (`integrada-vista.component.ts:532`):
1. **Se guarda** la página como establecida.
2. **Festeja la tripulación** (`tripulacion.festejar()`):
   - el objeto de la etapa reacciona;
   - cada nave se pone contenta 1,6 s y salta, una tras otra (0,12 s entre una y otra);
   - salen 10 chispas del objeto, del color de acento.
3. **Habla la tripulación:** el pie cambia a la línea «al resolver», con la voz grabada que corta la anterior y la antena de quien habla titilando.

**Lo que hace cada objeto al festejar:**
- **Etapa 1, la caja naranja con campanita:** suma 1 al número, que vuelve a 0 después del 9. Rebota, la campana se mece y salen anillos.
- **Etapa 2, la molécula:** dos átomos ámbar y uno menta con «+». Los puntos de los enlaces viajan y los átomos rebotan.
- **Etapa 3, la baliza:** un poste con lámpara coral. Gira, los rayos destellan y sale un anillo.
- **Etapa 4, la balanza con dos tarjetas «{3, 4}»:** el brazo se mece.

**Nada traba.** En el viaje `puedeSeguir` es siempre verdadero (`pasarPagina`, `integrada-vista.component.ts:569`): puedes pasar de página sin resolver el desafío.

##### Cómo pasas de página y de etapa

**«Siguiente página →»**, la pastilla dorada del pie:
1. Las naves se van, en unos 0,78 s:
   - el objeto se apaga (0,3 s, desde los 0,25 s);
   - las naves dan un tirón atrás de 0,14 s y salen disparadas en 0,5 s, con 0, 0,08 y 0,14 s de diferencia.
2. Entra la página siguiente, con todo lo de «Al llegar».

**«← Anterior»** (solo desde la segunda página):
- la página anterior entra desde la izquierda, sin vuelo de naves;
- el desafío vuelve a arrancar roto, aunque ya lo hayas resuelto.

**«Seguir el viaje →»**, en la última página:
1. La hoja se cierra de golpe (`dejarLaHoja(true)` y `terminarManual`), sin el apagado de tele del prólogo.
2. Se abre la cinemática del concepto siguiente, con su iris.

**El mapa (la molécula) y la bitácora no existen.** Se retiraron (`docs/adr/0019-la-molecula-se-retira.md` y ADR 0021): al terminar una hoja se pasa directo a la cinemática siguiente. Algunos documentos todavía los nombran; está en «Cosas raras».

---

#### 1 · La caja que avisa

###### 1. Cinemática 1: «El que avisa»

*Dónde:* el cielo nocturno, vacío. En el centro aparece la tarjeta «La caja que avisa · El que avisa».

1. **Al llegar (sin tocar)**:
   - **0,12 s** — *Se ve:* la tarjeta del título.
   - **0,64 s** — *Se ve:* entran las naves.
     - Nave A en x16, y44; el capitán en x22, y62; la Nave B en x11, y74.
     - A los 0,38 s del beat (≈1,0 s) aparecen dos paneles con «0»: el de la Nave A (x16, y31) y el del capitán (x31, y62).
   - **1,16 s** — *Se ve:* la caja ámbar cae desde arriba (−58cqh) y rebota en el centro (x50, y44), mostrando «0». *Se oye:* el tono «beat».
   - **2,4 s** — *Pasa:* la tarjeta sube y el subtítulo pasa a la barra.
   - **2,5 a 6,2 s** — *Dice:* Nave B, «Encontré una caja. / Adentro hay…».
   - **6,4 a 10,2 s** — *Dice:* Nave A, «Lo cambié… y mi panel se enteró.». *Pasa:* el beat `hilo-lectura`:
     - un hilo punteado se dibuja en 1,1 s de la Nave A a la caja;
     - la caja y el panel A cambian de 0 a 7, como un cruce de números;
     - a los 0,7 s, el «0» del panel del capitán se apaga a gris.
   - **10,5 a 13,1 s** — *Dice:* Capitán, «El mío no. Sigue en cero.».
   - **13,3 a 15,8 s** — *Dice:* Nave B, «¿A ella le avisó y a vos no?».
   - **16,4 a 20,4 s** — *Se ve:* Angie sube con rebote abajo a la derecha (beat `mascota`). *Dice:* Angie (rotulada «MASCOTA»), «La caja no grita al espacio.».
   - **20,6 a 23,0 s** — *Dice:* Angie, «Avisa a quien la leyó.». *Pasa:* el beat `aviso-pulso`:
     - la caja late 2 veces;
     - un cometa ámbar recorre el hilo de la caja a la Nave A dos veces (1,05 s cada pasada, desde los 0,18 s);
     - sale una onda de la caja;
     - el panel A destella dos veces, a los 1,1 s.
   - **23,2 a 27,4 s** — *Dice:* Capitán, «Nunca la leí. / ¿Cómo se lee…».
   - **28,8 s** — *Pasa:* la cinemática se cierra sola y se abre la hoja.
2. **▸ (opcional)** — completa o adelanta la línea, como en las reglas.
3. **Saltar (opcional)** — el iris se cierra en 0,46 s y se abre la hoja.

*Para seguir:* nada. Corre sola.

###### 2. 1/1 · Variables (repaso pre-signals)

*Dónde:* la hoja «La caja que avisa», página 1 de 7. A la derecha del título, la caja naranja con campanita, mostrando «0».

1. **Al llegar (sin tocar)**
   - *Se ve:*
     - la hoja aparece (0,3 s);
     - el trazo del título se dibuja (0,2 a 1,1 s);
     - las naves ya están quietas, porque es la primera página.
   - *Se oye:* Nave B, con su voz y su antena titilando: «Una caja común: / guarda un número y calla.».
   - *Se ve, en la demo:*
     - chips de tipo: Number / String / Boolean / Object / Array;
     - chips de ejemplo del tipo elegido;
     - un circuito con tres cajas sin cables, var / const / let, con el valor elegido;
     - el código, de 3 renglones.
   - *Se ve, en el desafío:*
     - «▸ let total = 0; … total = total + 1;»;
     - las lecturas «cambios» y «avisos» en gris;
     - el botón «cambiar».
2. **Tocar un chip de tipo** — *Pasa:*
   - los ejemplos cambian a los de ese tipo y se elige el primero;
   - las tres cajas se sacuden y brillan con el valor nuevo, sin pulsos porque no hay cables.
3. **Tocar un chip de ejemplo** — *Pasa:* lo mismo, con ese valor.
4. **«cambiar» con la perilla rota** — *Se ve:*
   - las lecturas en rojo: «cambios 1, avisos 0»;
   - aparece la Angie chiquita: «Esa no era. Mirá la lectura.».
5. **Tocar la perilla (`let total = 0`)** — *Pasa:* el renglón pasa a `const total = signal(0);` y el último a `total.set(total() + 1);`. Las lecturas vuelven a gris.
6. **«cambiar»** — *Se ve:*
   - «cambios 1, avisos 1» en verde;
   - el rótulo dice «DESAFÍO · SANO».
   - *Pasa:* el festejo. La caja del cielo pasa de 0 a 1, rebota, la campana se mece y salen anillos; las naves saltan y salen chispas.
   - *Se oye y dice:* Capitán, «Con signal, la caja ya avisa.».
7. **«Siguiente página →»** — como en las reglas.

*Para seguir:* girar la perilla una vez y apretar «cambiar» una vez. Es opcional: nada traba.

###### 3. 1/2 · Qué es un signal

*Dónde:* página 2 de 7.

1. **Al llegar (sin tocar)**
   - *Pasa:* las naves se fueron con la página anterior y vuelven volando.
   - *Dice:* Nave A, «Esta caja avisa cuando cambia.».
   - *Se ve:* un circuito:
     - Number, String y Boolean arriba;
     - Object y Array abajo;
     - en el medio de abajo, el «consumidor» con «…».
2. **Tocar una caja** — *Pasa:* se convierte en signal (cambia al tono de fuente) y se dibuja su cable al consumidor.
   - Tras la primera conversión aparecen el texto «Un signal puede contener cualquier valor…» y el código de `SignalWrapper`, con la nota «es una metáfora».
3. **Tocarla otra vez** — *Pasa:*
   - cambia su valor de muestra;
   - la caja se sacude y brilla;
   - sale un pulso por el cable (0,34 s) y, al llegar, el consumidor reacciona.
4. **Desafío** — *Cambia:*
   - la perilla es el argumento de `mostrar(...)`, dentro de un `effect`;
   - el botón es «cambiar el valor»;
   - la lectura es «consumidores enterados»;
   - roto da 0; sano, `mostrar(total())`, da 1.
   - Al resolver *Dice:* Nave B, «¡Me avisó! / Y no le pregunté nada.».

*Para seguir:* girar y una acción.

###### 4. 1/3 · Tipos de signal

*Dónde:* página 3 de 7.

1. **Al llegar (sin tocar)**
   - *Dice:* Capitán, «¿Qué cosas entran en la caja?».
   - *Se ve:* un circuito y, al lado, el código:
     - WritableSignal, alto, a la izquierda;
     - dos cables a Signal y a Computed, los dos con candado.
2. **Tocar un nodo** — *Pasa:*
   - lo selecciona y el código muestra cómo se crea;
   - el chip dice «escribible» (esmeralda) o «solo lectura» (ámbar);
   - aparecen una descripción y los valores de `isSignal() →` e `isWritableSignal() →`.
3. **«Probar .set()»**
   - sobre WritableSignal: suma 1 y salen pulsos por los dos cables; Computed muestra el doble;
   - sobre los otros: rebota en rojo «no tiene .set()».
4. **Desafío** — *Cambia:*
   - la perilla elige `computed(...)` o `signal(0)`;
   - el botón es «escribir»;
   - la lectura es «escrituras aceptadas»: rota 0, sana 1.
   - Al resolver *Dice:* Nave A, «Número, texto o lista. / Todas avisan igual.».

*Para seguir:* girar y una acción.

###### 5. 1/4 · Leer un signal: el getter ()

*Dónde:* página 4 de 7.

1. **Al llegar (sin tocar)**
   - *Dice:* Capitán, «Nunca la leí. / ¿Cómo se lee una caja?». Es la misma línea que cerró la cinemática 1.
   - *Se ve:*
     - los nodos count → template;
     - tres botones;
     - dos paneles de código, html y ts.
2. **`count`** — *Pasa:* rebota una «ƒ» y la lectura dice «count → function».
3. **`count()`** — *Pasa:* el nodo reacciona, sin pulso.
4. **`count.update()`** — *Pasa:* suma 1 y sale un pulso al template.
5. **Pista de Angie** — *Cambia:* el globo no tiene «Qué hacer»; solo Concepto y Qué observar.
6. **Desafío** — *Cambia:*
   - la perilla es `total * 2` o `total() * 2`;
   - el botón es «leer»;
   - la lectura es «número leído»: rota 0, sana 14.
   - Al resolver *Dice:* Nave B, «Con paréntesis. / Así sabe quién la lee.».

*Para seguir:* girar y una acción.

###### 6. 1/5 · Writable Signal

*Dónde:* página 5 de 7.

1. **Al llegar (sin tocar)**
   - *Dice:* Nave A, «Esta caja la puedo escribir yo.».
   - *Se ve:*
     - un campo numérico con «Set»;
     - «Valor: N»;
     - los nodos count → count().
2. **Escribir un número y «Set» (o Enter)** — *Pasa:*
   - el valor cambia y sale un pulso;
   - si es distinto del anterior, el valor viejo sale despedido del nodo.
   - Si no es un número, *Se ve:* «Escribí un número: el signal quedó como estaba.».
3. **Desafío** — *Cambia:*
   - la perilla es `total + 1` o `total() + 1`;
   - el botón es «sumar uno».
   - **Hacen falta 2 acciones** para que la lectura deje el gris:
     - roto da «valor 0»;
     - sano da «valor 2».
   - Al resolver *Dice:* Capitán, «Con set cambia, / y todos se enteran.».

*Para seguir:* girar y dos acciones.

###### 7. 1/6 · Update Signal

*Dónde:* página 6 de 7.

1. **Al llegar (sin tocar)**
   - *Dice:* Nave B, «¿Y si sumo a lo que había?».
   - *Se ve:* el botón «Incrementar» y una cadena de chips.
2. **«Incrementar»** — *Pasa:*
   - suma 1, con pulso;
   - la cadena suma un chip «0 → 1 → …», como máximo 5.
3. **Desafío** — *Cambia:*
   - la perilla es `set(1)` o `update((n) => n + 1)`;
   - el botón es «sumar uno» y hacen falta 2 acciones;
   - la lectura «valor» da 1 rota y 2 sana.
   - Al resolver *Dice:* Nave A, «update parte del valor de antes.».

*Para seguir:* girar y dos acciones.

###### 8. 1/7 · Read-only signals: asReadonly()

*Dónde:* página 7 de 7, la última. El pie dice «Seguir el viaje →».

1. **Al llegar (sin tocar)**
   - *Dice:* Capitán, «Que la lean todos. / Que la escriba uno.».
   - *Se ve:* los nodos `private _count` → `count` (con candado) → `count()`, y botones.
2. **«Incrementar (interno)»** (botón azul) — *Pasa:* suma 1 y salen pulsos.
3. **«Reiniciar»** — *Pasa:* vuelve a 0.
4. **`count.set(5)`** — *Pasa:* rebota «no compila» y aparece una nota.
5. **Desafío** — *Cambia:*
   - la perilla es `this._total` o `this._total.asReadonly()`;
   - el botón es «escribir desde afuera»;
   - la lectura es «escrituras ajenas»: rota sube 1 por cada acción, sana queda en 0.
   - Al resolver *Dice:* Nave B, «asReadonly: se mira, no se toca.».
6. **«Seguir el viaje →»** — *Pasa:* la hoja se cierra de golpe y se abre la cinemática 2.

*Para seguir:* girar y una acción. Después, «Seguir el viaje».

#### 2 · La molécula punteada

###### 9. Cinemática 2: «El que se entera por otro»

*Dónde:* el cielo. La apertura trae solo «titulo» y «naves»: sin objeto propio hasta los 2,4 s.

1. **Al llegar (sin tocar)**:
   - **2,4 s** — *Se ve:* caen dos cajas arriba: «velocidad» 5 (x40) y «viento» 3 (x60).
   - **2,3 a 6,5 s** — *Dice:* Capitán, «Rumbo es velocidad más viento. / Súmenlo…». *Pasa:* el beat `suma-a-mano`:
     - a los 0,6 s aparece un papel;
     - de los 0,8 a los 2,05 s se escribe a mano «5 + 3 = 8», trazo por trazo;
     - a los 3,3 s el viento late y sale una onda; a los 3,4 s cambia de 3 a 4;
     - a los 3,9 s el papel se apaga a 0,4, porque la suma quedó vieja.
   - **6,8 a 10,6 s** — *Dice:* Nave A, «Cambió el viento. / Tu suma quedó vieja.».
   - **10,8 a 14,4 s** — *Dice:* Nave B, «Esta molécula punteada / ya tiene la suma.». *Pasa:* el beat `molecula-punteada`:
     - el contorno menta punteado se dibuja en 1 s, con relleno y halo;
     - a los 0,8 s muestra 9.
   - **14,6 a 18,4 s** — *Dice:* Capitán, «¿Quién la escribió? Nadie la tocó.».
   - **19,1 a 23,3 s** — *Se ve:* sube Angie. *Dice:* Angie, «Nadie la toca. Se entera por otro.».
   - **23,5 a 26,6 s** — *Dice:* Nave A, «¿Se rehace con cada cambio del viento?». *Pasa:* el beat `hilos-fuente`:
     - se dibujan los hilos de cada caja a la molécula;
     - la velocidad pasa de 5 a 6 a los 0,95 s y el viento de 4 a 5 a los 1,07 s;
     - bajan anillos por los hilos (1,0 y 1,12 s);
     - a los 1,95 s la molécula hace un destello y pasa de 9 a 11.
   - **26,8 a 30,4 s** — *Dice:* Angie, «Fíjense qué pasa si nadie la lee.». *Pasa:* el beat `reposo`:
     - el viento pasa de 5 a 7 (0,35 s) y baja un anillo de eco;
     - la molécula se adormece en 2,5 s (opacidad 0,38) y respira;
     - a los 1,2 s se dibuja el hilo de lectura del capitán;
     - a los 2,1 s sale una onda y a los 2,15 s la molécula pasa de 11 a 13 y queda encendida.
   - **31,8 s** — la cinemática se cierra sola.
2. **▸ / Saltar** — como en las reglas.

*Para seguir:* nada.

###### 10. 2/1 · Computed signals

*Dónde:* la hoja «La molécula punteada», página 1 de 3. El objeto es la molécula (dos átomos ámbar y uno menta con «+»).

1. **Al llegar (sin tocar)**
   - *Dice:* Nave A, «Mi suma depende de otras cajas.».
   - *Se ve:*
     - los campos Name y Surname, con «Damian» y «Sire»;
     - los nodos firstName y surname → fullName (con candado);
     - el saludo «Hola, Damian Sire!».
2. **Escribir en un campo** — *Pasa:* sale un pulso de esa caja a fullName y el saludo cambia.
3. **Tocar fullName** — *Pasa:* rebota «es derivado».
4. **Desafío** — *Cambia:*
   - la perilla es `let conIva = precio() * 1.21` o `const conIva = computed(...)`;
   - el botón es «cambiar el precio»;
   - la lectura es «desfasado»: rota 1, sana 0.
   - Al resolver *Pasa:* los enlaces de la molécula del cielo hacen viajar sus puntos y los átomos rebotan. *Dice:* Capitán, «Cambió una caja. / La suma se rehízo sola.».

*Para seguir:* girar y una acción.

###### 11. 2/2 · Dependencias dinámicas

*Dónde:* página 2 de 3.

1. **Al llegar (sin tocar)**
   - *Dice:* Nave B, «Según el camino, / lee unas cajas u otras.».
   - *Se ve:*
     - los nodos showCount (botón) y count (+1) → conditionalCount;
     - los chips «Signals Inside / Dependencias»;
     - dos historiales (máximo 2 entradas): «conditionalCount Recomputations» y «All Signals Recomputations»;
     - el código, de 9 renglones, con el activo resaltado.
2. **showCount** — *Pasa:* alterna. En false, el cable de count queda colgando.
3. **count +1** — *Pasa:*
   - con showCount en true, sale pulso y se recalcula;
   - en false, no recalcula conditionalCount.
4. **Desafío** — *Cambia:*
   - la perilla toca el primer renglón del `computed`;
   - con la posición sana, el renglón viejo del `return` queda apagado a 0,65;
   - el botón es «cambiar la rama muerta»;
   - la lectura es «recálculos»: rota sube con cada acción, sana queda en 0.
   - Al resolver *Dice:* Nave A, «Escucha solo lo que leyó / la última vez.».

*Para seguir:* girar y una acción.

###### 12. 2/3 · Perezoso y memoizado

*Dónde:* página 3 de 3, la última («Seguir el viaje →»).

1. **Al llegar (sin tocar)**
   - *Dice:* Capitán, «¿Calcula aunque nadie la mire?».
   - *Se ve, arriba:* un circuito nombre «Ada» → saludo «sin correr», con tres botones y «corridas = 0».
   - *Se ve, abajo, el formulario básico:*
     - un h1 «Damian Sire!»;
     - los campos First Name y Surname, vacíos;
     - un botón negro «Set»;
     - los paneles «Clicks» y «Calculated Signals», de máximo 3 entradas.
2. **`saludo()`** — *Pasa:* lo lee y suben las corridas, solo si algo cambió.
3. **`nombre.set(otro)`** — *Pasa:* alterna entre Ada y Grace y sale un pulso hacia saludo, pero no recalcula hasta que lo leas.
4. **`nombre.set(igual)`** — *Pasa:* el nodo solo reacciona.
5. **Llenar el formulario y «Set»** — *Pasa:* se suman entradas en «Clicks» y en «Calculated Signals» *(el detalle de qué anota cada panel no lo pude confirmar)*.
6. **Desafío** — *Cambia:*
   - la perilla es una función común o un `computed(...)`;
   - el botón es «leer el total» y **hacen falta 3 lecturas**;
   - la lectura «ejecuciones» rota sube con cada lectura; sana queda en 1.
   - Al resolver *Dice:* Nave B, «No. Calcula al leerla, / y una sola vez.».
7. **«Seguir el viaje →»** — se abre la cinemática 3.

*Para seguir:* girar y tres acciones.

#### 3 · La baliza

###### 13. Cinemática 3: «El que sale a hacer algo»

*Dónde:* el cielo. La apertura trae titulo, naves y baliza-coral, pero la baliza y las cajas esperan a los 2,4 s: necesitan además «titulo-rincon» (`escenas/escena-03.component.ts:233,389`).

1. **Al llegar (sin tocar)**:
   - **2,4 s** — *Se ve:*
     - cae la caja ámbar «7» (x52, y44) y aparece la caja pálida del viento «3» (x66);
     - a los 0,38 s la baliza coral se engancha con rebote en el casco de la Nave B (x26, y52);
     - a los 0,65 s su sonar da dos vueltas.
   - **2,5 a 6,0 s** — *Dice:* Nave B, «Puse una baliza: / suena cuando…».
   - **6,2 a 9,3 s** — *Dice:* Nave A, «Cambié la caja. Sonó sola.». *Pasa:* el beat `hilo-lectura`:
     - el hilo de la baliza a la caja se dibuja en 1 s;
     - la caja late, sale una onda (1,0 s) y cambia de 7 a 8 (1,05 s);
     - un anillo coral viaja de la caja a la baliza (1,15 a 2,0 s);
     - la baliza destella y suena su sonar (1,98 s);
     - a los 2,7 s el viento late y a los 2,75 s cambia de 3 a 5, sin que la baliza reaccione.
   - **9,5 a 12,8 s** — *Dice:* Capitán, «Cambié el viento. No sonó.».
   - **13,5 a 16,4 s** — *Se ve:* sube Angie. *Dice:* Angie, «Solo vuelve por lo que leyó.».
   - **17,2 a 20,8 s** — *Dice:* Nave B, «Y ahora suenan dos. / La vieja no paró.». *Pasa:* el beat `baliza-doble`:
     - cae una baliza nueva, apilada encima;
     - la vieja queda fantasma, punteada y a 0,6;
     - a los 0,35 s aparece un segundo hilo;
     - las dos parpadean a destiempo para siempre (ciclo de 1,4 s, separadas 0,7 s), con sonar.
   - **21,0 a 23,9 s** — *Dice:* Nave A, «Salir a hacer algo deja rastro.». *Pasa:* el beat `rastro`: detrás de la nave quedan 5 anillos de estela, uno cada 0,38 s, que no se borran.
   - **24,2 a 27,7 s** — *Dice:* Capitán, «¿Cómo se apaga la anterior / antes de repetir?».
   - **29,1 s** — la cinemática se cierra sola.
2. **▸ / Saltar** — como en las reglas.

*Para seguir:* nada.

###### 14. 3/1 · Dependencias del effect

*Dónde:* la hoja «La baliza», página 1 de 3. El objeto es la baliza coral.

1. **Al llegar (sin tocar)**
   - *Dice:* Nave B, «Puse una baliza: / suena cuando cambia la caja.». Es la misma línea que abre la cinemática 3.
   - *Se ve:*
     - las cajas Count1 y Count2 (un diseño más viejo, con flex);
     - los estados «effect (1): count» y «effect (2): count2»;
     - el historial «Corridas del effect» (máximo 4);
     - el código, de 8 renglones.
   - *Pasa:* Count1 suma 1 solo cada 1,3 s y su effect anota «effect(1) corrió». Con movimiento reducido o la pausa del fondo, no late.
2. **Tocar Count2** — *Pasa:* suma 1 y el effect (2) corre y se anota.
3. **Desafío** — *Cambia:*
   - la perilla mueve la lectura: `console.log(c)` o `console.log(count())`;
   - con la lectura adentro, `const c = count();` queda apagado;
   - el botón es «count +1»;
   - las lecturas son «count» y «último log»: rota da count n y log 0; sana da 1 y 1.
   - Al resolver *Pasa:* la baliza del cielo gira, destella y suelta un anillo. *Dice:* Nave A, «Sonó sola. / Solo por lo que leyó.».

*Para seguir:* girar y una acción.

###### 15. 3/2 · Intervalo filtrado

*Dónde:* página 2 de 3.

1. **Al llegar (sin tocar)**
   - *Dice:* Capitán, «Esta baliza suena cada tanto.».
   - *Se ve:*
     - el botón «Destruir hijo»;
     - el widget del hijo: «Reloj del hijo», la hora, «Actualizar hora» (azul) y «Prender/Apagar intervalo» (verde);
     - «Latidos: N (sigue subiendo tras destruirlo: leak a propósito)»;
     - «Últimos latidos» (máximo 5);
     - el código, de 14 renglones.
   - *(Si el intervalo arranca prendido o apagado no lo pude confirmar.)*
2. **«Prender/Apagar intervalo»** — *Pasa:* empiezan (o paran) los latidos.
3. **«Actualizar hora»** — *Pasa:* el reloj se pone en hora.
4. **«Destruir hijo»** — *Pasa:* el widget desaparece, pero los latidos siguen subiendo.
   - **No hay vuelta atrás:** nada lo vuelve a mostrar hasta que dejes la página.
5. **Desafío** — *Cambia:*
   - **la perilla tiene 3 posiciones:**
     - «// nadie lo apaga»;
     - «return () => clearInterval(id)», la trampa de React;
     - `onCleanup(...)`;
   - hay que girarla dos veces;
   - el botón es «destruir el componente»;
   - la lectura «intervalos vivos» da 1 en las dos posiciones malas y 0 con `onCleanup`.
   - Al resolver *Dice:* Nave B, «Al irnos, se apaga con nosotros.».

*Para seguir:* girar dos veces y una acción.

###### 16. 3/3 · Limpieza con onCleanup

*Dónde:* página 3 de 3, la última («Seguir el viaje →»).

1. **Al llegar (sin tocar)**
   - *Dice:* Nave A, «Salir a hacer algo deja rastro.». Es una línea repetida de la cinemática 3.
   - *Se ve:* la misma pantalla que 3/2, pero con `onCleanup`: «(se frena al destruirlo: onCleanup)».
2. **Prender el intervalo y «Destruir hijo»** — *Pasa:* el widget desaparece y los latidos se frenan. Tampoco hay vuelta atrás.
3. **Desafío** — *Cambia:*
   - **la perilla tiene 3 posiciones:** `DestroyRef.onDestroy`, `ngOnDestroy` y `onCleanup`; hay que girarla dos veces;
   - el botón es «prender y apagar» y **hacen falta 2 acciones**;
   - las lecturas son «relojes vivos» y «esperado»: rota da n+1 contra 1; sana da 1 y 1.
   - Al resolver *Dice:* Capitán, «onCleanup barre / antes de repetir.».
4. **«Seguir el viaje →»** — se abre la cinemática 4.

*Para seguir:* girar dos veces y dos acciones.

#### 4 · Las coordenadas gemelas

###### 17. Cinemática 4: «¿Cambió, o solo se parece?»

*Dónde:* el cielo. La apertura trae titulo y naves. Con las naves aparecen tres paneles con marcas.

1. **Al llegar (sin tocar)**:
   - **2,4 s** — *Se ve:* cae la caja «0» (x50, y45).
   - **2,3 a 5,8 s** — *Dice:* Nave A, «Escribí siete. Y siete otra vez.». *Pasa:* el beat `siete-dos-veces`:
     - una ficha «7» viaja en arco desde la Nave A, dos veces (1,35 s cada una, desde los 0,9 s);
     - **la primera vez:** la caja golpea y pasa de 0 a 7 (1,64 s); una medialuna de onda sale hacia las naves; cada panel enciende la marca 1 con un destello (2,08 s + 0,1 s por panel);
     - **la segunda (≈2,99 s):** solo un aplaste corto.
   - **6,0 a 8,9 s** — *Dice:* Nave B, «La segunda vez nadie se enteró.».
   - **9,5 a 12,9 s** — *Se ve:* sube Angie. *Dice:* Angie, «Si no cambió, no hay aviso.».
   - **13,7 a 19,8 s** — *Dice:* Capitán, «Copié las coordenadas, idénticas. / Y todos…». *Pasa:* el beat `coordenadas-gemelas`:
     - aparecen dos tarjetas «(4,9)», en x38 y x62;
     - la vieja entra a la caja (0,12 s);
     - la copia empuja (0,98 s) y la reemplaza (1,16 s); la caja late y sale otra onda;
     - la vieja queda fantasma, punteada;
     - a los 1,6 s los paneles se encienden en ámbar y suman la marca 2.
   - **20,0 a 22,2 s** — *Dice:* Nave A, «¿Idénticas para quién?». *Pasa:* el beat `balanza`:
     - el punteado entre las tarjetas se dibuja (0,9 s);
     - aparece el fiel (x50, y29) con «=»;
     - desde los 1,1 s el signo duda entre «=» y «≠» y se mece, en bucle.
   - **22,4 a 28,3 s** — *Dice:* Angie, «Dos helados de chocolate / también…». *Pasa:* nada; esta línea no tiene beat ni dibujo.
   - **28,5 a 32,0 s** — *Dice:* Angie, «Y el criterio se puede elegir.». *Pasa:* el beat `criterio`:
     - el fiel se queda quieto a 0,7;
     - se dibuja el enchufe;
     - el dial (x50, y69) se abre con un iris (0,76 s), muestra «¿igual?» y busca de un lado a otro (±38°), en bucle.
   - **32,2 a 35,5 s** — *Dice:* Capitán, «¿Con qué criterio comparó mis coordenadas?».
   - **36,9 s** — la cinemática se cierra sola.
2. **▸ / Saltar** — como en las reglas.

*Para seguir:* nada.

###### 18. 4/1 · Igualdad por defecto (Object.is)

*Dónde:* la hoja «Las coordenadas gemelas», página 1 de 2. El objeto es una balanza con dos tarjetas «{3, 4}».

1. **Al llegar (sin tocar)**
   - *Dice:* Nave B, «Mismas coordenadas. / ¿Es la misma caja?».
   - *Se ve:*
     - la tarjeta «user()», «Ada», «Notificaciones: N»;
     - tres botones Tailwind: «Mismo contenido (objeto nuevo) → notifica» (índigo), «Misma referencia → NO notifica» (gris) y «Cambiar nombre → notifica».
2. **«Mismo contenido»** — *Pasa:* suma una notificación.
3. **«Misma referencia»** — *Pasa:* no suma.
4. **«Cambiar nombre»** — *Pasa:* cambia el nombre y suma una notificación. *(No lo pude confirmar en pantalla: si el contador anima.)*
5. **Desafío** — *Cambia:*
   - la perilla mueve la escritura: `u.name = …` o `return { ...u, name: … }`;
   - la posición sana saca el renglón `return u;`;
   - el botón es «renombrar»;
   - las lecturas «cambios» y «avisos» dan n y 0 rota, 1 y 1 sana.
   - Al resolver *Pasa:* el brazo de la balanza del cielo se mece. *Dice:* Nave A, «Mismo valor, nadie se entera. / Otro objeto, sí.».

*Para seguir:* girar y una acción.

###### 19. 4/2 · Función equal custom

*Dónde:* página 2 de 2, la última («Seguir el viaje →»).

1. **Al llegar (sin tocar)**
   - *Dice:* Capitán, «Que compare como yo quiero.».
   - *Se ve:* una tarjeta parecida, con `equal` por nombre, y dos botones: «Mismo name (objeto nuevo) → NO notifica» y «Cambiar nombre → notifica» (esmeralda).
2. **«Mismo name»** — *Pasa:* no suma.
3. **«Cambiar nombre»** — *Pasa:* suma.
4. **Pista de Angie** — *Dice:* «Tocá 'Mismo name' varias veces y comparalo con el sub-nivel 1.».
5. **Desafío** — *Cambia:*
   - la perilla agrega la comparación: con `equal` aparecen los renglones `equal: mismoContenido,` y `});`;
   - el botón es «recargar lo mismo» y hacen falta 2 acciones;
   - las lecturas «cargas» y «recálculos» dan n y n rota, 2 y 1 sana.
   - Al resolver *Dice:* Nave B, «Con equal, / el criterio es nuestro.».
6. **«Seguir el viaje →»** — se abre la cinemática 5 (fuera de esta parte).

*Para seguir:* girar y dos acciones.

### Parte 6 · Arco II · La banda vieja (capítulos 5 a 8)

Cuatro etapas: **El mapa de rutas** (cinemática 5 + 5/1, 5/2), **La transmisión** (cinemática 6 + 6/1 a 6/3), **El repetidor** (cinemática 7 + 7/1 a 7/6) y **Los pipes se traducen** (cinemática 8 + 8/1 a 8/4).

#### Reglas que valen para toda esta parte

- **Cinemáticas.** Las cuatro abren igual: la tarjeta del capítulo en el centro (`etapa · título`), a los 2,4 s se va hacia arriba y el héroe de la escena toma el centro. La primera línea entra sola a los ~2,3–2,5 s. Cada toque (clic en ▸, Enter, espacio, flecha derecha) completa la línea si todavía está entrando, o salta a la siguiente y enciende todo lo que había hasta ahí. El toque que sigue a la última línea cierra la cinemática y abre la hoja. Sin tocar, avanza sola al ritmo de la voz. Los tiempos que doy por línea son de la reproducción sin tocar (calculados con `armarReloj` y la duración de cada mp3).
- **Voces.** Las 34 líneas de las cinemáticas 5 a 8 y las 30 líneas de la tripulación de las 15 páginas tienen voz grabada en `voces-grabadas.ts:116-149` y `:223-252`. Ninguna cae en blips.
- **Sonidos de la cinemática.** Suena `titulo` al abrir, `beat` cada vez que se enciende un beat (también `naves`, el de la apertura y `mascota`), `transmision` en el beat `transmision` (solo en la cinemática 6), `toque` en cada avance y `cierre` al salir (`cinematica.component.ts:339,375-376,271,445`). No hay música, ni en las cinemáticas ni en las hojas.
- **Nombre en la caja.** Cuando habla Angie, la caja dice **MASCOTA** (`cinematica.component.ts:47`), en letra serif cursiva y con el retrato de la mascota. En la Cinemática 6, la línea de la exploradora dice **EXPLORADORA**.
- **Escenario común.** Las naves entran desde la izquierda en formación con el beat `naves` (a los 0,64 s), una detrás de otra. Angie está a la derecha (x 84 %) y sube con rebote recién cuando su primera línea enciende `mascota`. Antes de eso no está en escena.
- **Páginas.** Cada página es una pantalla montada en la hoja. El título de la pantalla lo pone la hoja, y el `app-title` propio de la pantalla se esconde (`styles.css:350-353`). Debajo va la demo, con el panel de código al lado; en ese panel, los renglones `active` van marcados. Al final, el desafío de perilla (`Desafío · tocá el código`). Al llegar, la tripulación dice su línea de llegada; al quedar sano, dice la de resuelta. La tarjeta (Concepto / Qué hacer / Qué observar) es la pista de Angie que se abre tocando a la mascota («tocame»). En 6/3, 7/4, 7/5 y 7/6 la pista trae solo el Concepto. Si accionas con el código roto, aparece «Esa no era. Mirá la lectura.» (el libro del viaje lleva `ayuda: true`, `integrada-vista.component.ts:974`).
- **Perilla.** Tocar el renglón marcado cambia el código, y cada cambio arranca la corrida de cero. En todas las páginas de esta parte la perilla tiene 2 posiciones, salvo en 6/3, que tiene 3. Con una sola acción ya se sabe el resultado, salvo en 6/1 y 6/2, que piden **dos** acciones después de girar (`accionesParaSaber`). Con menos, la lectura queda neutra.
- **Teclado en las hojas.** Escribir en los campos de 7/4, 7/5, 7/6 y 8/1 no mueve la hoja: las flechas y el espacio se ignoran adentro de un input (`manual-de-a-bordo.ts:80-84`).

---

#### 5 · El mapa de rutas

###### Cinemática 5: «Cuando el observador interviene»
*Dónde:* cielo crema con moléculas lejanas punteadas. A la izquierda, de arriba abajo: Nave A, Capitán, Nave B. Angie todavía no está.
1. **Al llegar (sin tocar)** — *Se ve:* la tarjeta «El mapa de rutas · Cuando el observador interviene». A los 1,16 s, `mapa-rutas`: la placa del mapa (papel con grilla de puntos) aparece en el centro (0,6 s) y abajo a la izquierda sube un rótulo `SECTOR 1`. A los 2,4 s se va la tarjeta y tres rutas ámbar se dibujan desde el nodo de partida hasta el de destino (0,9 s cada una, escalonadas). La de arriba (ruta 1) queda ámbar pleno y las otras dos en ámbar lavado. El nodo de destino aparece con rebote a los 0,7 s. A los 0,9 s cae desde arriba con rebote un alfiler menta de **borde punteado** (es un derivado) y se posa sobre la ruta 1. *Se oye:* `titulo`, y después `beat` con las naves y con el mapa. *Dice:* Nave A (2,5 s): «El mapa propone la primera ruta.»
2. **Toque 1** — *Pasa:* `mano-pisa`. Desde abajo a la izquierda entra un puntero del color de la Nave B. El alfiler se levanta, viaja en curva hasta la ruta 3 (0,9 s), aplasta y rebota. A los 1,44 s su borde pasa de punteado a **entero**, salen tres anillos menta desde donde cayó, la ruta 1 se lava y la 3 queda ámbar plena. El puntero suelta y se va (1,6 s), y la Nave B se inclina hacia el mapa. *Dice:* Nave B: «Yo prefiero la tercera. / La marco a mano.»
3. **Toque 2** — *Pasa:* nada nuevo. *Dice:* Capitán: «Lo derivado no se tocaba.»
4. **Toque 3** — *Pasa:* Angie sube con rebote a la derecha y empieza a respirar. *Dice:* Mascota: «Este sí se deja pisar.»
5. **Toque 4** — *Pasa:* `sector-nuevo`. La grilla se corre 80 px (1,1 s, se lee como paneo) y el rótulo cambia como odómetro: el `1` sale por arriba y sube el `2`. Las rutas 1 y 2 cambian de forma y ahora terminan en un destino nuevo, más arriba a la derecha. La ruta 3 se borra hacia adelante y se apaga, y en su lugar se dibuja una tercera ruta nueva que pasa por otro lado. El destino viejo se achica y desaparece, y el nuevo aparece con rebote (0,82 s). Ninguna ruta queda elegida. El alfiler sigue donde estaba la ruta 3 vieja, sobre la nada. *Dice:* Nave A: «Cambió el sector. / El mapa trae rutas nuevas.»
6. **Toque 5** — *Pasa:* `marcador-suspenso`. El alfiler se despega un poco del mapa, pierde la sombra y titila sin parar (opacidad 1 ↔ 0,3, cada 0,6 s). La Nave B se echa para atrás. *Dice:* Nave B: «¿Y mi tercera? No está en la lista.»
7. **Toque 6** — *Pasa:* nada nuevo; el alfiler sigue titilando. *Dice:* Capitán: «¿Queda huérfana o vuelve a la fuente?»
8. **Toque 7** — *Pasa:* nada nuevo. *Dice:* Mascota: «Vamos, lentos… Perdón. / Tómense su tiempo.» (es la voz más larga de la parte: 6,5 s).
9. **Toque 8** — cierra (sin tocar, a los ~34 s).

###### 5/1 · linkedSignal: reinicio con la fuente
*Dónde:* la hoja «linkedSignal: reinicio con la fuente». A la izquierda, la demo «Métodos disponibles»: chips `Ground`, `Air`, `Sea`, con `Ground` en violeta. Debajo, «Seleccionado: **Ground**» y dos botones de tinta: «Lista nacional» y «Lista internacional». A la derecha, el código (`selectedOption = linkedSignal(() => this.shippingOptions()[0])`, marcado).
1. **Al llegar (sin tocar)** — *Dice:* Nave A: «El mapa propone la primera ruta.» (la misma línea y el mismo mp3 con que abrió la cinemática que acabas de ver).
2. **Tocar un chip** (por ejemplo `Air`) — *Pasa:* queda violeta y «Seleccionado» cambia.
3. **Tocar «Lista nacional»** — *Pasa:* la lista pasa a `Ground`, `Air` y la selección vuelve a `Ground`, aunque `Air` siga en la lista. Con «Lista internacional» (`Air`, `Sea`, `Express`) vuelve a `Air`. A la lista original no se puede volver.
4. **Desafío** — *Se ve:* `const elegido = signal(primero(categoria()));`, lectura `selecciones inválidas 0` (neutra) y botón «cambiar de categoría». Si accionas con este código, cada vez suma 1 inválida y sale la ayuda. Tocar el renglón lo cambia a `linkedSignal(() => primero(categoria()))`, y con eso «cambiar de categoría» deja la lectura en 0 → sano. *Dice:* Capitán: «Cambió la fuente: / la ruta volvió a empezar.»
*Para seguir:* girar la perilla y accionar una vez.

###### 5/2 · linkedSignal: preservar si sigue válida
*Dónde:* la misma demo que en 5/1, pero en verde esmeralda. El código muestra `source` + `computation` con `previous`.
1. **Al llegar** — *Dice:* Nave B: «Si mi ruta sigue existiendo, / la guardo.»
2. **Elegir `Air` y tocar «Lista nacional»** — *Pasa:* `Air` sigue en la lista y **se queda**. Si eliges `Sea` y tocas «Lista nacional», cae a `Ground`.
3. **Desafío** — *Se ve:* `computation: (l) => l[0],` (marcado), lectura `selecciones perdidas 0` y botón «recargar la lista». Roto, cada acción suma 1 perdida. El giro lo cambia a `(l, p) => l.includes(p?.value) ? p.value : l[0]` y queda en 0 → sano. *Dice:* Nave A: «Si sigue valiendo, / se queda la mía.»

---

#### 6 · La transmisión

###### Cinemática 6: «El dato que todavía viaja»
*Dónde:* escena con tres planos (fondo lejano, mundo y manchas desenfocadas delante). En el centro, una molécula menta **punteada** con tres ranuras: cargando (arco), error (✕ gris) y valor (vacía, borde punteado). Arriba a la derecha está la fuente. Naves a la izquierda.
1. **Al llegar (sin tocar)** — *Se ve:* la cámara entra: el plano lejano y el cercano se acomodan en sentidos contrarios durante 2,8 s. Con la tarjeta se dibuja un rombo menta («este capítulo es el pico»), que se va con ella. A los 2,4 s la molécula entra girando con rebote, se dibujan sus enlaces y las tres ranuras aparecen de a una. El arco de «cargando» gira sin parar hasta el final. *Pasa:* a los 2,5 s, beat `transmision`: arriba a la derecha aparece un brillo rosa y una ventanita redonda punteada con un punto rosa adentro. Tres anillos rosa punteados laten tres veces, las tres naves giran hacia la fuente una por una y la cámara se corre un poco hacia la señal. *Se oye:* el efecto `transmision`, no el `beat`. *Dice:* Nave A: «¿Escucharon? Hay algo en la banda vieja.»
2. **Toque 1** — *Pasa:* `onda-debil`. La ventanita se abre en iris y adentro aparece la nave de la exploradora, rosa y mirando a la izquierda. Desde la fuente sale hacia las naves una onda rosa entrecortada (1,7 s) que se apaga antes de llegar. El punteado fluye y la opacidad tartamudea unos 5 s; después queda quieta y tenue. *Dice:* **Exploradora:** «…cap… ¿me… reciben?…»
3. **Toque 2** — *Dice:* Nave B: «¡Es la exploradora! Sigue afuera.»
4. **Toque 3** — *Dice:* Capitán: «¡Exploradora! ¿Dónde estás?»
5. **Toque 4** — *Dice:* Capitán: «No contesta. Preguntá de nuevo, / más fuerte.» (sin tocar entra con 0,9 s extra de silencio).
6. **Toque 5** — *Pasa:* `dos-paquetes`. Se revela un camino punteado menta desde la fuente hasta la ranura de valor. Salen dos paquetes rosa: el **7** a los 0,25 s, lento (2,8 s), y el **8** a los 0,77 s, rápido (1,68 s). El 8 pasa al 7 a mitad de camino y llega primero (2,45 s): en la ranura destella un 8, que se va, y salen anillos verdes. El 7 llega último (3,05 s) y **se queda** en la ranura. Los dos paquetes se acomodan al costado de la ranura, el 8 arriba y el 7 abajo. *Dice:* Nave B: «Llega 'sector ocho'… / y ahora 'sector siete'.»
7. **Toque 6** — *Pasa:* `cruce`. Los dos paquetes se cambian de lugar una y otra vez (1,6 s) y en la ranura el 8 y el 7 se turnan, sin quedarse ninguno. La ranura late. Esto sigue hasta el final. *Dice:* Capitán: «¿Cuál es la vieja? / Dos preguntas, dos respuestas.»
8. **Toque 7** — *Pasa:* Angie sube a la derecha (es su primera aparición en el capítulo). *Dice:* Mascota: «Lo que viaja todavía no es un valor.»
9. **Toque 8** — *Dice:* Mascota: «Pregunten en qué estado está.»
10. **Toque 9** — *Dice:* Capitán: «Si pregunto de nuevo, / ¿la anterior se cancela?»
11. **Toque 10** — cierra (sin tocar, a los ~43,5 s: es el capítulo más largo, y tiene permiso).

###### 6/1 · resource(): loader con Promise
*Dónde:* arriba, la etiqueta «Elegí un usuario (el #4 no existe)». Debajo, cuatro botones redondos (`1` a `4`), con el `1` en verde oscuro. Después, una ficha y, abajo, `status: …` con un botón «Recargar». En el código, el `resource` con `params` y `loader({ params, abortSignal })`.
1. **Al llegar (sin tocar)** — *Pasa:* la carga del #1 sale apenas se monta la página. Durante 0,8 s la ficha dice «⏳ Cargando…» (titilando) y el status dice `loading`. Después aparece **Ada Lovelace** / «Pionera de la programación» con `status: resolved`. *Dice:* Capitán: «Pregunto afuera / y espero la respuesta.»
2. **Tocar `2` o `3`** — 0,8 s de «Cargando…» y después Alan Turing o Grace Hopper. Si tocas otro número antes de que termine, el pedido anterior se cancela: el timer se corta con el `abortSignal` (`resource-basic.component.ts:30-41`) y solo llega el último. Volver a tocar el que ya está elegido no pide nada.
3. **Tocar `4`** — *Qué esperas:* 0,8 s de «Cargando…». *Si falla:* falla siempre, a propósito: «⚠️ No existe el usuario #4», en rojo, con `status: error`. «Recargar» vuelve a cargar y vuelve a fallar. En las otras, «Recargar» muestra «Cargando…» (`reloading`) y trae al mismo usuario. No hay red: es un `setTimeout` local, así que nada más puede fallar.
4. **Desafío** — *Se ve:* `effect(() => { traer(id()).then((u) => user.set(u)); });`, lectura `respuestas viejas 0` y botón «buscar otra cosa». Hacen falta **dos** acciones para que la lectura diga algo. Con el código roto, la segunda deja `1` y sale la ayuda. Tocar `effect(() => {` reemplaza el bloque entero por el `resource`, y dos «buscar otra cosa» dejan `0` → sano. *Dice:* Nave B: «Cargando, error o valor: / todo avisa.»

###### 6/2 · rxResource(): stream de RxJS
*Dónde:* la misma pantalla que 6/1: los mismos cuatro usuarios, la misma ficha, el mismo «Recargar». Solo cambia el código: `rxResource` con `stream: … timer(800).pipe(map(…))`.
1. **Al llegar** — *Pasa:* igual que en 6/1: 0,8 s de «Cargando…» y después Ada Lovelace. *Dice:* Nave A: «La respuesta llega por un stream.»
2. **Tocar usuarios** — todo igual que en 6/1, incluido el error del #4 («⚠️ No existe el usuario #4»). Lo que cancela el pedido anterior es la desuscripción del `timer` de RxJS.
3. **Desafío** — *Se ve:* `effect(() => { http.get(filtro()).subscribe(set); });`, lectura `suscripciones vivas 0` y botón «cambiar el filtro». También pide **dos** acciones. Roto, la lectura sube 1, 2, 3… Con `rxResource` se queda en `1` → sano. *Dice:* Capitán: «Un stream también / entra en la caja.»

###### 6/3 · httpResource(): pedir por URL
*Dónde:* sin bajada ni «Qué hacer» (el comentario de la plantilla dice que el 404 y los pedidos cancelados son la explicación). Hay cuatro botones `1` a `4`, una ficha, tres lecturas en monoespaciada (`status()`, `statusCode()`, `hasValue()`) y, bajo una línea punteada, la lista de los últimos 4 pedidos de red (el más nuevo arriba). Este es el único pedido **real** de la parte: `HttpClient` con `fetch` a `datos/tripulacion/<id>.json`, con 0,8 s de espera **antes** de mandar (`red-de-la-demo.ts:23,79-80`).
1. **Al llegar (sin tocar)** — *Pasa:* sale el pedido del #1 y en la lista aparece `GET datos/tripulacion/1.json` con `viaja` en ocre. La ficha muestra dos barras verdes que laten y las lecturas dicen `loading` / `·` / `false`. A los 0,8 s más lo que tarde el archivo: **Neil Armstrong** / «Comandante», `resolved` / `200` / `true`, y en la lista el `200` en verde. *Dice:* Nave B: «Basta la dirección para preguntar.»
2. **Tocar `2` o `3`** — Buzz Aldrin o Michael Collins, igual que el #1.
3. **Tocar varios números rápido** — cada pedido que se suelta antes de salir queda en la lista **tachado** con `cancelado`. Solo vuelve el último.
4. **Tocar `4`** — *Qué esperas:* 0,8 s de barras. *Si falla:* `4.json` no existe y el servidor contesta 404. La ficha muestra un **404** grande en rojo, las lecturas dicen `error` / `404` / `false` y en la lista sale `404` en rojo. Que el servidor de desarrollo y Pages contesten 404 a ese archivo (y no el `index.html`) *(no lo pude confirmar corriendo la app)*. Si la red se cae del todo, el pedido termina con código `0` (`red-de-la-demo.ts:65`); qué muestra la ficha en ese caso *(no lo pude confirmar)*.
5. **Desafío** — *Se ve:* `httpResource` + `const nombre = computed(() => t.value()?.nombre);`, lecturas `statusCode 200` · `excepciones 0` y botón «pedir el siguiente». La corrida arranca en el #3, así que **la primera acción ya cae en el 404**: `statusCode 404`, `excepciones 1`, y sale la ayuda. La perilla tiene **3 posiciones**:
   - El primer toque agrega `{ defaultValue: NADIE },` y deja `t.value().nombre`. Es la trampa que parece arreglo: con el 404 sigue tirando (`excepciones 1`).
   - El segundo toque deja `t.hasValue() ? t.value().nombre : ''`: `404` y `0` → sano.
   - Un tercer toque vuelve al principio.
   *Dice:* Nave A: «Cambió la dirección: / preguntó de nuevo solo.»

---

#### 7 · El repetidor

###### Cinemática 7: «Los bordes del aparato»
*Dónde:* cielo con moléculas lejanas. Naves a la izquierda: Nave A arriba, Capitán al medio, Nave B abajo. Angie no está.
1. **Al llegar (sin tocar)** — *Pasa:* a los 2,4 s, cuando se va la tarjeta, se destapa en el centro el **plano punteado** del repetidor: una caja con antena (1,3 s), y la antena al final. *Dice:* Capitán (2,3 s): «Armemos un repetidor / para la exploradora.»
2. **Toque 1** — *Pasa:* `repetidor`. Arriba a la izquierda aparece una caja de frecuencia que dice **88**. El plano se apaga y en su lugar se arma el aparato: la chapa ámbar se llena, el contorno se dibuja, aparecen los dos puertos, después la antena con su bola y en el centro se abre en iris un dial redondo. El puerto de entrada se enciende (0,85 s). Al segundo, una ficha **88** sale de la Nave A, pasa por la caja y entra al puerto, dejando un cable punteado detrás (1 s). Se achica y desaparece al llegar, la aguja del dial gira con rebote y el dial muestra **88** (2,05 s). Angie todavía no está en escena. *Dice:* Mascota: «Pásenle la ciento cuarenta y dos.»
3. **Toque 2** — *Pasa:* `frecuencia-vieja`. En la caja de afuera el 88 sale por arriba, entra **104** y la caja da un pulso. El 88 del dial pierde tinta, se corre un poco y parpadea como un visor que falla (sin parar). *Dice:* Nave B: «Cambié la frecuencia / y sigue en la vieja.»
4. **Toque 3** — *Pasa:* Angie sube a la derecha. A los 0,4 s un cometa ámbar corre por el cable desde la caja hasta el puerto. A los 1,25 s el puerto late, la aguja gira, el 88 se va por arriba y el dial muestra **104** (1,3 s). Deja de parpadear. *Dice:* Mascota: «Lo que entra sigue vivo adentro.»
5. **Toque 4** — *Pasa:* nada nuevo. *Dice:* Nave A: «¿Y cuando encuentre algo, / cómo nos avisa?»
6. **Toque 5** — *Pasa:* `borde-salida`. El puerto de salida (borde derecho) se enciende y de él salen tres arcos dibujados. Tres anillos ámbar grandes se abren por detrás del aparato, y las naves se sacuden con un destello, en el orden en que les llega la onda: Capitán, Nave A, Nave B. *Dice:* Mascota: «Por otro borde, hacia afuera.»
7. **Toque 6** — *Pasa:* `vacio`. La caja de afuera queda al 35 % (con el 104 todavía adentro). El cable y los arcos desaparecen y los puertos se apagan. El 104 se va del dial y la aguja vuelve al tope, medio transparente. En el dial aparece una **ranura vacía** de borde punteado que titila y cuyo punteado corre sin parar. *Dice:* Capitán: «Lo encendí sin frecuencia.»
8. **Toque 7** — *Dice:* Nave B: «Está escuchando la nada. / ¿Se puede exigir?»
9. **Toque 8** — cierra (sin tocar, a los ~32,6 s).

###### 7/1 · input() y output() basados en signals
*Dónde:* en el centro, un aparato oscuro (el hijo) con el rótulo ámbar `CLICKS`, el número `0` y un botón ámbar «+ 1». Debajo, «Paso (input): **1**» y «Último valor emitido (output): **(vacío)**», y un botón de tinta «Cambiar paso del input».
1. **Al llegar** — *Dice:* Capitán: «Armemos un repetidor / para la exploradora.» (la misma línea y el mismo mp3 que abrió la cinemática).
2. **Tocar «+ 1»** — el contador sube y el «Último valor emitido» lo copia.
3. **Tocar «Cambiar paso del input»** — el paso cicla 1 → 3 → 5 → 1. El botón del hijo pasa a «+ 3», «+ 5»…
4. **Desafío** — *Se ve:* `readonly precio = input(0);` / `readonly conIva = this.precio() * 1.21;` (marcado), lectura `desfasado 0` y botón «cambiar desde el padre». Roto, una acción da `1`. Con `computed(() => this.precio() * 1.21)` queda en `0` → sano. *Dice:* Nave B: «Entra por input, / sale por output.»

###### 7/2 · model(): binding two-way con [(value)]
*Dónde:* bajada «Tocá las estrellas (cambia el hijo) o reseteá desde el padre…». Cinco estrellas con tres llenas (★★★☆☆), «Valor en el padre: **3** / 5» y «Resetear desde el padre».
1. **Al llegar** — *Dice:* Nave A: «Que el repetidor hable / para los dos lados.»
2. **Tocar una estrella** — se llenan hasta esa y el número del padre cambia. **Resetear** deja todas vacías y `0`.
3. **Desafío** — *Se ve:* `readonly valor = input(0);` (marcado) + `valorChange = output<number>()` + `emit(nuevo)`, lectura `cambios perdidos 0` y botón «editar en el hijo». Roto, cada acción suma 1. El giro deja `model(0)` + `this.valor.set(nuevo)` (un renglón menos) y la lectura queda en `0`. *Dice:* Capitán: «model: lo cambio yo, / o lo cambia ella.»

###### 7/3 · input.required() y transform
*Dónde:* una pastilla gris «Mensajes 3», dos botones («+ 1» ámbar y «Resaltar») y una nota chica: «Si omitís `label`, el proyecto no compila: eso es `input.required()`.»
1. **Al llegar** — *Dice:* Nave B: «Sin frecuencia / no tendría que encender.»
2. **Tocar «+ 1»** — el número de la pastilla sube. **Resaltar** la pasa a ámbar con texto oscuro, y otra vez la devuelve a gris.
3. **Desafío** — *Se ve:* `readonly userId = input<string>();` (marcado) + `cargar(this.userId());`, lectura `undefined leídos 0` y botón «usar sin pasarlo». Roto, cada acción suma 1. Con `input.required<string>()` queda en `0`. *Dice:* Nave A: «required lo exige. / transform lo traduce.»

###### 7/4 · Formularios con signals
*Dónde:* sin bajada ni «Qué hacer». En la hoja el formulario va en dos columnas (`styles.css:390-397`). Arriba, `tripulante.nombre` (placeholder «Ana») y `tripulante.correo` («ana@nave.io»), cada uno con tres pastillas apagadas: `valid`, `touched`, `dirty`. Abajo, una caja oscura `modelo()` que dice `{ nombre: "", correo: "" }` y el botón ámbar «Sumar a bordo», **deshabilitado**.
1. **Al llegar** — *Dice:* Capitán: «Cada campo del formulario / es una caja.»
2. **Escribir en un campo** — se prende `dirty` y la caja `modelo()` cambia letra por letra. Cuando el campo es válido se prende `valid`.
3. **Salir del campo** — se prende `touched`. Si el campo está mal, el borde se pone rojo y aparece **un** error por vez: «Falta el nombre», «Mínimo 2 letras» (con una letra sola), «Falta el correo» o «Correo inválido». Los errores se van solos cuando corriges.
4. **Con los dos campos bien** — se habilita «Sumar a bordo». Al tocarlo aparece una pastilla oscura con el nombre (por ejemplo «Ana») al lado del botón, y el formulario se vacía y apaga `touched` y `dirty`. Las pastillas se van sumando.
5. **Desafío** — *Se ve:* `readonly f = form(this.modelo);` / `readonly valido = signal(false);` (marcado) / `enviar() { this.valido.set(esCorreo(…)); }`, lectura `sin validar 0` y botón «editar el correo». Roto, cada acción suma 1. El giro cambia **tres** renglones a la vez: el `form` gana `(t) => email(t.correo)`, `valido` pasa a `computed(() => this.f().valid())` y `enviar` pasa a `if (this.valido()) guardar(…)`. La lectura queda en `0`. *Dice:* Nave B: «Escribo, y la validez / se entera sola.»

###### 7/5 · Reglas que reaccionan
*Dónde:* sin bajada. A la izquierda, una torre de radio dibujada. Al llegar está **al aire**: foco ámbar y tres ondas que laten. Debajo dice `valid() = true`. A la derecha, los mandos: casilla `automatica`, deslizador `frecuencia` **98** (de 88 a 108), casilla `cifrar` y un recuadro punteado `clave: hidden`. En el código está marcado `hidden(r.clave, …)`.
1. **Al llegar** — *Dice:* Nave A: «El panel cambia / según lo que elijo.»
2. **Mover el deslizador** — el número cambia, y cuanto más alta la frecuencia, más rápido laten las ondas.
3. **Marcar `automatica`** — el deslizador se apaga (70 %), aparece `disabled: La elige el repetidor` y se marca el renglón `disabled(…)`. La torre sigue al aire. Desmarcarlo lo deshace.
4. **Marcar `cifrar`** — el recuadro se vuelve el campo `clave` (borde rojo) con «Falta la clave». Se marca `required(r.clave)`, la torre **sale del aire** (gris, ondas punteadas quietas) y la lectura pasa a `valid() = false`.
5. **Escribir una clave** — vuelve al aire. Si la clave contiene la frecuencia (por ejemplo «98»), aparece «Contiene la frecuencia», se marcan los tres renglones de `validate` y sale del aire. Mover el deslizador arregla o rompe esa clave sin tocarla. Desmarcar `cifrar` esconde la clave (y la conserva), y la torre vuelve al aire.
6. **Desafío** — *Se ve:* `const automatica = this.modelo().automatica;` + `disabled(r.frecuencia, () => automatica);` (marcado), lectura `regla vieja 0` y botón «cambiar el modo». Roto, cada acción suma 1. El giro **borra** el renglón de la constante y deja `(c) => c.valueOf(r.automatica)`, con lo que la lectura queda en `0`. *Dice:* Capitán: «Cambia el modelo, / y las reglas se acomodan.»

###### 7/6 · Transmitir con submit()
*Dónde:* sin bajada. A la izquierda, el campo `canal` con tres botoncitos (`alfa`, `ruido`, `eco`), el campo `mensaje` y el botón `submit()`. A la derecha, tres estaciones en pastilla: `debounce` · `pending` · `submitting`. Debajo, una franja oscura: antena ámbar a la izquierda, vía punteada y destino rosa a la derecha. Más abajo va la lista de lo enviado.
1. **Al llegar** — *Dice:* Nave B: «¿Y si transmito / antes de verificar el canal?»
2. **Tocar `submit()` con todo vacío** (o Enter) — *Pasa:* no sale nada. En la franja aparece y se apaga una pastilla roja **`retenida`** (1,8 s), salen «Falta el canal» y «Falta el mensaje», y el foco va al campo del canal.
3. **Escribir un canal** — mientras tipeas se prende `debounce`. A los 350 ms de soltar, `pending` (0,8 s de verificación) y después nada. Tocar un botoncito pone el canal de una y va directo a `pending`. Con `ruido`, al terminar la verificación aparece «Canal ocupado».
4. **`submit()` mientras el canal está en `pending`** — se retiene: vuelve a salir `retenida`. En el código se marca `ignoreValidators: "none"`.
5. **`submit()` con `alfa` y un mensaje** — *Qué esperas:* se prende `submitting`, los botones se apagan y un pulso amarillo cruza la vía en 1,1 s. Después el mensaje aparece como pastilla en la lista y el formulario queda vacío.
6. **`submit()` con `eco`** — *Si falla:* el pulso (rojo) va y vuelve en el mismo 1,1 s, la vía se pone roja y bajo el canal aparece «La señal rebotó». El mensaje no se borra. Elegir otro canal y esperar la verificación borra el error. Si tipeas un canal y mandas `submit()` todavía dentro de los 350 ms de `debounce`, qué pasa *(no lo pude confirmar)*.
7. **Desafío** — *Se ve:* `submit(this.f, {` / `ignoreValidators: 'pending',` (marcado) / `action: …`, lectura `sin verificar 0` y botón «transmitir ya». Roto, cada acción suma 1. Con `'none'` queda en `0`. *Dice:* Nave A: «Sin verificar, no sale. / submit la retiene.»

---

#### 8 · Los pipes se traducen

###### Cinemática 8: «Mirar la pantalla misma»
*Dónde:* naves a la izquierda en otro orden: **Nave B arriba** (x 15, y 33), Nave A al medio y Capitán abajo. Arriba, a la izquierda del centro, una esclusa de compuertas rayadas ámbar y negras que aparece con las naves (0,3 s después).
1. **Al llegar (sin tocar)** — *Pasa:* a los 2,4 s sube desde abajo con rebote el **repetidor**: un chasis gris con patas, un mástil con una bola gris y un hueco de pantalla vacío de borde punteado. *Dice:* Nave B (2,3 s): «Tiro los pipes de RxJS. / Acá no sirven.» Con esa misma línea entra `pipes-esclusa`: la Nave B da un tirón, las compuertas se abren y la luz de la esclusa se pone ámbar. Tres piezas de tubo violeta salen en arco desde la nariz de la Nave B (escalonadas desde 0,6 s). Las dos primeras entran a la esclusa, se achican y desaparecen. La tercera frena a mitad de camino y se **transforma** en una caja ámbar de esquinas cortadas con un brillo.
2. **Toque 1** — *Pasa:* Angie sube. A los 0,5 s las compuertas se cierran y la luz vuelve a gris. *Dice:* Mascota: «No los tiren. Se traducen.»
3. **Toque 2** — *Pasa:* `puente`. Desde la derecha (el horizonte, donde se desvanece) se dibuja la línea gris de un stream hasta un puente punteado violeta en arco que baja a la caja. Canicas violetas corren por el stream y el puente y caen en la caja tres veces; la caja late con cada una. A los 4,4 s un cometa ámbar hace el camino **al revés**, de la caja al stream, dos veces. *Dice:* Nave A: «¿Un stream puede volverse / un valor que avisa?»
4. **Toque 3** — *Pasa:* nada nuevo. Sin tocar, es justo cuando corre el cometa de vuelta. *Dice:* Mascota: «Y al revés. Nada de lo suyo sobra.»
5. **Toque 4** — *Pasa:* nada nuevo. *Dice:* Capitán: «Ahora el repetidor. / Quiero mirar su pantalla.»
6. **Toque 5** — *Pasa:* `pantalla-vacia`. Desde la Nave B sale un hilo punteado violeta hacia el hueco de la pantalla. Llega al borde y rebota (el borde del hueco destella violeta a los 0,87 s), queda corto sin entrar y la Nave B retrocede. *Dice:* Nave B: «La busqué apenas encendió. No estaba.»
7. **Toque 6** — *Pasa:* `pantalla-aparece`. La pantalla se enciende en iris (crema, con dos rayitas). El hilo termina de entrar hasta el centro, donde aparece un nudo violeta (1,15 s), y salen anillos ámbar. La bola de la antena se pone ámbar y su halo respira (sin parar). *Dice:* Mascota: «Miren la pantalla como un valor más.»
8. **Toque 7** — *Dice:* Nave A: «Ahora sí está. / ¿Desde cuándo se puede leer?»
9. **Toque 8** — cierra (sin tocar, a los ~36 s).

###### 8/1 · viewChild() como signal
*Dónde:* bajada «`viewChild()` entrega el elemento como signal…», el campo «Campo referenciado» (placeholder «Escribí tu nombre…»), «Texto leído: **(vacío)**», «¿Query resuelta? **sí**» y los botones «Enfocar» (verde azulado) y «Limpiar».
1. **Al llegar** — *Dice:* Nave A: «Quiero ver la pieza de adentro.»
2. **Escribir** — «Texto leído» copia lo que escribes. «Enfocar» pone el foco en el campo y «Limpiar» lo vacía y lo enfoca. «¿Query resuelta?» dice siempre **sí**.
3. **Desafío** — *Se ve:* `readonly caja = viewChild<ElementRef>("caja");` + `const alto = this.caja()!.nativeElement.offsetHeight;` (marcado), lectura `encontrado 0` y botón «montar». Roto, «montar» deja `0`. Con `afterRenderEffect(() => medir(this.caja()));` da `1` → sano. *Dice:* Capitán: «viewChild la encuentra / y avisa si cambia.»

###### 8/2 · toSignal() · toObservable() · untracked()
*Dónde:* tres recuadros. En el primero, «Observable → signal (toSignal)», un contador `0s` que **sube solo cada segundo** desde que se monta la página. En el segundo, «count = 0 · emisiones contadas = …» con «count + 1». En el tercero, «result = base × multiplier = **20**», «base = 10 · multiplier = 2 — subir multiplier NO recalcula result…», y los botones «base + 1» (verde) y «multiplier + 1» (gris).
1. **Al llegar** — *Pasa:* el reloj arranca y no para. *Dice:* Nave B: «Los pipes viejos / hablan otro idioma.»
2. **«count + 1»** — count y emisiones suben juntos. Emisiones va uno por encima de count, porque también cuenta la emisión inicial de `toObservable`, que llega un instante después de montar *(lo deduzco de `toObservable` + `scan`; no lo vi en pantalla)*.
3. **«multiplier + 1»** — cambia `multiplier = 3`, pero `result` sigue en 20. Después, **«base + 1»** recalcula con el multiplier nuevo: 11 × 3 = 33.
4. **Desafío** — *Se ve:* `effect(() => { const q = consulta(); enviar(q, pagina()); });` (el `enviar` marcado), lectura `corridas sobrantes 0` y botón «cambiar el auxiliar». Roto, cada acción suma 1. Con `untracked(pagina)` queda en `0`. *Dice:* Nave A: «toSignal y toObservable / traducen de ida y vuelta.»

###### 8/3 · viewChildren() como signal
*Dónde:* tres chips verde agua (`Ada`, `Alan`, `Grace`), «Elementos queriados: **3**» y los botones «Agregar» y «Quitar».
1. **Al llegar** — *Dice:* Capitán: «Ahora son muchas piezas, / y van y vienen.»
2. **Agregar / Quitar** — se suman `Linus`, `Margaret`, `Donald` y después se repiten desde `Ada`. Quitar saca el último y puede dejar la lista vacía. El conteo sigue a la lista.
3. **Desafío** — *Se ve:* `readonly filas = viewChildren<ElementRef>("fila");` + `const total = this.filas().length;` (marcado), lecturas `vistos 3` · `reales 3` y botón «agregar una fila». Roto: `vistos 3`, `reales 4`. Con `computed(() => this.filas().length)`: `4` y `4` → sano. *Dice:* Nave B: «La lista se actualiza sola.»

###### 8/4 · contentChild() y contentChildren()
*Dónde:* casi lo mismo que en 8/3, en fucsia: un recuadro con «Proyectados: **3** · primero: **Ada**», los chips `Ada`, `Alan`, `Grace` adentro y «Agregar» / «Quitar».
1. **Al llegar** — *Dice:* Nave A: «Lo que nos mandan de afuera / también cuenta.»
2. **Agregar / Quitar** — «Proyectados» sigue a la lista. «primero» dice siempre `Ada`, salvo con la lista vacía, que dice `(vacío)`.
3. **Desafío** — *Se ve:* `// el padre proyecta <app-item> con ng-content` + `readonly items = viewChildren(ItemComponent);` (marcado), lectura `encontrados 0` y botón «proyectar dos items». Roto, la lectura se queda en `0`. Con `contentChildren(ItemComponent)` da `2` → sano. *Dice:* Capitán: «contentChild mira / lo que pusieron adentro.»

### Parte 7 · Arco III, la revelación y el final

Sacado del código el 2026-11-22. Las rutas son relativas a `src/app/` salvo que digan otra cosa.

#### Reglas que valen para toda esta parte

- **Cómo se juega una cinemática, la hoja y la perilla lo cuenta otra parte.** Acá va sólo lo propio.
- **Los segundos de las cinemáticas** son los del reloj si no se toca nada, contados desde que se abre
  el iris. Los saqué con la misma cuenta que `armarReloj` (`integrada-vista/prologo-guion.ts:345-368`)
  y la duración de cada mp3 (`voces-grabadas.ts:150-192`); pueden correrse una décima. Un toque
  adelanta a la línea siguiente y aplica de una los beats que había en el medio.
- **Todas las líneas de esta parte tienen voz grabada**, las cinemáticas y las de la tripulación en la
  hoja (`voces-grabadas.ts:150-192` y `:253-264`). Cada beat suena con el efecto `beat`, salvo
  `transmision`, que tiene el suyo (`cinematicas/cinematica.component.ts:373-377`).
- **La apertura es igual en las cinco cinemáticas:** a los 0,12 s la tarjeta del título en el centro
  (arriba el nombre de la etapa, abajo el título); a los 0,64 s las tres naves entran desde la
  izquierda en formación, 120 ms una de otra; a los 2,4 s la tarjeta se corre a la barra de arriba
  y **recién ahí entra el héroe de la escena**. La primera línea llega a los 2,3 s (cap. 10) o 2,5 s
  (las demás).
- **Angie es la mascota**: sube desde abajo con rebote en su primera línea (beat `mascota`), a la
  derecha (84 %, 64 %), y después respira. En la caja de diálogo su nombre dice **«Mascota»**, no
  «Angie» (`cinematica.component.ts:47`). La exploradora habla como «Exploradora», con el retrato
  de la nave rosa.
- **Al fondo de cada escena** hay moléculas lejanas punteadas, quietas.
- **Cada cinemática cierra sola** 1,4 s después de su última línea, con el iris de cierre, y sigue
  lo que venga. «Saltar» (o Esc) la corta y sigue igual.
- **En las hojas** la etapa tiene su objeto del mundo junto a la tripulación, que reacciona cuando
  algo cambia y cuando se resuelve (`components-draw/tripulacion/objetos-del-mundo.ts:407-488`):
  - La antena: una torre de celosía con luz roja en la punta; al reaccionar la luz se infla, salen
    dos anillos y una regla aparece y se borra a su costado.
  - La tormenta: una nube lila; al reaccionar tira un rayo amarillo, caen cuatro gotas y la nube tiembla.
  - Quien lee, avisa: una pantalla oscura con un ojo y una campanita dorada; al reaccionar el ojo
    parpadea y la campana se sacude y suena en anillos.
- **Acento de color:** coral (`#ff5a4a`) en la antena y la tormenta, dorado (`#c98a2a`) en Quien
  lee, avisa, la revelación y el final (`cinematicas/escenas/acentos.ts`).
- **La tarjeta de la mascota** (concepto, qué hacer, qué observar) está cerrada detrás de la mascota
  con «tocame»; abrirla es optativo. Abajo de la demo, el código de la demo; más abajo, el desafío.
- **Cuántas veces hay que accionar antes de que la lectura diga algo** sale de la solución más
  corta (`libs/manipulable-challenge.ts:140-152`): una vez en 9/1 y 11/1, dos en 9/2, tres en 10/1,
  10/2 y 10/3. Antes de eso la lectura queda neutra. Mover la perilla vuelve las lecturas al
  arranque.
- **Ningún desafío de esta parte espera de verdad.** Los timers son de las demos: en 10/1, 10/2 y
  10/3 lo que espera quien juega son **400 ms después de la última tecla**. En los desafíos, la
  lectura cambia al toque.

---

#### 9 · La antena (arco III)

###### Cinemática 9: «Medir después de pintar»

*Dónde:* el cielo de la cinemática. Rótulo «La antena · Medir después de pintar». Tripulación a la
izquierda (Nave A arriba, Capitán al medio, Nave B abajo); el centro, vacío hasta la antena.

1. **Al abrir (sin tocar)** — *Se ve:* la apertura común. A los 1,16 s se traza a lápiz la línea del
   suelo (1 s). A los 2,4 s, con la tarjeta ya en la barra, la antena se dibuja **en boceto**:
   nueve trazos de lápiz gris, uno cada 95 ms (0,7 s cada uno), y un eje punteado sube por el medio
   (1 s). No tiene color. *Se oye:* el efecto del título y uno por beat.
2. **Línea 1 (sola a los 2,5 s)** — *Se oye:* Capitán. *Dice:* «Midan la antena del repetidor. Exacta.»
3. **Línea 2 (6,6 s)** — *Se ve:* una regla blanca entra desde la izquierda, desde la flota (0,78 s,
   frena suave) y queda bajo la antena, con el cero en su borde izquierdo. A los 0,6 s una cota roja
   marca el cero en el suelo. A los 0,56 s cuelga de la aguja una etiqueta negra **«0 px»** que
   salta, y a 1,3 s niega con la cabeza (se balancea). *Se oye:* Nave A. *Dice:* «Mide cero. Pero la
   estoy viendo.»
4. **Línea 3 (10,5 s)** — *Se oye:* Nave B. *Dice:* «¿La mediste antes o después de pintarla?»
5. **Línea 4 (14,7 s)** — *Se ve:* entra Angie. *Dice (Mascota):* «Este mundo primero pinta. /
   Después se mide.»
6. **Línea 5 (21,4 s, después de medio segundo de silencio)** — *Se ve:* en el mismo instante aparece
   una oreja rosada sobre la punta del boceto (sube con rebote). A 0,2 s la pintura coral barre la
   antena de izquierda a derecha (0,82 s) y el eje punteado se apaga. A 1 s la punta se enciende con
   un brillo rojo que queda latiendo y salen tres anillos. A 1,05 s un cometa rojo baja de la oreja
   hasta el cero de la regla (0,64 s). A 1,55 s se marca la cota derecha. A 1,65 s una banda roja y
   la aguja corren por la regla y la etiqueta gira como un cuentakilómetros: **0 → 176 px** (1,1 s).
   *Se oye:* Nave A. *Dice:* «Le puse un oído a la antena.»
7. **Línea 6 (24,1 s)** — *Se ve:* una franja de pintura clara cruza la antena dos veces (0,3 s cada
   una). Caen dos orejas más sobre la primera, apiladas hacia arriba (a 0,24 s y a 0,54 s), y las de
   abajo quedan al 40 %, como fantasmas. *Se oye:* Nave B. *Dice:* «Repintaron dos veces. / Ahora
   hay tres oídos.»
8. **Línea 7 (28,4 s)** — *Se oye:* Capitán. *Dice:* «Otra vez el rastro. Como la baliza.»
9. **Línea 8 (32,4 s)** — *Se oye:* Nave A. *Dice:* «¿Y cuándo sé que ya pintó?» Cierra sola a los
   36,2 s.

*Para seguir:* nada; tocar sólo adelanta. Después se abre la hoja de «La antena» en la página 1 de 2.

###### 9/1 · afterRenderEffect(): medir el DOM

*Dónde:* la hoja de «La antena», marcas arriba «1 de 2». Título de la página: «afterRenderEffect():
medir el DOM». Junto al título, la tripulación con la torre (objeto del mundo).

1. **Al llegar (sin tocar)** — *Se ve:* la demo, una tarjeta blanca con el campo «Texto», que ya dice
   «Escribí algo y miro su ancho»; debajo, «Texto renderizado (medido):» con ese mismo texto en
   cian subrayado, y «Ancho real: N px» (el ancho de ese texto ya pintado). Al lado, el código con el
   `afterRenderEffect` resaltado. *Se oye:* Nave B. *Dice:* «Necesito medir la antena / ya dibujada.»
2. **Tocar la mascota (optativo)** — abre la tarjeta: «afterRenderEffect() corre después del
   render…», «Editá el texto del campo.», «El ancho en píxeles se mide…».
3. **Escribir en el campo** — *Pasa:* el texto medido cambia con cada tecla y el ancho en píxeles se
   actualiza después de cada render (`signals/level-9-after-render-effect/sub-levels/1-after-render-effect/after-render-effect.component.ts:33-39`).
   No hay espera.
4. **El desafío, tal como arranca** — *Se ve:* el bloque con `effect(() => {` en el renglón que se
   mueve, el botón «sumar una fila» y dos lecturas: alto medido 200, alto real 200 (neutras).
5. **Toque en «sumar una fila» sin mover la perilla** — *Pasa:* alto real 240, alto medido 200: la
   medida queda una fila atrás (y sigue atrás con cada toque). Lectura en rojo.
6. **Toque en la perilla** — *Pasa:* el renglón pasa a `afterRenderEffect(() => {` y las lecturas
   vuelven a 200 / 200, neutras.
7. **Toque en «sumar una fila»** — *Pasa:* 240 / 240, sano. Se establece la página y la tripulación
   festeja; la torre reacciona. *Se oye:* Nave A. *Dice:* «Después de pintar, mide. / No antes.»

*Para seguir:* perilla y una fila. Nada obliga: «Siguiente página» está siempre.

###### 9/2 · effect((onCleanup) => …)

*Dónde:* la misma hoja, «2 de 2». Título: «effect((onCleanup) => …)».

1. **Al llegar (sin tocar)** — *Se ve:* la demo, un cronómetro: un **0** grande violeta, «ticks ·
   limpiezas: 0» y el botón violeta «Encender». *Se oye:* Capitán. *Dice:* «Si la antena cambia, /
   apago la vieja.»
2. **Toque en «Encender»** — *Pasa:* el número suma uno por segundo (un `setInterval` de 1 s) y el
   botón se vuelve rojo: «Apagar (dispara onCleanup)». En el código se encienden los renglones del `if`.
3. **Toque en «Apagar»** — *Pasa:* el tick se detiene y «limpiezas» suma uno. Los ticks no vuelven a
   cero. Cada apagar suma una limpieza; prender no.
4. **El desafío, tal como arranca** — *Se ve:* `afterRenderEffect((onCleanup) => {` con el renglón
   que se mueve en `// el listener queda`, el botón «cambiar de panel» y las lecturas listeners vivos
   1, esperado 1.
5. **Dos toques en «cambiar de panel» sin perilla** — *Pasa:* el primero queda neutro; con el
   segundo, listeners vivos 3, esperado 1, en rojo.
6. **Toque en la perilla** — *Pasa:* el renglón pasa a `onCleanup(off);` y la corrida vuelve a 1 / 1.
7. **Dos toques en «cambiar de panel»** — *Pasa:* sigue 1 / 1 y con el segundo queda sano.
   *Dice (Nave B):* «onCleanup corta lo anterior / antes de seguir.»

*Para seguir:* perilla y dos cambios de panel. El botón de abajo dice «Seguir el viaje →»: la
tripulación sale volando y se abre la cinemática 10.

---

#### 10 · La tormenta (arco III)

###### Cinemática 10: «Esperar a que se estabilice»

*Dónde:* rótulo «La tormenta · Esperar a que se estabilice». Tripulación a la izquierda. Arriba a la
derecha (88 %, 12 %), por ahora nada: de ahí va a hablar la exploradora, que no tiene nave en esta
escena, sólo un punto rosa.

1. **Al abrir (sin tocar)** — *Se ve:* la apertura común. A los 2,4 s **el repetidor** sube desde
   abajo con rebote al centro: una caja color arena con antena coral, pantalla oscura con un hueco
   punteado vacío, un dial, dos luces y una rejilla.
2. **Línea 1 (2,3 s, todavía con la tarjeta en el centro)** — *Se ve:* arriba a la derecha aparece
   un punto rosa con halo punteado y salen de él tres veces anillos rosas punteados (1,8 s cada vez).
   A 0,35 s se revela una banda de puntos rosas que baja en curva desde ese punto hasta la punta
   del repetidor (1,4 s). *Se oye:* el efecto de transmisión; después Nave A. *Dice:* «¡Tormenta en
   la banda! Es ella.»
3. **Línea 2 (5,7 s, con 0,3 s de pausa)** — *Se ve:* empieza la ráfaga: diez gotas rosas en cuatro
   pedazos (1, 2, 3 y 4 gotas) caen por la banda hasta la antena, en un ciclo de 2,8 s que se repite
   sin parar. *Se oye:* la Exploradora, entrecortada. *Dice:* «…sec… sector… sector oc… / ¡sector ocho!»
4. **Línea 3 (8,8 s)** — *Se ve:* la punta de la antena contesta cada pedazo con un anillo coral; los
   cuatro anillos se pisan, al compás de las gotas. *Se oye:* Nave B. *Dice:* «El repetidor contesta
   cada pedacito.»
5. **Línea 4 (12,1 s)** — *Se oye:* Capitán. *Dice:* «Cuatro respuestas para un solo mensaje.»
6. **Línea 5 (16,2 s)** — *Se ve:* un halo rojo crece alrededor del repetidor (1,8 s); desde los
   0,6 s el aparato tiembla a ráfagas. A su derecha aparece un medidor curvo con bulbo: la pista se
   dibuja (0,6 s) y el nivel rojo sube en cuatro empujones hasta casi el tope (2,6 s). La tripulación
   se echa un poco atrás. *Se oye:* Nave A. *Dice:* «Se va a fundir contestando a medias.»
7. **Línea 6 (19,6 s)** — *Se ve:* entra Angie. *Dice (Mascota):* «Ella todavía no terminó de hablar.»
8. **Línea 7 (23,6 s)** — *Se ve:* la calma. Las gotas se congelan donde están y se apagan; los
   anillos se van; el temblor para; el halo rojo se enfría (1,4 s); el medidor baja a un cuarto; la
   banda se vuelve gris y el punto rosa queda tenue; la tripulación vuelve a su lugar. A 0,15 s una
   ficha rosa con cuatro rayitas cae desde la antena a la pantalla del repetidor, con rebote, y a
   0,65 s se vuelve ámbar con las rayitas oscuras: el mensaje entero. A 0,9 s aparece debajo un reloj
   de espera con el signo de pausa; desde 1,4 s su arco coral se va vaciando, en 7 s, hasta quedar
   con un 38 %. *Dice (Mascota):* «Esperen a que la banda se calme.»
9. **Línea 8 (26,6 s)** — *Se oye:* Capitán. *Dice:* «¿Cuánto? ¿Y si vuelve a hablar / mientras
   esperamos?» Cierra sola a los 32,4 s, con el arco de espera casi en su punto final.

*Para seguir:* nada. Después, la hoja de «La tormenta», página 1 de 3.

###### 10/1 · Debounce con RxJS

*Dónde:* la hoja de «La tormenta», «1 de 3». Objeto del mundo: la nube.

1. **Al llegar (sin tocar)** — *Se ve:* la demo: campo «Buscar» («Escribí algo…»), «Inmediato:
   (vacío)» y «Debounced (400ms): (vacío)» en rosa. Código con `toObservable(...).pipe(debounceTime(400))`.
   *Se oye:* Nave A. *Dice:* «Con la tormenta / llegan mil avisos.»
2. **Escribir rápido** — *Pasa:* «Inmediato» cambia con cada tecla; «Debounced» no se mueve.
3. **Dejar de escribir** — *Pasa:* **400 ms después de la última tecla**, «Debounced» toma el
   valor de una vez. Cada tecla antes de los 400 ms reinicia la espera.
4. **El desafío** — *Se ve:* el bloque con `// sin espera` en el renglón que se mueve, el botón
   «tipear una letra» y la lectura búsquedas 0.
5. **Tres toques en «tipear una letra» sin perilla** — *Pasa:* los dos primeros neutros; al tercero,
   búsquedas 3, en rojo.
6. **Toque en la perilla** — el renglón pasa a `debounceTime(300),`; búsquedas vuelve a 0.
7. **Tres toques en «tipear una letra»** — *Pasa:* búsquedas pasa a 1 **con el primer toque**, sin
   espera, y con el tercero queda sano. *Dice (Capitán):* «Espero a que pare, / y leo uno solo.»

*Para seguir:* perilla y tres letras.

###### 10/2 · Debounce a mano (effect + onCleanup)

*Dónde:* «2 de 3». Lo que cambia respecto de 10/1:

1. **Al llegar** — la misma demo con acento naranja, armada con `effect` + `setTimeout(400)` +
   `onCleanup(clearTimeout)`. *Dice (Nave B):* «A mano: espero y cancelo.»
2. **Escribir y frenar** — igual que 10/1: «Debounced» aparece 400 ms después de la última tecla.
3. **Desafío** — renglón móvil `// el timer anterior sigue` ↔ `onCleanup(() => clearTimeout(id));`,
   lectura timers vivos. Roto: 3 después de tres letras. Arreglado: 1, sano.
   *Dice (Nave A):* «Un timer por cambio. / El viejo se borra.»

###### 10/3 · debounced() nativo

*Dónde:* «3 de 3». La tarjeta de la mascota sólo trae el concepto: «Experimental en v22. Sin RxJS ni
timers.» (sin «qué hacer» ni «qué observar»).

1. **Al llegar** — *Se ve:* un campo sin rótulo («Escribí rápido…») y tres lecturas:
   `query()` con una lupa «×0» y su valor `""`; `debouncedQuery.value()` con «×0» y el valor en rojo;
   `debouncedQuery.status()` con una pastilla gris «resolved». *Dice (Capitán):* «Angular ya trae /
   su propio paraguas.»
2. **Escribir rápido** — *Pasa:* `query()` cambia y su lupa suma uno por tecla. La pastilla pasa a
   «loading» (rosa) y debajo aparece una barrita que se llena en 400 ms y vuelve a cero con cada
   tecla. `debouncedQuery.value()` se queda con el valor de antes.
3. **Dejar de escribir** — *Pasa:* a los 400 ms la barrita se completa y desaparece, la pastilla
   vuelve a «resolved», el valor rojo se pone al día y su lupa suma **uno solo**.
4. **Desafío** — renglón móvil `params: () => consulta(),` ↔ `params: () => q.value(),`, lectura
   búsquedas. Roto: 3. Arreglado: 1 desde la primera letra, sano a la tercera.
   *Dice (Nave B):* «debounced calma la caja, / sin pipes.»

*Para seguir:* «Seguir el viaje →» lleva a la cinemática 11.

---

#### 11 · Quien lee, avisa (arco III)

###### Cinemática 11: «Quien lee, avisa»

*Dónde:* rótulo **«Quien lee, avisa · Quien lee, avisa»** (la etapa y el título se llaman igual).
Tripulación a la izquierda.

1. **Al abrir (sin tocar)** — *Se ve:* la apertura común. A los 1,16 s un iris abre desde el centro
   (1,1 s) un halo tinta que envuelve toda la escena, con un anillo punteado ovalado: es Zone.js. A
   los 2,4 s vuelve el árbol del capítulo 0: siete nodos dorados apagados (raíz, dos hijos, cuatro
   hojas) que se dibujan por filas, con ramas punteadas. A 0,56 s aparece abajo una caja dorada con
   un **7**, girando desde chica. Desde 0,82 s se revelan tres hilos punteados que van de la caja a
   tres nodos: el hijo izquierdo y las dos hojas de la derecha. Desde 1,15 s se dibuja arriba un
   **signo de pregunta** pálido; su punto aparece a 1,9 s.
2. **Línea 1 (2,5 s)** — *Se oye:* Capitán. *Dice:* «Repasemos. Nadie revisó el árbol entero.»
3. **Línea 2 (7,4 s)** — *Se oye:* Nave A. *Dice:* «Y la pantalla se repintó igual.»
4. **Línea 3 (10,5 s)** — *Se ve:* la caja late, el 7 se va hacia arriba y entra un **8** desde
   abajo; salen anillos dorados de la caja. Tres cometas ámbar recorren los hilos hasta los tres
   lectores (desde 0,22 s, uno cada 0,15 s) y esos tres nodos se encienden con un destello (desde
   0,9 s). Los otros cuatro siguen apagados. *Se oye:* Nave B. *Dice:* «Solo donde alguien leía algo
   que cambió.»
5. **Línea 4 (14,2 s)** — *Se oye:* Capitán. *Dice:* «En casa, Zone.js lo revisaba / todo por nosotros.»
6. **Línea 5 (19,6 s)** — *Se ve:* entra Angie. *Dice (Mascota):* «Dejar atrás lo que conocen. / ¿Se
   acuerdan?»
7. **Línea 6 (24,4 s, con medio segundo de pausa)** — *Se ve:* el signo de pregunta se vuelve dorado,
   le crece un halo y queda latiendo sin parar. *Se oye:* Nave B. *Dice:* «Entonces, ¿quién le avisó
   a la pantalla?»
8. **Línea 7 (27,7 s)** — *Se oye:* Nave A. *Dice:* «Creo que ya lo sabemos.»
9. **Línea 8 (30,2 s)** — *Se ve:* el halo de Zone.js se cierra en iris hacia el centro y se funde
   (0,82 s). *Se oye:* Capitán. *Dice:* «Sin Zone.js, entonces. Comprobémoslo.» Cierra sola a los 36,2 s.

*Para seguir:* nada. Después, la hoja de «Quien lee, avisa», una sola página (sin marcas).

###### 11/1 · Change detection sin Zone.js

*Dónde:* la hoja de «Quien lee, avisa», sin marcas porque es la única página. Objeto del mundo: la
pantalla con el ojo y la campanita.

1. **Al llegar (sin tocar)** — *Se ve:* un **0** grande índigo, «doble (computed): 0», el botón
   «Incrementar» y la nota «Esta app ya corre zoneless…». Código: `bootstrapApplication` con el
   comentario de zoneless resaltado. *Dice (Nave A):* «Sin Zone.js, / ¿quién revisa la pantalla?»
2. **Toques en «Incrementar»** — el número sube de a uno y el doble de a dos. No hay espera.
3. **El desafío** — renglón móvil `provideZoneChangeDetection(),`, botón «cambiar un valor», lectura
   nodos revisados 0. Con Zone.js, un toque da **7** (en rojo).
4. **Toque en la perilla** — el renglón pasa a `// zoneless por defecto desde v21`, nodos revisados 0.
5. **Toque en «cambiar un valor»** — nodos revisados **1**, sano. *Dice (Capitán):* «Quien lee, avisa.
   / Nadie revisa de más.»

*Para seguir:* «Seguir el viaje →». Es la última hoja: la tripulación sale volando, la barra de
direcciones se limpia (`integrada-vista.component.ts:952-954`) y empieza el cierre.

---

#### Cuándo llega el cierre

Después de la última hoja, `viajar()` sale del bucle de etapas y juega, una detrás de otra, la
revelación (13) y el final (12) (`integrada-vista.component.ts:925-930`). Cada una espera a que la
anterior termine, vista entera o salteada con Esc; nada exige haber resuelto nada. La que sigue se
abre recién cuando la anterior salió de pantalla (`:874-884`). Si se recarga durante el cierre, al
volver se juega otra vez desde la revelación.

**Completo o incompleto** se decide al abrir cada una de las dos: es «completo» si hay **al menos
una página establecida en cada una de las 11 etapas** (`integrada-vista.component.ts:867-869` y
`libs/partida.ts:257-264`). Además, el dibujo enciende un átomo por etapa con algo establecido, y la
Introducción (el átomo 0) va siempre encendida (`:264-271`).

#### La revelación

###### Cinemática 13: «Porque entré»

*Dónde:* rótulo «La revelación · Porque entré». Es el dibujo del final (`escenas/index.ts:22-24`):
una molécula de doce átomos en espiral, del centro hacia afuera, y a la derecha (92 %, 40 %) el
lugar de la salida, que **en esta escena no se abre**.

1. **Al abrir (sin tocar)** — *Se ve:* la apertura común. A los 1,16 s se revela la cadena punteada
   de la molécula (1,3 s) y los doce átomos saltan en orden, uno cada 70 ms, como zócalos punteados.
   A los 2,4 s un brillo dorado aparece detrás (tenue si es incompleto, pleno si es completo); los
   átomos de las etapas establecidas se llenan de oro con su órbita dorada, uno cada 120 ms, y se
   dibuja en dorado cada enlace entre dos etapas seguidas establecidas. Los demás quedan punteados
   y al 55 %.
2. **Línea 1 (2,5 s)** — *Se ve:* en el borde derecho, donde estará la salida, salen tres veces
   anillos rosas punteados *(en el código esos anillos no tienen alto; ver «Cosas raras»)*. *Se oye:*
   el efecto de transmisión y la Exploradora. *Dice:* «No los encuentro. Voy a entrar.»
3. **Línea 2 (5,6 s)** — *Se oye:* Nave A. *Dice:* «¡No! ¡Quedate afuera!»
4. **Línea 3 (8,6 s, con medio segundo de pausa)** — *Se ve:* entra Angie. *Dice (Mascota):* «Va a
   entrar igual.»
5. **Línea 4 (11,7 s)** — *Se oye:* Capitán. *Dice:* «¿Cómo lo sabés?»
6. **Línea 5 (14,3 s, con 0,7 s de pausa)** — *Se ve:* aparece la nave rosa de la exploradora en el
   borde derecho, sin que se abra ninguna salida. Cambia según el final:
   - *completo:* crece hasta su tamaño (0,7 s) y vuela en curva por arriba de la molécula hasta
     frenar con un rebote junto a la tripulación (1,7 s).
   - *incompleto:* aparece al 55 % y apenas se asoma desde el borde; **las tres naves de la
     tripulación vuelan hacia la salida cerrada** (1,6 s, una cada 0,15 s) y quedan por arriba de la
     molécula, del lado derecho.

   *Dice (Mascota):* «Porque entré.»
7. **Línea 6 (16,6 s, con 0,6 s de pausa)** — *Se oye:* Nave A. *Dice:* «¿Exploradora?»
8. **Línea 7 (18,8 s)** — *Dice (Mascota):* «Llegué antes que ustedes. / Mucho antes.»
9. **Línea 8 (24,9 s)** — *Dice (Mascota):* «No podía decirlo. / Ella tenía que entrar.»
10. **Línea 9 (31,0 s, con medio segundo de pausa)** — *Se oye:* Nave A. *Dice:* «Siempre tan
    aguafiestas.» (la misma línea que la Nave A le dice a la exploradora en el prólogo). Cierra sola
    a los 35,6 s.

*Para seguir:* nada. Al cerrar se abre el final.

#### El final

###### Cinemática 12: «Quien lee, vuelve»

*Dónde:* rótulo «Final · Quien lee, vuelve». El mismo dibujo que la revelación, pero es otra
cinemática: **nada de lo que pasó en la revelación sigue en pantalla**. La exploradora no está y
la tripulación vuelve a su lugar de la izquierda.

1. **Al abrir (sin tocar)** — igual que la revelación: la molécula se revela, el brillo y los átomos
   de oro de lo establecido.
2. **Línea 1 (2,5 s)** — *Se oye:* Nave A. *Dice:* «La banda está limpia. / Ya nadie transmite.»
3. **Línea 2 (6,6 s)** — *Se ve:* entra Angie. *Dice (Mascota):* «Ahora sí puedo intervenir.»
4. **Línea 3 (9,7 s)** — *Se oye:* Capitán. *Dice:* «Sus signals y nuestros operadores. / Juntos.»

**Si es completo:**

5. **Línea 4 (15,4 s, con medio segundo de pausa)** — *Se ve:* a 0,2 s se revela una ruta punteada
   del último átomo a la salida (0,9 s). A 1,15 s se abre la salida entera: un iris dorado con
   el espacio de afuera adentro (luz, tres estrellas) y un aro que entra con rebote; adentro gira
   despacio un anillo punteado (18 s por vuelta, sin parar). A 0,85 s la ruta se pinta de oro
   (0,62 s) y un cometa dorado recorre toda la molécula hasta la salida (1,3 s). *Se oye:* Nave B.
   *Dice:* «Todos los enlaces encendidos. / Se abrió la salida.»
6. **Línea 5 (19,6 s)** — *Dice (Mascota):* «Salgan de una vez, lentos.»
7. **Línea 6 (23,2 s)** — *Se ve:* las tres naves salen volando en curva por arriba de la molécula
   hasta la salida (1,9 s; Nave A, después el Capitán, después Nave B, 0,2 s una de otra), se achican
   y se pierden adentro; a los 2,2 s la salida suelta anillos dorados. Angie se queda. *Se oye:* Nave
   B. *Dice:* «Y después, helado de chocolate.»
8. **Línea 7 (27,2 s)** — *Dice (Mascota):* «Este mundo sigue reglas. / Ahora son suyas.» Cierra
   sola a los 33,7 s.

**Si es incompleto:**

5. **Línea 4 (15,4 s)** — *Se ve:* la ruta punteada a la salida se revela, pero la salida se abre a
   medias: el iris al 25 % y el aro a la mitad, casi enseguida (0,15 s); sin ruta dorada ni cometa.
   El anillo de adentro gira igual. *Dice (Nave B):* «Quedan enlaces punteados. / La salida está a
   medias.»
6. **Línea 5 (19,9 s)** — *Dice (Mascota):* «Los espero. Tengo práctica.»
7. **Línea 6 (23,2 s)** — *Se ve:* las tres naves giran 180° (0,82 s) y después avanzan, **mirando
   hacia atrás**, por su ruta hacia la salida (1,3 s), hasta quedar por arriba de la molécula entre la
   mitad y tres cuartos del camino. *Dice (Capitán):* «Todavía no. / Este mundo también es casa.»
8. **Línea 7 (28,3 s)** — *Dice (Mascota):* «Este mundo sigue reglas. / Ahora son suyas.» Cierra
   sola a los 34,9 s.

*Para seguir:* nada.

#### Qué queda en pantalla cuando termina todo

No hay epílogo en la colina, ni créditos, ni vuelta a un mapa. Al cerrarse el final, la partida se
guarda como terminada y se vuelve a abrir **el final congelado en su último cuadro**
(`integrada-vista.component.ts:931-965`, `cinematica.component.ts:355-370`):

1. **Al llegar (sin tocar)** — *Se ve:* el final quieto, sin iris de entrada, sin sonido y sin nada
   que se mueva: la molécula con lo establecido, la salida (entera o a medias) con el anillo de
   adentro quieto, Angie, y en la caja de diálogo su última línea: «Mascota: Este mundo sigue reglas.
   / Ahora son suyas.». En completo las naves no se ven (ya salieron); en incompleto quedan dadas
   vuelta camino a la salida. No está el botón ▸; Enter, espacio y Esc no hacen nada. Arriba a la
   derecha, en lugar de «Saltar», un botón: **«Empezar de cero»**.
2. **Primer toque en «Empezar de cero»** — el botón pasa a **«¿Seguro? Se borra todo»** durante 4 s;
   si no se toca, vuelve solo (`integrada-vista.component.ts:107`, `:1006-1017`).
3. **Segundo toque, dentro de esos 4 s** — borra la partida y recarga la página sin query: todo
   empieza desde el principio.

*Si en cambio se recarga:* se vuelve a pasar por la colina y, al entrar, se cae otra vez en este
mismo cuadro *(lo leí en el flujo de `alEntrar` y `viajar`; no lo vi en pantalla)*.

## Qué aprendes en cada paso

### Parte 1 · El arranque y la colina

| Paso | Qué es nuevo | Qué te toca hacer |
|---|---|---|
| 0. La carga | Nada | Esperar |
| 1. El aviso de auriculares | Que esto suena y conviene ponerse auriculares; conoces a Angie | Tocar en cualquier lado (opcional: apagar el sonido) |
| 2. La cámara sale del ojo | Que lo de recién era lo que Angie miraba; el mundo de la colina | Nada (5,6 s) |
| 3. La colina, de mañana | El título de la historia: «Las aventuras de Angie por el SignalVerso» | Esperar al llamado y tocar en cualquier lado |
| 4. «Ellos ya están aquí…» | Que algo llega, por una señal que todavía no se entiende | Tocar para pasar |
| 5. El sol: «Esto es demasiado caótico.» | La primera voz de los que llegan (la del capitán) | Tocar para pasar |
| 6. «Supongo que sí…» | Angie les contesta, y su respuesta viaja al sol hecha luz | Tocar para pasar |
| 7. «La hora ha llegado…» | Angie decide ir | Tocar para pasar |
| 8. Angie se vuelve luz | El paso de día a noche: la historia sigue en el espacio | Nada |

Nada de Signals todavía. Esta parte presenta a Angie, deja planteado el bucle con el prólogo (la misma charla se oye del otro lado) y enseña el gesto de juego: tocar completa y tocar otra vez pasa.

### Parte 2 · El prólogo, de «Al fin es hora de volver a casa» hasta que se abre el manual

| Paso | Qué es nuevo | Qué te toca hacer |
|---|---|---|
| 1. `casa-volver` | Nada del tema. Conoces el mundo y al Capitán: vuelven a casa | Nada, mirar |
| 2. `casa-familia` | Nada nuevo (Nave A, el corazón) | Nada |
| 3. `casa-helado` | Nada nuevo (Nave B, su antojo) | Nada |
| 4. `casa-unas` | Nada nuevo | Nada |
| 5. `casa-apuren` | Nada nuevo (la Exploradora, impaciente) | Nada |
| 6. `linea-msxheigk` | Nada del tema; empieza el peligro (temblor, arrastre) | Nada |
| 7. `anom-que-pasa` | Nada nuevo | Nada |
| 8. `anom-sin-control` | Nada nuevo: los sistemas fallan | Nada |
| 9. `anom-atraidos` | Nada nuevo | Nada |
| 10. `anom-rxjs` | Se nombran «operadores de RxJS» por primera vez | Nada; se abre el minijuego |
| 11. Hueco del Capitán | `map`: lo que devuelve la cuenta reemplaza al valor; `pipe(` y `$` aparecen sin explicarse | Elegir `map` y leer la velocidad (o saltar) |
| 12. Hueco de Nave A | `tap`: mira y deja pasar igual; lo que devuelve no importa | Elegir `tap` y leer la velocidad (o saltar) |
| 13. Hueco de Nave B | `filter`: la cuenta decide si pasa | Elegir `filter` y cargar el tanque (o saltar) |
| 14. La ráfaga | Siete nombres de operadores más (`switchMap`, `retry`…), sin explicación: aunque usen todos, no alcanza | Nada |
| 15. `anom-pipes` | La palabra «pipes», sin explicación | Nada |
| 16. `anom-lento` | La idea del prólogo: perseguir el cambio es demasiado lento | Nada |
| 17. `anom-fuerza` | Nada nuevo (primer tirón) | Nada |
| 18. `anom-velocidad` | Nada nuevo (segundo tirón) | Nada |
| 19. `anom-manual` | Se abre el manual de a bordo | Nada; la pantalla se prende sola |

### Parte 3 · El manual de a bordo (5 páginas) y el árbol de Signal Space (0/6)

| Paso | Qué es nuevo | Qué te toca hacer |
| --- | --- | --- |
| Se abre el manual | Que la nave tiene un libro de la «física vieja» | Nada (se abre solo) |
| Manual 1 · El HTML es un árbol de nodos. | El navegador arma el árbol con los tags, no con la sangría | Leer; tocar los 7 tags; mover `</article>` (tocar, arrastrar o ↑↓) |
| Manual 2 · El DOM está vivo. | Cambiar un nodo cambia la pantalla; un selector que no existe da `null` y no cambia nada | Leer; correr; cambiar `'#titulo'` por `'h1'`; correr |
| Manual 3 · No todo cambio cuesta lo mismo. | El pipeline de render: layout y paint son caros, `transform` los saltea | Leer; correr; rotar la propiedad hasta `transform`; correr |
| Manual 4 · A mano, te olvidás un lugar. | Sincronizar a mano: cada lugar que se olvida queda viejo | Leer; sumar; completar el handler; sumar |
| Manual 5 · Zone.js revisa todo el árbol. | Zone.js sólo se entera de lo que parchea, y entonces revisa los 7 nodos | Leer; correr; cambiar la API por una parcheada; correr |
| Se cierra el manual | La anomalía es justo lo que Zone.js no parchea | Nada |
| Se abre el árbol | Signal Space, sin cerca de Zone.js | Nada |
| 0/6 · El signal avisa quién lo lee. | Un signal sabe quién lo lee: se revisan 2 nodos y no 7 | Leer; correr; hacerlo signal; correr |

En todas las páginas, «Mostrame» lo hace por ti, y para seguir hay que tocar «Siguiente página», «Seguir la historia» o «Seguir».

### Parte 4 · Adentro, la voz y Angie (del cierre del manual al comienzo del viaje)

| Paso | Qué es nuevo | Qué te toca hacer |
| --- | --- | --- |
| 1. «Debería ser imposible» | Zone.js tiene leyes, y lo que pasa las rompe (cierra el manual) | Mirar |
| 2. La exploradora queda afuera | Hay un afuera conocido («el espacio de Zone.js») y un espacio desconocido | Mirar |
| 3. El grito y el salto | Nada (es el cruce) | Mirar |
| 4. Adentro y la bala | Ahí adentro todo pasa más rápido de lo que se reacciona | Mirar |
| 5. Escapar hasta «demasiado caótico» | Los operadores de RxJS no sirven acá («`switchMap` no funciona») | Mirar |
| 6. La voz | Lo mismo visto desde otro lado es armonía; la frase de la colina era de acá | Mirar |
| 7. El reclamo y el choque | Angie es la voz y nace del choque | Mirar (se la puede tocar) |
| 8. El caos es orden | La tesis, dicha (sin demostración en pantalla) | Mirar |
| 9. El pacto | Angie no los saca: les enseña; salir depende de ellos | Mirar |
| 10. La pregunta y el árbol | La pregunta del viaje: «¿Y quién le avisó a la pantalla?» | Mirar; después, el árbol (otra parte) |
| 11. Vuelta y la frase | Guardar la pregunta; «el ángulo correcto» | Tocar «Seguir» en el árbol; después mirar |
| 12. El par de Tusi | El caos era el par de Tusi visto de cerca: dos círculos | Mirar |
| 13. Al viaje | Nada | Nada (se abre sola la Cinemática 1) |

Fuera del árbol, en esta parte **no hay ninguna decisión ni acción de quien juega**: son ~3 min 30 s
de mirar. Los toques sólo hacen reaccionar a las naves, al cielo y a Angie.

### Parte 5 · El viaje, arco I: las cinemáticas 1 a 4 y las páginas 1/1 a 4/2

| Paso | Qué es nuevo | Qué te toca hacer |
|---|---|---|
| 1. Cinemática 1 | Un valor avisa solo a quien lo lee (hilo de lectura) | Solo mirar (▸ o Saltar opcional) |
| 2. 1/1 Variables | Repaso: var/const/let. Primer desafío de perilla | Elegir tipo y ejemplo; girar la perilla y «cambiar» |
| 3. 1/2 Qué es un signal | Un signal envuelve cualquier valor y avisa al consumidor | Tocar cajas para convertirlas y cambiarlas; girar y una acción |
| 4. 1/3 Tipos | Writable contra solo lectura (Signal, computed) | Elegir nodo, «Probar .set()»; girar y una acción |
| 5. 1/4 Getter | Se lee con `count()`, no con `count` | Probar los tres botones; girar y una acción |
| 6. 1/5 Writable | `set()` reemplaza el valor | Escribir un número y «Set»; girar y dos acciones |
| 7. 1/6 Update | `update()` parte del valor anterior | «Incrementar»; girar y dos acciones |
| 8. 1/7 asReadonly | Exponer solo lectura | Incrementar o reiniciar, probar `set(5)`; girar y una acción |
| 9. Cinemática 2 | Un derivado sigue a su fuente; perezoso si nadie lo lee | Solo mirar |
| 10. 2/1 Computed | `computed()` se rehace solo | Escribir nombre y apellido; girar y una acción |
| 11. 2/2 Dependencias dinámicas | Depende solo de lo que leyó la última vez | Alternar showCount y sumar count; girar y una acción |
| 12. 2/3 Perezoso y memoizado | No corre hasta leerlo; no recalcula sin cambios | Leer o cambiar el nombre, usar el formulario; girar y tres acciones |
| 13. Cinemática 3 | El effect repite por lo que leyó; deja rastro | Solo mirar |
| 14. 3/1 Dependencias del effect | El effect corre al cambiar lo que lee adentro | Tocar Count2; girar y una acción |
| 15. 3/2 Intervalo filtrado | Un `setInterval` no se limpia solo (leak) | Prender el intervalo, destruir el hijo; girar dos veces y una acción |
| 16. 3/3 onCleanup | `onCleanup` limpia al repetir y al destruir | Igual que 3/2; girar dos veces y dos acciones |
| 17. Cinemática 4 | Sin cambio no hay aviso; «¿idénticas para quién?» | Solo mirar |
| 18. 4/1 Object.is | Compara por referencia, no por contenido | Probar los tres botones; girar y una acción |
| 19. 4/2 equal | El criterio de igualdad se elige | Probar los dos botones; girar y dos acciones |

### Parte 6 · Arco II · La banda vieja (capítulos 5 a 8)

| Paso | Qué es nuevo | Qué te toca hacer |
| --- | --- | --- |
| Cinemática 5 | Un derivado que se puede pisar a mano; si cambia la fuente, la elección queda huérfana | Tocar para pasar |
| 5/1 | `linkedSignal(() => …)`: editable, y se reinicia cuando cambia la fuente | Elegir un chip y cambiar la lista; perilla + «cambiar de categoría» |
| 5/2 | `linkedSignal({ source, computation })`: conserva lo que sigue valiendo | Lo mismo; perilla + «recargar la lista» |
| Cinemática 6 | Lo que viaja tiene estado; dos pedidos se cruzan y el viejo llega último. Primera voz de la exploradora | Tocar para pasar |
| 6/1 | `resource()`: loading/resolved/error y cancelación con `abortSignal` | Elegir usuarios (el #4 falla); perilla + **dos** acciones |
| 6/2 | `rxResource()`: lo mismo con un Observable | Lo mismo que en 6/1 (misma pantalla); perilla + dos acciones |
| 6/3 | `httpResource()`: pedir por URL, 404, cancelados; `hasValue()` antes de `value()` | Elegir tripulantes y cambiar rápido; perilla de 3 posiciones (la del medio es trampa) |
| Cinemática 7 | Un aparato recibe por un borde y avisa por otro; lo que entra sigue vivo; encender sin valor | Tocar para pasar |
| 7/1 | `input()` / `output()` | Sumar y cambiar el paso; perilla + «cambiar desde el padre» |
| 7/2 | `model()` y `[(value)]` | Tocar estrellas y resetear; perilla + «editar en el hijo» |
| 7/3 | `input.required()` (y `transform`, que la demo no llega a mostrar) | Sumar y resaltar; perilla + «usar sin pasarlo» |
| 7/4 | `form()` sobre un signal: valid/touched/dirty y errores derivados | Escribir nombre y correo, salir del campo, sumar a bordo; perilla + «editar el correo» |
| 7/5 | Reglas que leen el modelo: `disabled`, `hidden`, `required`, `validate` cruzado | Marcar casillas, mover el dial, escribir clave; perilla + «cambiar el modo» |
| 7/6 | `debounce`, `validateAsync` (pending) y `submit()` que retiene | Elegir canal, escribir mensaje, transmitir; perilla + «transmitir ya» |
| Cinemática 8 | Los pipes se traducen (stream ↔ valor); la pantalla también es un valor que llega tarde | Tocar para pasar |
| 8/1 | `viewChild()` como signal | Escribir, Enfocar, Limpiar; perilla + «montar» |
| 8/2 | `toSignal`, `toObservable`, `untracked` | Tocar los tres botones; perilla + «cambiar el auxiliar» |
| 8/3 | `viewChildren()` | Agregar y quitar; perilla + «agregar una fila» |
| 8/4 | `contentChild()` / `contentChildren()` sobre lo proyectado | Agregar y quitar; perilla + «proyectar dos items» |

### Parte 7 · Arco III, la revelación y el final

| Paso | Qué es nuevo | Qué te toca hacer |
| --- | --- | --- |
| Cinemática 9 | Medir antes de pintar da cero; registrar en cada pintada apila oídos (rastro) | Mirar; tocar sólo adelanta |
| 9/1 | `afterRenderEffect` mide el DOM ya pintado; `effect` mide un render tarde | Escribir en el campo; perilla y una vez «sumar una fila» |
| 9/2 | `onCleanup` corta lo anterior (cronómetro y listeners) | Encender y apagar; perilla y dos veces «cambiar de panel» |
| Cinemática 10 | Una ráfaga de avisos; actuar cuando se calma | Mirar |
| 10/1 | `debounceTime` entre `toObservable` y `toSignal` | Escribir y frenar (esperar 400 ms); perilla y tres letras |
| 10/2 | El mismo debounce a mano: `setTimeout` y `onCleanup(clearTimeout)` | Igual que 10/1 |
| 10/3 | `debounced()` nativo: `.value()` sostiene, `.status()` dice loading | Escribir rápido y frenar; perilla y tres letras |
| Cinemática 11 | Repaso: sólo se repinta quien lee; Zone.js se apaga | Mirar |
| 11/1 | Zoneless por defecto desde v21 | Incrementar; perilla y una vez «cambiar un valor» |
| Revelación | Nada técnico: Angie es la exploradora | Mirar |
| Final | Nada nuevo: la salida, entera o a medias según lo establecido | Mirar |
| Último cuadro | Nada | «Empezar de cero» (dos toques) o nada |

## Cosas raras

### Parte 1 · El arranque y la colina

#### Comprobadas (leí las dos puntas)

**C1. Con voz grabada, el triangulito «tocá para seguir» aparece antes de que el toque pueda pasar, y el primer toque corta la voz a mitad de frase.**
- *El mecanismo:* lo que espera cada globo es `loQueDuraDicho`, el máximo entre lo que tarda en escribirse y la voz más 0,4 s (`inicio-angie.ts:253-255`). Antes de ese tiempo el toque es «completar», y completar llama a `sonido().callar()`, que corta también la grabación (`inicio-angie.ts:547-551`, `sonido.ts:401-412`). En cambio, el triangulito aparece en cuanto se escribió el texto (`inicio-angie.css:860-868`, `1009-1016`).
- *Las cuentas de esta parte:*

  | Globo | Triangulito | El toque pasa desde |
  |---|---|---|
  | Presiente | 2,19 s | 3,57 s |
  | Sol | 1,33 s | 3,51 s |
  | Respuesta | 2,25 s | 6,06 s |
  | Decide | 2,16 s | 4,60 s |

- *Resultado:* si tocas cuando el triángulo te invita, la voz se calla a la mitad y no pasa nada. Hace falta un segundo toque.
- Sin sonido, o sin la grabación, no pasa.

**C2. El esqueleto dice «(blips)» para la charla del sol, y no es así.** `scripts/guion.mjs:198-199` escribe «(blips)» para las dos líneas del sol y de Angie, pero la colina las dice con las grabaciones `dentro-caotico` y `voz-supongo` (`inicio-angie.ts:240-245`; existen en `voces-grabadas.ts:46-47`). `hablar()` las toca si bajaron, porque la ventana que se le pasa es la duración de la voz (`inicio-angie.ts:582`, `sonido.ts:463-466`). Los blips son sólo el respaldo. *(Corregido en el script antes de entregar: el anexo ya las marca con su voz.)*

**C3. Con movimiento reducido no hay charla en la colina.** `despedir()` vuelve apenas pone `ini--saliendo` (`inicio-angie.ts:652`): no hay radio, ni los dos pensamientos, ni el sol, ni la respuesta, ni el atardecer, ni la noche. Se entra derecho al prólogo, y quien tenga esa preferencia nunca oye el lado de la colina del bucle. En el aviso pasa algo parecido: la prueba de sonido suena, pero la pantalla ya se fue (`aviso-auriculares.component.ts:268-271`), así que no se ven las copas izquierda y derecha.

**C4. Las fichas de la colina siguen tocables cuando ya no se ven.** Al entrar se apagan sólo con `opacity: 0` (`inicio-angie.css:1113-1117`), sin `pointer-events: none`, y el toque sobre ellas no pasa el globo (`inicio-angie.ts:555`). En plena despedida, un toque en la esquina de arriba a la izquierda puede silenciar el sonido o pausar el fondo sin que se vea nada, y el globo no avanza.

**C5. Tocar a Angie para jugar también entra.** El click sobre ella sube a la escena y dispara la lamparita (`inicio-angie.ts:446-452`): quien la toca por curiosidad («¡jaja!») arranca la despedida. Sólo un arrastre no entra. No sé si es a propósito.

**C6. El output `elegido` del aviso no lo escucha nadie.** Se emite en `aviso-auriculares.component.ts:218` y `:304`, pero el template de la vista no lo enlaza (`integrada-vista.component.html:535-542`). Su comentario («la colina puede despertarse», `:94`) ya no es cierto.

**C7. Un comentario sobre la carga del prólogo no es cierto.** `integrada-vista.component.ts:702-703` dice que «el aviso de auriculares más la colina dan tiempo de sobra para traerlos», pero el único `import('./prologo-anomalia')` está en `abrirPrologo` (`:716`), que se llama recién en `alEntrar`, cuando la despedida ya terminó. Ese tiempo no se usa para bajarlo.

**C8. Otro comentario viejo.** `musica-del-presentimiento.ts:11` cita «Entonces… La hora ha llegado…», pero el texto es «Así que… La hora ha llegado» (`pensamientos-de-la-colina.ts:6`).

**C9. La ficha «Empezar de cero» de la colina casi nunca se ve.** Aparece con `partida().punto` (`integrada-vista.component.html:512`), pero con un punto válido el aviso salta la colina (`retomar.ts:34-41`). Sólo se ve con una línea guardada que el guion ya no tiene.

#### Sospechas (no las vi en pantalla)

**S1. Posible fogonazo claro entre la noche y el prólogo.**
- `entrar()` le pone `.gone` a la pantalla de inicio (fundido de 0,5 s) en el mismo turno en que se pide el código del prólogo (`intro-tusi.ts:451-460`).
- Al ponerse `.gone`, deja de valer la regla que ocultaba lo que hay debajo (`intro-tusi.css:417-419`). Vuelven a verse el canvas de la construcción, «Angular Signals», la mascota de Angular con «Hasta en lo más caótico hay un orden…» y el HUD, sobre el fondo crema de `.tusi`.
- El prólogo, negro y por encima (z-index 30), recién tapa cuando llega su código. En la primera visita llega por red: mientras tanto, el negro de la colina se vuelve transparente sobre una pantalla clara.
- Al retomar al viaje puede pasar lo mismo mientras bajan los datos de las cinemáticas (`cargarDatosCinematicas`).

**S2. `casa-volver` podría sonar con blips en la primera visita.** Las voces del prólogo se piden dentro de `initPrologoAnomalia` (`prologo-anomalia.ts:309`), que también corre después de la despedida. El comentario de ahí mismo avisa que la primera línea entra en menos de un segundo. Depende de la red.

**S3. En el aviso, tocar a Angie dispara dos cosas.** La palabrita y las chispas de la mascota, y además la prueba de sonido, porque el click sube al aviso. No parece grave; no lo vi.

**S4. El pensamiento grabado puede llegar tarde.** Si el pensamiento todavía está bajando, `decirGrabada` lo deja en espera y lo toca cuando llega (`sonido.ts:480-487`). Puede empezar a sonar con la nube ya escrita, o muy cerca del toque que la pasa.

### Parte 2 · El prólogo, de «Al fin es hora de volver a casa» hasta que se abre el manual

#### Comprobadas (leí las dos puntas)

1. **Retomar re-dispara de golpe los efectos ya pasados.** `arrancar` vacía `dichas` (`prologo-anomalia.ts:2052`) y todos los efectos «una sola vez» se disparan con `t >= hito`. Al recargar desde `anom-que-pasa` o `anom-rxjs`, en el primer cuadro aparecen sobre Nave B el «¡pop!» con chispas del helado (`:1240-1248`), el soplido de la vuelta (`:1349`) y el golpe de viento a las naves (`:1757`). Desde `anom-manual` (48,25 s) además suenan juntos los 12 pips de retroceso de la ráfaga y de los `pipe` con sus 12 soplidos, y las naves reciben los 12 retrocesos (`:1304-1320`), y los dos tirones a la vez, con golpe grave doble (`:1350-1352`, `:1758-1771`). El comentario de `unaVez` (`:1030`) promete lo contrario.
2. **Al retomar suena entera la voz de una línea que ya se iba.** El arranque es 0,3 s antes del punto, y ahí la línea anterior todavía está viva unos 80 ms: desde `anom-rxjs` suena «Estamos siendo atraídos» completa (2,0 s) con su caja desapareciendo; desde `anom-manual`, «Esta velocidad…». `hablar` recibe la ventana entera y no lo que le queda (`:1387-1392`).
3. **Con movimiento reducido no se ve ni se oye el diálogo.** El primer cuadro salta a 29,41 s (`saltoQuieto`, `prologo-escena.ts:38`; `frame`, `:1992-1994`): las líneas 1 a 9 no aparecen; al cerrar el minijuego salta a 50,83 s y tampoco aparecen `anom-pipes` … `anom-velocidad`. En esos saltos aparecen el «¡pop!» suelto y los pips juntos del punto 1.
4. **El minijuego no se abre «con la orden ya leída».** Se abre a los 0,3 s de la orden (`ESPERA_OPERADORES = M.rxjs − 100`, con `rxjs = t0 + 400`: `:1860`, `prologo-escena.ts:121`), y la voz dura 4,3 s: el Capitán sigue hablando encima de la hoja. Lo que dice el comentario de `:1859` no es cierto (la caja sí queda a la vista, eso anda).
5. **La escena no «sigue viva» en el minijuego, queda congelada.** Con `t` frenado, todo lo que depende de él se detiene: temblor, respiración, parpadeo, llamas, estrellas, disco de la anomalía (`dibujar` solo recibe `t`). Solo se mueven los muelles (el golpe del disparo). Los comentarios de `:113` («la escena sigue viva») y `:1995` («las naves tiemblan y responden») no son ciertos. Se nota en el respiro de 1,4 s después de cada acierto, cuando el velo se aparta.
6. **El zumbido sigue durante todo el minijuego, sin música.** `metaDelZumbido` solo lo baja con el manual (`:1331`). Contradice la regla 8 de `docs/sonido.md` («donde quien mira se queda un rato (leyendo, esperando, jugando) va música»).
7. **Recargar después de terminar el minijuego obliga a jugarlo otra vez.** Entre 29,1 s y 48,5 s el punto guardado sigue siendo `anom-rxjs`, que arranca antes de la parada, así que se reabre aunque ya se haya jugado (`puntos-del-prologo.ts`, `arrancar` `:2057`).
8. **Los rótulos del acierto no tienen el color de su nave.** Usan la luz de la antena (`PALETAS[i].luz`, `:1943`): el `tap` de Nave A sale rosa (`#ffb8cc`) aunque su hoja y su nombre son lila, y el `filter` de Nave B sale rojo (`#ff5d6c`) aunque su nave es salmón. Es el mismo descuadre que `VOZ_DE_NAVE` arregló para los nombres (`nave-del-prologo.ts:28-33`).
9. **Pausar a mitad de una línea la deja muda.** La pausa corta la voz (`sonido().callar()`, `:2119`), y al continuar esa línea ya figura como dicha y no vuelve a sonar; la caja sigue en silencio lo que le quede.
10. **Teclado en la hoja del minijuego.** Con el foco en la hoja (que lo recibe al abrirse) la barra espaciadora **pausa la historia**, porque la hoja no es un botón ni el manual (`alTeclado`, `:2153`). Y las flechas, RePág, AvPág, Inicio y Fin se anulan (`:2149-2152`): en una pantalla baja, donde la hoja scrollea, no se la puede bajar con el teclado.
11. **La caja de la Exploradora salta de lugar.** A los 12,95 s se apaga la de Nave A y la de la Exploradora pasa del lugar derecho al centro de un cuadro al otro (las cajas se reasignan en `pintarDialogo`, `:1403-1424`, dentro de un flex centrado).

#### Sospechas (no las comprobé del todo)

- **La ráfaga no usa lo que acabas de aprender.** Después de arreglar `map`, `tap` y `filter`, las naves disparan `switchMap`, `retry`, `mergeMap`, `catchError`, `concatMap`, `takeUntil` y `debounceTime` (`prologo-escena.ts:437`), nunca los tres del minijuego, y ninguno se explica. Puede ser a propósito («desplegaron todo y no alcanzó»), pero el acierto del minijuego no se conecta con la ráfaga.
- **Cosas que se usan antes de explicarlas.** La leyenda de cada hueco explica `v`, `c` y `panel.mostrar(v)`, pero no `velocidad$`, `.pipe(` ni `motor.acelerar(...)`; «pipes» aparece en `anom-pipes` sin explicación.
- **Blips en la primera línea.** Las voces se piden al montar el prólogo y la primera entra a los 0,8 s; con una red lenta, `casa-volver` (y quizás las siguientes) pueden sonar con blips (lo admite el comentario de `:309`). *No lo probé.*

### Parte 3 · El manual de a bordo (5 páginas) y el árbol de Signal Space (0/6)

#### Comprobadas (leí las dos puntas)

1. **La documentación del manual quedó vieja.** `docs/historia/recorrido.md:140-146` dice tres cosas que el código ya no hace:

   | Dice el documento | Hace el código |
   |---|---|
   | El manual se abre «en una hoja de papel sobre el velo» | Es la pantalla entera con la tele (`tele-del-manual.ts`, `manual-de-a-bordo.css:294-316`) |
   | «"Cerrar el manual" en la página 5» | El botón dice «Seguir la historia» (`integrada-vista.component.ts:122`, `:652`) |
   | «No pide resolver nada para avanzar» | «Siguiente» sólo aparece con la página cumplida (`integrada-vista.component.ts:405-408`; ADR 0014) |

   Lo mismo pasa con el comentario de `integrada-vista.component.ts:381` («pasar de página no exige resolver nada (ADR 0002)»).
2. **La bitácora no existe, pero la documentación dice que abre el manual y el árbol sueltos.** Lo dicen `recorrido.md:148-149` y `:181`, `docs/sonido.md:53` y las consecuencias de ADR 0014. El código no lo hace (ver la nota). Quien saltea el prólogo no puede leer el manual en ningún lado.
3. **→ del teclado pasa de página sin el vuelo de la nave.** `teclaDelManual` llama directo a `pasarPagina(1)` (`integrada-vista.component.ts:556`), mientras que el botón llama antes a `vuelo.despegar()` (`pagina-del-manual.component.ts:206-211`). Con la flecha, la nave no sale ni la de la página siguiente llega volando. En la última página, → cierra el manual sin la salida.
4. **En la página 1, mover el cierre antes de tocar todos los tags tacha el paso 1 sin estar hecho.** `paso` vale 2 si `arreglado()` aunque falten tags (`html-to-tree.component.ts:269`), y la plantilla tacha el paso 1 con `paso() > 1` (`pagina-del-manual.component.html:28`). Mientras tanto la mano sigue pidiendo tags.
5. **El hueco se pone verde antes de correr** (páginas 2, 3, 5 y 6: `dia-hueco--encuentra`, `dtp-hueco--barato`, `ocd-hueco--parcheada`, `scd-hueco--signal`). La respuesta correcta se ve sin probarla, y en la página 3 eso resta sentido a «correr con cada propiedad».
6. **El botón verde del pie del libro nunca se ve.** El libro le pasa a la página su `pie` («Siguiente página» con el estilo `--listo`, `integrada-vista.component.html:788-812`, `manual-de-a-bordo.css:400-431`), pero la página sólo lo dibuja cuando `!enPantalla()` (`pagina-del-manual.component.html:136-147`). Las seis páginas usan `[enPantalla]="true"`.
7. **Mezcla de «tú» y «vos».** La historia habla de «tú» («¿Tú entiendes este mundo?», «si lo miras desde el ángulo correcto»), pero todo lo de las páginas va en voseo: la ley 4 «A mano, te olvidás un lugar.», «Tocá los tags.», «Mové», «Corré.», «Cambiá», «Sumá y mirá el panel.», «Completá el handler y sumá.», «Hacelo signal.», «Mantené el click y arrastrá, o usá ↑ ↓.», «Mostrame».
8. **El árbol no tiene música y el manual sí.** Está decidido así (`docs/sonido.md:62`). Lo anoto porque se nota el contraste: la misma hoja, abierta con la misma tele, suena distinto (sólo el zumbido bajo).
9. **Comentario que ya no es cierto para el árbol:** «En el prólogo Angie todavía no interviene» (`integrada-vista.component.ts:628`). Cuando se abre el árbol, Angie ya pactó con la tripulación. No cambia nada, porque las páginas del nivel 0 no usan su pista.

#### Sospechas (no las vi correr)

1. **Al volver de cada hoja, el globo de la línea que la abrió puede reaparecer un instante.** La historia retoma 150 ms antes del final de `anom-manual` o `leccion-arbol`, y `pintarDialogo` muestra las líneas con `t0 ≤ t < t1` (`prologo-anomalia.ts:1378`). Al apagarse la tele puede verse otra vez «¡Rápido, el manual de a bordo!» o «Miren el árbol.» durante ~150 ms, sin voz porque ya está en `dichas`.
2. **Angie no acompaña el acercamiento de la cámara al abrir el árbol.** La tele escala sólo el SVG `.prologo__escena` (`tele-del-manual.ts:84`). Angie es otro elemento (`.prologo__mascot`, `z-index: 2`) y queda quieta mientras el fondo se agranda, hasta que el negro la tapa (0,48 s).
3. **La pausa no calla la música del manual.** `sonido().callar()` corta voces y blips (`libs/sonido.ts:401-411`), pero la música va por su propio bucle (`tocarEnBucle`). Pausar con el manual abierto deja la música sonando. Sólo el interruptor de sonido la apaga.
4. **El árbol de Signal Space contradice lo que Angie acaba de decir.** Ella dice «Aquí nadie revisa todo», y el primer «correr» muestra un barrido del árbol entero «como en casa». En Signal Space no hay Zone.js: no queda claro quién barre. En Angular sin zona, con una variable común, la pantalla quedaría vieja en vez de revisarse entera.
5. **La página 3 mueve la nave con `textContent` y `color`.** Esas propiedades no la moverían. La escena trata las cuatro como el mismo vuelo, que sólo cambia en lo trabado. Puede confundir qué hace cada renglón.

### Parte 4 · Adentro, la voz y Angie (del cierre del manual al comienzo del viaje)

#### Comprobadas (leí las dos puntas)

1. **Retomar re-dispara de golpe todos los sonidos y empujones de antes.** `arrancar()` vacía
   `dichas` (`prologo-anomalia.ts:2052`), y los efectos de «una sola vez» se disparan con `t >= hito`
   (`pintarAudio` 1349-1370, `pintarDisparos` 1304-1320, `pintarGags` 1240, `dibujar` 1652-1771).
   Retomando desde `dentro-vivos` o cualquier punto posterior, en el primer cuadro suenan juntos: los
   12 disparos de operadores y pipes con sus 12 «pff», los tres golpes de los tirones, el viento de la
   vuelta, el «pop» del helado y el salto (y el choque, desde `orden-caos-es-orden`). Además los
   tirones empujan a las naves (sin el chequeo de `pos` que sí tiene `impacto`) y, si la ronda ya
   está armada, saltan hacia el centro. El comentario de `unaVez` (línea 1030) dice justo lo
   contrario. No lo escuché: lo deduzco del código.
2. **Retomar repite la línea anterior encima de la primera.** Se arranca 0,3 s antes de la línea
   guardada (`prologo-anomalia.ts:2249`), pero entre líneas hay sólo 0,22 s de aire
   (`PRESUPUESTO.respiro`), así que la línea anterior todavía está viva y se vuelve a decir entera.
   Pasa en 5 de los 6 puntos de esta parte: `voz-supongo` repite «Esto es demasiado caótico.»,
   `orden-caos-es-orden` repite «…lo llamas armonioso.», `leccion-entiendes` repite «…un orden
   malinterpretado.», `leccion-pantalla` repite «…partículas siguiendo las reglas.» y
   `leccion-guarden` repite «Aquí nadie revisa todo. Miren el árbol.» (sin abrir el árbol). Como la
   voz siguiente arranca 0,3 s después y `reproducir()` no corta la anterior (`libs/sonido.ts:312`),
   se pisan dos voces (o la voz y blips, si la grabación todavía no bajó).
3. **Recargar después del manual vuelve a abrir el manual entero.** Entre `anom-manual` y
   `dentro-vivos` no hay otro punto, así que recargar durante `anom-leyes`, la exploradora, «perdiendo
   el control» o el grito (unos 28 s) retoma en `anom-manual` y el manual se abre de nuevo desde la
   página 1; lo cumplido no se guarda (`cumplidas` vive en memoria,
   `integrada-vista.component.ts:404`).
4. **Entre el choque y el final (unos 106 s) no hay patrón en pantalla.** Las bolas se apagan con el
   choque (`fusionEn().vivo`, `prologo-escena.ts:296`) y las líneas ya se borraron con la fusión
   (`prologo-anomalia.ts:1593`); vuelven recién con `orden` (`t = 252,8`). Así «El caos es orden»,
   «Lo que ustedes ven como caos…» y «…partículas siguiendo las reglas.» se dicen sobre un fondo
   vacío, sin las partículas a las que se refieren. `recorrido.md:160` dice que la tesis va «con el
   par de Tusi como demostración».
5. **El final del prólogo corta en seco a una pantalla congelada que ya no tiene sentido.** El
   prólogo se oculta sin fundido (`ocultar()`, 2080) y debajo queda la landing de Tusi sin arrancar:
   el componente pasa un `alEntrar` que ignora el `startBuild` (`integrada-vista.component.ts:817`,
   `intro-tusi.ts:452`), así que la construcción no corre nunca. Se ve «Se está formando algo · 1 de
   8 líneas» quieto, «Esta página es scrolleable», un segundo «Angular Signals» en otro lugar, y el
   iris de la Cinemática 1 se abre sobre eso. Quedaron viejos los comentarios que dicen que al
   terminar «le pasa la posta a la construcción de Tusi» (`prologo-anomalia.ts:88`,
   `integrada-vista.component.html:548-550`, `prologo-anomalia.css:1-2`) y `recorrido.md:19` («el par
   de Tusi antes del primer desafío»).
6. **Con movimiento reducido esta parte no se ve.** El reloj salta de parada en parada
   (`saltoQuieto`): al cerrar el manual va directo a la espera del árbol (`t = 236,2`). Lo único que
   pasa es que suena «Aquí nadie revisa todo. Miren el árbol.» (la línea viva en ese instante) y se
   abre el árbol; al cerrarlo, el prólogo termina en el acto. No se ve ni se oye nada de `anom-leyes`
   a `leccion-pregunta` (la exploradora, adentro, la voz, Angie, el pacto, la pregunta), ni
   `leccion-guarden`, que pide guardar una pregunta que nunca se hizo, ni la frase final.
7. **El zumbido de tensión sigue sonando durante todo el árbol.** `metaDelZumbido` sólo lo baja con
   el manual (`prologo-anomalia.ts:1331`); con el árbol queda bajito pero sostenido, sin cuadros,
   todo lo que se tarde en leer. Choca con «Nada sostenido que canse» (`docs/sonido.md:25`). El propio
   comentario de la línea 1897 lo reconoce.
8. **Angie se llama «Angie» en el prólogo y «Mascota» en las cinemáticas.** Prólogo:
   `NOMBRES.mascota = 'Angie'` (`prologo-anomalia.ts:174`); cinemática:
   `mascota: 'Mascota'` (`cinematicas/cinematica.component.ts:48`), que es lo que se ve en la caja de
   la Cinemática 1, a segundos de distancia. El comentario de ahí («el dato que el prólogo nunca
   mostraba: quién está hablando») también quedó viejo: el prólogo muestra nombres.
9. **Pausar a mitad de una línea la deja muda.** `alternarPausa` llama a `callar()` y al reanudar la
   línea ya está en `dichas`, así que no vuelve a sonar (`prologo-anomalia.ts:1385`, 2119). Pesa en
   las largas: `voz-circulos` (8,6 s), `leccion-reglas`, `anom-leyes`. Lo mismo al esconder la
   pestaña.
10. **Datos viejos en `docs/historia/recorrido.md`.** Dice «el prólogo (3 min 17 s, 60 líneas)»
    (línea 19): hoy son 67 líneas y 4 min 21 s de reloj, sin contar el minijuego, el manual y el
    árbol. Dice que «Cerrar el manual» sigue con `anom-leyes`: el botón dice «Seguir la historia»
    (`integrada-vista.component.ts:121`).
11. **Restos que no hacen nada:** los anclajes `caos` y `frase` (`prologo-guion.ts:403-406`) y los
    momentos `voz`, `tirados` y `listos` (`prologo-escena.ts:129-131`) se calculan y nadie los usa; el
    comentario de `prologo-guion.ts:319-320` dice que «`frase` arranca con la primera».

#### Sospechas (no las pude ver funcionando)

12. **La exploradora invisible sigue siendo tocable.** Cuando una nave se apaga, `pintarNave` le pone
    `opacity: 0` pero deja su último `transform` (`prologo-anomalia.ts:1147-1150`), y un SVG con
    opacidad 0 sigue recibiendo toques. Desde `t = 79,1` hasta el final, tocar arriba a la derecha
    (donde quedó la exploradora) haría aparecer un «¡ey!» de la nada.
13. **El comentario de `voz-circulos`** (`prologo-guion.ts:231-232`) dice que los dos círculos son
    «el final de la intro que sigue»: esa intro (la construcción de Tusi) ya no sigue. Los círculos sí
    aparecen, pero en la cola del propio prólogo, dos minutos después.
14. **«Llegan las luces de la colina y chocan»** (`recorrido.md:158`): en el código lo que choca son
    las bolas del patrón juntadas en dos átomos («no nacen átomos, se arman con lo que había»,
    `prologo-escena.ts:331`); no hay nada que las ate a las luces en que se desarmó Angie en la
    colina. Puede ser una decisión que no llegó al documento.

### Parte 5 · El viaje, arco I: las cinemáticas 1 a 4 y las páginas 1/1 a 4/2

#### Comprobadas (leí las dos puntas)

1. **Voces encimadas en la cinemática.**
   - Si tocas ▸ antes de que termine la voz, la grabación siguiente arranca sin cortar la anterior.
   - `hablar` llama a `reproducir` sin `cortarGrabaciones` (`libs/sonido.ts:460-474` y `312-322`); solo `callar` y `decirGrabada` cortan.
   - En la hoja no pasa, porque `decir` usa `decirGrabada`.
2. **El mapa (la molécula) y la bitácora ya no existen** (ADR 0019 y ADR 0021), pero todavía se nombran en:
   - `docs/historia/recorrido.md:192-193`: «Cerrar la hoja lleva al mapa (la molécula), y la bitácora sigue el viaje»;
   - `integrada-vista/cinematicas/cinematica-guion.ts:27`: «Se escribe en la bitácora…»;
   - `docs/sonido.md:54`: «desde la bitácora»;
   - el comentario de `settle` en `manipulable-system.component.ts`: «el recorrido traza el enlace al concepto siguiente», que no pasa en ningún lado.
3. **Angie figura como «MASCOTA»** en la caja de diálogo de la cinemática (`cinematica.component.ts:47`). En la hoja nunca habla Angie, solo las naves.
4. **Hay líneas de llegada que repiten líneas de la cinemática:**
   - en 1/4, la pregunta con que cierra la cinemática 1 («Nunca la leí…») se contesta recién tres páginas después;
   - 3/1 repite `c3-baliza`;
   - 3/3 repite `c3-rastro`.
5. **Se usan cosas antes de enseñarlas:**
   - el código sano de 1/1 usa `total.set(total() + 1)`: el getter llega en 1/4 y `set` en 1/5;
   - 1/2 usa `effect` (`signals/level-1-*/signals-systems.ts:44`), que se enseña en el capítulo 3.
6. **En 1/4 el comentario no coincide con la pantalla:** dice que la lectura rota da NaN, pero muestra 0 (`signals-systems.ts:85-86`).
7. **4/2 menciona una numeración vieja:** la pista dice «comparalo con el sub-nivel 1» (`custom-equal.component.html`). En el viaje la página es «4/1», y «sub-nivel» no aparece en ningún lado.
8. **El objeto de la etapa 4 no coincide con la cinemática:** la balanza del cielo muestra «{3, 4}» y la cinemática usa «(4,9)».
9. **En 3/2 y 3/3, «Destruir hijo» no tiene vuelta:** nada vuelve a poner `showComponent(true)`. Para repetir la demo hay que dejar la página y volver.
10. **2/3 tiene un estado vacío que no se ve nunca:** el panel de computados dice «Todavía no se ejecutó.», pero el formulario básico emite su valor inicial al montarse (lo dice el comentario de `basic-form.component.ts`). Además, las dos demos de la página comparten los paneles.
11. **Lo resuelto no se ve en la hoja:**
    - las marcas de la cabecera muestran «leída» por posición, no por resuelta;
    - al volver a una página resuelta, el desafío arranca roto otra vez y el festejo se puede repetir.
12. **El trazo del título se dibuja una sola vez por etapa:** el h2 no se recrea al cambiar de página, así que en las páginas 2 en adelante el título cambia sin animación.
13. **`avisarAlObjeto` no se usa en el viaje:** solo se llama en la práctica del carrito. El comentario de la tripulación dice que las naves «se enteran de cada cambio», pero en la hoja el objeto reacciona solo al resolver.
14. **Nada traba:** puedes llegar a «Seguir el viaje» sin resolver ningún desafío (`puedeSeguir` siempre verdadero). Es coherente con las reglas, pero ninguna página te avisa que te salteaste algo.

#### Sospechas (no las comprobé en pantalla)

1. **Entre la hoja y la cinemática siguiente** podría verse la colina un instante: la hoja se cierra de golpe y el iris espera a que cargue la escena. *(no lo pude confirmar)*
2. **Botones que desentonan con el papel crema:** el azul de 1/7 («Incrementar (interno)»), los de 3/2 y 3/3 (azul y verde) y los de 4/1 y 4/2 (índigo, gris y esmeralda) son colores de Tailwind.
3. **«Intervalo filtrado» se puede entender como un `filter` de RxJS.** Habla de un intervalo que se escapó (leak); podría llamarse «Intervalo que se escapa».
4. **En 2/3, `nombre.set(otro)` manda un pulso hacia «saludo».** Parece decir que recalculó, justo en la página que enseña que es perezoso.
5. **En la escena 3, el tono «beat» suena al encenderse el beat `hilo-lectura`,** no cuando la baliza destella, unos 2 s después: el sonido no acompaña al destello.

### Parte 6 · Arco II · La banda vieja (capítulos 5 a 8)

#### Comprobadas (leí las dos puntas)

1. **La frecuencia no cierra en ningún lado.** Angie dice «Pásenle la ciento cuarenta y dos» (`cinematicas-datos.ts:260`), pero la ficha que entra al repetidor dice **88**, el cambio es a **104** (`escena-07.component.ts:148,150,159,164-165`) y el dial de 7/5 va de 88 a 108 y arranca en 98 (`signal-rules.component.ts:24-25,40`): 142 ni siquiera entra. Y lo que se pasa al aparato es un 88 que nadie dijo, no el 142 de la pista. Además, el comentario de la escena dice que «la Nave A le pasa la frecuencia» (`escena-07.component.ts:5`), pero la línea es de Angie.
2. **Angie habla en la Cinemática 7 antes de estar en escena.** `c7-frecuencia` es de la mascota pero enciende `repetidor`. Recién `c7-vivo`, dos líneas después, enciende `mascota` (`cinematicas-datos.ts:257-276`). Su voz y su retrato salen en la caja de diálogo mientras a la derecha no hay nadie.
3. **La primera línea de 5/1 y la de 7/1 repiten lo que acabas de oír.** `viaje-5-1-llegada` = `c5-primera` y `viaje-7-1-llegada` = `c7-repetidor`: mismo texto, mismo hablante y el mismo mp3 (hash `81a0ef0b` y `8b38bad5`, `voces-grabadas.ts:116,223` y `:134,233`). Sale justo después de cerrar la cinemática, así que suena dos veces seguidas.
4. **La línea al resolver habla de otra cosa que el arreglo.** En 8/2 el arreglo es `untracked`, pero la Nave A dice «toSignal y toObservable / traducen de ida y vuelta». En 6/3 el arreglo es leer con `hasValue()` y se dice «Cambió la dirección: preguntó de nuevo solo». En 6/1 el arreglo es la cancelación y se dice «Cargando, error o valor: todo avisa» (`guion-del-viaje.ts`, entradas 6/1, 6/3 y 8/2, contra `resource-systems.ts` y `queries-systems.ts`).
5. **8/1 resuelve con una API del capítulo siguiente.** El código sano del desafío es `afterRenderEffect(...)` (`queries-systems.ts:22`), y `afterRenderEffect` se enseña en 9/1. La cinemática 8 termina justamente preguntando «¿Desde cuándo se puede leer?».
6. **Texto visible en inglés a medias:** «Elementos **queriados**» en la demo de 8/3 y en su «Qué observar» (`view-children.component.html:6,19`). Los métodos de envío de 5/1 y 5/2 también quedan en inglés: `Ground`, `Air`, `Sea`, `Express`.
7. **6/2 es la misma pantalla que 6/1.** Mismos usuarios, mismo 0,8 s, misma ficha, mismo «Recargar» y el mismo CSS (los dos `.css` son idénticos). Lo único distinto es el código de al lado, así que en la demo no hay nada nuevo que hacer ni que ver.
8. **El `transform` de 7/3 no se ve nunca.** La demo pasa `[count]="count()"` y `[highlight]="highlight()"` por property binding, con un número y un booleano (`input-required.component.html:9`), así que `numberAttribute` y `booleanAttribute` no convierten nada. Lo que dice «Qué observar» («count llega como número…») ya era cierto sin el transform.
9. **Los indicadores de 8/1 y 8/4 casi no se mueven.** «¿Query resuelta?» dice siempre «sí», porque el input está siempre en la plantilla (`view-child.component.html:17-26`). «primero:» en 8/4 dice siempre `Ada`, porque «Agregar» suma al final y «Quitar» saca el último; solo cambia a `(vacío)` con la lista vacía.
10. **Comentario viejo en 8/2.** Dice que la vista integrada «pre-monta las 12 cards y marca `inert` la que no se ve» y que el reloj «sigue desde donde quedó» (`rxjs-interop.component.ts:27-32`). Hoy cada página se monta sola con `createComponent` en una hoja que va **afuera** del escenario inerte (`integrada-vista.component.ts:1031-1045`, `integrada-vista.component.html:814-819`). El filtro sobra, y el reloj vuelve a 0 cada vez que se monta la página.
11. **El repetidor cambia de cuerpo entre la cinemática 7 y la 8.** En la 7 es una chapa ámbar apaisada con dial, dos puertos y antena a la derecha (`escena-07.component.ts:106-135`). En la 8 es un chasis gris con patas, mástil central, perillas y un hueco de pantalla (`escena-08.component.ts:115-124`). La 8 dice «Ahora el repetidor», como si fuera el mismo.
12. **La ranura de error de la Cinemática 6 no se usa nunca.** El héroe muestra tres ranuras (cargando/error/valor) y la ley nombra el error, pero ningún beat la enciende: queda en gris punteado de principio a fin (`escena-06.component.ts:165-169,453-461`).
13. **Lo que dice `recorrido.md` contra el código.** El giro del capítulo 5 es «Eligen a mano una ruta hacia el borde donde se oye la banda» (`docs/historia/recorrido.md:215`), pero en la cinemática no hay banda ni borde: la banda vieja aparece recién en la 6. Las otras pistas sí están: «lentos» (`c5-lentos`), el silencio (Angie no sale en la Cinemática 6 hasta `c6-no-valor`, después de la transmisión) y la frecuencia (con el número que no cierra, punto 1).
14. **El orden de las naves cambia en la 8.** Ahí la Nave B está arriba y el Capitán abajo; en la 5, la 6 y la 7 la Nave A va arriba (`escena-08.component.ts:230-253`).

#### Sospechas (no pude confirmarlas)

- **El 404 de 6/3 depende del servidor.** Si en algún entorno `datos/tripulacion/4.json` volviera el `index.html` con 200 (fallback de SPA), `aTripulante` tiraría «La respuesta no tiene la forma de un tripulante» y la ficha mostraría un **200** en rojo como si fuera la falla (`http-resource.component.html:43-44`). No corrí el servidor; en el repo no hay `404.html`.
- **El silencio de Angie no se nota.** En la Cinemática 6 no calla en escena: simplemente no está hasta la línea 8, y después habla dos veces. Para que se lea como «calla» probablemente haría falta que estuviera a la vista durante la transmisión.
- **El rótulo de la perilla de 7/6 dice lo contrario del código.** El `label` (solo para lectores de pantalla) dice «…o **esperarlos**», pero el comentario del sistema y la línea al resolver dicen que `'none'` **retiene** en vez de esperar (`io-systems.ts:135-139`).

### Parte 7 · Arco III, la revelación y el final

#### Comprobadas (leí las dos puntas)

1. **En el final no aparece la exploradora.** Su nave sólo se ve con el beat `nave4-entra`
   (`escenas/escena-12.component.ts:556-566`), y ninguna línea del 12 lo enciende
   (`cinematicas/cinematicas-datos.ts:487-544`). La revelación sí lo enciende, pero es otra
   instancia y sus beats no pasan al final. En completo se van tres naves por la salida, no cuatro
   como dice el comentario (`escena-12.component.ts:7-9`): la cuarta viaja invisible. En el último
   cuadro tampoco está. El recorrido dice que el final ocurre con ella ya adentro
   (`docs/historia/recorrido.md:249-252`).
2. **En el final incompleto la tripulación avanza de espaldas hacia la salida.** El paso de «ir
   hacia la salida» (77 %, 64,5 %, 56 % del camino) cuelga de `nave4-entra`
   (`escena-12.component.ts:629-645`), que en el 12 no se enciende. Con `regreso` las naves giran 180°
   y van de 0 % a 71 %, 58,5 % y 52 % (`:646-661`): se acercan a la salida mirando hacia atrás, justo
   cuando el Capitán dice «Todavía no. / Este mundo también es casa.». Así quedan en el último cuadro.
3. **En la revelación incompleta, la tripulación vuela hacia la salida cerrada al decir «Porque
   entré.»** El mismo bloque (`escena-12.component.ts:633-645`) depende sólo de «incompleto» +
   `nave4-entra`, y la revelación enciende `nave4-entra` (`cinematicas-datos.ts:480`). Es la
   coreografía del final a medias jugándose en la revelación.
4. **En la revelación la exploradora sale de una salida que no existe.** El 13 no enciende
   `salida-iris` (`cinematicas-datos.ts:463-486`), así que el iris está cerrado (`escena-12:495-523`),
   y aun así la nave sale del borde derecho.
5. **Los anillos de la transmisión de la revelación no tienen alto.** `.k-transmision` sólo tiene
   ancho y sus anillos son `inset: 0` (`cinematicas/cinematica.component.css:415-421` y `:593-604`);
   el capítulo 10 lo arregla con `aspect-ratio` y un comentario que dice que «sin esto sus anillos
   serían una raya» (`escena-10.component.ts:232-235`). La escena 12 no lo hace (`:240-242`). Lo leí
   en el código; no lo vi en pantalla.
6. **Angie dice «Porque entré.» bajo el nombre «Mascota».** Todas sus líneas llevan ese nombre
   (`cinematica.component.ts:47`). Pendiente H3 propone que la caja diga «Angie»
   (`docs/historia/pendientes.md:14-16`).
7. **La cinemática 11 repite su nombre:** la etapa se llama «Quien lee, avisa» (`integrada-vista/viaje.ts:29`)
   y su título también (`cinematicas-datos.ts:424-425`): la tarjeta y la barra dicen «Quien lee,
   avisa · Quien lee, avisa».
8. **Demo y desafío del debounce no esperan lo mismo:** las demos 10/1, 10/2 y 10/3 esperan 400 ms
   (`debounced-rxjs.component.ts:23`, `debounced-manual.component.ts:24`, `debounced-nativo.component.ts:37`)
   y el código de los desafíos dice 300 (`signals/level-10-debounced/debounce-systems.ts:21,43,65`).
9. **Para el final completo alcanza una página por etapa**, 11 de los 36 desafíos de perilla
   (`integrada-vista.component.ts:867-869`; `libs/partida.ts:257-264`). El comentario del input dice
   «Si el jugador estableció los doce capítulos» (`cinematica.component.ts:107`).
10. **Lo diseñado que no está:** el desafío de «La salida» y el epílogo en la colina
    (`docs/historia/recorrido.md:39-40`, `:249-269`; J3 y J4 en `pendientes.md:40-46`). Después
    del final queda el cuadro congelado con «Empezar de cero».
11. **El recorrido dice que «cerrar la hoja lleva al mapa (la molécula)»** (`docs/historia/recorrido.md:193-194`),
    pero la hoja no se cierra (`integrada-vista.component.html:787`) y la molécula se retiró
    (`integrada-vista/viaje.ts:87`, ADR 0019).
12. **El último beat del final no cambia nada y suena igual:** «Este mundo sigue reglas.» enciende
    `mascota`, que ya estaba encendido, y `encender` siempre toca el efecto (`cinematica.component.ts:373-377`).

#### Sospechas (no las pude confirmar)

- Entre la revelación y el final hay un instante sin cinemática (se abre en el render siguiente,
  `integrada-vista.component.ts:874-884`); no sé qué se ve detrás en ese cuadro.
- En la revelación completa calculo que la nave rosa frena arriba de la Nave A (el 46,88 % de su ruta
  cae cerca de 25 %, 28 %); no lo vi en pantalla.
- 9/2 se titula `effect((onCleanup) => …)` y su demo usa `effect`, pero el desafío usa
  `afterRenderEffect((onCleanup) => …)`; la etapa enseña limpieza por tercera vez (3/2, 3/3 y 9/2,
  J5 en `pendientes.md:47-50`).
