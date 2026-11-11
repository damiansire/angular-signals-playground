import { saltosDelPaisaje, trazoDelHaz } from './escenas.logica';

describe('escenas del manual', () => {
  it('el paisaje va de corrido solo con el cambio barato, y a más tirones cuanto más cuesta', () => {
    expect(saltosDelPaisaje('barato')).toBe(0);
    expect(saltosDelPaisaje('caro')).toBeLessThan(saltosDelPaisaje('medio'));
  });
});

describe('trazoDelHaz', () => {
  it('va de la nariz al borde izquierdo de la pantalla, entrando por debajo de las esquinas', () => {
    expect(trazoDelHaz({ x: 66, y: 0 }, { izquierda: 266, arriba: -89, abajo: 89 })).toBe(
      'M66.0 0.0L266.0 -59.0L266.0 59.0Z',
    );
  });

  it('sin pantalla adelante de la nariz (en el celular va abajo), no hay haz', () => {
    expect(trazoDelHaz({ x: 66, y: 0 }, { izquierda: 70, arriba: 80, abajo: 300 })).toBeNull();
    expect(trazoDelHaz({ x: 66, y: 0 }, { izquierda: 266, arriba: 10, abajo: 10 })).toBeNull();
  });
});
