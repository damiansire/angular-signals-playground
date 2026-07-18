import { scrollLayout, snapStops, initMolecule, cameraAt, CONCEPT_COUNT } from './molecule-engine';
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

describe('cameraAt — matemática de cámara del recorrido (pura, sin DOM)', () => {
  // Geometría con números redondos para poder verificar el lerp/smoothstep a mano.
  const geom = {
    W: 1,
    cen: { x: 100, y: 100 },
    target: { x: 200, y: 200 },
    parent: { x: 0, y: 0 },
  };
  const FK = 2.7;

  it('en la zona de sub-niveles (w>=2): zoom máximo y buceo total, con la cámara inclinada un toque hacia el concepto anterior', () => {
    const cam = cameraAt(2.5, false, geom);
    expect(cam.K).toBe(FK);
    expect(cam.diveDepth).toBe(1);
    // lean 0.2 desde el átomo actual (200,200) hacia el anterior (0,0): el vecino asoma en el frame.
    expect(cam.fx).toBeCloseTo(160, 5);
    expect(cam.fy).toBeCloseTo(160, 5);
  });

  it('primer concepto en sub-niveles (w>=2, isFirst): sin lean porque no tiene anterior', () => {
    expect(cameraAt(2.5, true, geom)).toEqual({ K: FK, fx: 200, fy: 200, diveDepth: 1 });
  });

  it('primer átomo en vista molécula (w<1.3): zoom wide centrado en el centroide, sin buceo', () => {
    expect(cameraAt(1.0, true, geom)).toEqual({ K: 1, fx: 100, fy: 100, diveDepth: 0 });
  });

  it('primer átomo buceando (w=1.65): interpola wide→FK y foco centroide→átomo (t=0.5)', () => {
    const cam = cameraAt(1.65, true, geom); // smoothstep(0.5)=0.5
    expect(cam.K).toBeCloseTo(1.85, 5); // lerp(1, 2.7, 0.5)
    expect(cam.fx).toBeCloseTo(150, 5); // lerp(100, 200, 0.5)
    expect(cam.diveDepth).toBeCloseTo(0.5, 5);
  });

  it('átomo interno naciendo (w=0.35): interpola FK→wide desde el padre, sin buceo', () => {
    const cam = cameraAt(0.35, false, geom); // smoothstep(0.5)=0.5
    expect(cam.K).toBeCloseTo(1.85, 5); // lerp(2.7, 1, 0.5)
    expect(cam.fx).toBeCloseTo(50, 5); // lerp(0, 100, 0.5)
    expect(cam.diveDepth).toBe(0);
  });

  it('átomo interno buceando (w=1.65): interpola wide→FK con buceo creciente', () => {
    const cam = cameraAt(1.65, false, geom);
    expect(cam.K).toBeCloseTo(1.85, 5);
    expect(cam.fx).toBeCloseTo(150, 5);
    expect(cam.diveDepth).toBeCloseTo(0.5, 5);
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
