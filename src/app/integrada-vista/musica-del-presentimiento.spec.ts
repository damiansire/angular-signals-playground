import { planDelPresentimiento, type TiemposDelPresentimiento } from './musica-del-presentimiento';

const TIEMPOS: TiemposDelPresentimiento = {
  presiente: 0.24,
  decide: 2.54,
  seVuelveLuz: 4.86,
  noche: 10.5,
};

describe('planDelPresentimiento', () => {
  const plan = planDelPresentimiento(TIEMPOS);

  it('es determinista: el mismo momento suena siempre igual', () => {
    expect(planDelPresentimiento(TIEMPOS)).toEqual(plan);
  });

  it('no suena antes del toque ni sigue después de la noche', () => {
    for (const n of plan) {
      expect(n.t).toBeGreaterThanOrEqual(0);
      if (n.voz !== 'caja') expect(n.t + n.dura).toBeLessThanOrEqual(TIEMPOS.noche + 0.6 + 1e-9);
    }
    expect(plan.filter((n) => n.voz === 'caja').every((n) => n.t < TIEMPOS.noche - 1)).toBeTrue();
  });

  it('cambia de acorde justo con cada pensamiento', () => {
    const entradas = [...new Set(plan.filter((n) => n.voz === 'acorde').map((n) => n.t))];
    expect(entradas).toEqual([TIEMPOS.presiente, TIEMPOS.decide, TIEMPOS.seVuelveLuz]);
  });

  it('la cajita baja mientras lo presiente y sube cuando decide', () => {
    const caja = plan.filter((n) => n.voz === 'caja');
    const primero = caja.filter((n) => n.t < TIEMPOS.decide).map((n) => n.hz);
    const segundo = caja
      .filter((n) => n.t >= TIEMPOS.decide && n.t < TIEMPOS.seVuelveLuz)
      .map((n) => n.hz);
    expect(primero.length).toBeGreaterThan(1);
    expect(primero).toEqual([...primero].sort((a, b) => b - a));
    expect(segundo.length).toBeGreaterThan(1);
    expect(segundo).toEqual([...segundo].sort((a, b) => a - b));
  });

  it('si un pensamiento dura poco, toca menos notas en vez de pisar el siguiente', () => {
    const corto = planDelPresentimiento({ ...TIEMPOS, decide: 1.4, seVuelveLuz: 2 });
    const primero = corto.filter((n) => n.voz === 'caja' && n.t < 1.4);
    expect(primero.length).toBe(2);
  });
});
