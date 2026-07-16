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

## Z-order y geometría

- [ ] Dots/círculos del riel por ENCIMA de los degradados del topbar; ningún
      degradado tapa contenido interactivo.
- [ ] El degradado inferior queda por DEBAJO del contenido, no encima.
- [ ] La órbita/elipse CONTIENE la card (la abraza, no la corta ni la pisa).
- [ ] Cero colisiones entre título, contador (1/4), dot activo y órbita:
      overlap medido con `getBoundingClientRect()` contra todos los vecinos,
      no a ojo.

## Composición y chrome

- [ ] Chrome persistente presente tras cualquier reestructuración: botón de
      inicio, riel/barra lateral, topbar (regresión ya ocurrida una vez).
- [ ] Tamaños consistentes entre niveles y sub-niveles.
- [ ] Título de la card en un renglón armónico, no partido en dos renglones
      sueltos.
- [ ] Espacio horizontal aprovechado; sin margen superior sin overlay.
- [ ] El sub-nivel actual queda fijo arriba, sin movimiento.

## Vistas y estado

- [ ] Verificar la vista CERCANA (sub-nivel) y la ALEJADA (molécula completa,
      sin átomos amontonados); un cambio puede romper solo una de las dos.
- [ ] URL sync bidireccional: navegar actualiza la URL Y pegar una URL
      restaura el estado (nivel y sub-nivel). Testear ambas direcciones.
- [ ] Probar en la ruta ancha Y en el embed angosto: un fix de layout
      (`whitespace-nowrap`, etc.) debe verificarse en los dos contextos.
