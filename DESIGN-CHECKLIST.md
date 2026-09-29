# DESIGN-CHECKLIST — vista integrada / journey

Checklist ACUMULADO de diseño. Regla: cada defecto visual que se detecta y
resuelve se agrega acá como ítem permanente, y cada revisión verifica TODOS los
ítems, no solo el síntoma más reciente. El porqué: la misma familia de defectos
("parece un modal") sobrevivió a 8 rondas de revisión porque cada ronda
auditaba solo lo último reportado.

## Gramática de modal (la card debe sentirse parte de la escena, no una ventana)

- [ ] Sin scroll anidado dentro de la card/sub-nivel: el scroll es de la
      escena, no de una ventana interna. Excepción escrita: por debajo de 600 px, a una columna, un
      sub-nivel no entra en la altura de un celular y la card scrollea por dentro. Por encima de
      600 px la regla sigue entera.
- [ ] Toda card que scrollea por dentro (la excepción de arriba, o un sub-nivel que todavía no
      entra) avisa "más abajo" mientras queda contenido por ver: el corte seco a mitad de renglón se
      lee como roto. El aviso sigue el scroll de la card (scroll-driven), así que sin scroll no
      aparece. No va con máscara de fundido: una máscara en la card borra la mascota de la pista,
      que es su hija `position: fixed`. Y la pausa de la vida de fondo no lo termina (no se mueve
      solo). Medir el `::after` de `.subbody`: visible con la card arriba si scrollea, apagado si no.
      Y medir DÓNDE cae: el sticky se ancla dentro del padding de la card, así que con `bottom`
      positivo flotaba 50 a 110 px por encima del corte, tapando código, botones y lecturas en 15 de
      27 capturas. Va en el borde real (descuenta `--pad-abajo`), sobre el renglón que igual ya
      está cortado, y su rango de scroll no cuenta el padding, así no anuncia "más abajo" cuando
      abajo solo queda aire. Medirlo con una sonda real que copie su sticky: a ~9 px del borde.
- [ ] Sin backdrop/vignette que oscurezca el fondo detrás de la card.
- [ ] Sin bordes duros de recuadro flotante: continuidad de fondo y color con
      la escena.
- [ ] Componentes embebidos (`createComponent`) sin costura: sin fondo propio
      distinto, sin scroll propio, no deben "parecer un iframe".

## Barra única de navegación (borde izquierdo, morphea conceptos ↔ sub-niveles)

Desde 2026-07-18 la navegación es UNA sola barra vertical pegada al borde
IZQUIERDO (antes: riel de conceptos a la izquierda + ascensor/órbita de
sub-niveles, que se pisaban entre sí y con las instrucciones). El electrón
actual (dot + órbita + sonar) se mantiene CEÑIDO al ancho del riel para no pisar
la espina vertical "Signals" que vive a su derecha.

- [ ] Una SOLA barra visible por vez: en la vista molécula muestra los 12
      conceptos (0-11); al bucear, su cuerpo (ticks + línea) se desvanece y la
      barra de sub-niveles ocupa el mismo eje. Nunca dos barras a la vez.
- [ ] Al bucear, los extremos de la barra de sub-niveles se ABREN hacia los
      bordes (arriba/abajo) — el gesto de "morph" — en vez de aparecer de golpe.
- [ ] Las flechas ▲/▼ (stepper) quedan siempre visibles y FLANQUEAN la barra
      (arriba de la primera parada, abajo de la última), sin pisar el sub-nivel
      1 ni el N.
- [ ] El lado IZQUIERDO queda libre de navegación: solo el título vertical del
      concepto (espina) y la columna de instrucciones. Cero colisiones de la
      barra derecha con las instrucciones.
- [ ] La espina vertical NO se superpone al índice de conceptos: overlap medido
      contra TODAS las paradas del riel, no contra una. En la vista molécula la
      espina va en 0 (su casa es el buceo).
- [ ] El índice es NAVEGABLE, no decorativo (desde 2026-07-24): cada parada es un
      `<button>` que salta a su concepto, con `aria-label`, `aria-current` en el
      actual y foco visible. Queda `inert` cuando el índice no se ve (landing o
      buceado) para no robar tabs ni recibir clicks fantasma.

