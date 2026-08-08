import { cambiosDeMontaje, ordenarPorUrgencia } from './mount-window';

const N = 12;
const RADIO = 1;

describe('cambiosDeMontaje', () => {
  it('sin nada montado, monta la ventana entera', () => {
    const { montar, desmontar } = cambiosDeMontaje(5, N, RADIO, new Set());
    expect(montar).toEqual([4, 5, 6]);
    expect(desmontar).toEqual([]);
  });

  it('con la ventana ya montada no hace nada', () => {
    const { montar, desmontar } = cambiosDeMontaje(5, N, RADIO, new Set([4, 5, 6]));
    expect(montar).toEqual([]);
    expect(desmontar).toEqual([]);
  });

  it('al avanzar un concepto, monta el que entra y desmonta el que sale', () => {
    const { montar, desmontar } = cambiosDeMontaje(6, N, RADIO, new Set([4, 5, 6]));
    expect(montar).toEqual([7]);
    expect(desmontar).toEqual([4]);
  });

  it('en el primer concepto la ventana se recorta contra el borde', () => {
    const { montar } = cambiosDeMontaje(0, N, RADIO, new Set());
    expect(montar).toEqual([0, 1]);
  });

  it('en el último también', () => {
    const { montar } = cambiosDeMontaje(N - 1, N, RADIO, new Set());
    expect(montar).toEqual([N - 2, N - 1]);
  });

  it('un salto largo desmonta todo lo viejo de una', () => {
    // Deep-link o click en el índice: se pasa de un extremo al otro sin pasar por el medio.
    const { montar, desmontar } = cambiosDeMontaje(10, N, RADIO, new Set([0, 1]));
    expect(montar).toEqual([9, 10, 11]);
    expect(desmontar).toEqual([0, 1]);
  });

  it('nunca deja montado nada fuera de la ventana', () => {
    // La propiedad que evita la fuga: barre TODAS las posiciones, no solo las contiguas.
    for (let actual = 0; actual < N; actual++) {
      const montados = new Set(Array.from({ length: N }, (_, i) => i));
      const { desmontar } = cambiosDeMontaje(actual, N, RADIO, montados);
      const quedan = [...montados].filter((i) => !desmontar.includes(i));
      for (const i of quedan) expect(Math.abs(i - actual)).toBeLessThanOrEqual(RADIO);
    }
  });

  it('siempre deja montado el concepto que se está mirando', () => {
    // La propiedad que evita la card en blanco.
    for (let actual = 0; actual < N; actual++) {
      const { montar, desmontar } = cambiosDeMontaje(actual, N, RADIO, new Set());
      expect(montar).toContain(actual);
      expect(desmontar).not.toContain(actual);
    }
  });

  it('radio 0 deja solo el actual', () => {
    const { montar } = cambiosDeMontaje(5, N, 0, new Set());
    expect(montar).toEqual([5]);
  });
});

describe('ordenarPorUrgencia', () => {
  it('el que se está mirando va primero', () => {
    expect(ordenarPorUrgencia([4, 5, 6], 5)[0]).toBe(5);
  });

  it('después los vecinos, por cercanía', () => {
    expect(ordenarPorUrgencia([0, 3, 5, 9], 5)).toEqual([5, 3, 9, 0]);
  });

  it('no muta la lista que recibe', () => {
    const original = [4, 5, 6];
    ordenarPorUrgencia(original, 6);
    expect(original).toEqual([4, 5, 6]);
  });
});
