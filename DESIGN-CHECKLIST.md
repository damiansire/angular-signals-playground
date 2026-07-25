# DESIGN-CHECKLIST — vista integrada / journey

Checklist ACUMULADO de diseño. Regla: cada defecto visual que se detecta y
resuelve se agrega acá como ítem permanente (patrón `postmortem-guardrail`).
El `design-reviewer` verifica TODOS los ítems en cada ronda, no solo el
síntoma más reciente. Origen: autopsia de las sesiones del 09 al 16 de julio
2026, donde la misma familia de defectos ("parece un modal") sobrevivió a 8
rondas de review porque cada ronda auditaba solo lo último reportado.

## Gramática de modal (la card debe sentirse parte de la escena, no una ventana)

- [ ] Sin scroll anidado dentro de la card/sub-nivel: el scroll es de la
      escena, no de una ventana interna.
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

## Color y afordancia (que el clima no tape, que el vacío no confunda)

- [ ] El wash del concepto (`.dive-aura`) IDENTIFICA, no domina: a pleno buceo el
      contenido (chips, código, texto) mantiene contraste contra el fondo teñido.
      Ojo con acumular opacidad alta + `saturate()`: se suman y lavan el contenido.
- [ ] Toda zona grande que ESPERA una interacción para llenarse dice qué esperar
      mientras está vacía. Un área que ocupa media escena sin contenido se lee
      como espacio muerto y el primerizo pasa de largo (caso: el árbol del DOM en
      html-to-tree, que solo crece al clickear). El hint se va con el contenido.

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

## Trabajo de fondo (lo que corre cuando no lo estás mirando)

- [ ] Ningún timer, effect ni fetch de un sub-nivel corre mientras su capítulo
      no está activo. La vista integrada NO desmonta las cards: marca `inert`
      la que no se ve, así que el cleanup por `DestroyRef`/`ngOnDestroy` nunca
      se dispara y un `setInterval` late desde que carga la página. Verificar
      midiendo (contar logs o ticks durante N segundos parado en otro nivel),
      no leyendo el código.
- [ ] Consola limpia mientras se recorre: un `console.log` didáctico solo
      aparece cuando el usuario está en el sub-nivel que lo enseña.

## Legibilidad del contenido embebido

- [ ] Texto que hay que LEER (valores de demo, resultados, aclaraciones) cumple
      contraste AA sobre el wash del nivel: 4.5:1 normal, 3:1 para ≥24px.
      Ojo con el remapeo de `[class*="text-blue-"]`/`text-indigo-` al acento del
      nivel en `.subhost`: una clase que en aislado contrasta bien puede quedar
      en ámbar sobre crema una vez embebida. Medir, no mirar.
- [ ] Grupos de opciones con estado elegido visible Y anunciado
      (`aria-pressed`), no solo un cambio que hay que adivinar.
- [ ] Errores de entrada avisados: si el demo descarta lo que escribiste, lo
      dice. Nada de fallar en silencio.

## Vistas y estado

- [ ] Verificar la vista CERCANA (sub-nivel) y la ALEJADA (molécula completa,
      sin átomos amontonados); un cambio puede romper solo una de las dos.
- [ ] URL sync bidireccional: navegar actualiza la URL Y pegar una URL
      restaura el estado (nivel y sub-nivel). Testear ambas direcciones.
- [ ] Probar en la ruta ancha Y en el embed angosto: un fix de layout
      (`whitespace-nowrap`, etc.) debe verificarse en los dos contextos.