## Estado en REPOSO de cada parada (lo que se ve cuando el scroll asienta)

Origen: 2026-07-24. En la parada de intro al concepto (`off[c]+1.3`) se veía
FANTASMEADA la card del sub-nivel detrás de la molécula, y la espina vertical
del concepto asomaba por encima del índice. Eran EL MISMO bug: las anclas de
snap se posicionaban como fracción de `TOTAL + 0.2` mientras el alto del track
usa `TOTAL + TRACK_TAIL`, así que el snap descansaba en un `scrollTop` que,
releído como `s`, quedaba inflado (~×1.016) y metía el frame en la banda de
fade de la card. El daño ESCALA con el índice del concepto (~3% de opacidad en
el 0, ~87% en el 8), así que verificar solo el concepto 0 no alcanza.

- [ ] El % de un ancla de snap divide por el MISMO total que el alto del track.
      Si difieren, el estado en reposo NO es el que el motor cree.
- [ ] En la parada de intro al concepto (antes de bucear): la card del sub-nivel
      está en opacidad 0 EXACTA y la espina vertical en 0. Medido leyendo las
      opacidades reales, no a ojo (al 3% el fantasma se ve pero casi no se mide).
- [ ] Verificado en un concepto LEJANO (8-11), no solo en el 0: los defectos de
      drift de scroll escalan con `off[c]`.

## Z-order y geometría

- [ ] Dots/círculos del riel por ENCIMA de los degradados del topbar; ningún
      degradado tapa contenido interactivo.
- [ ] El degradado inferior queda por DEBAJO del contenido, no encima.
- [ ] La barra derecha NO invade la card ni la columna de instrucciones: vive
      en la canaleta del borde derecho.
- [ ] Cero colisiones entre la barra de sub-niveles y sus vecinos (card,
      instrucciones, topbar/título, link "Practicá"): overlap medido con
      `getBoundingClientRect()` contra TODOS los vecinos, no a ojo.
- [ ] Con el sub-nivel asentado no queda nada de la molécula detrás de los controles salvo el átomo
      actual: los átomos anteriores y los enlaces se retiran (`opacidadDeVecinos`) y, del todo
      apagados, se ocultan y los enlaces dejan de fluir. La espiral los deja donde cae sin mirar el
      contenido: el vecino pisaba inputs y botones en 13 sub-niveles y el enlace en 18. Medir cada
      átomo no actual (caja de anillos y núcleo) y cada enlace (la curva muestreada en pantalla)
      contra TODOS los controles, en los 40 sub-niveles a 1920, 1440, 820 y 500 px, y confirmar que
      `#scene` tiene `vecinos-fuera` también en un concepto lejano: la parada no asienta con el
      buceo en 1 exacto (en 7/1 queda cerca de 0.93).

## Composición y chrome

- [ ] Chrome persistente presente tras cualquier reestructuración: botón de
      inicio, riel/barra lateral, topbar (regresión ya ocurrida una vez).
- [ ] Tamaños consistentes entre niveles y sub-niveles.
- [ ] Título de la card en un renglón armónico, no partido en dos renglones
      sueltos.
- [ ] Espacio horizontal aprovechado; sin margen superior sin overlay.
- [ ] El sub-nivel actual se marca con el electrón-ascensor (puck) que se
      DESLIZA de una parada a la siguiente en la barra derecha, sin saltar.
- [ ] Sin overflow: CADA sub-nivel entra en la card a 860px de alto (contenido
      ≤ el `max-height` de la card) sin depender del scroll interno. Verificado
      con `scrollHeight` de la card en los 35 sub-niveles, no a ojo. Ojo con
      demos de lista que crecen por timer (cap explícito) y con demos de varios
      bloques que se apilan en el grid dissolve (agruparlos en un contenedor).
