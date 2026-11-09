import { DURA_LA_RADIO, planDeLaRadio, type GolpeDeRadio } from './ruido-de-radio';

describe('el ruido de la radio', () => {
  const plan = planDeLaRadio();
  const chasquidos = plan.filter((g) => g.tipo === 'chasquido');
  const silbidos = plan.filter(
    (g): g is Extract<GolpeDeRadio, { tipo: 'silbido' }> => g.tipo === 'silbido',
  );

  it('es siempre el mismo con la misma semilla, y otro con otra', () => {
    expect(planDeLaRadio()).toEqual(plan);
    expect(planDeLaRadio(99)).not.toEqual(plan);
  });

  it('todo cae dentro de lo que cubre el plan, en orden', () => {
    for (let i = 0; i < plan.length; i++) {
      expect(plan[i].t).toBeGreaterThanOrEqual(0);
      expect(plan[i].t).toBeLessThan(DURA_LA_RADIO);
      if (i > 0) expect(plan[i].t).toBeGreaterThanOrEqual(plan[i - 1].t);
    }
  });

  it('los chasquidos son irregulares y nunca van pegados', () => {
    expect(chasquidos.length).toBeGreaterThan(10);
    const huecos = chasquidos.slice(1).map((c, i) => c.t - chasquidos[i].t);
    for (const h of huecos) expect(h).toBeGreaterThanOrEqual(0.18);
    expect(new Set(huecos.map((h) => h.toFixed(2))).size).toBeGreaterThan(huecos.length / 2);
  });

  it('el dial va y viene: los silbidos alternan entre subir y bajar', () => {
    expect(silbidos.length).toBeGreaterThan(3);
    silbidos.forEach((s, i) => {
      const sube = s.hasta > s.desde;
      expect(sube).toBe(i % 2 === 0);
      expect(s.t + s.dura).toBeLessThan(DURA_LA_RADIO);
    });
  });

  it('los silbidos van más bajo que los chasquidos: se adivinan, no pitan', () => {
    const masFuerte = Math.max(...silbidos.map((s) => s.volumen));
    const masSuave = Math.min(...chasquidos.map((c) => c.volumen));
    expect(masFuerte).toBeLessThan(masSuave);
  });
});
