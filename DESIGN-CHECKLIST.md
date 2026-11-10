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

- [ ] Una SOLA barra visible por vez: en la vista molécula muestra los 11
      capítulos (1-11); al bucear, su cuerpo (ticks + línea) se desvanece y la
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
- [ ] Y el átomo actual, con el sub-nivel asentado, queda de fondo: su núcleo pasa a fantasma
      (0.3) porque el disco sólido se veía a través de las cajas vacías del demo ("Todavía no
      corrió nada" en 3/3). Mientras buceás sigue entero, y anillos y halo siguen respirando: la
      card sigue parada sobre el átomo.

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
      con `scrollHeight` de la card en los 40 sub-niveles, no a ojo. Ojo con
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
      y la primera parada del riel contra el TEXTO del topbar que le queda encima. Un control nuevo, angosto,
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
      palabra entera (`[class~='bg-gray-50']`). Y un remapeo pensado para fondo claro no aplica
      adentro de una caja oscura: el ink de los grises dejaba "CLICKS" de 7/1 a 1.5:1 sobre
      `bg-gray-800` (ahí vuelve el gris de Tailwind con `revert-layer`).
- [ ] La armonización de `.subhost` también alcanza a lo que el sub-nivel crea DESPUÉS de montado
      (un `@if` que abre un click, una fila nueva): el motor lo estampa con un vigía
      (`estampado-tardio.ts`). Sin eso el tercer "Valor:" de 3/1 salía con el gris crudo de
      Tailwind y "Pionera…" de 6/1 a 3:1. Medir clickeando los botones de cada demo y contando
      los elementos de la card sin el atributo de encapsulación: cero.
- [ ] Los controles de la barra de la pantalla de inicio (sonido, pausa) se leen sobre el cielo y
      sobre el pasto: fondo casi opaco y sin `backdrop-filter`. Con el fondo al 50% la pastilla
      quedaba gris sobre gris (~2:1). Mirarla en captura a 1440, 820 y 500.

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
      ahí. Sin tocar Entrar nadie liberaba el `inert` que pone la landing, y un
      link compartido abría la app entera muerta (review de animaciones,
      2026-09-24).
- [ ] Ningún contenedor del chrome (riel, topbar) atrapa clicks con su caja: solo
      sus controles. Hit-test con `elementFromPoint` sobre cada botón del demo en
      pantalla, a 1440 y a 1920 de ancho: `aside.rail` (312×900, z 6) se comía el
      botón entero de 1/6 a 1440 px.
- [ ] Ninguna regla del recorrido apaga el foco de lo embebido. Los rings de
      Tailwind son `box-shadow`: un `box-shadow: none` genérico sobre la card
      también los borra. Tabular hasta un botón embebido y mirar el anillo.
- [ ] En la landing el topbar está en opacidad 0 y, tocado Entrar, ya no es inerte: sus links
      (bitácora, práctica, pausa) van `inert` mientras no se ven, con el mismo umbral que el
      índice. Tabular después de entrar: el foco no cae en el topbar.
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
- [ ] Lo que tapa la intro no se pinta: con la intro entera encima, `svg.mol` y `#content` van
      en `visibility: hidden` y el SMIL de la molécula en pausa, y vuelven apenas la intro empieza
      a irse. Defecto resuelto (2026-11-10): debajo de la colina, los electrones y las Angie de las
      cards obligaban a rasterizar de nuevo, en cada cuadro, una capa del tamaño de la pantalla
      (~2000 tiles en 2,5 s; ahora ~300). Verificar contando `RasterTask` por capa en un trace de
      `disabled-by-default-cc.debug` con la colina quieta. (2026-11-10) Lo mismo con la landing
      de Tusi: mientras la colina la tapa (`.tusi__overlay` sin `.gone`), su canvas, título y HUD
      van en `visibility: hidden`. Seguían en capas propias, ~30 MB de memoria de video a 3440 px
      que le faltaban al zoom desde el ojo.
- [ ] Consola limpia mientras se recorre: un `console.log` didáctico solo
      aparece cuando el usuario está en el sub-nivel que lo enseña.
- [ ] Ningún loop de dibujo (rAF de canvas) corre sin algo que mover: parado en
      pausa, antes de entrar o fuera de vista, contar `requestAnimationFrame`
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
      Tenue es relativo al título, no por debajo de AA. Con la card disuelta el fondo es la
      ESCENA, no el papel: medir contra el píxel real (#c3bdb1 en el peor caso). Los rótulos del
      desafío ("Desafío · tocá el código", "desfasado") daban 4.7:1 contra el token y 2 a 3.9:1
      contra la escena; el borde del verbo del desafío, 1.1:1.
- [ ] Gate de contraste sobre el píxel compuesto: en los 40 sub-niveles a 1440 y 375, cada texto
      de la card activa contra la escena real, capturando con el texto y sin él (texto
      transparente, animaciones pausadas): fondo = mediana sin texto, texto = el píxel que más se
      separa (p97). Pasa con 0 textos por debajo de 3:1; lo que queda entre 3 y 4.5 es deuda de
      AA anotada. Un rectángulo sin tinta (el espacio del corte de renglón) no se mide, y nada se
      captura con el overlay de error del dev server a la vista: un error de compilación a mitad
      de un barrido tapó 2/1 y 2/2 con un panel negro. Las lecturas teñidas (contadores, el valor
      elegido, "sí"/"no") van con la TINTA del acento (`--tinta`, el mismo tono oscurecido), no
      con el acento: el acento claro sobre una escena de su mismo tono daba 1.4-2:1 ("Ground" de
      5/1). Un chip con fondo propio (`bg-*-100`) se queda con su color, y adentro de una caja
      oscura va el acento claro. Lo apagado a propósito (pestaña no elegida, botón deshabilitado,
      bandera apagada) se apaga sin bajar de 3:1: `opacity` 0.75 y 0.65, no 0.5 y 0.4.
      Se mide también DESPUÉS de manejar cada demo (clickear sus botones y los del desafío): en
      reposo no aparecen el resaltado de 7/3 (blanco sobre ámbar, 2.2:1), la línea vieja del
      desafío (opacity 0.36, 1.8:1) ni el "Leyendo…" de 0/1. No cuenta lo que la card scrolleó
      debajo del topbar. Y una tinta no se confunde con un significado: la de effect iba casi del
      rojo del error y un "(vacío)" neutro se leía como error; va hacia ladrillo, con menos croma.
- [ ] Texto de un SVG que escala con el ancho: medir su tamaño renderizado, no solo su color.
      El diagrama de 0/3 (viewBox de 1000) a 375 px dejaba sus rótulos en 4 px, y ningún color
      los hacía legibles. Si el SVG no entra, se cambia de forma, no de tamaño: por debajo de 720
      px de CONTENEDOR (container query, no media query: embebido, cada ancho de pantalla le deja
      otro ancho) 0/3 muestra el mismo pipeline en vertical, con los rótulos en HTML. Medir el
      tamaño REAL del rótulo más chico en los dos lados del corte (11 px o más): en el SVG es
      `font-size` × ancho renderizado / viewBox, no el alto de su caja (que da de más). Y el alto
      que suma la versión vertical: con filas de 2.6rem, a 768 px la card pasaba a scrollear. La
      respuesta del demo (la palabra del costo) va al lado del vertical y no abajo, donde en un
      teléfono bajo quedaba fuera de la vista; y el vertical se vuelve a dibujar al cambiar, como
      el SVG: si el angosto pierde el movimiento, perdió lo que enseña. Que la animación exista
      (`getAnimations()`) no prueba que interpole: pausarla, adelantarla a mano y leer el valor a
      mitad de camino. El arco declaraba solo `from { clip-path: inset(…) }`, terminaba en `none`
      (que no interpola con `inset()`) y aparecía de golpe.
- [ ] Cada ESTADO de un demo se mide, no solo el de arranque: 0/3 arranca en "caro", y las
      palabras "barato" y "medio" (2.6-2.9:1) y los rótulos salteados (1.6:1) solo aparecen al
      elegir otro cambio.
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
- [ ] Retomar al recargar (ADR 0005), probado con input real: con un punto del prólogo, aviso →
      colina → entrar arranca en esa línea; con un lugar del recorrido, abre ahí sin pasar por la
      colina; con el prólogo pasado, entrar va a la construcción. La landing del arranque no pisa el
      punto del prólogo: la vista la reporta antes de que se entre.
- [ ] Un bucle que avanza un índice no lo hace adentro de una llamada con `?.`: sin quien escuche,
      el argumento no se evalúa y el bucle no termina. Pasó con `alPasarPunto` y colgaba el prólogo
      abierto desde la bitácora (y a Karma, que se desconectaba sin nombrar el spec).
- [ ] El HUD del prólogo son íconos de 44 px (pausa, sonido, pantalla completa; a la derecha, empezar
      de cero) con su nombre en `aria-label` y `title`, que cambia con el estado. No hay "Saltar
      intro" ni "Velocidad": el prólogo es el comienzo de la historia, no una intro que se saltea.
- [ ] Con el manual abierto en el prólogo, la fila de arriba es solo del HUD (pausa, sonido,
      pantalla completa, empezar de cero), por encima de la pantalla del libro. El libro, sus marcas
      y "1 de 5" van debajo del título de la ley, adentro de la página: en la fila del HUD se
      chocaban con los íconos.
- [ ] "Empezar de cero" está en la barra, en el HUD del prólogo y en la colina, y pide un segundo
      toque que caduca. Su globo en la colina es corto: el largo tapaba el título a 1024×768, y el
      del "¿seguro?" se ve sin apuntar. Borrar recarga SIN la query.
- [ ] El capítulo es un nombre, no una posición (ADR 0006): `?nivel=`, la cinemática, el número del
      riel y la bitácora usan `CAPITULO_DE_CONCEPTO`; la partida y el motor, la posición. Signals es
      el capítulo 1 en la posición 0. `?nivel=0` se ignora y manda lo guardado. Un cambio que
      mezcla los dos abre la cinemática o el link de al lado.
- [ ] Los specs que montan la vista limpian la partida antes y después: la vista guarda el punto
      apenas el recorrido se mueve, y cada test le dejaba su lugar al siguiente.
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
      ellos y deja un renglón vacío arriba del código. El texto del renglón va por binding, nunca
      interpolado entre etiquetas (el espacio del template se volvía un espacio común delante de
      la sangría), y con puntos de corte (`<wbr>` después de `.`, `(` y `=`, en
      `libs/cortes-de-codigo.ts`): sin ellos se partía a mitad de un identificador
      ("textCont|ent", "'#|count'").
      Un identificador de 24 letras o más (el `provideZoneChangeDetection()` de 11/1) no entra
      entero en la columna angosta y se partía igual: ese se corta en las jorobas del camelCase.
      Medirlo con un `Range` carácter por carácter en los 40 sub-niveles: ningún salto de renglón
      cae entre dos caracteres de un mismo token, salvo en una joroba.
      Todo código embebido con `overflow-x: auto`
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
      fija a propósito y no cuenta). Una fila que envuelve separa con `gap`, no con `space-x-*`:
      el margen del segundo botón lo dejaba corrido 16 px en su renglón nuevo (3/2 y 3/3).
- [ ] Ninguna columna de la grilla queda reservada para algo que ya no vive ahí. La de
      instrucciones (14rem más el hueco) quedó vacía cuando la pista de la mascota pasó a flotar
      fija, y seguía ocupando un tercio del ancho a 820 px y haciendo saltar la x del contenido
      entre sub-niveles en escritorio (130 px contra 357 a 381 a 1440). La grilla va en una sola
      columna en todos los anchos y todos los sub-niveles despejan la espina igual. Medir la x donde
      arranca el contenido en los 40: tiene que ser la misma. Y no alcanza con el contenedor: se
      mide lo VISIBLE. El `justify-around` de la fila demo|código repartía el sobrante y el demo
      arrancaba 100-170 px a la derecha del desafío en 29 de 40 (dos ejes en una columna). La
      primera cosa visible del demo arranca en el eje del desafío; solo se aparta lo que va
      centrado adentro de su propio widget (hasta ~50 px, el texto centrado de 7/1). Un contenedor
      desvanecido (borde transparente) no cuenta como visible al medir, y su padding tampoco corre
      el contenido: `.profile-container` de 2/1 lo metía 20-40 px adentro.

## Lo que se toca: resortes, circuito y golpes

- [ ] Lo que responde al puntero son muelles de `libs/muelle.ts` en UN reloj compartido. Con todo
      quieto, cero `requestAnimationFrame`: se cuenta en reposo y otra vez después de asentarse.
- [ ] Un toque suma velocidad, no fija una pose: doce clics seguidos terminan en
      `translate(0, 0) rotate(0) scale(1, 1)`, nada queda a medio camino.
- [ ] Apretar y arrastrar estira y no selecciona texto (`user-select: none` y `getSelection()` vacío);
      soltar no dispara el click del botón que se arrastró.
- [ ] Todo golpe pasa por el evento `impacto-vivo`: el del fondo, el de un nodo y el aterrizaje de la
      mascota sacuden lo mismo. La cámara del motor sigue siendo la única dueña del `transform` de la
      escena: la sacudida es un grupo propio.
- [ ] `app-circuito` cuenta la verdad del grafo: sus valores salen de signals reales del demo. Un pulso
      viaja solo por un enlace vivo y el consumidor reacciona cuando llega; un enlace `vivo: false` se
      ve suelto y no lleva nada. Escribir el mismo valor no manda pulso; leer tampoco.
- [ ] Un nodo con `accion` es un `<button>` con nombre accesible, y anda con Enter. Sin `accion` no es
      focusable.
- [ ] Un nodo se mide con `offset*`, no con `getBoundingClientRect`: el warp del sub-nivel lo distorsiona.
- [ ] Un computed de demo no se lee para mostrarlo si el sub-nivel enseña que es perezoso: la pantalla
      toma la cuenta de corridas recién al leer.
- [ ] La card de `.card` no scrollea a 860 px con el demo USADO, no solo al abrirlo: los historiales
      tienen tope, y dos paneles van en un renglón.
- [ ] Una regla de la armonización pesa más de lo que parece: las de `integrada-vista` llevan el
      atributo de encapsulación en cada parte. Para ganarle se mira la lista real de reglas que
      aplican, no se adivina.
- [ ] El click en el fondo se prueba con input real y contando `impacto-vivo`. `closest()` sube hasta
      la raíz: un `[tabindex]` en la lista de "lo interactivo" atrapaba a `#main-content`
      (`tabindex="-1"`) y el fondo entero quedó muerto, sin que nada fallara.
- [ ] Nada que el motor apague por `inert` puede vivir en un elemento que la intro o el prólogo también
      liberan: esos destapan a todos los hermanos. Va un nivel adentro. Se comprueba con Tab a 375 px,
      con el prólogo corriendo.
- [ ] Un identificador en un nodo no se parte (`WritableSi|gnal`): la columna mide lo que mide su nodo.
      Y el demo no baja de 19rem al lado del código: se barre de 640 a 1001 px, no solo en los extremos.
- [ ] Un nodo que no es redondo no gira su órbita: como elipse rígida le pisa el texto y al vecino.
- [ ] Un rebote no cambia ningún estado, así que su palabra es la información: tiene región viva para el
      lector de pantalla y, con movimiento reducido, aparece sin moverse.
- [ ] Lo vivo de una card pre-montada o apagada (`[inert]`) queda en pausa: órbitas y respiración de la
      mascota no suman animaciones infinitas sobre lo que no se ve.
- [ ] Agrandar la mascota del mapa corre el globo a la izquierda, contra el nombre de los átomos de
      abajo. Se mide texto contra texto en las 12 paradas, a 1440×860 y 1280×720.

## Cierre del sub-nivel (el desafío manipulable, los 40)

Los 40 sub-niveles terminan con el mismo gesto: un bloque de código con una
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

## Pantalla de inicio (Angie en la colina)

Origen: 2026-11-08, cuando el selector de modo noche/día pasó a ser una sola escena de día que al
entrar desarma a Angie en luz y se hace noche, la costura con el prólogo.

- [ ] Angie pisa la cima en todos los anchos: el paisaje se ancla abajo (`xMidYMax slice`) y ella
      se ubica con la misma unidad (`--u`, contra el contenedor). Mirar los pies sobre el pasto en
      1920, 1440, 1280, 820, 500 y 375, y medir con `getBoundingClientRect` sol, kicker, título,
      Entrar, Angie y barra de abajo entre sí y contra el borde: cero solapes y nada afuera. El
      átomo-sol pisaba "Signals" a 1024 px; en vertical va a la esquina, más chico, y el texto baja.
- [ ] Los controles de la construcción (sonido, pausa, velocidad, ayuda) viven debajo de la
      pantalla de inicio en el mismo `.tusi`: van `inert` hasta que arranca la construcción. Antes
      de entrar, Tab pasaba por cinco botones tapados. Contar los tabulables: saltar, Entrar y los
      dos interruptores, nada más.
- [ ] La noche cae en dos tiempos, como cae de verdad: primero un atardecer dorado y rosado, después
      todo se apaga hacia el azul con la colina como silueta, y las estrellas se prenden de a una.
      Ni un fundido parejo de negro (pasaba por un gris sucio) ni una cortina que baja (dejaba una
      franja gris, como niebla, y la colina desaparecía de golpe): dos capas que multiplican, que
      oscurecen sin lavar. El negro del prólogo entra recién detrás del destello final. Se revisa
      grabando la salida cuadro a cuadro (input real por CDP), no con capturas sueltas del panel,
      que no alcanzan la animación a mitad de camino.
- [ ] El desarme escala con Angie: con un salto fijo en píxeles, en un celular (donde ocupa casi
      todo el ancho) las piezas llegaban al borde. Grabarlo a 1280 y a 390.
- [ ] Lo que la salida crea a mano (las luces) lleva el atributo de encapsulación del componente:
      sin él el CSS no lo alcanza.
- [ ] Con movimiento reducido Entrar pasa directo, sin desarme ni luces, y en la escena no queda
      ninguna animación infinita.
- [ ] El chrome del recorrido (topbar, riel) no asoma sobre la landing: va por encima (z 6 contra 5) y su fundido arrancaba en s = 0.03, así que un toque de rueda dejaba "Bitácora" y "Tu
      recorrido" flotando sobre la colina. Rueda real de una muesca: topbar y riel en 0 con la
      intro en 1 (`chromeVisible`).
- [ ] La despedida es el foco: las piezas se separan lejos (al menos 0.3 del ancho de Angie) y
      quedan suspendidas un momento; la noche tarda ~3 s y las luces viajan al sol, que late con
      cada una y se apaga con el destello. Con un segundo de noche y saltos cortos se veía todo
      pegado y apurado. Se revisa con capturas encadenadas tras un click real.
- [ ] Cada pieza se CONVIERTE en luz, no se cambia por una: se carga de brillo, se condensa en un
      núcleo que se enciende en su centro, el núcleo flota un instante y recién al arrancar le
      crece la estela. Si la pieza se apagaba y al lado aparecía una estela ya hecha, se leían como
      dos cosas distintas. Las luces que esperan turno van con `fill: 'both'`: con `forwards` se
      veían enteras, sin girar, como rayas colgando de las piezas.
- [ ] Al desarmarse no queda nada en el piso: la sombra de contacto no es una pieza y quedaba en el
      pasto como una mancha oscura durante toda la noche. Se apaga cuando las piezas despegan.
- [ ] Entrar es un objeto de la escena, no un botón encima: la lamparita de Angie (un `<button>`
      transparente sobre el dibujo, con nombre "Entrar") y abajo solo el llamado, que es su
      `<label>` (el texto de hoy está en el ítem siguiente). Una píldora oscura bajo el título se
      leía como un hueco y una magenta seguía siendo una caja. El halo de la idea va DETRÁS del
      dibujo: delante, en `screen` sobre el cielo claro, no se notaba. Medir el llamado en un
      renglón a 375 px y sin tocar los pies de Angie ni los interruptores.
- [ ] Se entra tocando en cualquier lugar de la escena, no solo la lamparita: apuntarle a un foco
      chico era un examen de puntería. Arrastrar a Angie (más de 8 px entre bajar y soltar) no
      entra, ni tocar un control. El llamado dice "Hacé click para iniciar las aventuras", sin
      nombrar la idea, y tiene vida: un cursor hace click al empezar cada vuelta de 2,6 s, la frase
      se mueve en ola detrás (causa y reacción) y la chispa del final salta cuando la ola llega.
      Defecto resuelto: "Tocá para entrar" solo parpadeaba en opacidad y se leía apagado. Llega
      después del título (no antes: competía con la entrada de las letras).
- [ ] En una pantalla táctil (`(hover: none) and (pointer: coarse)`) no hay click ni cursor: el
      aviso y la colina dicen "Tocá…" y el cursor deja lugar a un punto que late con los mismos
      anillos. Las dos frases están en el DOM y el CSS muestra una; cada una con su texto para el
      lector. Probarlo con touch emulado por CDP (`setTouchEmulationEnabled`) y un tap real: el
      ancho de 375 solo no cambia el puntero.
- [ ] Sonido y pausa son dos fichas de ícono arriba a la izquierda, con su texto en un globo al
      pasar o enfocar. Abajo, al lado del llamado, eran dos píldoras oscuras que competían con él.
      Probarlas con click REAL: el topbar invisible (opacidad 0, z 6) tapaba las fichas y se comía
      el click. Con el chrome en 0 el motor lo deja en `visibility: hidden`; comprobar con
      `elementFromPoint` en el centro de cada ficha.
- [ ] En vertical las fichas van en fila: en columna, con una partida guardada ("Empezar de cero"
      es la tercera), bajaban hasta 160 px y la última tapaba la "L" del título, que a 390×664
      empieza en 115. Medir con una partida sembrada y el aviso tocado: sin ella hay dos fichas y
      el choque no aparece. Medido letra por letra contra cada ficha a 390×664, 360×640 y
      768×1024; a 750×342, 1024×700 y 1440×900, en columna como antes.
- [ ] El título es el de la historia ("Las aventuras de Angie por el SignalVerso") y la bajada dice
      qué es. Medir título, bajada, sol y fichas sin solapes en los mismos seis anchos, y el
      título en dos renglones. Va en Baloo 2 (800 el título, 600 la bajada): redonda y gruesa,
      de dibujo animado; la Archivo, recta, era la de un cartel. Entra cuando se va el aviso
      (`ini--revelada`, que pone `revelar()`), no al cargar: detrás del aviso nadie lo veía. Las
      letras caen y rebotan de a una, de punta a punta (`letrasDelTitulo` numera sin reiniciar en
      el segundo renglón); la bajada llega después, de a una palabra que sube y se aclara; y
      "SignalVerso" se mece cada tanto, lo único del título que sigue vivo. El lector lee la frase
      entera (`sr-only`); las letras van `aria-hidden`. Con movimiento reducido están quietas y a
      la vista.
- [ ] El sol es un sol dibujado y vivo: cuerpo con degradé y brillo que respira, corona que late,
      rayos alternados largo/corto que crecen desde su base (no desde el centro: se despegaban) en
      una ola que da la vuelta, y todo gira despacio. Defecto resuelto: el átomo con anillos de
      órbita y dos puntos de color se leía raro, y los rayos de un degradé cónico que giraban en
      90 s parecían pintados. En vertical, las puntas de los rayos no salen de la pantalla.
- [ ] Angie tiene vida propia mientras espera (`vidaPropia`; parada, porque sentada hace solo lo
      tranquilo, ver el paseo más abajo): se balancea, los brazos y la lamparita
      se mecen a destiempo, y cada 1.6-4.2 s se le ocurre algo (saluda, mira la idea, mira al sol,
      cambia el peso, saltito, se estira), sin repetir. Solo respirar y parpadear se leía como un
      dibujo quieto. Comprobar con una hoja de cuadros (cada 110-250 ms): el saludo va al costado de
      la cabeza, contra el cielo (encima quedaba rosa sobre rosa), y la lamparita no se le viene
      encima de la cara. Con la pausa de fondo, con movimiento reducido o al entrar, no hace nada:
      cero animaciones infinitas y el brazo en `rotate(0)`. Agendar el próximo gesto no puede
      borrar los pasos del que corre: el brazo del saludo quedaba trabado arriba.
- [ ] Esperando, Angie sonríe y se sonroja: la boquita en "o" sola es asombro y se leía seria. La
      sonrisa vive en el grupo de la boca, así el muelle la abre (ríe al saludar, bosteza al
      estirarse). Solo con vida propia: las mascotas del mapa y de las cards no cambian. La
      sonrisa es ancha, con las comisuras redondeadas por un trazo del mismo color y la lengua
      recortada con la misma forma (`sonrisa`): en punta y con la lengua suelta asomando por
      debajo, se leía rara.
- [ ] Sentada en la piedra, la cara es MELANCÓLICA: ni preocupada ni triste. Párpados apenas
      caídos hacia afuera (un `clipPath` que baja el muelle `pena`), cejas con el lado de adentro
      apenas arriba (±6-7°), el brillo del ojo abajo y una sonrisa chica cerrada. Con la "o" y
      una ceja levantada se leía preocupada; con las cejas a ±16-18° y los párpados más
      inclinados, triste. Mirarla con una lupa (la mascota clonada a 2000 px) Y a tamaño real.
- [ ] Angie YA ESTÁ sentada en la piedra del CENTRO cuando aparece la colina: no camina hasta
      ella (la caminata se sacó; `sentarse(deUna)` asienta los muelles sin animar la bajada, así no
      se ve que recién llega). Sentada es de frente (`mv--pensativa`), mirando al sol
      (`MIRA_AL_SOL`), con los brazos al costado y las piernas colgando del borde, balanceándose a
      destiempo. La cara es MELANCÓLICA (2026-11-09): párpados apenas caídos y la boca casi recta,
      con las puntas un poco caídas (`mv__boca-pena`); nada de sonrisa (la boca chica curvada hacia
      arriba se leía contenta) ni de "o" (preocupada). Sonríe recién con "La hora ha llegado".
      NADA de mano en el mentón: le tapaba la cara (se sacó `mv__menton`). Lo que la
      arruinaría: sentada flotando o parada delante de la piedra (la piedra es paisaje,
      `.ini__piedra`, con la misma caja que Angie y en el centro, con la inclinación que tiene ella
      sentada, debajo del atardecer para que se tiña con la colina; el cuerpo queda casi a altura
      de parada (`SENTADA_EN_LA_PIEDRA`), las piernas se acortan (`COLGADA_ALARGA`) para que se
      vean las pantorrillas con piedra debajo de los pies, y la sombra de contacto sube a la
      piedra y se achica); halo corrido (la entrada y el halo siguen a la lamparita,
      `translate: 24% -4%`); pensativa muerta (respira, mira lejos, balancea los pies, sigue al
      mouse con la cara; nada de saltito, estirarse, saludar ni cambiar el peso). La nube del
      pensamiento se desinclina (`--inclina`): torcida se leía como error. Va con
      `translate`/`rotate` sueltos, porque la despedida anima el `transform` del mismo elemento.
      Un cambio de tamaño la reacomoda en la piedra. Medir a Angie sentada y a la piedra contra
      sol, fichas, título y llamado en los seis anchos: cero solapes y nada afuera. Las piezas
      apagadas miden 0,0: filtrarlas antes de armar la caja de Angie.
- [ ] La respuesta de Angie no se apaga donde la dijo: al tocar, el globo se condensa en un punto
      y de ahí nace UNA luz (`subirLuz`, la de la despedida, más grande: `ini__luz--mensaje`) que
      sube al sol, y el sol late al recibirla. Se lee como un mensaje que se manda. Defecto
      resuelto: el globo entero cruzando el cielo se veía raro, un cartel volando. Sin movimiento,
      no viaja.
- [ ] No se entra mientras la portada todavía está entrando: el click se frena en captura hasta
      que el llamado termina su animación (`animationend` de `.ini__llamado`). Un toque a mitad de
      la bajada cortaba la portada sin terminar de leerla. Sin movimiento, se puede de entrada.
- [ ] Angie lo piensa en dos tiempos, en la misma nube: "Así que… Ellos ya están aquí…" (lo
      presiente, con la radio, `T.presentir`) y, después de hablar con el sol y con el atardecer
      empezando, "Así que… La hora ha llegado…" (lo decide, sonriendo). Cada pensamiento lo pasa QUIEN MIRA con un click (o Enter/Espacio en
      `document`), no un reloj; `T.presentir`/`T.pensar` son solo lo mínimo que tarda en entrar la
      nube. Un triangulito que late abajo a la derecha de la nube (como en un diálogo de juego)
      aparece con el último punto y dice "tocá para seguir". Sonido y pausa no pasan el
      pensamiento. Por eso el overlay NO va `inert` durante la salida (inerte, el toque no
      llegaba); volver a entrar lo cierra `picked`. La música va por fases (`planDeFase`): el fondo
      sigue y cada pensamiento suena hasta el click siguiente. Las dos frases ocupan la misma celda y cruzan opacidad:
      la nube toma el ancho de la más larga y no salta al cambiar, y los puntos de la segunda
      empiezan recién cuando ella aparece. La nube va corrida a la izquierda (`-62%`; a 800 px
      la frase larga se salía 11 px) y un poco arriba (`-14%`; con Angie sentada la esquina
      rozaba los rayos de la lamparita, 53-77 px² contra `.ini__foco` de 1280 a 1920). Primero salen las burbujas del rastro, de la más chica a la más
      grande, y después la nube, así se lee que el pensamiento sale de ella. Los puntos aparecen de
      a uno y la nube se va antes de que tome impulso: nunca se desarma con el globo encima. Va
      dentro de `.ini__angie` (sigue su asomo) y arriba de la cabeza, donde ya no está el título.
      Las burbujas del rastro tienen un mínimo en px: con el porcentaje solo, a 1024 px medían 8 y
      12 px y no se leían como rastro. Medir nube y burbujas contra sol, fichas, lamparita y
      llamado en los seis anchos y en 800×737 (cero solapes, a 8 px o más del borde), con cuadros
      encadenados tras un click real. Con movimiento reducido no aparece.
- [ ] (2026-11-09) El toque prende una radio, no un diálogo: estática, chasquidos y silbidos de
      dial (`ruido-de-radio.ts`, plan con semilla) y anillos punteados que salen del sol y
      tiemblan (`ini--radio`). Recién a los `T.sintonizar` entra el primer pensamiento. Con la voz
      del sol la estática se apaga y los anillos quedan enteros y quietos; cuando Angie contesta, se
      desvanecen. Los anillos van DEBAJO del globo del sol: encima, uno le cruzaba la frase.
      (2026-11-10) Cada anillo SUENA al salir (`sonidoDeOnda`, `tocarOnda`): un tono que cae, con
      temblor mientras hay interferencia y limpio y más suave con la voz del sol; con la respuesta
      de Angie, ya no. Va pegado al anillo (`animationstart`/`animationiteration` del `ini-radio`,
      no un reloj aparte), así no se desfasa. Defecto resuelto (Damian): las ondas salían mudas.
- [ ] (2026-11-09) Los cuatro globos se escriben de a una letra, como los diálogos de un RPG
      (`TECLA_MS`, que es también `--tecla` en el CSS y lo que espera cada globo antes del toque,
      `loQueTardaEnEscribirse`). El globo entra entero y las letras lo llenan: no cambia de tamaño
      mientras se escribe. Las palabras no se parten al bajar de renglón. Los puntos y el
      triangulito de "tocá para seguir" esperan a que termine la frase, y los blips de voz duran
      lo mismo que la escritura. Al irse, las letras esperan a que el globo se encoja.
- [ ] (2026-11-10) El toque sobre un diálogo que se escribe (los globos de la colina y las líneas
      de las cinemáticas) hace lo de un RPG (`queHaceElToque`): a medio escribir lo COMPLETA en el
      acto (`ini--escrito`, `cine__linea--escrita`: letras, puntos y triangulito saltan a su lugar y
      se cortan los blips), y recién escrito lo PASA. Después de completar, el toque siguiente
      espera `RESPIRO_MS` (350) para pasar. Anti-patrones (Damian, con muchos clics): todo toque
      pasaba, y una ráfaga se llevaba dos diálogos juntos sin leer ninguno; en la colina el toque a
      medio escribir quedaba guardado y el globo se iba solo al terminar de escribirse. Probado con
      una ráfaga real cada 60-90 ms: un diálogo por vez, cada uno entero unos 400 ms.
- [ ] (2026-11-09) Con "Ellos ya están aquí" Angie tiene la boca en "o"; con "La hora ha llegado"
      sonríe y se sonroja (`sonreir()` de `app-mascota-viva`, clase `mv--sonrie`, que le gana a la
      boca chica pensativa y a la "o").
- [ ] (2026-11-08) Después del presentimiento, el sol habla y Angie le contesta: "Esto es demasiado
      caótico." y "Supongo que sí… Desde su perspectiva puede ser caótico.". Es el mismo texto que
      la línea `voz-supongo` del prólogo, y sale de un solo archivo (`intercambio-del-sol.ts`):
      el bucle se nota porque las dos puntas dicen lo mismo, letra por letra. La voz del sol va
      en un globo con borde punteado, en cursiva y con la cola hacia el sol (no tiene cuerpo, es
      la anomalía); la de Angie, en un globo de diálogo con cola hacia su cabeza, en la misma
      celda que la nube (no es un pensamiento, lo dice en voz alta). Cada globo espera un toque,
      con el mismo triangulito que la nube, y suena con el timbre de quien habla (`hablar`).
      Los dos van con `text-wrap: balance`: sin eso, a 390 la última palabra quedaba sola en su
      renglón, y el globo de Angie se salía del ancho hasta que su máximo pasó a `92cqw`. Para
      quien no ve la pantalla, lo dicho va a una región `aria-live` aparte. Medido a 390×844,
      500×900, 800×737, 820×1180, 1280×720, 1440×900 y 1920×1080: nada afuera; los únicos
      cruces son la cola contra el sol y el globo sobre la caja de Angie, igual que la nube.

- [ ] Antes que nada, de noche, el aviso de auriculares (`app-aviso-auriculares`): Angie en el
      medio con los auriculares puestos (L y R) y lentes de sol, accesorios proyectados en su
      propio dibujo (`mvDetras`, `mvCara`, `mvDelante` en `app-mascota-viva`) para que la sigan en
      cada golpe; las cejas asoman por arriba del marco. No hay botón a la vista: la invitación es
      texto ("Hacé click en cualquier lado para continuar") con un cursor que hace click y una ola
      que sale de ese click, separada del título con aire (pegados se leían como un renglón
      partido); sigue siendo un `<button>` para teclado y lector, sin anillo de foco (el foco llega solo
      al cargar y lo volvía botón). Arriba a la derecha, el control de sonido: apagado, las copas
      pierden el color, las ondas se cierran y se dibuja la cruz; tocar en cualquier lado entonces
      continúa sin sonido y los botones de sonido de la colina lo reflejan. Con sonido, su toque es
      el gesto que el navegador exige: suena la prueba de un oído al otro (`planDeLaPrueba`), la
      copa que suena golpea y Angie se vuelca hacia ese lado (`inclinarse`), y en el acorde salta.
      Después la CÁMARA SE ALEJA como en Powers of Ten (2026-11-09, `cuadroDelViaje`): la noche
      era lo que Angie miraba, y se va adentro de su OJO. Dos tramos: (a) el CIERRE
      (`SE_CIERRA_MS`): el aviso SE ACHICA DESDE EL PRIMER CUADRO, despacio al principio en
      escala (`v = u²`), hasta CERO en el negro del ojo (#0f0f11), en el medio de la pantalla (ver
      "El círculo del aviso se cierra en el MEDIO"), y mientras se achica su borde se
      redondea en un círculo blando (máscara con `--aa-aire`) hasta el que cabe adentro
      (`aireQueCabe`); el negro aparece ALREDEDOR porque el aviso se aleja; el texto se va
      primero; (b) la cámara se ALEJA (`ALEJARSE_MS`) del ojo a la cara, a
      Angie en la piedra y a la colina entera, en escala pareja (cada tramo de tiempo divide la
      escala por lo mismo); arranca desde ADENTRO del ojo izquierdo (`MANCHA`, el negro lejos del
      párpado, del borde y del brillo pensativo; `profundidadDesdeElOjo`: las cuatro esquinas, en
      el dibujo del ojo, caen adentro con margen ×1,2, tope 900); los dos tramos se pisan: la
      cámara arranca (`SE_ALEJA_DESDE_MS`) cuando el aviso ya es una mota, y la pantalla queda toda
      negra apenas un tercio de segundo; después asoma el borde del ojo, su
      brillo, la cara, Angie y la colina. La BOCA queda cerrada todo el viaje, como siempre, y
      Angie no parpadea mientras dura (`sinParpadear`). El título de la colina entra recién al
      llegar (`llego`): antes se vería gigante. Lo que NO puede pasar (anti-patrones): un IRIS
      NEGRO que se cierra hacia el medio sobre el aviso quieto (2026-11-09, Damian: "no se hace
      realmente un zoom out", se lee como que lo negro tapa, no como alejarse); el aviso que se
      achica parejo en escala hasta 0,004 en un segundo (cada 140 ms la mitad: a los 200 ms ya iba
      por un tercio y se leía como un salto; por eso arranca despacio, a los 300 ms sigue arriba
      de 0,6); un zoom en
      línea recta (el ojo pasaba en un parpadeo y la colina se arrastraba); la colina en
      RECTÁNGULOS (animada por el compositor, el navegador la pintaba una sola vez a la escala del
      arranque: por eso va cuadro a cuadro con `requestAnimationFrame`, y cada cuadro se vuelve a
      dibujar); el negro corrido (la cara se mueve sola y a cientos de aumentos dos píxeles se
      notan: la cámara SIGUE al punto del ojo cada cuadro, con su matriz de pantalla; los ojos del
      perfil también existen, apagados, y miden cero); un PARPADEO en el viaje (abría la pantalla
      negra de golpe); un cuadro sin aviso al arrancar (el primero se pinta antes de prender la
      máscara); texto del aviso legible mientras se va; un PUNTO que queda en el medio y viaja
      hasta la colina (se leía como algo nuevo: el aviso termina en cero antes de que la cámara se
      aleje); la pantalla NEGRA más de medio segundo (uno detrás del otro y con margen ×2, quedaba
      un segundo y medio: se leía como que se había colgado); cortes entre tramos; más de unos 6 s; arrancar con la cara a la vista (medida por su
      caja de pantalla, una figura girada y estirada por los muelles dejaba un borde a la vista; y
      a cientos de aumentos se pinta más angosta que su geometría: de ahí el margen); el aviso de
      vuelta entero un cuadro al llegar (queda en escala 0 hasta que `listo` lo oculta). Antes
      arrancaba en la boca abierta, de #940054: lo que se iba era oscuro y se leía como algo ajeno
      a la boca; en el negro del ojo, la noche y el ojo son del mismo color. Defectos viejos que
      siguen valiendo: un
      rectángulo que se achica se leía como una ventana; nubes oscuras sobre la cara, como humo
      de explosión. Los cuadros pausados NO muestran los rectángulos, porque pausar le da tiempo
      a pintar: grabar en tiempo real con screencast por CDP (Edge headless, click real) y mirar
      la hoja de cuadros. Verificado así a 1440×900 y 390×844. Ojo: un click por `ref`
      de la herramienta hace scroll del overlay (`overflow: hidden` igual scrollea): no es un bug,
      repetir con click por coordenada. En el acorde final, ondas y notas usan otra animación: con
      el mismo nombre, las del lado que ya había sonado no volvían a salir. Va diferido (`@defer`,
      con un telón liso del mismo color de placeholder). En celular, la invitación va en línea (no
      flex): en flex el toque quedaba solo a un costado del renglón partido. El bloque va
      centrado de verdad: el renglón del lado que suena comparte lugar con la invitación (grid
      apilado) en vez de sumar un renglón vacío abajo. Colores: un velo de noche oscurece bordes y
      alba (el rosado de abajo competía con Angie), el título es crema con un solo acento rosa en
      "auriculares" y "volumen", y la invitación va en crema suave con la ola en amarillo; el foco
      de teclado es una línea rosa debajo, no un fondo de pastilla que la volvía botón.
- [ ] El cielo del aviso tiene planos, no solo puntos: lomas en silueta abajo (la de lejos con el
      filo rosa del alba, debajo del velo), las estrellas más grandes brillan en cruz y cada 11 s
      cruza una fugaz que termina antes de llegar a Angie. Defectos resueltos: (1) la mitad de abajo
      era un vacío y la escena se leía como una calcomanía en el medio de la noche; (2) las lomas
      recortadas (`slice`) perdían el filo en ventanas bajas: van estiradas (`none`, con el borde
      `non-scaling-stroke`); (3) en un celular una cruz caía sobre el control de sonido: no hay
      destellos en la franja de arriba (`y >= 110`). Medir el aire entre la invitación y la cresta
      de lejos en 375×667, 800×737, 1280×600, 1600×610 y 1920×1080: siempre positivo (18 px el más
      justo, en el celular). La invitación va en voseo como el título ("Hacé click", no "Haz
      click"). Angie llega a `min(440px, 76vw, 48vh)`: en una pantalla ancha y baja quedaba chica.
- [ ] Mientras espera, Angie ESCUCHA la música de sus auriculares (`escuchar`, pulso de
      `TIEMPO_MS` = 600 ms): cabecea en cada tiempo, se mece cada medio compás con la cabeza
      adelantada, marca el pulso con un pie y después con el otro, y le salen notas de las copas.
      El compás (2,4 s) dura lo mismo que el latido de las ondas. Sin sonido no hay música: deja de
      moverse (`dejarDeEscuchar`) y vuelve su vida propia. La prueba de auriculares también corta
      la música. El primer tiempo llega con el timer, no al montar: si la vista se destruye
      enseguida, no queda un cuadro pedido al motor (lo vigila el contrato de teardown).
- [ ] La colina tiene su música (`musica-de-la-colina.ts`): melancólica, en re menor como la
      despedida, una vuelta de cuatro acordes que termina suspendida y vuelve a empezar. Cada vuelta
      se agenda en el reloj del audio pegada a la anterior (un timer atrasado no abre huecos), y al
      entrar se funde con la de la despedida. Si se eligió sin sonido espera callada y suena cuando
      lo prenden en la colina.
- [ ] Después de que las luces de Angie suben a las estrellas arranca SIEMPRE el prólogo de las
      naves, aunque ya se haya visto: es la continuación de esa escena. Quien ya lo vio lo salta
      con su botón.
- [ ] Ninguna capa que lee lo de atrás (`mix-blend-mode`, `backdrop-filter`) queda prendida en el
      aviso ni en la colina mientras no hace falta. Las capas del atardecer multiplican recién con
      `ini--atardecer` / `ini--noche`, y la ficha "Sonido" del aviso es casi opaca y sin
      desenfoque. Defecto resuelto (2026-11-10, Opera Neon en Windows): aunque estuvieran en
      opacidad 0, hacían que el navegador dibujara a pedazos lo animado de encima. Se borraban
      letras de la ola del llamado, el cuerpo de Angie, el sol y las fichas, y el aviso se cortaba
      al aparecer. En Chromium no se ve: se revisa en Opera Neon con capturas seguidas (cada
      ~0,4 s), porque el corte dura un cuadro y una captura suelta no lo agarra.
- [ ] La colina entra en la memoria de video de una PC cargada: quieta y en un monitor ultrawide
      (3440×1300), sus tiles suman del orden de 150 MB, todos a escala ≤ 3. Defecto resuelto
      (2026-11-10, Opera Neon en Windows, fijo y no de un cuadro): faltaban el cuerpo de Angie,
      letras del título y del llamado, y quedaban rectángulos pálidos. La cámara que sale del ojo
      agranda la escena cientos de veces, y el navegador dibuja lo que anima (juncos, nubes, Angie,
      el halo del sol) a la escala más grande que alcanzó, y no la baja mientras siga animando:
      quedaban capas a ×40 y la colina pedía 650–750 MB. Al llegar, los loops de la escena van dos
      cuadros a velocidad 0 y arrancan de nuevo, ya a escala 1. Durante el viaje se frenan un
      cuadro cada vez que la escala baja a la mitad: con la del ojo todo el viaje, la colina
      entraba en pantalla a ×955, se pasaba el límite y el zoom quedaba a medio dibujar; quietos
      todo el viaje, se redibujaban en cada cuadro y pestañeaba en blanco. Contar cuadros lavados
      del screencast del zoom (0–1 por corrida) contra la versión anterior. Se reproduce sin la PC de Damian: una
      Opera aparte (Playwright, `executablePath` y perfil propio) con
      `--force-gpu-mem-available-mb=128`. Se mide con un trace `disabled-by-default-cc.debug`: el
      `LayerTreeHostImpl:snapshot` trae `gpu_memory_usage` y `contents_scale` de cada tile.
- [ ] (2026-11-10) El círculo del aviso se cierra en el MEDIO de la pantalla: la cámara lleva el ojo
      de Angie al medio mientras el aviso se cierra y lo devuelve a su lugar a medida que se aleja,
      parejo en escala (`corridaDeLaCamara`: a la mitad del viaje en escala, a la mitad del camino).
      El aviso se achica alrededor de su propio medio, puesto sobre el ojo. Defecto resuelto
      (Damian, monitor ultrawide): Angie queda a un costado y el aviso se iba achicando hacia allá,
      "se va corriendo para el costado". Con el ojo en el medio la profundidad también baja
      (×936 → ×522 a 3440×1300): las esquinas quedan más cerca.
- [ ] (2026-11-10) El arranque del zoom desde el ojo no se ve a rayas con poca memoria de video.
      Defecto resuelto (Damian, Opera Neon con YouTube abierto): en los primeros cuadros de la cara
      gigante quedaban franjas y rectángulos sin dibujar, por donde asomaban las lomas. Tres causas
      y sus arreglos: (1) lo que la gema tapa se pintaba igual: el cielo y las lomas pedían 250 MB a
      ×500–×900 detrás de la cara; mientras la gema cubre la pantalla (`laGemaTapaLaPantalla`: las
      cuatro esquinas, con margen ×1,15, adentro de sus piezas; la gema es convexa) lo que está
      detrás de Angie va con `visibility: hidden`; (2) lo que no anima se redibujaba en cada cuadro a
      la escala nueva: la escena va con `will-change: transform`, que el navegador dibuja una vez y
      solo achica, y a cada mitad de escala se le saca un cuadro para que vuelva a la escala del
      momento (no la baja sola y la memoria crecía ×4 por mitad); (3) la landing de abajo seguía en
      capas propias bajo la colina (ver "Trabajo de fondo"). Probado y descartado: pausar todos los
      loops del viaje (todo en una capa que se redibuja en cada cuadro: cuadros enteros en blanco);
      `will-change` todo el viaje sin soltarlo (520 MB a los 2 s); soltarlo para siempre a la
      primera mitad (desaparecía la cabeza dos cuadros); una deriva de la cámara durante el cierre
      (más cuadros a medio dibujar). Medido con screencast en Opera aparte a 3440×1300: con
      `--force-gpu-mem-available-mb=256`, picos blancos 30 (antes) → 7, y el tramo ojo → cara
      entero; con la memoria normal, 0 picos y todos los cuadros enteros hasta la colina.

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
      puede autocancelarse (movimiento reducido, falta de una capacidad),
      destapar después de decidir: si no, queda el velo puesto sobre
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

Del prólogo reconstruido en SVG (2026-11-08):

- [ ] Los planos de fondo (cielo, interior, papel) se pintan MÁS ALLÁ del viewBox: con `meet`
      la escena entera cabe y el sobrante muestra escena, no franjas. Revisado a 16:9, 4:3 y
      768×1024 en vertical.
- [ ] El rumbo de un personaje sale de su pose del GUION, nunca de la pintada. Con el balanceo
      y los muelles adentro, una nave quieta en la ronda se inclinaba 30° por respirar; y el
      vaivén de la exploradora daba vuelta su `mira` y la hacía volar marcha atrás.
- [ ] Lo plano de un objeto que escala se desvanece antes de que la escala lo delate: en el
      salto, los anillos punteados de la anomalía a ×5 se leían como rectángulos volando.
- [ ] La trayectoria de un personaje no cruza un hito del fondo: la exploradora pasaba por
      encima del planeta de casa. Se mueve el hito, no se le recorta el camino.
- [ ] Quién habla va en una caja HTML con su nombre y el punto del color de su antena; la voz
      sin cuerpo va arriba, dorada y sin caja; el grito de todos, al centro. Nada de texto
      dentro del SVG.
- [ ] En la caja la frase corta sola, por su ancho: un `\n` a mano más el corte automático dejaba
      renglones de una palabra ("Rápido." solo, "inalcanzable" solo). Solo la voz y el grito, sin
      caja, declaran sus cortes; `malformado()` rechaza un `\n` en la caja.
- [ ] Cada frase de la caja entra en UN renglón: la caja ocupa el ancho de la escena (tenía tope de
      860 px y con dos cajas lado a lado "¡Oigan! Dejen de desear…" se partía) y ninguna línea pasa
      de 75 columnas (`renglonesLargos()`). Una frase más larga se parte en dos líneas con "…".
      Medido a 2000×840 con la caja más larga del guion y con dos cajas a la vez.
- [ ] La caja es casi opaca (96%; 97% sobre el papel del final): al 78% las líneas de la anomalía
      y las moléculas cruzaban la frase. Sin `backdrop-filter`, que la escena no usa.
- [ ] Angie habla con su rosa (#ff8ac9, el de la exploradora: es ella; #c2185b sobre papel). En
      amarillo su nombre se confundía con el del capitán.
- [ ] Un operador nombrado en la charla (`switchMap`) se ve como código: va entre comillas
      invertidas en el guion y el motor lo escribe en un `<code>` estampado con el atributo de
      encapsulación. Sin estampar, el `<code>` salía sin color.
- [ ] Angie nace del choque como el componente real (`app-mascota-viva`), no como un dibujo:
      es la misma que la colina y la misma que recibe en la construcción de Tusi.
- [ ] Toda reacción pasa por `impacto(x, y, fuerza)`: toques, la bola del grito, el choque.
      Tocar una nave la sacude y vuelve a reposo; tocar el cielo deja chispas; tocar nunca
      pausa ni termina.
- [ ] `?prologo=<id de línea>` arranca el prólogo en esa línea, solo en dev. Lo lee el módulo
      de la vista al cargar: la sincronía de la URL lo borra antes de que el prólogo arranque.
- [ ] El prólogo carga diferido, recién al bajar de la colina: en el bundle inicial pasaba el
      presupuesto por 21 kB. Si el pedazo no llega, se sigue como si se hubiera saltado: nunca
      queda la noche sin construcción.

Del minijuego de operadores (2026-11-08):

- [ ] "¡Activen todos los operadores!" detiene el reloj del guion (`ESPERA_OPERADORES`) y abre
      una hoja por nave: el código con su hueco y el desafío manipulable de siempre, con su
      perilla, su lectura y su barrido (`malformed`, `solutionFor`). Las naves siguen vivas
      mientras tanto: el reloj se detiene, los resortes no.
- [ ] La hoja va al CENTRO, sobre un velo: es lo único que hay que hacer mientras la historia
      espera. Abajo a la derecha se leía como un aviso secundario. Es la excepción escrita a "sin
      backdrop" de la gramática de modal, que vale para las cards del recorrido. Se centra en la
      franja libre entre el HUD y la caja de diálogo, y la caja queda por encima del velo: centrada
      en la pantalla entera, a 1280×640 tapaba la mitad de la orden del capitán. Medida contra la
      caja de diálogo y el HUD a 1440×900, 1280×640 y 1024×700, con la pista abierta: cero solapes
      y sin scroll interno.
- [ ] Al arreglar un hueco, la nave DISPARA su operador: un proyectil SVG con el nombre en el
      color de su antena y borde oscuro, como los de la ráfaga. Con `palabra()` el texto salía
      oscuro sobre el espacio y no se leía. El disparo no suena: acertar es en silencio. Mientras
      dispara, el velo y la hoja se apartan (`prologo--disparo`): tapado, el único aviso del acierto
      pasaba detrás de la hoja.
- [ ] La hoja dice qué hacer: qué es cada nombre del código (`v`, `c === 'combustible'`), qué tiene que
      salir y la meta de la lectura. Sin esto el hueco era adivinar. Qué tocar lo dice la flecha
      "tocá acá" sobre el operador: la frase "Tocá el operador marcado" repetía lo mismo.
- [ ] Los huecos se arreglan con `map`, `tap` y `filter`, uno por nave: los tres más simples, con
      un encargo que se dice en una frase (duplicar la velocidad, verla en el panel, sacar el agua).
      Con `scan` y `throttleTime` el primerizo no tenía de dónde sacar qué hacían.
- [ ] Un óvalo trazado a mano marca EL operador, y una flecha con "tocá acá" lo señala hasta que se
      elige algo. Los dos se miden contra el token real del código (`afterRenderEffect` y un
      `ResizeObserver`), no contra una posición fija: el nombre cambia de ancho con cada operador.
      La flecha se apaga al elegir por cualquiera de los dos caminos: elegir desde el panel el mismo
      operador del arranque no mueve la perilla, y con solo mirar la posición quedaba prendida.
- [ ] El óvalo se vuelve a trazar con WAAPI en cada operador nuevo. Recrearlo con un `@for` de un
      elemento daba el warning NG0956 en cada cambio.
- [ ] Al costado van los tres operadores con su dibujo animado y qué hace cada uno en una frase;
      tocar uno lo pone en el hueco (`fijar` del átomo, la misma corrida que la perilla). Es la
      excepción escrita a "el desafío no enumera opciones": el prólogo es antes de aprender nada,
      y elegir entre tres nombres sin saber qué hacen era adivinar. El puesto dice "en el código".
- [ ] "tocá acá" va en un naranja más oscuro que el trazo (#b93d0c): el del óvalo daba 4.2:1 sobre
      el papel del código.
- [ ] Con movimiento reducido la hoja aparece igual, sobre la escena quieta (ADR 0013), con sus
      dibujos quietos en el momento que los explica. El acierto no dispara: el nombre aparece y se
      apaga al lado de la nave.
- [ ] Lo que tiene que salir (`encargo`) va en una franja del color de la nave, de lado a lado
      justo debajo del título, con la diana: es lo primero que se lee. En una columna al costado,
      junto a los nombres, se perdía como una nota más. Los nombres del código (`nombres`) van en
      fila arriba del bloque, como la leyenda de un plano. La meta corta va además en la barra del
      desafío (`msMeta`, proyectada), al lado del número que da el código y con la misma diana:
      comparar es mirar de un número al otro.
- [ ] El desafío va con `[banco]="true"`: la barra es un banco de prueba (lecturas, meta y acción
      en su franja) y la acción es el botón principal, oscuro, con un triángulo de "probar" y al
      final del renglón. El botón de contorno fino se leía como texto y no se sabía cómo confirmar.
- [ ] La hoja va en dos columnas desde 760 px (código y banco | operadores) y en una por debajo,
      con los operadores en fila. Baja y ancha (`max-height: 720px`), la instrucción y la leyenda
      comparten renglón: con la ayuda abierta, a 1280×640 la hoja scrolleaba 39 px por dentro. El
      óvalo y la flecha quedan fuera de esa grilla porque se miden contra el bloque entero. Medida
      con input real a 1440×900, 1280×640, 1024×700, 820×1180 y 700×900, con la ayuda abierta:
      cero solapes con HUD y diálogo, sin scroll, el óvalo sobre el operador, consola limpia.
- [ ] La hoja no deja seleccionar texto (`user-select: none`): es un tablero para tocar, y tocar la
      perilla varias veces seguidas pintaba de azul medio renglón de código.
- [ ] La Nave B pide `c === 'combustible'`: dice qué pasa, no qué se descarta. Con `nafta` y
      `c !== 'agua'` había que leer una negación para entender el filtro.
- [ ] En el prólogo Angie todavía no puede intervenir: el desafío va con `[ayuda]="false"` y no
      muestra su pista. La ayuda la da OTRA nave, solo con la corrida ya rota, y dice qué hizo el
      operador elegido, nunca cuál es el bueno (lo verifica `operadores-del-prologo.spec.ts`).
- [ ] La hoja no alcanza las clases del desafío (estilos encapsulados): lo que cambia adentro va
      por variables del átomo (`--ms-codigo`, `--ms-ancho`, `--ms-aire`, `--ms-renglon`) o por una
      entrada suya (`banco`). Una regla `.prologo__operadores .ms__code` no aplicaba y nadie lo
      notaba.
- [ ] La hoja es su propio componente diferido (`hoja-del-hueco/`): plantilla, CSS, desafío y
      resaltador fuera del bundle inicial, que con la hoja adentro pasaba el presupuesto de 740 kB.
- [ ] Los datos del minijuego viajan con el prólogo diferido (el motor se los pasa a la vista),
      no en el bundle inicial: importados desde la vista lo pasaban de 740 kB.
- [ ] Al medir o clickear, los selectores van dentro de `.prologo__operadores`: los sub-niveles
      ocultos del recorrido también tienen `.ms__knob`, y el click caía en uno invisible.

**El comienzo en el celular** (2026-11-10, ADR 0012):

- [ ] El prólogo se juega a cualquier ancho y con movimiento reducido (ADR 0013). Abajo de 700 px
      se salteaba, y con él el minijuego, el manual y el árbol: en el iPhone la Introducción no
      estaba.
- [ ] Los rótulos dibujados en el SVG tienen piso en pantalla (`letraConPiso`): 12 px el del
      disparo, 15 el del acierto. Con `meet`, a 390 px la escena queda a 0.24 y 19 unidades eran
      4.6 px. Agrandado, el nombre se apaga antes (`opacidadDelRotulo`) y nunca hay dos a la vez:
      con el tamaño de escritorio se pisaban. En escritorio el piso no alcanza: medido 19/4 a
      1440×900 y 1024×700.
- [ ] A 390 px la caja de diálogo parte la frase en dos renglones, abajo y sin tapar la escena: "un
      renglón" vale desde el ancho de escritorio.
- [ ] El libro de leyes, a 760 px de ancho o menos, o 500 de alto o menos, scrollea: la página no
      entra. Arranca debajo del HUD (`top: 4.25rem`, sin padding): con padding arriba, la ley pasaba
      por detrás de los botones. Sin el vidrio `::after`: en un scroller se iba con el contenido y
      dejaba una franja negra a mitad de página. "más abajo ↓" va sticky en el borde de abajo, sobre
      el renglón ya cortado, y se apaga al final (scroll-driven; sin soporte, no aparece). Medido
      con input real en WebKit y Edge a 390×664 (el alto real de Safari en el iPhone, no 844) y
      750×342: el minijuego, las cinco páginas y el árbol hasta "Seguir la historia", sin desborde
      horizontal. A 1440×900 y 1024×700 el libro no cambia.
- [ ] En vertical la cámara toma la altura entera de la escena y solo el ancho que piden las naves
      que están en el cuadro y la anomalía con 200 unidades a cada lado (`encuadreVertical`, entre
      900 y 1600 de ancho): con la escena entera, a 390×664 todo pasaba en una franja de 220 px. Se
      desliza (no corta) y la nave que se va no la arrastra: siguiéndola, se abría de golpe antes
      del final. Con solo el punto del centro, la anomalía quedaba pegada al borde y las bolas
      salían por la mitad. Apaisada no cambia: `0 0 1600 900` medido a 1440×900 y 750×342. Revisado
      a 390×664 en 13 líneas, del regreso a casa a la figura final, con el título entero.
- [ ] Con movimiento reducido el comienzo se juega quieto (ADR 0013): el reloj salta de parada en
      parada (`saltoQuieto`) y los muelles no avanzan. Medido con input real a 1440×900 y 390×664
      desde la colina: el minijuego, las cinco páginas y el árbol, y después la cinemática quieta
      del capítulo 1.

**El manual de a bordo** (0/1 a 0/5, pantallas enteras en el prólogo):

- [ ] Las pantallas se ven como en la molécula: la hoja lleva `card--dissolve` y las reglas
      globales de `src/styles.css` van con `:is(.card, .prologo__manual).card--dissolve`. Sin eso,
      unos 45 selectores no llegaban: botones claros en vez de la pastilla oscura, y "handler
      completo" a 2.76:1. NO sumar `.card`: trae opacidad 0, escala y alto de la molécula.
- [ ] Un solo borde izquierdo: el corrimiento de 1.5rem es para la espina de la molécula, y en la
      hoja se anula.
- [ ] La hoja scrollea por dentro y se mueve con todo: rueda y dedo nativos (el prólogo corta su
      propagación ahí adentro, porque la rueda del recorrido está en un ancestro y en el borde movía
      la molécula), y ↑/↓, AvPág, Inicio, Fin y espacio a mano. Antes, solo arrastrando la barra.
- [ ] Sin barra de sistema. En el viaje, "más abajo" en el pie, que se apaga al final (sus keyframes
      son propios: Angular renombra los de cada hoja de estilo). El libro de leyes no lo tiene: entra
      entero.
- [ ] Adentro del manual el espacio desplaza, no pausa: pausaba la historia, y al cerrar el manual
      quedaba congelada hasta tocar Continuar.
- [ ] ←/→ pasan de página (en `document`: un botón de la pantalla que se rehace deja el foco en el
      `body`). Escape NO cierra: el libro es parte de la historia, no un cartel encima, y se sigue
      hasta la última página. Al dejarlo, el foco vuelve a Pausa, no al `body`.
- [ ] Angie no da pistas en el prólogo: el manual provee `AYUDA_DE_ANGIE` en `false`, porque los
      desafíos vienen adentro de cada pantalla y no se les puede pasar `[ayuda]`.
- [ ] En la primera página no hay "← Anterior": apagado igual se leía como un camino que todavía
      no se había abierto. Suelto desde la bitácora sí hay uno, "← Bitácora": vuelve a ella, y la
      última página dice "Volver a la bitácora".
- [ ] Medido a 1440×900, 1280×640 y 1024×700 con input real: sin choques con el HUD, sin desborde
      horizontal, pie siempre visible, nada sin estampar, la caja de diálogo escondida, y al cerrar
      sigue "Debería ser imposible…".
- [ ] Se abre suelto desde la bitácora ("Manual de a bordo", siempre a la vista): la misma hoja en
      un `ng-template`, afuera del escenario y en el z 70 de la bitácora. En la historia sigue
      adentro del prólogo, porque la pantalla completa es la del prólogo. El escenario queda
      `inert`, y al volver se prende antes de devolverle el foco a "Bitácora", que se reabre.
- [ ] Las teclas de leer las atiende la vista (`pasoEnElManual`, función pura), no el motor del
      prólogo: suelto, el motor no está, y sin `preventDefault` ↓ movía la molécula de atrás.
- [ ] La hoja es una columna flex con el cuerpo estirado: en una página corta el pie flotaba a
      mitad de la hoja, con media hoja vacía debajo.
- [ ] Cada página lee igual (`app-pagina-del-manual`, en `signals/level-0-introduction/manual/`):
      la ley suelta sobre el cielo, la nave como escenario y su consola abajo. Antes el código
      quedaba chico arriba a la izquierda con un hueco al lado, "Leer el HTML" flotaba sin contexto,
      el desafío quedaba abajo de una raya y la mitad de abajo de la hoja, vacía.
- [ ] La página del manual es UNA pieza, siempre (las seis leyes, la 6 en Signal Space): ya no hay
      forma de tres tarjetas ni input `integrada`, y con ella se fueron `[demo]`, `[desafio]`,
      `.pm-mesa` y el marco de papel de la escena. Anti-patrón: volver a traer una demo o un
      desafío de perilla al lado de la escena. La escena de la nave es
      el escenario y su pantalla muestra los números, una sola vez; abajo, la consola de la nave, en
      la paleta de su pantalla (vidrio `#1c1434`, borde `#5b4a96`, texto `#f2ecff`). Antes, la demo
      en papel repetía los números del panel y el desafío usaba otro código (`badge`, `total`): tres
      tarjetas sueltas. El desafío es el paso 2 de la misma consola, sobre el mismo código: el hueco
      del handler se toca ahí, y completarlo no arregla el panel hasta la próxima corrida.
- [ ] Los dos pasos de la consola dicen dónde se está: el que toca, en dorado; el hecho, en verde.
      La fila guarda el alto de "Mostrame" aunque ya no esté: al irse, la consola no se achica.
- [ ] El escenario llena la ventanilla con `xMidYMid slice` sobre un cielo más grande que la lámina
      (`CIELO_DEL_ESCENARIO`, centrado en la nave, su pantalla y el lápiz), y la ventanilla nunca es
      más apaisada que 3.5:1 (`28.5cqi` de alto mínimo): a 1280×640 quedaba en 4.6:1 y el recorte le
      cortaba el borde de arriba a la pantalla. A 1100 px de ancho o más y 800 o menos de alto, la
      consola va al costado: apiladas no entraban, y `increment()` quedaba debajo del pie. Ahí la
      escena se lleva la parte más ancha: más angosta que 1.3:1, el recorte le cortaba el fuego.
- [ ] Por debajo de 560 px de escena, la lámina encuadra lo suyo (`cieloAngosto` con su franja:
      la nave y su pantalla, o en la ley 5 la cerca con la anomalía y el fuego) sobre un cielo
      PINTADO de 520 (`cieloCentradoEn(y, 520)`): a 390 las ventanillas de las leyes 3, 5 y 6 son
      casi cuadradas o más altas que anchas, el cielo de 340 no alcanzaba, el encuadre se rendía y
      el recorte se comía el borde derecho de la pantalla (la 3, 8 px de marco; la 5, la cerca y el
      "0/7"; la 6, el último `<p>`). Medido con `getBoundingClientRect` de cada forma de la lámina
      contra la caja del SVG, antes y después de correr: nada afuera salvo la punta del fuego de la
      3 y la 6, que se desvanece.
- [ ] El subrayado del hueco no toma la sangría: va como espacio del botón, no del texto.
- [ ] La ley 5 en el escenario: la anomalía va AFUERA de la cerca, a la izquierda, y el punto que
      pasa por afuera viaja por debajo de la cerca hasta ella; dentro de la cerca solo quedaba
      lugar detrás de la nave. Su cielo se centra en 111 (`cieloCentradoEn`): la cerca y la lectura
      bajan más que la pantalla de la ley 4. El árbol se achica para dejarle a la pantalla un
      renglón de lectura, `total` y `N/7` revisados: el valor solo se ve ahí, en rojo con "!"
      cuando quedó viejo, y cambia cuando el barrido enciende el árbol, no antes (sin movimiento,
      al toque). Antes la demo en papel tenía su propio árbol y su propio total, y el desafío
      parcheaba con otro código. A 600 px "correr" va al lado del código (debajo, solo bajo
      480 px): debajo, la consola pasaba 10 px el pie, "correr" quedaba tapado por "Anterior" y al
      bajar el HUD pisaba "LEY 5". La caja de la nave incluye la antena: el choque con la anomalía
      se mide contra cada forma de la nave, no contra esa caja.
- [ ] La ley 2 en el escenario: la pantalla de la nave es el DOM, una sola vez, con tres
      instrumentos rotulados con el selector que los busca (`h1`, `#count`, `#status`). La consola
      tiene las tres líneas, y el hueco es el selector de la del título (`'#titulo'`, `h1`,
      `.titulo`). Cada línea sale de la nariz como una ficha con su selector y va al instrumento de
      ese rótulo; la que no encuentra nodo busca por la pantalla, se vuelve `null` y cae debajo, a la
      derecha, donde queda hasta la próxima corrida, y su renglón dice `// null`. En el medio, a
      390 px la ficha caída pisaba la leyenda. Antes el desafío usaba otro código
      (`<h2 class='titulo'>`) y no se entendía, la caja de nodos en papel se achicaba después de los
      clicks y la nave era una lámina al costado. La mano señala el selector, no la punta del
      renglón, y el paso 2 nombra el selector que dio `null`: con "Cambiá el querySelector." el paso
      no entraba en la fila de "Mostrame" a 600 px, y la consola bajaba un renglón más. A 600×800 la
      hoja baja 48 px (la ley 4, 121), con "correr" a la vista desde el arranque.
- [ ] La ley 3 en el escenario: la pantalla de la nave ES el pipeline, en vertical (DOM, style,
      layout, paint, composite) con las capas caras marcadas. Antes la demo en papel lo dibujaba
      dos veces (el SVG ancho y el vertical en HTML) y la lámina repetía el costo en barras de 16
      ms. Cada corrida dibuja su flujo pieza por pieza, con el pulso en la punta
      (`recorridoDelFlujo`, función pura): caro baja derecho por todas, color salta layout y
      transform salta las dos caras por el carril de la izquierda; las salteadas quedan tachadas
      desde el arranque. La palabra del costo aparece cuando el flujo llega, y recién ahí cambia el
      vuelo (a los tirones y la nave trabada, o de corrido). El hueco es la propiedad y rota de la
      más cara a la más barata (`left`, `textContent`, `color`, `transform`): la mano alterna el
      hueco y "correr" para que se vean las cuatro, y se resuelve recién al correr `transform`.
      Rótulos de 13.5 unidades o más y, por debajo de 560 px de escena, el `viewBox` encuadra la
      nave con su fuego y su pantalla (`cieloAngosto`): con el cielo de sobra, a 390 px la escena
      quedaba a 0.69 y "capas caras" en 8 px; encuadrada, a 0.99, el más chico va en 13 px. En
      angosto el código va más apretado y la página entera entra sin scroll: medido en el libro a
      1440×900 y 390×844, con "correr" y "Siguiente página" a la vista. Las cajas de
      texto no se tocan (`getBoundingClientRect` entre todos los rótulos de la pantalla): con
      filas cada 34 unidades "capas caras" pisaba a layout y a paint, y "barato" quedaba pegado a
      "style"; la fila de DOM baja hasta despegarse del brillo del vidrio.
- [ ] La ley 1 en el escenario: la consola dibuja el HTML a mano, sin `app-code` ni `app-tree`.
      Cada tag que abre es un botón dorado que revela su pieza; tocado, blanco, y su renglón se
      marca (franja lila con raya; en rojo si lo que abre quedó fuera de su panel; destella dorado
      al marcarse). Un cierre suelto se marca con su elemento (`estadoDelRenglon`). (2026-11-11)
      Al lado del código va el ÁRBOL DE NODOS, de arriba hacia abajo, con el color de cada pieza de
      la pantalla: la pantalla es como se dibuja, el árbol es como se lee. Defecto resuelto
      (Damian): sin él, "el HTML es un árbol" no se veía como árbol. Se ve lo tocado y, punteados,
      sus ancestros (sin nada tocado, la raíz): el árbol entero de entrada delataba el bug. Con el
      bug, `h3` y `p` cuelgan de `main` en rojo; al mover el cierre se mudan bajo `article` con su
      rama. El lienzo mide lo de la versión más ancha (5 hojas): con el suyo, al arreglar todo
      cambiaba de escala. Alto fijo en `em` (el del código) y ancho por su proporción: estirado a
      lo ancho, el árbol quedaba chico en un vidrio vacío, y con `aspect-ratio` sin alto se iba a
      una fila propia de 1868×752. Los paneles oscuros llevan borde lila: `main` no se veía.
      El bug es `<article></article>` cerrado enseguida, con `<h3>` y `<p>` sangrados adentro: al
      revelarlos aparecen donde los pone la sangría y CAEN al fondo del marco, el panel queda en una
      tira vacía, lo caído va rodeado en rojo y la nave se preocupa. Los lugares punteados de los
      hijos van ENCIMA del marco de `<main>`: debajo, el marco los tapaba apenas aparecía y el panel
      chico no mostraba lo que había perdido. El hueco `</article>` no se delata en el paso 1 (es un
      cierre más); en el paso 2 va dorado y, movido, verde: el título y el párrafo suben a su panel y
      recién ahí la nave festeja. El código no se envuelve (la sangría va en `ch`) y va a renglón
      1.4: son 10 renglones arreglado, contra 3 de la ley 5. A pantalla entera entra sin scroll a
      1440×900, 1366×768 y 1280×640: la ventanilla cede el renglón que suma el arreglo. Con el
      árbol, suelto a 390×844 baja 50 px con "más abajo" (la excepción del celular). Antes el desafío era "parsear" un `<div>` adentro de un `<p>`, con otro código: no se
      entendía.
- [ ] La ley 6 en el escenario (Signal Space): la pantalla de la nave es el árbol de la ley 5 y,
      arriba, la lectura "revisados N/7"; la caja ámbar del valor tiene un hilo hasta cada `<p>`
      que lo lee. El hueco es la declaración (`let total = 0;` ↔ `const total = signal(0);`) y la
      escritura la sigue (`total++;` ↔ `total.update((t) => t + 1);`): con `let` se barre el árbol
      entero, los siete quedan en rosa y la lectura en rojo; con el signal el aviso corre solo por
      los dos hilos, se encienden los dos `<p>` en verde y el resto se apaga. La cuenta cambia
      cuando el aviso llega o el barrido termina, no antes (sin movimiento, al toque): al toque,
      decía 2/7 con el árbol todavía en rosa. La lectura va ARRIBA
      del árbol: abajo la cruzaban los hilos, que entran a los nodos desde abajo. Antes la demo en
      papel tenía su propio árbol de pastillas con "count.set(1)" y "Reiniciar", y el desafío era
      un sistema de perilla aparte (`SIGNAL_NOTIFY_SYSTEM`): tres tarjetas que a 390 scrolleaban.
      A 390 la consola es corta y la ventanilla queda más alta que ancha (412 px): con el cielo de
      340 `cieloAngosto` se rendía y el recorte le comía a la pantalla el último `<p>` y la cuenta.
      La lámina pinta un cielo de 520 y encuadra con ese alto. Medido con input real en la historia
      a 1440×900 y suelto a 1440×900 (con movimiento reducido), 1280×640 y 390×844: entra sin
      scroll, "Mostrame" la resuelve, y "Seguir" vuelve a "Guarden esa pregunta.".
- [ ] La ley va a la izquierda también entre 700 y 1099: la regla de la grilla la centraba.
- [ ] Integrada, medido con input real a 1920×1080, 1440×900, 1366×768 (entra sin scroll),
      1280×640 (consola al costado) y 1024×700, y a 600×800: sin desborde horizontal, sin choques
      entre título, HUD, cabeza, leyenda, nave, pantalla, "Mostrame" y pie, la nave y su pantalla
      adentro de la ventanilla, y "Mostrame" hasta los dos pasos hechos.
- [ ] La escena REACCIONA a la demo, no la ilustra: el árbol se arma con cada tag tocado, el paquete
      viaja al instrumento que nombra la línea, el paisaje va a los tirones con el cambio caro, el
      lápiz se saltea el lugar que el handler olvida (en el panel de la ley 4, el lugar viejo va en
      rojo con "!", un "Sí" al día en verde y el resto neutro: un múltiplo que se cumple se ve sin
      leer), el barrido de Zone.js no ve lo que pasa por
      afuera de la cerca. Y el desafío resuelto hace saltar a la nave.
- [ ] La página sabe su número, su ley y lo que dice la nave por un token (`PAGINA_DEL_MANUAL`) que
      la vista pasa al montarla: la misma pantalla en la molécula no lo recibe y no muestra la
      cabeza del manual.
- [ ] GSAP vive solo en los chunks diferidos de las páginas: el bundle inicial no lo trae.
- [ ] Nada que GSAP anime tiene su posición en el atributo `transform`: GSAP lo pisa. Las cejas de
      la nave, envueltas en su propio `<g>`; sin eso quedaban debajo de los ojos y la cara, triste.
- [ ] La hoja del manual no selecciona texto (`user-select: none`): clickear varias veces un tag
      del código lo pintaba de azul. La escena tampoco, para poder pinchar a la nave.
- [ ] Clicks rápidos sobre un tag alternan: `app-code` lee la selección de su signal, no del objeto
      que le pasa el template. Con tres clicks seguidos la vista no se rehacía, los tres decían
      'Select' y el árbol duplicaba el nodo (NG0955).
- [ ] Tocar un tag marca el ELEMENTO entero, como una sola marca: `<h2> Introduction </h2>` es un
      nodo con su texto, y marcar solo la apertura lo leía como tres cosas. El texto y el cierre
      también son blanco del toque; solo la apertura es parada de teclado.
- [ ] El ancho máximo de 64rem de las pantallas en la molécula se anula en la hoja: con él, a 2000 px
      la página quedaba en una franja angosta. El CSS del manual vive en `manual-de-a-bordo.css`.
- [ ] En cada escena, nada importante detrás de la nave: el planeta va arriba a la izquierda, el
      lápiz descansa adentro del cuadro y el rótulo "zone" cuelga de la cerca. Con movimiento
      reducido cada escena queda en el momento que explica, sin bucles.
- [ ] Afuera del prólogo (el manual suelto y el viaje), detrás de la hoja va el negro opaco de la
      tele apagada: con un velo, el mapa se leía a través y "11 sin establecer" se pisaba con la
      cabecera.
- [ ] Pasar de página se ve: la página nueva entra deslizándose, con su título, desde el lado al
      que se va. La hoja de papel que giraba desde el lomo, sobre una hoja sin papel, era un
      destello blanco a pantalla entera. Sin animación con movimiento reducido.
- [ ] Suelto, medido a 1280×640, 1024×700 y 600×800 con input real: rueda, teclas y los botones;
      la molécula no se mueve mientras está abierto, y sí al volver a la bitácora.
- [ ] Con las escenas, medido con input real en la historia a 1440×900 y 1280×640, suelto a
      1024×700 y 600×800, y suelto a 1440×900 con movimiento reducido: sin solapes con el HUD y sin desborde horizontal en las cinco páginas.

**El libro de leyes integrado a la pantalla** (el manual y Signal Space, `prologo__manual--libro`):

- [ ] El libro es la pantalla de la nave, ENTERA (como la tele del viaje a Japón): no un modal
      encima de la historia. Al "¡Rápido, el manual de a bordo!" la cámara se acerca a la escena y
      todo queda negro; la pantalla se prende como una tele vieja (un punto, una raya de luz que
      se abre, el fogonazo que se asienta) y adentro la página es el mundo: el cielo y la nave de
      borde a borde, la ley arriba sobre ese cielo, y la consola como franja de abajo. El vidrio se
      ve desde adentro: esquinas redondeadas y un reflejo que casi no se nota. Después de la última
      página la pantalla se apaga (raya, punto) y la historia sigue con "Debería ser imposible…".
      Anti-patrones: un velo o un desenfoque sobre el prólogo, una tarjeta con marco alrededor de la
      página, una × o Escape que sale, scroll o "más abajo", botones encima del código, la cabeza
      del libro en la fila del HUD, y un corte de cielo entre el prólogo y la página. Excepción
      escrita: en el celular la página no entra y scrollea con "más abajo" (ver "El comienzo en el
      celular"). La hoja del viaje habla distinto (ADR 0010): ver "El viaje".
- [ ] (2026-11-10) Con lugar (más de 760 de ancho y 500 de alto), la escena de la página llega hasta
      arriba de todo y la ley flota sobre su cielo, debajo de la barra del juego (`--pm-arriba`, que
      pone el libro). Defecto resuelto (Damian): la barra y la ley iban en una franja propia encima
      de la escena, con un degradé oscuro que le bajaba encima: el título cortaba la pantalla de la
      nave y lo que saltaba al tocar quedaba debajo de la franja. La ley no recibe toques salvo sus
      botones. Medido a 2000×800 y 3440×1300: la pantalla de la nave entra entera. En el celular la
      ley sigue en su lugar, arriba de la escena.
- [ ] (2026-11-11) La ley no se pega a la barra: la barra termina a 1rem + 44 px y `--pm-arriba` le
      suma `clamp(1.5rem, 5vh, 3.25rem)`. Defecto resuelto (Damian): a 4.25rem la ley quedaba a 8 px
      de los íconos y se leía como parte de la barra. En el celular, 0.9rem de respiro bajo la franja.
      Ancha y baja (consola al costado), la ley va en la columna de la consola, arriba, en un
      renglón: flotando sobre el cielo, a 2000×780 el título pisaba la pantalla de la nave, y en la
      columna con dos renglones 1280×640 desbordaba 115 px. En el escenario el planeta va a la
      derecha de la pantalla (x 432): arriba a la izquierda le cruzaba el título. Medido con input
      real en la historia a 1920×1080, 2000×780, 1440×900, 1366×768, 1280×1000, 1280×640 y
      1024×768: sin scroll, sin desborde horizontal, título lejos del HUD y de la pantalla.
- [ ] La tele se prende cuando la página ya está montada (`montarDiferido` avisa), y la primera
      página se pide al abrir el prólogo: prendida antes, el fogonazo pasaba mientras la página
      cargaba y se trababa un segundo. Si la página no llega en 4 s, se prende igual.
- [ ] La tele recorta (`clip-path`), no achica: con `scale(0, …)` la nave de la ley 1 medía su
      matriz al nacer y no tenía inversa (`NaveDelManual.mirar` tiraba). El blanco es la imagen
      sobreexpuesta (`brightness`): pasando a blanco con `invert`, el medio era un velo gris.
- [ ] "Anterior" y "Siguiente" van en la fila de los pasos de la consola (`pie` del token
      `PAGINA_DEL_MANUAL`), "Anterior" a la izquierda de "Mostrame", nunca sobre el código ni en una
      franja aparte. Son cartelitos de papel: le ganan a la pastilla oscura global por
      especificidad. (2026-11-11, ADR 0014) "Siguiente" llega recién con la página cumplida, verde,
      en el lugar de "Mostrame", con un salto y dos latidos; la flecha → tampoco pasa antes, y una
      página cumplida queda cumplida al volver. Defecto resuelto (Damian): siempre a la vista, en su
      propia fila al pie, se pasaba sin hacer nada y la fila existía solo para él. Medido con input
      real: sin cumplir no está ni la flecha pasa; cumplida aparece; volviendo con ← sigue.
- [ ] Medido con input real en la historia a 1440×900 y suelto a 390×844: las páginas integradas
      entran enteras, sin scroll, sin choque con el HUD y sin botón encima del código; Escape no
      cierra; "← Bitácora" vuelve. En el celular, ver "El comienzo en el celular".
- [ ] La mano guía señala lo próximo que hay que tocar y amaga el toque hasta que alguien lo toca
      (cada página dice qué con `guia`, un selector). Antes "Clickeá un tag" no decía cuál y nadie
      empezaba. Entra 1,2 s después de la ley para no robarle la mirada.
- [ ] "▶ Mostrame" toca por quien no se anima, con la misma mano y un click real en el objetivo,
      hasta que la página no señala nada nuevo (tope de 16 toques). Al terminar la mano se va y el
      botón desaparece. Con movimiento reducido la mano aparece quieta en su lugar, sin amague.
- [ ] El dedo cae en el borde derecho del objetivo, a 60 % del alto (`puntaDeLaMano`): en el centro
      tapaba el valor de las pastillas anchas, y arriba parecía señalar el renglón de abajo.
- [ ] Si la página re-mide mientras la mano entra, el viaje nuevo lleva escala y opacidad: sin
      ellas cortaba la entrada y la mano quedaba invisible.
- [ ] A 600 px o menos la vista integrada topa todo lo montado con `max-width: 100%`: la caja de la
      mano mide lo que el guante, porque adentro de una caja de 0 el guante también medía 0.
- [ ] "Mostrame" y los botones del pie le ganan a la pastilla oscura global de los botones de las
      pantallas (especificidad 0,4,1): con `.pm .pm-paso .pm-mostrar` y los selectores del libro.
- [ ] El árbol va `position: absolute` en su recuadro: con su alto natural en el flujo, el mínimo de
      la grilla crecía y la hoja desbordaba 12 px a 1366×768.
- [ ] El nodo aparece con el toque, no al final: el árbol es SVG armado por Angular. Con ECharts
      (canvas en un chunk con `@defer (on idle)`) la escena animada no dejaba al navegador ocioso y
      el árbol llegaba tarde y todo junto.
- [ ] Ningún conector cruza a otro: un nodo por fila en el orden del código y la profundidad como
      sangría (el árbol del inspector). El árbol espejado de arriba hacia abajo invertía a los
      hermanos (article antes que section) y enredaba los conectores. Cada conector sale del final
      del elemento en su renglón, no del tag: si no, tachaba el texto recién marcado.
- [ ] El árbol se centra en su recuadro y su lienzo no cambia de tamaño al revelar nodos: se mide
      con el árbol completo, así un nodo nuevo no corre a los demás.
- [ ] Los nodos con rótulo largo de la ley 5 son píldoras que crecen con el texto: "section" en
      un círculo de radio 15 se leía "ectio".
- [ ] Medido con input real a 1920×1080, 1366×768 (entra sin scroll), 1024×768 y 480×900 (scroll
      con "más abajo"), suelto a 1440×900 y con movimiento reducido: la mano a la vista y
      "Mostrame" hasta el final en las cinco páginas.

**El árbol de Signal Space** (el viejo 0/6, la misma hoja con una sola página):

- [ ] La historia se frena en "Miren el árbol." y sigue con "Guarden esa pregunta." al tocar
      "Seguir". Retomar desde `leccion-guarden` no la vuelve a abrir.
- [ ] La hoja dice "Signal Space" y la ley 6 (sigue a las cinco del manual), no "Manual de a
      bordo". Con una sola página no hay marcas, ni "1 de 1", ni "← Anterior".
- [ ] La lámina reacciona a la corrida: con el signal, el aviso viaja solo por los hilos de los dos
      nodos que leen; con `let`, el árbol entero se pinta, como en casa, y la nave se preocupa. Es
      la ley 6 en una sola pieza, como las cinco del manual (ver "La ley 6 en el escenario").
- [ ] Un desafío resuelto en una hoja del prólogo no se anota en la molécula: el motor solo cuenta
      el `sistema-establecido` que sale de una card. Antes caía en el concepto que hubiera en
      pantalla, y Signal Space marcaba Signals 1/1.

**El viaje** (cada capítulo después del prólogo: su cinemática y sus pantallas en la hoja, ADR 0007):

- [ ] Al terminar el prólogo, visto o salteado, arranca la cinemática del capítulo 1 sin pasar por
      la molécula. Escape la saltea y abre la hoja.
- [ ] La hoja dice el nombre de la etapa ("La caja que avisa"), no "Nivel 1"; cada página lleva
      el título de su pantalla y el pie dice "Seguir el viaje" en la última.
- [ ] La hoja del viaje no es un rectángulo crema a pantalla entera: el título va suelto sobre el
      cielo con la letra de la ley, la pantalla entera en una tarjeta de papel con borde de tinta, y
      en el medio del alto cuando es corta. Antes media hoja quedaba vacía debajo de la pantalla.
- [ ] El desafío (`app-manipulable-system`) va en su recuadro punteado adentro del papel, a lo
      ancho: la raya de arriba y el tope de 64rem eran para cerrar una card de la molécula.
- [ ] La pista de Angie se ve: arranca invisible y la revela la entrada del sub-nivel (`.warp`), que
      en la hoja no corre, y en el viaje no aparecía nunca. Aparece cuando la página ya asentó:
      mientras entra deslizándose es el bloque contenedor de su `fixed`, y flotaba en el medio.
- [ ] Medido con input real a 1440×900, 1366×768 (scroll de 57 px con "más abajo"), 1024×768 y
      480×900 (una columna): sin desborde horizontal; "Seguir el viaje" en la última página lleva a
      la cinemática del capítulo siguiente.
- [ ] La pista de Angie (`app-concept-card`, fija en la esquina) va por encima del pie de la hoja:
      a `bottom: 1rem` tapaba "Seguir el viaje" y el click caía en la card. Medirlo con
      `elementFromPoint` en el centro del botón.
- [ ] En un celular (hasta 760 px de ancho o 500 de alto) el pie es una consola fija abajo, AFUERA
      de lo que scrollea: "Anterior", la pista de Angie chica en el medio y "Siguiente". La hoja
      termina donde empieza la consola, así que nada de la página queda nunca debajo. Antes, a
      390×664, los carteles sticky flotaban sobre el desafío ("cambiar el valor" asomaba debajo de
      "Anterior" y el toque se lo llevaba el cartel) y la mascota pisaba la caja punteada aun al
      final. Con la pista abierta, su globo va arriba de la consola, a lo ancho. Medido con input
      real a 390×664, 360×640, 480×900 y 750×342, capítulos 1 y 10: en cada posición del scroll,
      `elementFromPoint` en el centro de cada control visible, y la consola y la pista contra todos
      los controles y contra la caja del desafío. A 1440×900 y 1024×700, igual que antes.
- [ ] Lo resuelto en una hoja del viaje se anota en la molécula con el mismo id ("0/0").
- [ ] Recargar sigue en la misma página, sin repetir el comienzo ni la cinemática. La hoja del
      viaje no tiene "Cerrar" y Escape no la cierra: es una sola historia (ADR 0008).
- [ ] Entrar nunca abre la molécula: una partida que quedó en ella (`recorrido`, `construccion`)
      carga en la colina, sin `?nivel=` en la barra, y entrar sigue el viaje; sin el comienzo visto,
      lo arranca. Antes, una partida de antes del viaje iba directo a la molécula y parecía que la
      introducción se había borrado.
- [ ] Después del capítulo 11 va la revelación, después el final, y al terminar la historia queda
      en su último cuadro, con "Empezar de cero" arriba en lugar de "Saltar" y sin el ▸. Recargar
      vuelve a ese cuadro, sin repetir la revelación. En la molécula (solo con un link), el final
      también llega después de la revelación.

## Cinemáticas de capítulo (que se sienta un juego, no un video)

Lista escrita de lo que "que se sienta como la cinemática de un RPG" significa acá. Cada ítem es
verificable con `/cine/<n>?cuadro=<beat>` (fotograma congelado) o `/cine/<n>` (reproducción).

- [ ] Se sabe QUIÉN habla sin leer: retrato, nombre y timbre de voz por personaje. El prólogo no
      lo mostraba y era la fricción número uno de un jugador nuevo.
- [ ] Una línea en pantalla por vez y nunca más de ocho palabras (lo verifica
      `cinematica-guion.spec.ts`). El texto va en la caja de diálogo, NUNCA dentro de la escena.
      La caja del prólogo de las naves escala con el ancho Y con el alto (`min(2.1vw, 4.2vh)`): a
      1440 la frase quedaba en 22 px y se leía chica, y medida solo por el ancho, en una ventana
      ancha y baja la caja de tres renglones tapaba las naves.
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
- [ ] Se juega cada vez que se llega a la parada del capítulo, aunque ya se haya visto (ADR
      0004): una vez por partida parecía un bug, porque nada decía que ya se había gastado. Salir
      de un sub-nivel al átomo del mismo capítulo no es llegar; un deep-link a un sub-nivel no se
      interrumpe; se vuelve a ver desde la bitácora.
- [ ] Como se abre sola, la pausa de la vida de fondo también la alcanza: con la pausa puesta
      se cuenta en modo quieto (el de reduced-motion), el diálogo sigue y hay cero animaciones
      corriendo en la escena.
- [ ] Las escenas se cargan diferidas (un chunk por capítulo): el bundle inicial no paga por
      trece escenas.
- [ ] Ningún actor pisa a otro ni sale del lienzo: medido con `getBoundingClientRect` en
      `?cuadro=fin` contra TODOS los `.k-actor`, no contra uno.
- [ ] El final se personaliza con la partida: solo se encienden los capítulos establecidos
      (clases `e-<n>`), la deuda queda punteada y visible.
- [ ] Dos cinemáticas seguidas (la revelación y el final) son dos instancias: la segunda se abre
      después del render que sacó a la primera. Abierta en el mismo tick, el `@if` reusaba la
      instancia desvanecida y el final corría invisible (opacidad 0) con las clases de la
      revelación. Verificar que `app-cinematica` tenga opacidad 1 y el título del final.
- [ ] Una View Transition abortada (Escape mientras abre, otra encima) no deja
      `InvalidStateError` sin manejar en la consola: medir con un listener de
      `unhandledrejection` y saltear con Escape real.
- [ ] La exploradora lleva la paleta de Angie porque es ella (ADR 0003): en el prólogo, casco,
      aletas, franja, antena y una cabina del tono de su cara (los ojos se leen por el trazo y la
      pupila); en las cinemáticas, nombre, retrato, flecha, transmisiones, la ventana, la onda y
      los paquetes del capítulo 6, y la fuente, la banda, las gotas y la ficha del 10. Lo que es del
      concepto no cambia: la molécula menta y el giro de carga del 6 son del resource, y la
      anomalía del prólogo sigue ámbar y menta. Antes la exploradora y la molécula del 6 eran del
      mismo verde. Al recolorear se cuida el PESO, no el número: el rosa al mismo alfa que el verde
      pesaba más, y el halo del 6 bajó de 0.3 a 0.22. Los dígitos blancos de los paquetes daban
      2.1:1 sobre el verde; con la faceta con luz de Angie como brillo, 3.2:1 en el peor punto. Un
      recolor busca también los comentarios que nombran el color ("un punto verde"). Mirar
      `?prologo=casa-apuren`, `/cine/6?cuadro=dos-paquetes` y `/cine/10?cuadro=rafaga`, y medir
      el nombre en las dos cajas (8:1).

## Sonido (tiene que andar en cualquier PC)

- [ ] Un solo `AudioContext` en toda la app (`libs/sonido.ts`), creado recién con un gesto.
- [ ] Nada depende de que suene: sin Web Audio, con el contexto cerrado o con el almacenamiento
      bloqueado, todo sigue en silencio y sin errores en la consola.
- [ ] Nada de `speechSynthesis`: las voces de los personajes son blips sintetizados. El ritmo de
      un diálogo no puede cambiar según qué voces tenga instaladas la máquina.
- [ ] Un solo interruptor de sonido: silenciar en la intro, el prólogo o una cinemática silencia
      en todos (preferencia `signals-sonido`). El prólogo ya no tiene botón de voces aparte:
      apagar el sonido calla también a los personajes.
- [ ] Silencio al acertar: ningún sonido de "¡bien!" al establecer un sistema.
- [ ] La música de la despedida de Angie (`integrada-vista/musica-del-presentimiento.ts`) arranca
      con el toque, no antes: el contexto se abre con ese gesto. Sale por `sonido().salida()`:
      silenciada no se agenda, y silenciar a mitad de camino la baja a cero. Se corta al
      desmontar (`apagar`). El plan es una función pura con test: un acorde por pensamiento, la
      cajita baja con el primero y sube con el segundo, y si un pensamiento dura poco toca menos
      notas en vez de pisar el siguiente. Verificarla contando por CDP los osciladores agendados
      tras un click real: contexto `running` y cada entrada en el tiempo del plan.
