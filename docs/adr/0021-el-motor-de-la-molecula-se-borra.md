# 0021. El motor de la molécula se borra; la vista hace lo que él todavía hacía

## Contexto

Desde [0019](./0019-la-molecula-se-retira.md) la molécula no se veía en ningún camino, pero
`molecule-engine.ts` seguía montado e invisible (`visibility: hidden`: con `display: none` el SVG
medía 0 y la cámara dibujaba NaN), y montaba una pantalla real escondida. Le quedaban tres cosas
que no eran de la molécula: avisarle a la colina si está a la vista, la pausa de las animaciones de
fondo y anotar lo establecido (T15 en `docs/historia/pendientes.md`).

## Decisión

1. **La vista hace las tres cosas, y el motor se borra** junto con todo lo que era de la molécula:
   los átomos, el riel, la barra de arriba, la guía, la bitácora, la card (`.card`, `.card--sub`),
   el aviso de "más abajo" de la card, la sacudida del fondo (`mundo-que-responde.ts`) y sus
   ayudantes (`frame-scheduler.ts`, `mount-window.ts`).
2. **La colina está tapada cuando el viaje ocupa la pantalla entera**: una cinemática o la hoja de
   una etapa. Tapada, deja de dibujar, de sonar y de animar (`setVisible(false)`). El prólogo no la
   tapa: vive adentro de ella. Antes lo decidía el scroll, y desde 0019 la colina estaba siempre
   "a la vista", también debajo del viaje.
3. **La pausa vive en `pausa-del-fondo.ts`** y su botón es el de la colina, junto al sonido. Hace lo
   mismo que hacía el motor: los loops a velocidad 0, las entradas terminadas, lo de primer plano
   (el prólogo, las cinemáticas) intacto y la pestaña oculta congelada (`anims-frozen`). El botón
   de la barra de la molécula se fue con ella.
4. **Lo establecido lo anota la hoja**: el desafío avisa con `sistema-establecido`, la hoja de la
   etapa lo escucha y la partida lo guarda como `"concepto/página"`. El formato de la partida no
   cambia; el punto `recorrido` de una partida vieja se sigue leyendo.
5. **`CAPITULO_DE_CONCEPTO` y `conceptoDeCapitulo` pasan a `viaje.ts`**, al lado de las etapas.

## Consecuencias

- El final dibuja los doce átomos por número de capítulo con lo establecido en la hoja; ya no hay
  una cinemática final que se dispare al resolver el último capítulo fuera del viaje.
- Los títulos de capítulo de la molécula (`tagline`) se fueron: el título de cada cinemática es su
  propia fuente.
- La barra de direcciones ya no se limpia al arrancar: un link `?nivel=` queda escrito hasta que el
  viaje escribe su lugar, que es el mismo.
- `.card--dissolve` se queda: es la clase de la hoja, y el CSS de los demos embebidos la usa.
