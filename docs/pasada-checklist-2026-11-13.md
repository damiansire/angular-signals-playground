# Pasada completa del DESIGN-CHECKLIST (2026-11-13)

Los 299 ítems de `DESIGN-CHECKLIST.md`, verificados en pantalla contra el dev server con Edge
headless manejado por CDP e input real (clicks, teclas, rueda, dedo). Nueve revisores, uno por tramo
del archivo; cada falla trae pasos, tamaño de pantalla y números. Las líneas (`L…`) son las del
checklist al momento de la pasada.

| Veredicto                           | Ítems |
| ----------------------------------- | ----- |
| Cumple                              | 215   |
| Falla                               | 61    |
| Ya no aplica (la molécula se borró) | 9     |
| Comprobado por código               | 14    |

Las 61 fallas cuentan repetidos: varios defectos los reportaron dos o tres revisores por separado
(el globo a 1280×640, el skip-link tapado, la hoja de 7/4 a 375). Sin repetir son unos 50.

## Arreglado en esta pasada

Cada uno quedó comprobado en pantalla después del arreglo, y anotado en el checklist.

- **La flecha de `envioGratis` en el carrito** (L1597). Regresión del día anterior: la condición
  nueva la descartaba en cualquier ancho, porque el Reto vive en la columna del código.
- **La hoja del minijuego no bajaba en el celular** (L980, L990): ni el dedo ni la rueda la movían,
  el botón de probar quedaba fuera de la vista y solo se podía saltar.
- **Tocar una nave del prólogo nunca llegaba a la nave**: el destello, invisible y del tamaño de la
  escena, se quedaba con todos los toques. Las quejas de las naves no salían nunca.
- **La hoja siguiente del minijuego abría con el scroll de la anterior.**
- **El aviso de auriculares pisaba la preferencia de sonido** (L1610): quien lo había apagado lo
  encontraba prendido, y seguir lo volvía a prender.
- **El skip-link tomaba el foco tapado** por la hoja del viaje y por las cinemáticas (L79, L1551).
- **La caja con `role="button"` no respondía al espacio** (L83).
- **El latido de 3/1 no se enteraba del movimiento reducido cambiado en vivo** (L174).
- **Las notas del aviso seguían en loop con movimiento reducido** (L176).
- **Cuatro grupos de opciones sin `aria-pressed`** (L244): 5/1, 5/2, 6/1 y 6/2.
- **La capa lejana del capítulo 6 iba con la crema entera** (L1523 a).
- **Recargar en el último cuadro volvía a la página 11/1 y perdía el fin** (L1506).

Después de la pasada, en una segunda tanda, el manual de a bordo en pantallas bajas:

- **El globo de la nave tapaba "Manual de a bordo" y la bajada** (L1073, L1280, L1317, L1342; lo
  reportaron tres revisores): con 720 de alto o menos, la ley va sobre la columna de la pantalla.
- **La portada de la ley 1 scrolleaba** (L1342, L1239): hasta 52 px a 2000×700.
- **La pista de cómo se arrastra `</article>` salía cortada** (L1159) a 1280 y a 1024 de ancho.

## Fallas que quedan abiertas

### El manual de a bordo y el árbol (prólogo)

- **El marco de la portada tapa la punta del anillo del planeta a 1280×640** (L1091): de 8 a 20 px.
- **El globo se achica 48 px cuando se va "Mostrame"** (L1059), en todos los tamaños.
- **La pantalla de la ley 4 crece 4,9 px al completar el handler a 1280×640** (L1113).
- **La llama se despega de la boca del motor** (L1183): hasta 61 px a fondo. El chisporroteo escala
  desde la punta de la llama, no desde la boca (`nave-del-manual.ts`).
- **La mano guía entra 0,5 a 0,7 s después de la ley, no 1,2 s** (L1368): un `medir()` posterior
  reemplaza la entrada demorada.
- **La hoja del árbol no dice "Signal Space"** (L1403): el nombre del libro vive en la plantilla de
  las marcas, que no se pinta con una sola página.
- **En el celular** (390×844): los rótulos SVG de las portadas quedan en 9,4 a 10,7 px (L227); las
  portadas tienen 3 px de scroll y muestran un "más abajo" fantasma (L21); "más abajo ↓" tapa el
  texto de "Leer →" en la portada de la ley 1 (L990); la ley 1 baja 385 px y la 6 no entra (L1239,
  L1263).
