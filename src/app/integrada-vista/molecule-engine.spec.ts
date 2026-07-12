import { scrollLayout } from './molecule-engine';

describe('scrollLayout', () => {
  it('un concepto sin sub-niveles ocupa 2 unidades (nace + bucea)', () => {
    const { off, len, total } = scrollLayout([null, null, null]);
    expect(len).toEqual([2, 2, 2]);
    expect(off).toEqual([0, 2, 4]);
    expect(total).toBe(6);
  });

  it('un concepto con N sub-niveles ocupa N + 1 unidades', () => {
    const { len } = scrollLayout([4, 7, null]);
    expect(len).toEqual([5, 8, 2]); // Introducción (4) → 5, Signals (7) → 8, plano → 2
  });

  it('los offsets acumulan los largos y el total cierra', () => {
    const { off, total } = scrollLayout([4, 7, null, null]);
    expect(off).toEqual([0, 5, 13, 15]);
    expect(total).toBe(17);
  });
});
