# Pendientes: lo que falta cerrar

Todo lo que la historia continua todavía no decidió, cada punto con una propuesta. El canon está en
el [README](./README.md) y el recorrido, en [recorrido](./recorrido.md).

Cuando un punto se cierra, la decisión pasa al canon o al recorrido, y acá queda la línea con la
fecha y adónde fue. Los ids (H1, J1…) sirven para nombrarlos en una sesión ("cerramos H3").

## Historia

- **H12. Cómo se cuenta la vuelta a casa.** Desde H2 (2026-11-22) el final no se queda en Signal
  Space: vuelven a casa los cuatro y migran todo de a poco. Falta decidir cómo se ve. **Propuesta:**
  el epílogo arranca en la colina (la despedida, el helado y las papas fritas) y cierra en el
  espacio Zone.js, con la primera migración en la pantalla de la nave. "Este mundo también es casa."
  (`c12-casa`) queda: no se quedan en Signal Space, se lo llevan.

## Decidido, falta en el código

Lo decidido el 2026-11-22 que todavía no está hecho:

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

- **H2. La familia** (2026-11-22). La familia es la tripulación completa, con la exploradora, y al
  final vuelven a casa y migran todo de a poco, como el equipo de Angular con signals. Está en el
  canon y en el epílogo del recorrido; cómo se cuenta la vuelta quedó como H12.
- **H8. El guion de la revelación** (2026-11-22). La versión B: de tú, y con "¿Cuánto tiempo?" y "Lo
  suficiente para dejar de apurarlos.". Está en el recorrido, en "La revelación", y en el juego, con
  voz.
- **J2. Escribir el operador** (2026-11-22). No se suma: el hueco se completa tocando.
- **T7. Cómo suenan Angie y la exploradora** (2026-11-22). La exploradora habla con la voz de Angie,
  rápida e impaciente (`scripts/voces.json`). Está en el canon, en "Pistas sembradas".
- **T10. La foto del README** (2026-11-22). Se regenera con `node docs/preview/capturar.mjs`, con
  el servidor local corriendo.
- **H9 y H10. Tú y femenino** (2026-11-22). El juego entero habla de tú, y en el prólogo el capitán
  le dice "¿Estás loca?" y "tan tranquila". Las 18 líneas que cambiaron tienen voz nueva.
- **T8. Los colores de la fusión** (2026-11-22). Las bolas y los átomos del choque usan
  `COLORES_DE_LUZ`, los de la luz de la colina.
- **T9. Angie viva en todos lados** (2026-11-22). `mascota-viva` reemplaza a
  `angular-mascot-idea.svg` en las cinemáticas, el retrato del diálogo, la pista del desafío y la
  intro de Tusi.
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
