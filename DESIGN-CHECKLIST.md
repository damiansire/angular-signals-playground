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

## Vistas y estado

- [ ] Verificar la vista CERCANA (sub-nivel) y la ALEJADA (molécula completa,
      sin átomos amontonados); un cambio puede romper solo una de las dos.
- [ ] URL sync bidireccional: navegar actualiza la URL Y pegar una URL
      restaura el estado (nivel y sub-nivel). Testear ambas direcciones.
- [ ] Probar en la ruta ancha Y en el embed angosto: un fix de layout
      (`whitespace-nowrap`, etc.) debe verificarse en los dos contextos.