- **GSAP y el texto del guion del prólogo están en el bundle inicial** (L1293): la tripulación
  importa GSAP y la vista la trae estática; `cinematica-guion.ts` importa `armarReloj` de
  `prologo-guion`.

### El prólogo y el minijuego

- **Con dos cajas de diálogo a la vez, las dos frases se parten en dos renglones** a 2000×840 y
  1920×1080 (L883), unos 485 ms, cuando la Exploradora interrumpe en `casa-helado`.
- **En la ráfaga, dos rótulos de operador se pisan** a 1440×900 (L861): "catchError" sobre
  "mergeMap" 217 ms, "pipe" sobre "pipe" 249 ms.
- **El rótulo del disparo queda en 11,4 a 11,8 px** a 390×664 y 700×900; el piso es 12 (L983).
- **Al abrir cada hoja del minijuego, el óvalo queda 3 a 5 px arriba del operador** hasta la primera
  corrida (L929): se mide durante la animación de entrada.
- **Con la ayuda abierta la hoja scrollea 4 px a 1280×640 y 2 px a 700×900** (L911, L954).

### La colina y el aviso

- **En vertical, al desarmarse Angie la lamparita queda fuera de la pantalla y la gema cortada**
  (L479): a 390×844, 375×667, 500×900 y 820×1180. La lamparita es una pieza anidada en la del brazo
  y recibe dos corrimientos.
- **Los globos de las fichas** (L514): con el puntero salen girados 6° y el de sonido se corta
  arriba; a 1280×720 el de pausa pisa la "L" del título; a 375×667 se sale 42 px por la derecha.
- **Un toque sobre un globo ya escrito no lo pasa hasta que termina la voz** (L622), aunque el
  sonido esté apagado: en la respuesta de Angie son 3,7 s con el triangulito invitando.
- **A 390×844 la pantalla queda toda negra 533 a 600 ms en el zoom desde el ojo** (L647); el ítem
  pide un tercio de segundo.
- **La chispa del llamado salta 0,3 s antes de que la ola llegue a "aventuras"** (L502, menor).
- **El "¿Borrar todo? Tocá otra vez" de la colina** pisa el título 4 px a 1024×768 y se sale 11 px
  a 375×812 (L289).
- **Durante el prólogo siguen corriendo 82 a 86 loops de la colina en opacidad 0** (L171): 70
  estrellas, las letras del llamado y el halo del sol.
- **La invitación del aviso no tiene anillo de foco** (L94): un subrayado a 2,48:1.

### El viaje y sus pantallas

- **Con una partida guardada no se llega al botón de pausa** (L183, WCAG 2.2.2): la colina no se
  muestra y ni la hoja ni el aviso tienen un control que pause. Hay que decidir dónde va.
- **17 botones oscuros no son `.boton-tinta`** (L1441) y **4 siguen con color de Tailwind**
  (L1435): 1/3 a 1/7, 2/3, 3/2, 3/3, 4/1, 4/2, 8/1, 8/2, 8/3 y 9/2. En 8/2 conviven tres estilos.
  "Enfocar" y "Agregar" dan además 3,74:1 (L200).