- [ ] Nada del topbar se parte por dentro (el contador nunca queda "1 /" arriba y "3" abajo) y el
      título va entero: en un renglón desde 1200 px, y por debajo en dos pisos (arriba contador y
      título, abajo la pregunta del recorrido y los controles, a la DERECHA: a la izquierda quedaba
      encima de la primera parada del riel y se leía como su viñeta). Por debajo de 400 px cada piso
      sigue en un renglón: el título escala con el ancho y Bitácora y Practicá pasan a íconos
      (pasarlos a dos renglones subía el topbar a 100 px y tapaba la card y el riel). Medido con el
      título más largo (8/2, "toSignal() · toObservable() · untracked()") a 360, 375, 500, 600, 768,
      820, 1001, 1440 y 1920 px,
      y la primera parada del riel contra el TEXTO del topbar que le queda encima. Medirlo sin el
      link "Estudio" (solo existe en desarrollo y además empuja el margen del siguiente link): con
      él la medición da un topbar partido que en producción no pasa. Un control nuevo, angosto,
      pasa a ícono con un blanco de 24px y su etiqueta queda como nombre accesible.

## Color y afordancia (que el clima no tape, que el vacío no confunda)

- [ ] El wash del concepto (`.dive-aura`) IDENTIFICA, no domina: a pleno buceo el
      contenido (chips, código, texto) mantiene contraste contra el fondo teñido.
      Ojo con acumular opacidad alta + `saturate()`: se suman y lavan el contenido.
- [ ] Toda zona grande que ESPERA una interacción para llenarse dice qué esperar
      mientras está vacía. Un área que ocupa media escena sin contenido se lee
      como espacio muerto y el primerizo pasa de largo (caso: el árbol del DOM en
      html-to-tree, que solo crece al clickear). El hint se va con el contenido.
- [ ] Un `<button>` nuevo con estilo PROPIO no queda comido por la regla global
      `.subhost button:not([class*='bg-'])` (0-2-1), que le encaja pastilla
      oscura #3a352d, `border-radius: 999px` y `width: fit-content` a todo botón
      sin clase Tailwind. Caso: las piezas de código de `repair-challenge`
      salieron como manchones oscuros con el código ilegible. Ganarle con
      especificidad desde el CSS del propio átomo (tres clases, p.ej.
      `.rc .rc__pieces .rc__piece`), no con `!important`. Segundo caso: las
      estrellas de `app-rating` (7/2) salían como cinco pastillas oscuras iguales,
      sin leerse el puntaje, y la fila desbordaba su caja hasta pisar la espina.
- [ ] Las reglas que remapean clases de Tailwind por substring (`[class*='bg-gray-50']`) no
      atrapan a sus vecinas de nombre: `bg-gray-500` contiene `bg-gray-50`, y el botón gris
      "multiplier + 1" de 8/2 quedaba con texto blanco sobre transparente. Para un tono exacto,
      palabra entera (`[class~='bg-gray-50']`).
- [ ] Los controles de la barra del selector de clima (sonido, pausa) se leen sobre las DOS
      mitades: fondo casi opaco y sin `backdrop-filter`. Con el fondo al 50% la pastilla que cae
      sobre la mitad clara quedaba gris sobre gris (~2:1). Mirarla en captura a 1440, 820 y 500.

## Operable sin mouse y sin trampas de foco

Origen: review de los niveles 0 y 1 del 2026-07-25. Las 12 cards viven
pre-montadas y el intro se apaga con `opacity`, así que "no se ve" y "no se
puede alcanzar" son dos cosas distintas y hay que chequear las dos.

- [ ] Cero controles invisibles pero tabulables: nada oculto solo con
      `opacity: 0` queda en el tab-order. Lo que se apaga va con `inert` (o
      `visibility: hidden`). Medir contando focusables cuya cadena de ancestros
      tenga opacidad 0, no a ojo.
- [ ] Todo lo que responde al click responde también al teclado, con rol y
      nombre accesible. Un `<g>` de SVG con listener no es un botón: necesita
      `role`, `tabindex`, `aria-label`, handler de Enter/Espacio y anillo de
      foco visible (en SVG el `outline` va sobre el grupo, porque el motor
      escribe `stroke` inline y le ganaría a la regla CSS).
- [ ] Focusable ⇒ hace algo. Nada de blancos muertos con `role="button"` que
      al activarse no producen efecto, ni focusables anidados (contenedor y
      contenido ambos tabulables) que duplican las paradas de tabulación.
