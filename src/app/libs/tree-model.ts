/**
 * Forma del árbol que produce el parser y que los componentes de dibujo renderizan.
 *
 * Vive en `libs/` y no en `components-draw/` por la dirección de la dependencia: `libs/` es la
 * capa agnóstica del framework y no puede importar presentación. Antes estos dos tipos estaban
 * del lado del dibujo y `code-parser` los importaba hacia arriba, o sea el productor del dato
 * dependía de uno de sus consumidores.
 */

/** Un nodo ya posicionado: el parser calcula `level` y la disposición, el dibujo solo lo pinta. */
export interface NodeTree {
  name: string;
  x: number;
  y: number;
  id: string;
  color?: string;
  level: number;
}

/** Una arista entre dos nodos, por id. */
export interface Link {
  source: string;
  target: string;
}
