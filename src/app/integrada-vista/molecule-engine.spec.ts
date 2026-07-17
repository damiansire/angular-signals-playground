import { scrollLayout, snapStops, initMolecule, CONCEPT_COUNT } from './molecule-engine';
import { signalsRoutesTree } from '../app.routes';

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

describe('snapStops', () => {
  it('arranca en 0 (overlay inicial), antes del átomo del primer concepto', () => {
    const stops = snapStops([2, null]);
    expect(stops[0]).toBe(0);
    expect(stops[1]).toBe(1.3); // átomo enfocado del concepto 0
  });

  it('un concepto con N sub-niveles aporta átomo + N paradas, una por sub-nivel', () => {
    const stops = snapStops([2, null]);
    // concepto 0 (off 0): átomo 1.3, sub 1 → 1.95, sub 2 → 2.5
    expect(stops.slice(0, 4)).toEqual([0, 1.3, 1.95, 2.5]);
    // concepto 1 (off 3, plano sin sub-niveles): solo su átomo, en 3 + 1.3
    expect(stops.slice(4)).toEqual([4.3]);
  });

  it('cada parada es estrictamente mayor que la anterior (nunca retrocede ni se repite)', () => {
    const stops = snapStops([4, 7, 2, null]);
    for (let i = 1; i < stops.length; i++) {
      expect(stops[i]).toBeGreaterThan(stops[i - 1]);
    }
  });
});

describe('CONCEPT_COUNT — RAW ↔ signalsRoutesTree acoplados por índice', () => {
  it('RAW tiene la misma cantidad de conceptos que el árbol de rutas de signals', () => {
    // Si alguien agrega/quita un nivel en app.routes sin tocar RAW, este test rompe antes
    // de que el motor descarte el nivel en silencio.
    expect(signalsRoutesTree.length).toBe(CONCEPT_COUNT);
  });

  it('initMolecule falla ruidoso si subCounts no coincide con RAW', () => {
    const root = document.createElement('div');
    const mountStub = () => ({ dispose: () => undefined, reveal: null });
    expect(() =>
      initMolecule(root, mountStub, [1, 2, 3], null, () => undefined, null),
    ).toThrowError(/subCounts tiene 3 conceptos pero RAW tiene 12/);
  });
});