- [ ] Las paradas que están ocultas (índice fuera de vista, sub-nivel no
      activo) salen del tab-order mientras no se ven.
- [ ] Abrir por deep-link (`?nivel=X&sub-nivel=Y`) deja el recorrido operable:
      tomar el árbol de accesibilidad y confirmar que topbar, card y riel están
      ahí. Sin elegir clima nadie liberaba el `inert` que pone la landing, y un
      link compartido abría la app entera muerta (review de animaciones,
      2026-09-24).
- [ ] Ningún contenedor del chrome (riel, topbar) atrapa clicks con su caja: solo
      sus controles. Hit-test con `elementFromPoint` sobre cada botón del demo en
      pantalla, a 1440 y a 1920 de ancho: `aside.rail` (312×900, z 6) se comía el
      botón entero de 1/6 a 1440 px.
- [ ] Ninguna regla del recorrido apaga el foco de lo embebido. Los rings de
      Tailwind son `box-shadow`: un `box-shadow: none` genérico sobre la card
      también los borra. Tabular hasta un botón embebido y mirar el anillo.
- [ ] En la landing el topbar está en opacidad 0 y, elegido el clima, ya no es inerte: sus links
      (bitácora, práctica, pausa) van `inert` mientras no se ven, con el mismo umbral que el
      índice. Tabular después de elegir clima: el foco no cae en el topbar.
- [ ] Todo anillo de foco llega a 3:1 contra lo que tiene alrededor. Los acentos claros (ámbar,
      verde) sobre el crema no llegan: el anillo va doble, `var(--focus-ink)` en el `outline` (el
      contraste) y el acento en un `box-shadow` por dentro (la identidad).

## Trabajo de fondo (lo que corre cuando no lo estás mirando)

- [ ] Ningún timer, effect ni fetch de un sub-nivel corre mientras su capítulo
      no está activo. La vista integrada no desmonta el concepto vecino
      (ventana de montaje de ±1): marca `inert` la card que no se ve, así que
      el cleanup por `DestroyRef`/`ngOnDestroy` no se dispara y un
      `setInterval` sigue latiendo. Lo reproduce un salto de rueda desde un
      sub-nivel al concepto vecino: ese sub-nivel queda montado e inerte. El
      guard es `host.closest('[inert]')`, y un contador frenado cuenta los
      ticks que pasaron el guard (`filter` + `scan`), no el índice del
      `interval`: al volver sigue desde donde quedó en vez de cobrar de golpe
      el tiempo inerte (8/2, 2026-09-29). Verificar midiendo (contar logs o
      ticks durante N segundos parado en otro nivel), no leyendo el código.
- [ ] Consola limpia mientras se recorre: un `console.log` didáctico solo
      aparece cuando el usuario está en el sub-nivel que lo enseña.
- [ ] Ningún loop de dibujo (rAF de canvas) corre sin algo que mover: parado en
      pausa, antes de elegir clima o fuera de vista, contar `requestAnimationFrame`
      durante un segundo y esperar cero (review de animaciones, 2026-09-24).
- [ ] Toda animación infinita sobre algo en opacidad 0 queda pausada. Verificar
      con `getComputedStyle(el).animationPlayState`, no leyendo la regla: un
      shorthand `animation` más específico resetea el play-state y le gana.
- [ ] `prefers-reduced-motion` se prueba cambiándolo EN VIVO, no solo al cargar:
      el CSS reacciona solo, el SMIL y los canvas no.
