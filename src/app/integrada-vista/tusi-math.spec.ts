import {
  bisectAngle,
  dotOffset,
  emergentCircleCenter,
  introNarration,
  lineAngle,
  lineFreq,
  NARRATION_DONE,
  NARRATION_IDLE,
  phaseForLine,
} from './tusi-math';

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

  it('bisectAngle: horizontal, vertical, y luego bisecando (las ya puestas no se mueven)', () => {
    expect(bisectAngle(0)).toBe(0); // horizontal
    expect(bisectAngle(1)).toBeCloseTo(Math.PI / 2, 12); // vertical
    expect(bisectAngle(2)).toBeCloseTo(Math.PI / 4, 12); // 45° de un lado
    expect(bisectAngle(3)).toBeCloseTo((3 * Math.PI) / 4, 12); // 135° del otro
    expect(bisectAngle(4)).toBeCloseTo(Math.PI / 8, 12); // 22.5°, bisecando el primer hueco
  });

  it('bisectAngle: el ángulo de cada línea es fijo (no depende de cuántas haya) y vive en [0, π)', () => {
    // Si el ángulo de k dependiera del total, agregar líneas movería las anteriores: acá no.
    const seen = new Set<string>();
    for (let k = 0; k < 12; k++) {
      const a = bisectAngle(k);
      expect(a).toBeGreaterThanOrEqual(0);
      expect(a).toBeLessThan(Math.PI);
      seen.add(a.toFixed(9));
    }
    expect(seen.size).toBe(12); // 12 diámetros distintos
  });

  it('lineFreq sube por La menor: A3, B3, C4… A4', () => {
    expect(lineFreq(0)).toBeCloseTo(220.0, 2); // A3
    expect(lineFreq(1)).toBeCloseTo(246.94, 2); // B3
    expect(lineFreq(2)).toBeCloseTo(261.63, 2); // C4
    expect(lineFreq(7)).toBeCloseTo(440.0, 2); // A4 (una octava arriba de A3)
  });

  it('lineFreq pliega la octava cada 3: con muchas líneas el tono no se dispara a agudos', () => {
    expect(lineFreq(21)).toBeCloseTo(lineFreq(0), 6); // la octava vuelve al inicio (no sigue subiendo)
    // ninguna de las 30 líneas del intro supera G6 (~1568 Hz): sin plegar, la 30 llegaba a ~4.7 kHz
    for (let k = 0; k < 30; k++) expect(lineFreq(k)).toBeLessThan(1600);
  });

  it('introNarration: reposo sin arrancar, evoluciona con el progreso, cierra al completar', () => {
    expect(introNarration(0, false)).toBe(NARRATION_IDLE);
    expect(introNarration(0.5, false)).toBe(NARRATION_IDLE); // sin arrancar, siempre reposo
    expect(introNarration(0, true)).not.toBe(NARRATION_IDLE); // ya arrancó
    expect(introNarration(1, true)).toBe(NARRATION_DONE);
    expect(introNarration(1.5, true)).toBe(NARRATION_DONE); // clamp por las dudas
  });

  it('introNarration: es monótona (el texto nunca retrocede al subir el progreso)', () => {
    const probes = [0, 0.1, 0.3, 0.5, 0.8, 0.99, 1];
    let changes = 0;
    for (let i = 1; i < probes.length; i++) {
      if (introNarration(probes[i], true) !== introNarration(probes[i - 1], true)) changes++;
    }
    expect(changes).toBeGreaterThanOrEqual(3); // hay varias etapas distintas en el camino
  });
});