- **Los campos de 2/3 van transparentes y sin sombra** (L1431).
- **El foco de los campos de texto no llega a 3:1** (L94): 1,66 a 2,14:1 en 2/1, 7/4 y 10/1.
- **La línea vieja del desafío queda en 2,8 a 2,9:1** (L210).
- **Con el celular acostado las naves se dibujan encima del título** (L1478): 667×375 y 640×360.
- **La hoja no entra** (L17, L379): 2/2 con el demo usado scrollea 156 px a 1440×860 ("Nothing to
  see here!" se parte en tres renglones); también 2/2 y 6/3 a 1024×768 y 3/1 a 768×1024.
- **A 375 px, un renglón del desafío de 7/4 se sale 42 px de la pantalla** (L337, L422), y el de 8/1
  6 px.
- **Con la perilla del desafío en dos renglones, el subrayado va a todo el ancho** (L408): 3/3,
  5/1, 6/3, 8/4, 8/1, 1/3 y 7/1, entre 360 y 480 px.
- **El código se parte a mitad de `this` en 6/3 a 640 px**, y baja de 27 columnas en 8/2, 3/2, 3/3
  y 7/4 (L306).
- **En la hoja nunca hay cero `requestAnimationFrame`** (L358): la tripulación del cielo mantiene
  despierto el reloj de GSAP. O se duerme, o el ítem se reescribe: es vida a propósito.

### Las cinemáticas

- **El héroe entra debajo de la tarjeta del título** en los capítulos 1, 5, 12 y 13, y **la primera
  línea entra antes que el héroe** en 2, 4, 8, 10 y 11 (L1538).
- **La antena del repetidor da 1,5:1 sobre el cielo** en los capítulos 7 y 10 (L1523 b).
- **Se animan propiedades fuera de la lista** (L1545): `letter-spacing` del título en las 13, `d`
  en el 8 y colores en varias escenas.
- **En modo quieto hay beats que no dejan nada a la vista** (L1536): en el 1, de `mascota` a
  `aviso-pulso` no cambia ningún píxel; en el 13, `transmision`.

## Fuera del checklist

Defectos que ningún ítem cubría.

- A 1024×700 la pista de Angie tapa el botón del desafío y se lleva el click (3/3, 8/2, 3/2, 5/2,
  7/1); a 1280×720 se mete 88 px en el marco del desafío en 27 de 34 pantallas.
- Si el puntero o el foco quedan sobre la lamparita al entrar, su halo sigue prendido toda la
  salida, de noche.
- Durante la salida de la colina las fichas quedan invisibles pero activas: un click cambia el
  sonido o la pausa sin que se vea.
- En el desarme, la cara de Angie queda 2,9 s apoyada sobre la piedra.
- Al irse el negro del manual, la línea que estaba al abrir reaparece a media opacidad 0,3 s.
- Las rayas de velocidad de la ley 3 pasan por "3 de 5" y se leen como tachado; con movimiento
  reducido una queda fija ahí.
- La mano del paso 2 en las leyes 3 a 6 señala la punta vacía de la franja del hueco.
- La llama de la nave del manual se corta contra el borde izquierdo al resolver la ley 1.
- El capítulo 11 repite su nombre en la barra y en la tarjeta.
- En el carrito: la bodega dibujada sigue con tres cajas después de "Vaciar carrito"; `NG0956` en
  la consola al cambiar la línea; `ResizeObserver loop completed…` en cada carga.
- 8/3: los chips de nombres salen estirados. 9/2: "Apagar" es un rectángulo rojo crudo. 10/3: un
  `""` en rojo se lee como error. 2/3: "Set" con los campos vacíos deja un "!" suelto.
- En vertical, Angie queda fuera de cuadro en la figura final del prólogo.
- Con el pedazo del prólogo caído se ve un instante la construcción de Tusi.

## Ítems cuyo texto quedó viejo

Describen algo que cambió; conviene reescribirlos o retirarlos.

- Son 34 pantallas, no 33 ni 40 (L1472 y los ítems que dicen "los 40").
- La bitácora y el manual suelto ya no existen (L1031, L1037, L1298, L1301, L1315, L1365, L1395).
- "Saltar" ya no existe en el prólogo (L1414); con el comienzo visto, el aviso sigue directo a la
  cinemática 1 (L734, L1502); la barra de la hoja dice solo el nombre de la etapa (L1418).
- "Siguiente" es el vidrio verde con latido, no un cartelito (L1357); el árbol de la ley 1 va de
  arriba hacia abajo y sin conectores (L1387); el de la ley 5 no lleva rótulos (L1393); el planeta
  va a la derecha (L1306).
- La pausa ya no deja los brazos en `rotate(0)`: frena con velocidad 0 (L538). L553 y L558 se
  contradicen sobre la boca de Angie sentada.
- L1121 da por bueno el rótulo de la ley 3 en 10,9 unidades y L1224 pide que no baje de 13,5.

## Lo que no se pudo verificar

- Todo lo que se juzga de oído: Edge corrió silenciado. Se midió qué se agenda y con qué ganancia.
- Opera Neon y la memoria de video a 3440 px (L737, L745, L767, L805): solo Edge headless.
- WebKit (L990) y el dedo en la hoja del viaje.
- Los 4 s de espera de la tele si la página no llega (L1351): solo por código, y sin test.
- En varios ítems con muchos tamaños se cubrieron 1440×900 y el más chico, no todos.
