import { TIEMPOS, movidaDelTiempo } from './escuchar';

describe('la mascota escuchando música', () => {
  it('se mece dos tiempos hacia un lado y dos hacia el otro', () => {
    const lados = [0, 1, 2, 3].map((t) => Math.sign(movidaDelTiempo(t).destinos.giro ?? 0));
    expect(lados).toEqual([1, 1, -1, -1]);
  });

  it('el vaivén es parejo: los dos lados llegan igual de lejos', () => {
    const ida = movidaDelTiempo(0).destinos;
    const vuelta = movidaDelTiempo(2).destinos;
    for (const parte of ['giro', 'torcer', 'x', 'cara'] as const) {
      expect(vuelta[parte]).toBe(-(ida[parte] ?? 0));
    }
  });

  it('la cabeza va adelantada al cuerpo: se corre más de lo que gira', () => {
    const d = movidaDelTiempo(0).destinos;
    expect(Math.abs(d.cara ?? 0)).toBeGreaterThan(Math.abs(d.giro ?? 0));
  });

  it('cabecea en cada tiempo, y más fuerte en el primero del compás', () => {
    const cabeceos = [0, 1, 2, 3].map((t) => movidaDelTiempo(t).impulsos.aplastar ?? 0);
    for (const c of cabeceos) expect(c).toBeGreaterThan(0);
    expect(cabeceos[0]).toBeGreaterThan(Math.max(...cabeceos.slice(1)));
  });

  it('marca el pulso con un pie y después con el otro', () => {
    const pies = [0, 1, 2, 3].map((t) => Math.sign(movidaDelTiempo(t).impulsos.piernas ?? 0));
    expect(pies).toEqual([1, -1, 1, -1]);
  });

  it('solo levanta las cejas en el primero del compás', () => {
    const cejas = [0, 1, 2, 3].map((t) => movidaDelTiempo(t).impulsos.cejas);
    expect(cejas[0]).toBeLessThan(0);
    expect(cejas.slice(1)).toEqual([undefined, undefined, undefined]);
  });

  it('se repite cada compás, aunque lleve muchos', () => {
    for (let t = 0; t < TIEMPOS; t++) {
      expect(movidaDelTiempo(t + TIEMPOS * 37)).toEqual(movidaDelTiempo(t));
    }
  });
});