- [ ] La vida de fondo se pausa desde el topbar (WCAG 2.2.2) y la pausa se recuerda
      (`signals-pausa`). Pausar NO es congelar: `animation-play-state: paused` deja una entrada que
      todavía no arrancó en su primer cuadro, invisible (con la pausa puesta la bitácora quedaba
      afuera de la pantalla y el recorrido, inerte detrás). Los loops se frenan con velocidad 0 y lo
      que tiene fin salta a su estado final, también lo que arranca después; prólogo, cinemáticas y
      bitácora no son fondo. Nunca `pause()`/`play()` de la API: le sacan al CSS el control de
      `animation-play-state` (la pestaña oculta deja de congelar) y `play()` revive como animación
      suelta un loop que el CSS ya canceló. Con la pausa puesta: abrir la bitácora, ver una
      cinemática, entrar a un sub-nivel y contar las `getAnimations()` infinitas que siguen
      corriendo (cero). Después: pausar en el nivel 0, bajar al 3, reanudar y contar halos latiendo
      fuera de la parada actual (cero). La vida por timer de un demo (el latido de 3/1) también
      para: lo que apaga reduced-motion lo apaga la pausa. Lo que ES la lección no es vida y sigue
      con la pausa puesta (el cronómetro de 8/2 es el stream convertido a signal): solo se frena
      fuera de vista.

## Legibilidad del contenido embebido

- [ ] Texto que hay que LEER (valores de demo, resultados, aclaraciones) cumple
      contraste AA sobre el wash del nivel: 4.5:1 normal, 3:1 para ≥24px.
      Ojo con el remapeo de `[class*="text-blue-"]`/`text-indigo-` al acento del
      nivel en `.subhost`: una clase que en aislado contrasta bien puede quedar
      en ámbar sobre crema una vez embebida. Medir, no mirar. Vale también para el chrome
      "tenue a propósito": la pregunta del topbar estaba en 2.7:1 (y contestada, en 3.3:1).
      Tenue es relativo al título, no por debajo de AA.
- [ ] Grupos de opciones con estado elegido visible Y anunciado
      (`aria-pressed`), no solo un cambio que hay que adivinar.
- [ ] Errores de entrada avisados: si el demo descarta lo que escribiste, lo
      dice. Nada de fallar en silencio.
- [ ] Bloques de CÓDIGO no se estiran al ancho completo de la card. A ~1100px
      con el texto ocupando un quinto se leen como banners, no como opciones
      clickeables: acotar al ancho del contenido (caso: las piezas de
      `repair-challenge`, capadas a `34rem`).
- [ ] Un enunciado en PRESENTE no sobrevive al cambio de estado que lo
      contradice. Si el texto dice "el log quedó clavado" y el usuario ya
      reparó el sistema, pasa a leerse como reporte histórico (atenuado, con el
      eyebrow en "resuelto"), no como afirmación vigente.

## Vistas y estado

- [ ] Verificar la vista CERCANA (sub-nivel) y la ALEJADA (molécula completa,
      sin átomos amontonados); un cambio puede romper solo una de las dos.
- [ ] URL sync bidireccional: navegar actualiza la URL Y pegar una URL
      restaura el estado (nivel y sub-nivel). Testear ambas direcciones.
- [ ] Probar en la ruta ancha Y en el embed angosto: un fix de layout
      (`whitespace-nowrap`, etc.) debe verificarse en los dos contextos.
- [ ] Ningún bloque de código se aprieta por debajo de ~27 columnas: por debajo de 1200 px la fila
      demo|código envuelve si al código no le quedan 15rem, y por debajo de 600 px todo va en una
      columna. La base del código es 15rem y no `auto`: con `auto` la fila envuelve apenas un
      renglón largo no entra y baja el código en sub-niveles que andaban bien (a 820 px la card
      pasaba a scrollear en 33/40). El demo entra al cálculo con 12rem o su mínimo real: con base 0,
      un demo `min-w-0` (el árbol de 0/1) contaba como nada y quedaba en 60 px al lado del código.
      Cortando por palabra, el ancho mínimo del código es su token más largo: por debajo de 600 px
      va con `min-width: 0` o se sale de la card. `overflow-wrap: anywhere` en un flex-item colapsa su ancho mínimo
      a un carácter: en angosto el código corta por palabra. La continuación de un renglón largo se
      sangra desde la sangría propia del renglón (`--sangria`, que pone app-code), no desde una fija,
      y la sangría va en espacios duros: con espacios comunes el navegador corta justo después de
      ellos y deja un renglón vacío arriba del código. Todo código embebido con `overflow-x: auto`
      (el `<pre>` de 0/4, el `<code>` de los botones de 0/2) envuelve en vez de scrollear: su scroll
      horizontal es invisible (el recorrido oculta las barras) y la línea clave se cortaba sin que
      nada lo avisara. El código con renglones INTERACTIVOS (cada token es un blanco, el árbol de
      0/1) no envuelve a propósito: su ancho mínimo es el renglón entero y la fila lo baja entero.
      Medir `scrollWidth > clientWidth` de todo lo que tenga overflow dentro de la card, no solo
      contra la card (los `sr-only` son falsos positivos).
      Medir el ancho del renglón de código en los 40 sub-niveles a 1001, 820, 600, 500 y 375 px, y
      el `scrollHeight` de la card antes y después (un arreglo de ancho no puede empujar
      sub-niveles fuera de la pantalla: correr el contenido para despejar la espina sacaba el
      desafío de 8/2 de la vista a 820 px).
