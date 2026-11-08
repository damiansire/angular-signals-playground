import { cuadrosDelCosto, posicionesEnElDocumento, saltosDelPaisaje } from './escenas.logica';

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

  describe('cuadrosDelCosto', () => {
    const pasados = (costo: Parameters<typeof cuadrosDelCosto>[0]): number =>
      cuadrosDelCosto(costo, 15).filter((c) => c > 1).length;

    it('barato nunca se pasa del cuadro', () => {
      expect(pasados('barato')).toBe(0);
    });

    it('medio se pasa a veces, y caro casi siempre', () => {
      expect(pasados('medio')).toBeGreaterThan(0);
      expect(pasados('caro')).toBeGreaterThan(pasados('medio'));
      expect(pasados('caro')).toBe(15);
    });

    it('sale igual cada vez', () => {
      expect(cuadrosDelCosto('medio', 8)).toEqual(cuadrosDelCosto('medio', 8));
    });
  });

  it('el paisaje va de corrido solo con el cambio barato, y a más tirones cuanto más cuesta', () => {
    expect(saltosDelPaisaje('barato')).toBe(0);
    expect(saltosDelPaisaje('caro')).toBeLessThan(saltosDelPaisaje('medio'));
  });
});
