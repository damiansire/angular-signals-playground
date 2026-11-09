import { ESCENA_ANGOSTA, cieloAngosto, saltosDelPaisaje } from './escenas.logica';

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
    expect(cieloAngosto(390, 412, 520)).toBe('4 -78.1 394 416.2');
  });

  it('sin medida todavía, el de siempre', () => {
    expect(cieloAngosto(0, 0)).toBeNull();
  });
});
