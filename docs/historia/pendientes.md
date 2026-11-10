# Pendientes: lo que falta cerrar

Todo lo que la historia continua todavía no decidió, cada punto con una propuesta. El canon está en
el [README](./README.md) y el recorrido, en [recorrido](./recorrido.md).

Cuando un punto se cierra, la decisión pasa al canon o al recorrido, y acá queda la línea con la
fecha y adónde fue. Los ids (H1, J1…) sirven para nombrarlos en una sesión ("cerramos H3").

## Historia

- **H2. La familia.** "Extraño a mi familia." (`casa-familia`) queda sin resolver si se quedan a
  vivir en Signal Space. **Propuesta:** la familia es la tripulación, que estaba incompleta sin la
  exploradora; en el epílogo están los cuatro.
- **H3. El nombre.** ¿La exploradora se llamaba Angie? Si es así, ¿por qué no la reconocen?
  **Propuesta:** la tripulación siempre le dijo "exploradora", y "Angie" es el nombre que tomó en
  Signal Space. La caja de diálogo lo muestra porque habla para quien juega, no para la tripulación.
- **H4. Por qué es una gema.** ¿Signal Space transforma a quien entra? Si es así, ¿por qué la
  tripulación sigue siendo nave? **Propuesta:** el mundo transforma con el tiempo, no al entrar. La
  tripulación lleva minutos y ella muchísimo tiempo. El epílogo puede insinuar que ellos empiezan a
  cambiar.
- **H5. El sol.** El canon propone que el sol de la colina es la anomalía vista desde Signal Space.
  Falta confirmarlo. El dibujo queda como está: `DESIGN-CHECKLIST.md` ya decidió un sol dibujado, no
  un átomo.
- **H8. El guion de la revelación.** Pasado en limpio el 2026-11-09 como la cinemática 13 (ADR
  0007). Falta que Damian lo lea en pantalla: el ritmo y los huecos entre líneas son una propuesta.
- **H9. El género.** Angie es ella, pero el prólogo le dice "¿Estás loco?" (`reclamo-loco`) y "tú,
  tan tranquilo" (`reclamo-armonioso`). Además, un comentario de `prologo-guion.ts` dice "él se
  NIEGA primero". **Propuesta:** "¿Estás loca?" y "tan tranquila", porque para entonces ya oyeron
  su voz, y el comentario en femenino.
