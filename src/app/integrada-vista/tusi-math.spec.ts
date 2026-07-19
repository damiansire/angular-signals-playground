import { dotOffset, emergentCircleCenter, lineAngle, lineFreq, phaseForLine } from './tusi-math';

describe('tusi-math', () => {
  it('reparte los diámetros cada π/n', () => {
    expect(lineAngle(0, 4)).toBe(0);
    expect(lineAngle(1, 4)).toBeCloseTo(Math.PI / 4, 12);
    expect(lineAngle(2, 4)).toBeCloseTo(Math.PI / 2, 12);
  });

  it('dotOffset es MAS: ±R en los extremos, 0 al pasar por el centro', () => {
    expect(dotOffset(100, 0, 0)).toBeCloseTo(100, 12); // extremo
    expect(dotOffset(100, Math.PI / 2, 0)).toBeCloseTo(0, 12); // centro
    expect(dotOffset(100, Math.PI, 0)).toBeCloseTo(-100, 12); // extremo opuesto
  });

  it('los puntos de un mismo color equidistan R/2 del centro emergente (el círculo oculto)', () => {
    const R = 120;
    const ph = 0.7;
    const n = 6;
    const center = emergentCircleCenter(R, ph, 0, 0, 1);
    for (let k = 0; k < n; k++) {
      const theta = lineAngle(k, n);
      const s = dotOffset(R, ph, theta);
      const px = s * Math.cos(theta);
      const py = s * Math.sin(theta);
      expect(Math.hypot(px - center.x, py - center.y)).toBeCloseTo(R / 2, 9);
    }
  });

  it('los dos colores trazan círculos con centros opuestos', () => {
    const a = emergentCircleCenter(120, 0.3, 0, 0, 1);
    const b = emergentCircleCenter(120, 0.3, 0, 0, -1);
    expect(b.x).toBeCloseTo(-a.x, 12);
    expect(b.y).toBeCloseTo(-a.y, 12);
  });

  it('con 4 choques por línea, la línea 8 aparece a fase 28·π', () => {
    expect(phaseForLine(1, 4)).toBe(0);
    expect(phaseForLine(8, 4)).toBeCloseTo(28 * Math.PI, 10);
  });

  it('lineFreq sube por La menor: A3, B3, C4… A4', () => {
    expect(lineFreq(0)).toBeCloseTo(220.0, 2); // A3
    expect(lineFreq(1)).toBeCloseTo(246.94, 2); // B3
    expect(lineFreq(2)).toBeCloseTo(261.63, 2); // C4
    expect(lineFreq(7)).toBeCloseTo(440.0, 2); // A4 (una octava arriba de A3)
  });
});
