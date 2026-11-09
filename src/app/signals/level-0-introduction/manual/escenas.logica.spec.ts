import {
  ESCENA_ANGOSTA,
  cieloAngosto,
  posicionesEnElDocumento,
  saltosDelPaisaje,
} from './escenas.logica';

describe('escenas del manual', () => {
  describe('posicionesEnElDocumento', () => {
    const orden = ['main', 'section', 'h2', 'p'];

    it('ordena por el lugar en el HTML, no por el orden en que se tocaron', () => {
      expect(posicionesEnElDocumento(orden, ['p', 'main', 'h2'])).toEqual([0, 2, 3]);
    });

    it('ignora repetidos y los ids que no están en el árbol', () => {
      expect(posicionesEnElDocumento(orden, ['h2', 'h2', 'nada'])).toEqual([2]);
    });

    it('sin nada a la vista, no hay posiciones', () => {
      expect(posicionesEnElDocumento(orden, [])).toEqual([]);
    });
  });

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

  it('sin medida todavía, el de siempre', () => {
    expect(cieloAngosto(0, 0)).toBeNull();
  });
});
