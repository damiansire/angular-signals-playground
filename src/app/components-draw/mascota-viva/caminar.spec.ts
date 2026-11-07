import {
  APERTURA,
  LARGO_DE_PIERNA,
  LARGO_DE_PIERNA_R,
  aperturaPara,
  posturaDePaso,
  zancada,
} from './caminar';

/** Dónde apoya un pie respecto de su cadera con la pierna girada `grados` (negativo: adelante). */
const pie = (grados: number, largo: number): number => -largo * Math.sin((grados * Math.PI) / 180);
const LARGO = { piernaL: LARGO_DE_PIERNA, piernaR: LARGO_DE_PIERNA_R } as const;

describe('el paso de la mascota', () => {
  it('arranca y termina un paseo con las piernas juntas (media fase)', () => {
    for (const fase of [0.5, 1.5, 7.5]) {
      const p = posturaDePaso(fase);
      expect(p.piernaL).withContext(`fase ${fase}`).toBeCloseTo(0, 9);
      expect(p.piernaR).withContext(`fase ${fase}`).toBeCloseTo(0, 9);
    }
  });

  it('los pies van siempre en espejo, aunque las piernas no midan lo mismo', () => {
    for (let fase = 0; fase < 4; fase += 0.13) {
      const p = posturaDePaso(fase);
      expect(pie(p.piernaL, LARGO.piernaL)).toBeCloseTo(-pie(p.piernaR, LARGO.piernaR), 6);
    }
  });

  it('el pie apoyado barre hacia atrás justo una zancada por paso: no patina', () => {
    for (const paso of [0, 1, 2, 3]) {
      const desde = posturaDePaso(paso + 0.001);
      const hasta = posturaDePaso(paso + 0.999);
      // El apoyado es el que va hacia atrás (su giro crece).
      const apoyado = desde.piernaL < hasta.piernaL ? 'piernaL' : 'piernaR';
      const barrido = pie(desde[apoyado], LARGO[apoyado]) - pie(hasta[apoyado], LARGO[apoyado]);
      expect(barrido).withContext(`paso ${paso}`).toBeCloseTo(zancada(), 0);
    }
  });

  it('el pie apoyado barre a ritmo parejo: a mitad de tiempo, mitad de camino', () => {
    for (const [paso, lado] of [
      [0, 'piernaL'],
      [1, 'piernaR'],
    ] as const) {
      const al = (u: number): number => pie(posturaDePaso(paso + u)[lado], LARGO[lado]);
      expect(al(0.25) - al(0.5)).toBeCloseTo(al(0.5) - al(0.75), 6);
    }
  });

  it('cada paso cambia la pierna apoyada', () => {
    const apoyada = (paso: number): string =>
      posturaDePaso(paso + 0.2).piernaL < posturaDePaso(paso + 0.8).piernaL ? 'L' : 'R';
    expect(apoyada(0)).not.toBe(apoyada(1));
    expect(apoyada(1)).not.toBe(apoyada(2));
  });

  it('el cuerpo sube con las piernas juntas y baja con las piernas abiertas', () => {
    expect(posturaDePaso(0.5).alzar).toBeLessThan(posturaDePaso(0.02).alzar - 5);
    expect(posturaDePaso(1).alzar).toBeCloseTo(0, 6);
  });

  it('cada brazo va a contratiempo de la pierna de su lado', () => {
    const p = posturaDePaso(0.9);
    expect(Math.sign(p.brazoL)).toBe(-Math.sign(p.piernaL));
    expect(Math.sign(p.brazoR)).toBe(-Math.sign(p.piernaR));
  });

  it('se inclina hacia donde va', () => {
    for (const fase of [0.1, 0.5, 1.3]) expect(posturaDePaso(fase).giro).toBeGreaterThan(0);
  });

  it('la apertura y la zancada se corresponden', () => {
    expect(aperturaPara(zancada())).toBeCloseTo(APERTURA, 6);
    expect(aperturaPara(zancada(12))).toBeCloseTo(12, 6);
  });
});
