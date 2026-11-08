# Pendientes: lo que falta cerrar

Todo lo que la historia continua todavía no decidió, cada punto con una propuesta. El canon está en
el [README](./README.md) y el recorrido, en [recorrido](./recorrido.md).

Cuando un punto se cierra, la decisión pasa al canon o al recorrido, y acá queda la línea con la
fecha y adónde fue. Los ids (H1, J1…) sirven para nombrarlos en una sesión ("cerramos H3").

## Historia

- **H1. El deseo cortado.** "Y yo quiero unas…" (`casa-unas`) nunca se dijo, y el epílogo lo
  completa junto al helado de chocolate. Falta elegir qué era. **Propuesta:** "unas vacaciones", y
  terminan de vacaciones para siempre en la colina.
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
- **H8. El guion de la revelación.** Hay un borrador en el recorrido; falta pasarlo en limpio.
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
  (`CONTRIBUTING.md`) y pediría su ADR.
- **T2. Dónde vive el código nuevo.** La tabla de scopes de `AGENTS.md` es una lista cerrada: si la
  historia vive en una carpeta nueva, su fila y su scope se suman en el mismo cambio.
- **T3. Reemplazo por etapas.** `CONTRIBUTING.md` no acepta reescrituras masivas: cada cambio tiene
  que leerse como un diff. **Propuesta:** la historia nueva crece al lado del recorrido actual, una
  etapa por vez, y cada etapa nueva retira lo que reemplaza.
- **T4. La partida.** `libs/partida.ts` guarda `"concepto/sub"` (con el sub-nivel desde 0) y lo
  valida contra la cantidad de sub-niveles de cada concepto. Con etapas, esos ids cambian de
  sentido. Hay dos caminos: subir `VERSION` a 2, y las partidas viejas arrancan de cero como ya prevé
  ADR 0002, o escribir una migración.
- **T5. Lo que fija la forma de 0 a 11.** Va a fallar al cambiarla:
  - `RAW` (`molecule-engine.ts`) y `signalsRoutesTree` (`app.routes.ts`) tienen que tener el mismo
    largo y el mismo orden;
  - los specs: `app.routes.spec.ts` (12 niveles), `molecule-engine.spec.ts`,
    `cinematica-guion.spec.ts` (capítulos 0 a 12), `integrada-vista.component.spec.ts`,
    `url-sync.spec.ts`, `libs/partida.spec.ts` y `libs/manipulable-systems.sweep.spec.ts`, que
    importa los 12 archivos por ruta y espera 40;
  - sin test: `ACTS`, `CAPITULO_FINAL = 12`, el mapa `ESCENAS`, `LARGOS = {6, 12}` y el "de 12" de
    la bitácora.
- **T6. El gate de prosa.** `scripts/prose-budget.mjs` mide solo los `*.component.html` que están
  bajo `src/app/signals/**/sub-levels/`. Si las pantallas se mudan, mide cero y pasa sin avisar.
  Además, una pantalla movida o renombrada arranca sin crédito de línea base, con 8 palabras. La
  raíz del escaneo se mueve junto con las pantallas.
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
- **T10. La captura del README.** `public/preview.jpeg` (también es la `og:image`) y el README en
  inglés se rehacen cuando cambie la vista integrada.

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

- **H6. El salto atrás** (2026-11-08). Sin marca: el prólogo arranca directo después de la colina,
  sin cartel de "Un rato antes…". Está en el recorrido, en "La colina".
- **H7. El intercambio con el sol** (2026-11-08). "Esto es demasiado caótico." y "Supongo que sí…
  Desde su perspectiva puede ser caótico." en la colina y en la cabina, sin "Así que caótico…". En
  el prólogo es la línea `voz-supongo`, que reemplaza a `voz-asi-que` y `voz-perspectiva`. Está
  en el recorrido.
- **J1. El minijuego de operadores** (2026-11-08). Tres huecos, uno por nave: `map`, `scan` y
  `throttleTime`. Está en el recorrido, en "La anomalía y el minijuego de operadores".
- **J2. Completar el hueco** (2026-11-08). Se elige entre tres operadores con la perilla de
  `ManipulableChallenge`, como en los demás desafíos. Teclear quedó como pendiente aparte.

## Memoria

- **M1. Las aperturas desparejas de las cinemáticas.** Los capítulos 0, 2, 4, 7, 8 y 10 abren solo
  con el título y las naves; los otros, con un objeto propio. Damian lo dejó en espera hasta definir
  el enfoque de las cinemáticas, y con el rediseño queda absorbido. **Propuesta de regla para las
  etapas nuevas:** toda etapa abre con su objeto de mundo.
