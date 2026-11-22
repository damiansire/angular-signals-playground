# Pendientes: lo que falta cerrar

Todo lo que la historia continua todavía no decidió, cada punto con una propuesta. El canon está en
el [README](./README.md) y el recorrido, en [recorrido](./recorrido.md).

Cuando un punto se cierra, la decisión pasa al canon o al recorrido, y acá queda la línea con la
fecha y adónde fue. Los ids (H1, J1…) sirven para nombrarlos en una sesión ("cerramos H3").

## Historia

- **H2. La familia.** Al volver a casa, la Nave A dice "Extraño a mi familia." (`casa-familia`).
  Pero no vuelven nunca: al final se quedan a vivir en Signal Space, y esa familia queda colgada.
  **Propuesta:** la familia que extraña es la tripulación completa, los cuatro con la exploradora.
  Recién en el epílogo están los cuatro juntos, así que la línea se cumple. (La exploradora es la
  nave violeta, con los colores de Angie; la Nave A es otra.)
- **H8. El guion de la revelación.** Damian pidió propuestas (2026-11-22). Tres versiones, todas de
  tú (H10):
  - **A. La de hoy, de tú:** "No los encuentro. Voy a entrar." · "¡No! ¡Quédate afuera!" · "Va a
    entrar igual." · "¿Cómo lo sabes?" · "Porque entré." · "¿Exploradora?" · "Llegué antes que
    ustedes. Mucho antes." · "No podía decirlo. Ella tenía que entrar." · "Siempre tan aguafiestas."
  - **B. Con la espera:** la A, y después de "Mucho antes." la Nave B pregunta "¿Cuánto tiempo?" y
    Angie contesta "Lo suficiente para dejar de apurarlos.". Cuenta en una línea por qué cambió de
    carácter.
  - **C. La adivinan por las pistas:** después de "Va a entrar igual.", la Nave B junta las pistas,
    "Sabías lo del helado. Y la frecuencia.", el capitán pregunta "¿Quién eres?" y Angie dice "La que
    siempre los apuraba."; sigue con "¿Exploradora?". Premia a quien vio las pistas, pero pierde
    "Porque entré.".

  **Propuesta:** la B. Cambiar líneas pide regenerar sus voces, y eso gasta crédito.

## Juego

- **J2. Escribir el operador.** En el minijuego del prólogo, el hueco se completa tocando uno de
  tres operadores (hecho, ver J2 en cerrados). La duda era si sumar otra forma: escribir el nombre
  con el teclado. **Propuesta:** no sumarla. Tocar anda igual en el celular y en la compu, y escribir
  agrega errores de tipeo que no enseñan nada.

## Técnica

- **T7. Cómo suenan Angie y la exploradora.** Son la misma persona, pero hoy suenan como dos: la
  exploradora tiene una voz grabada de Gemini (`csagent-7`) y Angie otra (`commercial-6`), y sus
  blips también son distintos (`libs/sonido.ts`). La duda es si el sonido tiene que dejar una pista.
  **Propuesta:** la exploradora habla con la voz de Angie, pero rápida e impaciente. Quien preste
  atención puede sospechar, y a la primera no se nota. Son 8 líneas (5 del prólogo y 3 de las
  cinemáticas) que hay que regenerar, y eso gasta crédito.
- **T10. La foto del README.** `public/preview.jpeg` es la captura que abre el README, y hay que
  sacarla de nuevo cada vez que cambia la vista integrada. Eso ya es regla en `AGENTS.md`, así que
  no hay nada que decidir. **Propuesta:** cerrarlo, y sumar un script que la saque solo, como
  `docs/tarjeta-social/capturar.mjs`, para que regenerarla sea un comando.

## Decidido, falta en el código

Lo decidido el 2026-11-22 que todavía no está hecho:

- **H9 y H10.** Pasar el juego entero a tú y el prólogo a femenino ("¿Estás loca?", "tan
  tranquila", y el comentario de `prologo-guion.ts`). Cada línea que cambia se queda sin voz hasta
  regenerarla, y eso gasta crédito.
- **T8.** Los átomos de la fusión con los colores de `COLORES_DE_LUZ`.
- **T9.** `mascota-viva` en lugar de `angular-mascot-idea.svg`: está en el reproductor de
  cinemáticas, en cada `escena-NN` y en `manipulable-system`.
- **J3 y J4.** El desafío final, como lo describe el recorrido en "La salida".
- **J6.** La heladería de la colina.

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

- **H3. El nombre** (2026-11-22). La tripulación le dijo siempre "exploradora", y "Angie" es el
  nombre que tomó en Signal Space. Está en el canon.
- **H4. Por qué es una gema** (2026-11-22). Signal Space transforma con el tiempo, no al entrar. Está
  en el canon y en el epílogo del recorrido.
- **H5. El sol** (2026-11-22). El sol de la colina es la anomalía vista desde Signal Space. Está en
  el canon.
- **H9. El género** (2026-11-22). Desde que oyen su voz, le hablan en femenino. Está en el canon;
  falta en el código.
- **H10. El registro** (2026-11-22). Todo el juego habla de tú, sin voseo. Está en el canon, en "Cómo
  hablan"; falta en el código.
- **J3. ¿El final exige resolverlo?** (2026-11-22). Sí, y Angie ayuda más con cada intento.
  [ADR 0028](../adr/0028-el-final-se-resuelve-para-escapar.md).
- **J4. El desafío final concreto** (2026-11-22). El motor de salida, con seis huecos. Está en el
  recorrido, en "La salida".
- **J5. Los desafíos que se repiten** (2026-11-22). Se revisan al rehacer cada etapa. Está en el
  recorrido, en "Los 42 desafíos".
- **J6. El carrito** (2026-11-22). Pasa a ser la heladería de la colina, para después del final.
  Está en el recorrido.
- **J7. La bitácora y volver a ver** (2026-11-22). Cuando vuelva, es el cuaderno de leyes por etapa.
  Está en el recorrido, en "El manual de a bordo".
- **J8. La duración de la apertura** (2026-11-22). La primera interacción, antes de los 60 s. Está
  en los principios del recorrido; hoy son unos 61 s.
- **M1. Las aperturas desparejas** (2026-11-22). Toda etapa abre con su objeto de mundo, y hoy las
  doce cinemáticas ya lo muestran a los 3 s. Está en el recorrido, en "El cuerpo".
- **T1, T2, T3, T4, T6 y T13** (2026-11-22). Cómo se construye la historia nueva: el motor de
  animación, el scope, una etapa por vez, la partida, el gate de prosa y el formato de las
  pantallas. Están en el recorrido, en "Cómo se construye".
- **T8. La fusión del prólogo** (2026-11-22). Los colores de las luces de la colina. Está en el
  recorrido, en "La voz y Angie"; falta en el código.
- **T9. Tres nombres para Angie** (2026-11-22). "Angie" y `mascota-viva` en todos lados. Está en el
  canon, en "Nombres"; falta en el código.
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
