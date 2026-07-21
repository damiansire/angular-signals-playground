/**
 * Árbol de nodos compartido por los dos sub-niveles de detección de cambios (Zone.js y signals),
 * para que el contraste "cuántos nodos se re-chequean" se lea sobre el MISMO árbol. Datos puros,
 * sin DOM: la coordenada es para dibujar; `depth` ordena el barrido; `SIGNAL_DEPENDENTS` son los
 * nodos que leen el estado que cambió.
 */
export interface CdNode {
  id: string;
  label: string;
  x: number;
  y: number;
  depth: number;
}

export interface CdEdge {
  from: string;
  to: string;
}

export const CD_NODES: readonly CdNode[] = [
  { id: 'main', label: 'main', x: 170, y: 40, depth: 0 },
  { id: 'section', label: 'section', x: 95, y: 120, depth: 1 },
  { id: 'article', label: 'article', x: 245, y: 120, depth: 1 },
  { id: 'h2', label: 'h2', x: 50, y: 200, depth: 2 },
  { id: 'p', label: 'p', x: 125, y: 200, depth: 2 },
  { id: 'h3', label: 'h3', x: 215, y: 200, depth: 2 },
  { id: 'p2', label: 'p', x: 290, y: 200, depth: 2 },
];

export const CD_EDGES: readonly CdEdge[] = [
  { from: 'main', to: 'section' },
  { from: 'main', to: 'article' },
  { from: 'section', to: 'h2' },
  { from: 'section', to: 'p' },
  { from: 'article', to: 'h3' },
  { from: 'article', to: 'p2' },
];

/** Los nodos que LEEN el estado que cambió (los dos `<p>` que muestran el valor). */
export const SIGNAL_DEPENDENTS: readonly string[] = ['p', 'p2'];

/** Zone.js no sabe qué cambió: re-chequea el árbol entero. */
export function recheckedByZone(): number {
  return CD_NODES.length;
}

/** Un signal avisa exactamente quién lo lee: solo esos se re-chequean. */
export function recheckedBySignals(): number {
  return SIGNAL_DEPENDENTS.length;
}