- [ ] Por debajo de 600 px nada embebido es más ancho que la card: la card recorta, así que lo que
      se sale queda cortado ("multiplie", "(TOOBSERVABL") y ni el documento ni `overflowX` lo ven.
      Cajas de ancho fijo de Tailwind (`w-80` es 320 px) y filas flex que no envolvían. Medir el
      `getBoundingClientRect` de cada elemento contra el de la card (la mascota de la pista flota
      fija a propósito y no cuenta).
- [ ] Ninguna columna de la grilla queda reservada para algo que ya no vive ahí. La de
      instrucciones (14rem más el hueco) quedó vacía cuando la pista de la mascota pasó a flotar
      fija, y seguía ocupando un tercio del ancho a 820 px: por debajo de 1200 px la grilla va en
      una sola columna. En escritorio sigue reservada y hace saltar la x del contenido entre
      sub-niveles (130 px contra 357 a 381 a 1440): decisión de diseño pendiente.

## Cierre del sub-nivel (el desafío manipulable, los 37)

Los 37 sub-niveles terminan con el mismo gesto: un bloque de código con una
parte que se mueve, las lecturas del sistema y el verbo que lo acciona. Con esa
cantidad, la uniformidad no se sostiene con buena voluntad: la forma está fijada
en `SHAPE` (`libs/manipulable-challenge.ts`) y la verifica `malformed()` en cada
posición de la perilla. Estos ítems son los defectos que YA aparecieron.

- [ ] El subrayado de la perilla marca el TOKEN, no el ancho del bloque: a
      ancho completo se lee como una línea divisoria debajo del código, no como
      algo tocable.
- [ ] La sangría va aparte del cuerpo del renglón, y el texto por binding de
      propiedad: con interpolación entre etiquetas el formateador mueve los
      saltos de línea y con `white-space: pre` se ven como sangría fantasma.
- [ ] Un renglón vacío del bloque conserva su alto: `display:flex` lo colapsa a
      cero y el mismo desafío se ve con distinto aire que el de al lado.
- [ ] `role="status"` va en un ENVOLTORIO, nunca en el `<ul>` de las lecturas:
      puesto en la lista le pisa el `role=list` y sus `<li>` quedan huérfanos
      (lo detecta axe-core en los specs).
- [ ] Una línea que no existe en esa variante NO es una línea apagada: se saca
      del arreglo, no se marca `dead`. Si no, quedan cierres muertos y renglones
      vacíos de relleno.
- [ ] El bloque no desborda: máximo `SHAPE.maxCodeCols` columnas. Medir el
      `scrollWidth` del bloque contra su `clientWidth`, no el de cada renglón
      (son contenedores flex y siempre reportan el ancho del padre).

- [ ] Una corrida sin evidencia suficiente se pinta NEUTRA, nunca roja: el umbral de acciones sale
      de la solución de cada desafío (`accionesParaSaber`). Con el código correcto y una sola
      vuelta, 3/3 mostraba "1 vivo, 1 esperado" en rojo.
- [ ] Al fallar (código roto con evidencia) la mascota dice "Esa no era. Mirá la lectura." y nada
      más; al acertar, silencio. La imagen de la pista pelea contra `.card--dissolve .subhost img`
      (que agranda toda imagen embebida): selector de tres clases.