- **H10. El registro.** El prólogo tutea ("Sácanos de aquí", "si lo miras desde el ángulo
  correcto") y las cinemáticas usan voseo ("¿A ella le avisó y a vos no?", "Preguntá"). La interfaz
  mezclaba ("Haz click" al lado de "Ponete auriculares"); los dos llamados ya dicen "Hacé click".
  Falta elegir uno para toda la historia. **Propuesta:** voseo, como los docs y casi toda la interfaz.

## Juego

- **J2. Teclear el hueco.** Elegir ya está hecho (ver abajo). Falta decidir si se suma teclear como
  variante para quien quiera, validando contra las mismas opciones (mayúsculas, espacios, nombres
  parecidos).
- **J3. ¿El final exige resolverlo?** Damian quiere que tengan que resolverlo para escapar, pero
  [ADR 0002](../adr/0002-capa-de-juego-cinematicas-partida-y-sonido.md) decidió que no se bloquea el
  avance (25 y 26 de julio). **Propuesta:** el escape pasa al resolverlo, y Angie ayuda un poco más
  con cada intento, así nunca es un muro. La decisión va en un ADR.
- **J4. El desafío final concreto.** Qué sistema, cuántos huecos, cuáles le tocan a la tripulación
  (RxJS) y cuáles a Angie (signals). Toma de 6/2 (`rxResource`), de 8/2 (`toSignal`, `toObservable`
  y `untracked`) y de 10/1 (`debounceTime` con `switchMap`), y vuelven los operadores del minijuego.
- **J5. Los desafíos que se repiten.** Algunos se pisan o encajarían mejor en otro lado:
  - 1/1 (variables, antes de signals) podría ir al manual de a bordo;
  - 3/2, 3/3 y 9/2 enseñan tres veces la limpieza de un efecto;
  - 10/1 a 10/3 son tres formas del mismo debounce, y la de RxJS puede ir al final.

  **Propuesta:** revisarlo al rehacer cada etapa, sin perder ninguna ley.

- **J6. El carrito.** `/practica/carrito` es el único ejemplo de práctica, y no es parte de los
  desafíos ni de la partida. **Propuesta:** "la heladería de la colina", un juego para después del
  final, con la misma lógica de `cart.model.ts` y los productos del epílogo.
- **J7. La bitácora y volver a ver.** Con una historia continua, ¿qué se repasa y cómo se vuelve a
  ver una escena? La pregunta de la barra ("¿Quién le avisó a la pantalla?", que cambia a "Quien
  lee, avisa." en el último concepto) ya hace de hilo de todo el viaje. **Propuesta:** la bitácora
  sigue siendo el cuaderno de leyes, ahora por etapa, y la pregunta sigue como hilo hasta la
  penúltima.
- **J8. La duración de la apertura.** **Propuesta:** la primera interacción, antes de los 60 s.
  Se mide con el reloj del guion, como hoy el prólogo.

## Técnica

- **T1. El motor de animación.** `/animacion-vectorial` arma las escenas con SVG y GSAP, y el repo
  no tiene GSAP. Además, las cinemáticas exigen cero JavaScript de animación (`DESIGN-CHECKLIST.md`),
  y el bundle inicial anda cerca de su presupuesto: 740 kB, y el prólogo pasó a carga diferida
  porque lo excedía por 21 kB. **Propuesta:** usar el método del skill (causa y reacción, planos, luz,
  resortes, un solo impacto) con el motor del repo: CSS, Web Animations, `libs/resorte.ts`,
  `libs/muelle.ts`, `libs/rastros.ts` y `emitirImpacto`. Sumar GSAP sería un cambio de stack
  (`CONTRIBUTING.md`) y pediría su ADR. Actualización (2026-11-09): las láminas del manual ya usan
  GSAP (`EscenaDelManual`), y la del árbol de Signal Space también; el prólogo y las cinemáticas
  siguen con el motor del repo.
- **T2. Dónde vive el código nuevo.** La tabla de scopes de `AGENTS.md` es una lista cerrada: si la
  historia vive en una carpeta nueva, su fila y su scope se suman en el mismo cambio.
- **T3. Reemplazo por etapas.** `CONTRIBUTING.md` no acepta reescrituras masivas: cada cambio tiene
  que leerse como un diff. **Propuesta:** la historia nueva crece al lado del recorrido actual, una
  etapa por vez, y cada etapa nueva retira lo que reemplaza. La primera fue el manual de a bordo
  (2026-11-09): sacó 0/1 a 0/5 de la molécula. La segunda, el árbol de Signal Space (el mismo día):
  sacó 0/6, y con él la Introducción entera.
- **T4. La partida.** `libs/partida.ts` guarda `"concepto/sub"` (con el sub-nivel desde 0) y lo
  valida contra la cantidad de sub-niveles de cada concepto. Con etapas, esos ids cambian de
  sentido. Hay dos caminos: subir `VERSION` a 2, y las partidas viejas arrancan de cero como ya prevé
  ADR 0002, o escribir una migración. Con el manual se eligió migrar: la versión 2 traduce las
  partidas de la 1 (el viejo `0/5` es el `0/0`, y lo de `0/0` a `0/4` se descarta) y el resto de lo
  guardado sigue. Con el árbol, la versión 3 corre todo un concepto, punto del recorrido incluido,
  y descarta lo de la Introducción (ADR 0006). Cada etapa que retire sub-niveles suma su migración
  en `MIGRACIONES`.
- **T5. Lo que fija la forma de 0 a 11.** Resuelto el 2026-11-09 (ADR 0006), al sacar la
  Introducción entera. El número de capítulo quedó como nombre (`CAPITULO_DE_CONCEPTO`, atado al
  `path` de `signalsRoutesTree`), así que las cinemáticas 1 a 12, el riel, la bitácora y `?nivel=`
  no se renumeraron. La partida pasó a la versión 3 con su migración. Lo que sigue atado a la
  posición: `RAW` y `signalsRoutesTree` (mismo largo y orden), `ACTS` y `CONCEPTO_PICO` en
  `molecule-engine.ts`, y el final, que dibuja doce átomos por número de capítulo.
- **T12. El estilo de las cinemáticas.** Damian pidió que las cinemáticas de capítulo se vean como
  la intro. Siguen con su estilo (papel claro, barras de cine) y su "Capítulo N" arriba, que
  contradice el principio de no mostrar números. **Propuesta:** el reproductor toma el cielo del
  prólogo y muestra el nombre de la etapa en lugar del número.
- **T13. Las pantallas en la hoja.** En el viaje, las pantallas de los capítulos se leen en la hoja
  del manual tal como venían de la molécula: su explicación (la pista de Angie) flota en la esquina y
  sus títulos son técnicos ("Read-only signals: asReadonly()"). **Propuesta:** pasarlas al formato
  de las páginas del manual (qué hacer, la demo, la escena de la nave y el desafío), una etapa por
  vez, como se hizo con la Introducción.
- **T6. El gate de prosa.** `scripts/prose-budget.mjs` mide solo los `*.component.html` que están
  bajo `src/app/signals/**/sub-levels/`. Si las pantallas se mudan, mide cero y pasa sin avisar.
  Además, una pantalla movida o renombrada arranca sin crédito de línea base, con 8 palabras. La
  raíz del escaneo se mueve junto con las pantallas. El manual dejó sus cinco pantallas en su
  carpeta de `signals/`, así que el gate las sigue midiendo.
- **T7. El sonido.** Si Angie y la exploradora comparten algo del timbre, es una pista más. Hoy, en
  `libs/sonido.ts`, la exploradora suena en onda cuadrada a 392 Hz (la más aguda y rápida) y Angie
  en senoidal a 330 Hz, lenta. Además, `sonido.spec.ts` exige que la exploradora tenga la voz más
  aguda.
- **T8. La fusión del prólogo.** Los átomos que chocan cuando nace Angie son ámbar y menta, y con el
  lore nuevo lo que choca son sus luces de la colina. **Propuesta:** que tomen los colores de
  `COLORES_DE_LUZ` (`inicio-angie.ts`).
- **T9. Tres nombres para Angie.** El prólogo la llama "Angie", las cinemáticas "Mascota", y la
  intro de Tusi usa una imagen estática (`public/angular-mascot-idea.svg`). **Propuesta:** "Angie" y
  el componente vivo (`mascota-viva`) en todos lados.
- **T10. La captura del README.** `public/preview.jpeg` y el README en
  inglés se rehacen cuando cambie la vista integrada.
- **T11. Quien no ve el prólogo.** Sin movimiento (`prefers-reduced-motion`) o con menos de 700 px de
  ancho, el prólogo se saltea entero, y con él el manual de a bordo: esas personas ya no ven 0/1 a
  0/5, que antes estaban en la molécula. Cada etapa que pase a la historia agranda el hueco. Falta
  decidir cómo se lee la historia sin la cinemática: por ejemplo, las páginas solas, sin la escena
  detrás. El manual y el árbol de Signal Space ya están (2026-11-09): la bitácora los abre sueltos,
  sin la escena. El viaje (ADR 0007) cierra el resto: con el prólogo salteado solo, sigue la primera
  etapa, y las cinemáticas tienen su modo quieto.

## Arreglos de docs

Textos que estaban desactualizados y no dependían de la historia nueva. Cerrados el 2026-11-08:

- **A1.** "Quien vuelve no ve el prólogo": el README ya dice que el prólogo sigue siempre a la
  colina y se saltea con "Saltar intro →", y el comentario de `libs/partida.ts` dice para qué
  sirve hoy el prólogo guardado: la bitácora ofrece volver a verlo. ADR 0002 queda como se
  escribió, porque entonces era cierto; el cambio está en las consecuencias de ADR 0003.
- **A2.** "37 desafíos": el checklist dice 40, también donde decía 35. ADR 0002 sigue diciendo 37,
  que eran los de entonces.
- **A3.** [ADR 0001](../adr/0001-computed-vs-linked-signal-vs-resource.md) nombraba
  `level-4-computed`, una carpeta que no existió nunca: ahora dice `level-2-computed-signals`, con
  una fe de erratas al pie.
- **A4.** El ítem de la lamparita en `DESIGN-CHECKLIST.md` ya no cita el llamado viejo.
- **A5.** Los dos comentarios quedaron al día: el del símbolo de la nave en
  `cinematica.component.html` explica que es la flecha del prólogo viejo, y el de los electrones
  de `molecule-engine.ts` dice que la Introducción tiene 6.

## Cerrados

- **H1. El deseo cortado** (2026-11-09). Eran papas fritas: "Y yo quiero unas papas fritas…"
  (`casa-unas`) se dice entero, con su globo de papas como el del helado, y la exploradora igual
  la pisa. El epílogo las sirve junto al helado de chocolate. Está en el canon y en el recorrido.
- **H6. El salto atrás** (2026-11-08). Sin marca: el prólogo arranca directo después de la colina,
  sin cartel de "Un rato antes…". Está en el recorrido, en "La colina".
- **H7. El intercambio con el sol** (2026-11-08). "Esto es demasiado caótico." y "Supongo que sí…
  Desde su perspectiva puede ser caótico." en la colina y en la cabina, sin "Así que caótico…". En
  el prólogo es la línea `voz-supongo`, que reemplaza a `voz-asi-que` y `voz-perspectiva`. Está
  en el recorrido.
- **H11. El orden de la colina** (2026-11-09). Primero la radio y el presentimiento ("Así que…
  Ellos ya están aquí…"), después el sol y la respuesta, y al final la decisión, sonriendo: "Así
  que… La hora ha llegado…" (antes "Entonces…", y el sol hablaba primero). Está en el recorrido.
- **J1. El minijuego de operadores** (2026-11-08). Tres huecos, uno por nave: `map`, `tap` y
  `filter` (2026-11-09; antes `map`, `scan` y `throttleTime`). Está en el recorrido, en "La anomalía y el minijuego de operadores".
- **J2. Completar el hueco** (2026-11-08). Se elige entre tres operadores con la perilla de
  `ManipulableChallenge`, como en los demás desafíos. Teclear quedó como pendiente aparte.
- **T14. Las páginas del manual en una sola pieza** (2026-11-09). Damian pidió que la demo, la
  escena de la nave y el desafío no se lean como tres cosas sueltas. Las seis leyes (las cinco del
  manual y la de Signal Space) son una sola pieza: la nave es el escenario y su pantalla muestra los
  números una sola vez (en la 3, el pipeline; en la 1 y la 6, el árbol), y abajo va su consola con
  los dos pasos, probar y arreglar, sobre el mismo código. En la 1, el desafío de "parsear" pasó a
  un `</article>` fuera de lugar; en la 6, el hueco es la declaración (`let` o `signal`). Sin la
  forma de tres tarjetas ni el input `integrada` en `app-pagina-del-manual`, sin
  `introduction-systems.ts` (sus seis sistemas de perilla), sin `app-tree` ni
  `posicionesEnElDocumento`, y el barrido cuenta 34.

## Memoria

- **M1. Las aperturas desparejas de las cinemáticas.** Los capítulos 0, 2, 4, 7, 8 y 10 abren solo
  con el título y las naves; los otros, con un objeto propio. Damian lo dejó en espera hasta definir
  el enfoque de las cinemáticas, y con el rediseño queda absorbido. **Propuesta de regla para las
  etapas nuevas:** toda etapa abre con su objeto de mundo.
