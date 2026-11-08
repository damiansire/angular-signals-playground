import {
  HASTA_LA_NOCHE,
  SOSTENIDO,
  planDeFase,
  planDelFondo,
  type FaseDelPresentimiento,
} from './musica-del-presentimiento';

const FASES: readonly FaseDelPresentimiento[] = ['presiente', 'decide', 'luz'];

describe('la música del presentimiento', () => {
  it('es determinista: el mismo momento suena siempre igual', () => {
    for (const fase of FASES) expect(planDeFase(fase)).toEqual(planDeFase(fase));
  });

  it('el fondo es grave y dura lo que se le pide', () => {
    const fondo = planDelFondo(12);
    expect(fondo.length).toBe(2);
    expect(fondo.every((n) => n.voz === 'fondo' && n.t === 0 && n.dura === 12)).toBeTrue();
  });

  it('cada momento entra con su acorde y lo sostiene hasta que llega el siguiente', () => {
    for (const fase of FASES) {
      const acorde = planDeFase(fase, 7).filter((n) => n.voz === 'acorde');
      expect(acorde.length).withContext(fase).toBeGreaterThan(2);
      expect(acorde.every((n) => n.t === 0 && n.dura === 7))
        .withContext(fase)
        .toBeTrue();
    }
  });

  it('si nadie toca, el pensamiento no suena para siempre', () => {
    const presiente = planDeFase('presiente');
    expect(Math.max(...presiente.map((n) => n.t + n.dura))).toBeLessThanOrEqual(SOSTENIDO + 1.6);
  });

  it('la cajita baja mientras lo presiente y sube cuando decide', () => {
    const caja = (fase: FaseDelPresentimiento): number[] =>
      planDeFase(fase)
        .filter((n) => n.voz === 'caja')
        .map((n) => n.hz);
    const baja = caja('presiente');
    const sube = caja('decide');
    expect(baja.length).toBeGreaterThan(1);
    expect(baja).toEqual([...baja].sort((a, b) => b - a));
    expect(sube.length).toBeGreaterThan(1);
    expect(sube).toEqual([...sube].sort((a, b) => a - b));
  });

  it('con las luces, la caja termina antes de que caiga la noche', () => {
    const luz = planDeFase('luz');
    expect(luz.filter((n) => n.voz === 'caja').every((n) => n.t < HASTA_LA_NOCHE - 1)).toBeTrue();
    expect(
      luz.filter((n) => n.voz === 'acorde').every((n) => n.dura === HASTA_LA_NOCHE),
    ).toBeTrue();
  });

  it('si un pensamiento dura poco, toca menos notas en vez de pisar el siguiente', () => {
    const corto = planDeFase('presiente', 1.2);
    expect(corto.filter((n) => n.voz === 'caja').length).toBe(2);
  });
});