- [ ] Los sub-niveles de ancho completo no quedan debajo de la espina vertical: medido a 1280,
      1440 y 1920 px con `getBoundingClientRect` (espina contra eyebrow y bloque de código). Entre
      601 y 1199 px la espina se achica y esos bloques se corren solo lo que falte; por debajo de
      600 la espina se guarda. Despejarla angostando el contenido es la solución cara: correr la
      card entera apretaba todos los demos, y correr los bloques lo que ocupaba la espina grande
      sacó de la vista el desafío de 8/2 a 820 px. Medido contra controles Y texto a 1001, 820 y
      768 px, con el `scrollHeight` de la card antes y después.

## Lo que la app HACE, no lo que dice

- [ ] Ningún contador de pendientes que apure ("te faltan N") en un recorrido
      que se presenta como exploración: nombrar la deuda ("N sin establecer"),
      y contar lo que se entendió, no hasta dónde se scrolleó.
- [ ] Ningún panel de lista abre como un rectángulo vacío: sin estado vacío se
      lee como espacio muerto o como algo roto.
- [ ] Presupuesto de prosa por pantalla (`npm run gate:prosa`): lo que hoy es
      párrafo tiene que poder verse en la demo. Si el texto explica lo que el
      dibujo ya muestra, sobra el texto.
- [ ] La rueda cruza de un concepto al siguiente, en los dos sentidos. El tramo de cámara
      entre conceptos mide 1.8 pantallas, y con snap obligatorio un gesto corto terminaba más
      cerca de la parada de partida: el navegador lo devolvía y con el mouse no se podía pasar de
      capítulo. El motor rescata ese caso (`rueda-rescate.ts`) sin secuestrar la rueda. Probar
      con rueda real por CDP: un golpe de 500 px y muescas de 100 px separadas, del átomo 9 hacia
      arriba y de 8/4 hacia abajo (una parada por muesca), y una rueda girada a ritmo parejo
      (avanza siempre, sin temblar).

## Overlays que tapan el recorrido (prólogo, modales a pantalla completa)

Del design-review del prólogo (2026-07-26): tres de los defectos más graves no
eran de dibujo sino de que el recorrido seguía vivo por debajo del velo.

- [ ] Mientras un overlay cubre la pantalla, el recorrido de atrás va `inert`.
      No alcanza con taparlo: el chrome invisible (`topbar`, `rail`, con opacidad
      0 pero `pointer-events` activos) se come los clicks del overlay, y en
      tablet llegó a tapar el botón para entrar.
- [ ] Un handler de teclado colgado del overlay NO se dispara: el foco nunca
      está ahí. Va en `document`, y filtrando por overlay visible. Síntoma: la
      tecla "no hace nada" y encima scrollea lo de atrás.
- [ ] Mostrar y terminar no pueden ocurrir en el mismo turno. Si el overlay
      puede autocancelarse (movimiento reducido, pantalla angosta, falta de una
      capacidad), destapar después de decidir: si no, queda el velo puesto sobre
      una escena terminada, con los controles muertos y la app bloqueada.
- [ ] Todo estado visual que el motor togglea por clase tiene que existir en el
      CSS. El motor marcaba `claro` y `oculto` sobre el botón de saltar y
      ninguna de las dos estaba escrita: el HUD quedaba en 1,2:1 sobre el fondo
      claro del final.
- [ ] Los colores que cambian con el estado van por CUSTOM PROPERTIES, no por
      reglas que se pisen. Con una regla por estado la cascada decide, y decide
      mal; con variables hay una sola regla por propiedad y el estado solo
      cambia el valor.
- [ ] Nada de `!important` en un control: le gana también a su propio `:hover` y
      lo deja sin ninguna señal al pasarle el mouse.
- [ ] El overlay se queda con las teclas y gestos de desplazamiento (flechas,
      AvPág, Inicio/Fin, rueda, arrastre) y el motor ignora eventos ya
      consumidos (`defaultPrevented`). El `inert` de los hermanos no alcanza al
      scroller que los contiene: probar con una flecha abajo REAL que la
      cinemática siga en pantalla.
- [ ] Con la pestaña oculta el overlay se pausa (audio incluido) y al volver se
      reanuda solo si la pausa no la puso la persona.
