# 0019. La molécula se retira: los links abren la hoja del viaje

## Contexto

Con [0008](./0008-entrar-siempre-sigue-la-historia.md) la molécula dejó de ser una salida, pero
seguía en dos lugares: un link `?nivel=` la abría, y la rueda o las flechas en la colina bajaban a
los átomos y abrían la cinemática del capítulo 1 desde ahí. Damian volvió a encontrarla el
2026-11-11 ("Tu recorrido", los átomos, "scrolleá para bucear") y pidió que no exista más: todo
pasó al viaje y a las cinemáticas.

## Decisión

Reemplaza el punto 4 de 0008 y el punto 5 de 0007.

1. **Un link `?nivel=X(&sub-nivel=Z)` abre la misma pantalla en la hoja del viaje.** Se guarda
   como el lugar del viaje (`lugarDelLink`), y el aviso sigue directo ahí
   ([0015](./0015-con-partida-el-aviso-sigue-directo-donde-quedo.md)). Con solo el nivel, abre la
   cinemática de ese capítulo.
2. **El viaje escribe su lugar en la barra de direcciones** con el mismo formato: copiar el link
   lleva a la misma página. La ida y la vuelta tienen un test cada una.
3. **La colina no baja**: el escenario no scrollea, y el motor ya no navega con la rueda ni con el
   teclado. Lo que era de la molécula (los átomos, el riel, la barra, la guía) no se ve.
4. **"Practicá" pasa a la barra de la hoja**: era un link de la barra de la molécula.

## Consecuencias

- La molécula ya no se ve en ningún camino, pero su motor (`molecule-engine.ts`) sigue: también
  maneja la visibilidad de la colina, la pausa de las animaciones y lo establecido. Borrarlo exige
  pasar eso a la vista primero; es un cambio aparte.
- La bitácora y "Seguir el viaje" quedaban del lado de la molécula: ya no se abren.
- `rueda-rescate.ts` se va: era el rescate de la rueda de la molécula.
