import { ESCENA_ANGOSTA, cieloAngosto, saltosDelPaisaje, trazoDelHaz } from './escenas.logica';

describe('escenas del manual', () => {
  it('el paisaje va de corrido solo con el cambio barato, y a más tirones cuanto más cuesta', () => {
    expect(saltosDelPaisaje('barato')).toBe(0);
    expect(saltosDelPaisaje('caro')).toBeLessThan(saltosDelPaisaje('medio'));
  });
});

describe('cieloAngosto', () => {
  it('ancha, la escena usa el cielo de siempre', () => {
    expect(cieloAngosto(1200, 450)).toBeNull();
    expect(cieloAngosto(ESCENA_ANGOSTA, 420)).toBeNull();
  });

  it('angosta, encuadra la nave y su pantalla con el alto de la ventanilla', () => {
    // La escena de un teléfono de 390 px, a lo ancho.
    expect(cieloAngosto(390, 260)).toBe('4 -1.3 394 262.7');
  });

  it('más alta que el cielo, vuelve al de siempre en vez de dejar franjas sin pintar', () => {
    expect(cieloAngosto(300, 400)).toBeNull();
  });

  // La ventanilla de Signal Space a 390 px: la consola es corta y la escena queda más alta que ancha.
  it('con un cielo pintado más alto, encuadra también una ventanilla alta', () => {
    expect(cieloAngosto(390, 412)).toBeNull();
    expect(cieloAngosto(390, 412, { altoDelCielo: 520 })).toBe('4 -78.1 394 416.2');
  });

  // La ley 5 a 390: la cerca y la anomalía de afuera, centradas en la cerca.
  it('encuadra la franja que la lámina pida, no siempre la nave y su pantalla', () => {
    const importa = { x: -16, ancho: 412, centro: 111 };
    expect(cieloAngosto(390, 365, { altoDelCielo: 520, importa })).toBe('-16 -81.8 412 385.6');
  });

  it('sin medida todavía, el de siempre', () => {
    expect(cieloAngosto(0, 0)).toBeNull();
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
