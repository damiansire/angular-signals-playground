import { act, malformed, startOf, SystemState, turn } from '../../libs/manipulable-challenge';
import { AFTER_RENDER_SYSTEM } from './after-render-systems';

describe('after render 9/1 · un effect mide el DOM del render anterior', () => {
  const sistema = AFTER_RENDER_SYSTEM;

  function filas(n: number, desde: SystemState): SystemState {
    let state = desde;
    for (let i = 0; i < n; i++) state = act(sistema, state);
    return state;
  }

  it('sigue bien armado con las dos lecturas', () => {
    expect(malformed(sistema)).toEqual([]);
  });

  it('en un effect la medida no es cero: es el alto viejo, una fila atrás', () => {
    const state = filas(2, startOf(sistema));
    expect(state.values['real']).toBe(280);
    expect(state.values['medido']).toBe(240);
    expect(sistema.healthy(state)).toBe(false);
  });

  it('insistir en el effect no alcanza nunca al alto real', () => {
    const state = filas(5, startOf(sistema));
    expect(state.values['real'] - state.values['medido']).toBe(40);
  });

  it('después del render mide el alto de este render', () => {
    const state = filas(2, turn(sistema, startOf(sistema), 'perilla'));
    expect(state.values['medido']).toBe(state.values['real']);
    expect(sistema.healthy(state)).toBe(true);
  });

  it('sin sumar filas todavía no hay desfase que notar', () => {
    expect(sistema.healthy(turn(sistema, startOf(sistema), 'perilla'))).toBe(false);
  });
});
