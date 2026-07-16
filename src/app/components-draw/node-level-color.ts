// Un color por profundidad de nivel del árbol DOM. Compartido entre el árbol (relleno del
// nodo) y los conectores que lo señalan desde el código, para que un mismo tag se vea del
// mismo color en los dos lugares.
export const LEVEL_PALETTE = ['#2563eb', '#059669', '#d97706', '#db2777', '#7c3aed', '#0891b2'];

export function getLevelColor(level: number): string {
  return LEVEL_PALETTE[(level - 1) % LEVEL_PALETTE.length];
}
