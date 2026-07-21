import {
  CD_NODES,
  CD_EDGES,
  SIGNAL_DEPENDENTS,
  recheckedByZone,
  recheckedBySignals,
} from './cd-tree';

describe('cd-tree (árbol compartido Zone.js vs signals)', () => {
  it('Zone.js re-chequea todos los nodos; signals solo los dependientes', () => {
    expect(recheckedByZone()).toBe(7);
    expect(recheckedBySignals()).toBe(2);
    expect(recheckedBySignals()).toBeLessThan(recheckedByZone());
  });

  it('cada arista conecta nodos que existen', () => {
    const ids = new Set(CD_NODES.map((n) => n.id));
    for (const edge of CD_EDGES) {
      expect(ids.has(edge.from)).toBe(true);
      expect(ids.has(edge.to)).toBe(true);
    }
  });

  it('los dependientes de signals existen en el árbol', () => {
    const ids = new Set(CD_NODES.map((n) => n.id));
    for (const dep of SIGNAL_DEPENDENTS) {
      expect(ids.has(dep)).toBe(true);
    }
  });
});
