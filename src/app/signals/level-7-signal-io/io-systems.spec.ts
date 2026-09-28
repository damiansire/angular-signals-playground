import {
  act,
  accionesParaSaber,
  healthOf,
  malformed,
  solutionFor,
  startOf,
  SystemState,
  turn,
} from '../../libs/manipulable-challenge';
import { SIGNAL_FORMS_SYSTEM } from './io-systems';

describe('io 7/4 · la validez de un form se deriva, no se calcula al enviar', () => {
  const sistema = SIGNAL_FORMS_SYSTEM;
  const codigo = (posicion: number) =>
    sistema
      .code({ perilla: posicion })
      .map((line) => line.text)
      .join('\n');

  function editar(veces: number, desde: SystemState): SystemState {
    let state = desde;
    for (let i = 0; i < veces; i++) state = act(sistema, state);
    return state;
  }

  const derivando = () => turn(sistema, startOf(sistema), 'perilla');

  it('está bien armado en las dos posiciones de la perilla', () => {
    expect(malformed(sistema)).toEqual([]);
  });

  it('tiene solución, y con una edición alcanza para saber', () => {
    expect(solutionFor(sistema)).not.toBeNull();
    expect(accionesParaSaber(sistema)).toBe(1);
  });

  // La trampa tiene que ser la que se escribe de verdad: un signal propio, escrito en el handler.
  it('la avería valida a mano dentro de enviar() y guarda el resultado en un signal', () => {
    expect(codigo(0)).toContain('readonly valido = signal(false);');
    expect(codigo(0)).toContain('this.valido.set(esCorreo(');
    expect(codigo(0)).not.toContain('email(');
  });

  it('el arreglo declara la regla en el schema y deriva la validez del form', () => {
    expect(codigo(1)).toContain('form(this.modelo, (t) => email(t.correo))');
    expect(codigo(1)).toContain('computed(() => this.f().valid())');
    expect(codigo(1)).not.toContain('esCorreo');
  });

  it('validando al enviar, cada edición posterior queda sin validar', () => {
    const state = editar(3, startOf(sistema));
    expect(state.values['sinValidar']).toBe(3);
    expect(healthOf(sistema, state)).toBe('broken');
  });

  it('derivando del form, ninguna edición se queda con la validez vieja', () => {
    const state = editar(3, derivando());
    expect(state.values['sinValidar']).toBe(0);
    expect(healthOf(sistema, state)).toBe('healthy');
  });

  it('girar al código sano arranca una corrida nueva: hay que volver a editar', () => {
    const girada = turn(sistema, editar(2, startOf(sistema)), 'perilla');
    expect(girada.actions).toBe(0);
    expect(girada.values['sinValidar']).toBe(0);
    expect(healthOf(sistema, girada)).toBe('idle');
  });
});
