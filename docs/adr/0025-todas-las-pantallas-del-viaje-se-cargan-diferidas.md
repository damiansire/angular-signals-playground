# 0025. Todas las pantallas del viaje se cargan diferidas, y la siguiente se pide antes

## Contexto

`signalsRoutesTree` importaba de forma estática los componentes de los capítulos 3 a 11 (21
pantallas) y solo difería los capítulos 1 y 2 y tres pantallas pesadas. El viaje muestra una página
por vez, pero el bundle inicial las pagaba todas para dibujar la colina: 814 kB contra un
presupuesto de 740 kB, con el warning de `ng build` encendido en cada corrida.

La vista no distinguía las dos formas: `paginasDeEtapa` ya envuelve un `component` en una promesa,
así que toda página se monta por el mismo camino (`montarDiferido`).

## Decisión

1. **Todos los sub-niveles del árbol usan `loadComponent`.** El árbol queda sin imports estáticos de
   pantallas.
2. **Con una página a la vista se pide la siguiente** (`montarPagina`): pasar de página no espera a
   la red. Se pide una sola, la que sigue, y un pedido que falla no rompe nada.

## Consecuencias

- El bundle inicial baja de 814,6 kB a 714,8 kB (de 214 kB a 193 kB transferidos) y entra en el
  presupuesto: el warning se fue.
- Cada pantalla es un chunk. Sin red, una página que no se bajó no se monta: es el mismo caso que ya
  tenían los capítulos 1 y 2, y lo informa el `ErrorHandler`.
- El spec del árbol carga de verdad las 33 pantallas: una ruta de import mal escrita falla en CI,
  no en la página.
