import { azar } from './azar';

describe('azar', () => {
  it('la misma semilla da siempre el mismo número', () => {
    expect(azar(7)).toBe(azar(7));
    expect(azar(7)).not.toBe(azar(8));
  });

  it('cae siempre entre 0 y 1, sin llegar a 1', () => {
    for (let k = -50; k <= 500; k++) {
      expect(azar(k)).withContext(`semilla ${k}`).toBeGreaterThanOrEqual(0);
      expect(azar(k)).withContext(`semilla ${k}`).toBeLessThan(1);
    }
  });

  it('reparte: mil semillas seguidas no se amontonan en una mitad', () => {
    const bajas = Array.from({ length: 1000 }, (_, k) => azar(k)).filter((v) => v < 0.5).length;
    expect(bajas).toBeGreaterThan(400);
    expect(bajas).toBeLessThan(600);
  });
});
