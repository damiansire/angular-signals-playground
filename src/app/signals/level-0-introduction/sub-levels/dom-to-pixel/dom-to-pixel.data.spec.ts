import { renderCost } from '../../../../libs/render-pipeline';
import { CAMBIOS, esBarato, queSigue, quedoFluida, siguienteCambio } from './dom-to-pixel.data';

const [LEFT, TEXTO, COLOR, TRANSFORM] = CAMBIOS;

describe('dom-to-pixel (dominio "no todo cambio cuesta lo mismo")', () => {
  it('el hueco va del cambio más caro al más barato', () => {
    expect(CAMBIOS.map((c) => renderCost(c.kind))).toEqual(['caro', 'caro', 'medio', 'barato']);
  });

  it('cada cambio trae su renglón real, con la propiedad que toca', () => {
    for (const cambio of CAMBIOS) expect(cambio.renglon).toContain(cambio.propiedad);
  });

  it('solo transform es barato', () => {
    expect(CAMBIOS.filter(esBarato)).toEqual([TRANSFORM]);
  });

  it('el hueco rota por los cuatro y vuelve al primero', () => {
    expect(CAMBIOS.reduce((c) => siguienteCambio(c), LEFT)).toBe(LEFT);
    expect(siguienteCambio(LEFT)).toBe(TEXTO);
  });

  it('queda fluida recién cuando corre transform, no al ponerlo en el código', () => {
    expect(quedoFluida(TRANSFORM, COLOR)).toBeFalse();
    expect(quedoFluida(TRANSFORM, TRANSFORM)).toBeTrue();
    expect(quedoFluida(COLOR, COLOR)).toBeFalse();
  });

  it('la guía alterna correr y el hueco hasta que corre transform', () => {
    let actual = LEFT;
    let corrido: (typeof CAMBIOS)[number] | null = null;
    const toques: string[] = [];
    for (let paso = 0; paso < 12; paso++) {
      const sigue = queSigue(actual, corrido);
      if (sigue === null) break;
      toques.push(sigue);
      if (sigue === 'correr') corrido = actual;
      else actual = siguienteCambio(actual);
    }
    expect(toques).toEqual([
      'correr',
      'propiedad',
      'correr',
      'propiedad',
      'correr',
      'propiedad',
      'correr',
    ]);
    expect(corrido).toBe(TRANSFORM);
  });
});
