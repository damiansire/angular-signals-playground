import { act, malformed, startOf, turn } from '../../libs/manipulable-challenge';
import { ZONELESS_SYSTEM } from './zoneless-systems';

describe('zoneless 11/1 · desde v21 Zone.js solo vuelve si se lo pide', () => {
  const sistema = ZONELESS_SYSTEM;
  const codigo = (posicion: number) =>
    sistema
      .code({ perilla: posicion })
      .map((line) => line.text)
      .join('\n');

  it('sigue bien armado', () => {
    expect(malformed(sistema)).toEqual([]);
  });

  // En v22 bootstrapApplication ya trae zoneless: la avería no puede ser "zone.js en los
  // polyfills" (eso solo no hace nada) ni el arreglo un provider que ya viene puesto.
  it('la avería es pedir Zone.js con provideZoneChangeDetection()', () => {
    expect(codigo(0)).toContain('provideZoneChangeDetection()');
    expect(codigo(0)).not.toContain('polyfills');
  });

  it('el arreglo es no pedirlo, no sumar el provider zoneless', () => {
    expect(codigo(1)).not.toContain('provideZoneChangeDetection()');
    expect(codigo(1)).not.toContain('provideZonelessChangeDetection()');
  });

  it('con Zone.js pedido, un cambio barre el árbol entero', () => {
    const state = act(sistema, startOf(sistema));
    expect(state.values['revisados']).toBe(7);
    expect(sistema.healthy(state)).toBe(false);
  });

  it('sin Zone.js, el cambio revisa solo a quien lo lee', () => {
    const state = act(sistema, turn(sistema, startOf(sistema), 'perilla'));
    expect(state.values['revisados']).toBe(1);
    expect(sistema.healthy(state)).toBe(true);
  });
});