- [ ] Si el texto es el contenido de un beat, verificar que no se pise consigo
      mismo. Las etiquetas de operadores salían de a cinco y se leían
      "mergeMapetryrror": ilegible equivale a no haberlo dibujado.

## Cinemáticas de capítulo (que se sienta un juego, no un video)

Lista escrita de lo que "que se sienta como la cinemática de un RPG" significa acá. Cada ítem es
verificable con `/cine/<n>?cuadro=<beat>` (fotograma congelado) o `/cine/<n>` (reproducción).

- [ ] Se sabe QUIÉN habla sin leer: retrato, nombre y timbre de voz por personaje. El prólogo no
      lo mostraba y era la fricción número uno de un jugador nuevo.
- [ ] Una línea en pantalla por vez y nunca más de ocho palabras (lo verifica
      `cinematica-guion.spec.ts`). El texto va en la caja de diálogo, NUNCA dentro de la escena.
- [ ] Cada beat cambia algo visible que la línea que lo dispara nombra. Un beat que no se ve es
      un beat que no existe; uno que no se corresponde con la línea es ruido.
- [ ] Coreografía: primero el entorno, después el héroe, después los personajes, al final el
      texto. La tarjeta del capítulo y el héroe se turnan el centro, no lo comparten.
- [ ] Entradas con resorte (`--resorte-*`), salidas más cortas que las entradas. Nada salta.
- [ ] Las entradas son TRANSICIONES entre estados, así con movimiento reducido el fotograma final
      es el mismo (mismo destino, sin viaje). `?cuadro=fin` tiene que verse completo.
- [ ] Loops solo en el foco de la escena y pocos (dosis de un tercio). Si todo se mueve, nada
      llama la atención.
- [ ] Performance: cero `requestAnimationFrame` y cero JS de animación (el reloj solo cambia
      clases con `setTimeout`); sin `filter`, `backdrop-filter` ni `mix-blend-mode`; solo se
      animan `transform`, `opacity`, `stroke-dashoffset`, `offset-distance` y `clip-path`; lo que
      se mueve es HTML (lo compone la GPU), lo que se dibuja es SVG.
- [ ] Con la pestaña oculta la cinemática se congela (reloj, animaciones y voces) y al volver
      sigue donde estaba.
- [ ] Saltable siempre (Esc o "Saltar") y avanzable como un RPG (Enter, espacio, → o el botón).
      Mientras corre, el recorrido de atrás no recibe teclas, rueda ni foco.
- [ ] Se juega UNA vez por partida al llegar a la parada del capítulo; un deep-link a un
      sub-nivel no se interrumpe; se vuelve a ver desde la bitácora.
- [ ] Como se abre sola, la pausa de la vida de fondo también la alcanza: con la pausa puesta
      se cuenta en modo quieto (el de reduced-motion), el diálogo sigue y hay cero animaciones
      corriendo en la escena.
- [ ] Las escenas se cargan diferidas (un chunk por capítulo): el bundle inicial no paga por
      trece escenas.
- [ ] Ningún actor pisa a otro ni sale del lienzo: medido con `getBoundingClientRect` en
      `?cuadro=fin` contra TODOS los `.k-actor`, no contra uno.
- [ ] El final se personaliza con la partida: solo se encienden los capítulos establecidos
      (clases `e-<n>`), la deuda queda punteada y visible.

## Sonido (tiene que andar en cualquier PC)

- [ ] Un solo `AudioContext` en toda la app (`libs/sonido.ts`), creado recién con un gesto.
- [ ] Nada depende de que suene: sin Web Audio, con el contexto cerrado o con el almacenamiento
      bloqueado, todo sigue en silencio y sin errores en la consola.
- [ ] Nada de `speechSynthesis`: las voces de los personajes son blips sintetizados. El ritmo de
      un diálogo no puede cambiar según qué voces tenga instaladas la máquina.
- [ ] Un solo interruptor de sonido: silenciar en la intro, el prólogo o una cinemática silencia
      en todos (preferencia `signals-sonido`).
- [ ] Silencio al acertar: ningún sonido de "¡bien!" al establecer un sistema.
