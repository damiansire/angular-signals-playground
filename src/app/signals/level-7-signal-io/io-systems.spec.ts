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
import { SIGNAL_FORMS_SYSTEM, SIGNAL_RULES_SYSTEM, SIGNAL_SUBMIT_SYSTEM } from './io-systems';

describe('io 7/5 · una regla lee el modelo cada vez, no una sola al armar el form', () => {
  const sistema = SIGNAL_RULES_SYSTEM;
  const codigo = (posicion: number) =>
    sistema
      .code({ perilla: posicion })
      .map((line) => line.text)
      .join('\n');

  it('está bien armado y tiene solución', () => {
    expect(malformed(sistema)).toEqual([]);
    expect(solutionFor(sistema)).not.toBeNull();
  });

  it('la avería captura el valor afuera de la regla', () => {
    expect(codigo(0)).toContain('const automatica = this.modelo().automatica;');
    expect(codigo(0)).toContain('() => automatica');
    expect(codigo(1)).toContain('c.valueOf(r.automatica)');
  });

  it('con el valor capturado cada cambio deja la regla vieja; leyéndolo, ninguno', () => {
    const roto = act(sistema, act(sistema, startOf(sistema)));
    expect(roto.values['reglaVieja']).toBe(2);
    expect(healthOf(sistema, roto)).toBe('broken');

    const sano = act(sistema, turn(sistema, startOf(sistema), 'perilla'));
    expect(sano.values['reglaVieja']).toBe(0);
    expect(healthOf(sistema, sano)).toBe('healthy');
  });
});

describe('io 7/6 · submit deja salir lo pendiente si no se le pide retenerlo', () => {
  const sistema = SIGNAL_SUBMIT_SYSTEM;
  const codigo = (posicion: number) =>
    sistema
      .code({ perilla: posicion })
      .map((line) => line.text)
      .join('\n');

  it('está bien armado y tiene solución', () => {
    expect(malformed(sistema)).toEqual([]);
    expect(solutionFor(sistema)).not.toBeNull();
  });

  it('la perilla es la opción real de submit()', () => {
    expect(codigo(0)).toContain("ignoreValidators: 'pending'");
    expect(codigo(1)).toContain("ignoreValidators: 'none'");
  });

  it('con pending cada envío sale sin verificar; con none, ninguno', () => {
    const roto = act(sistema, startOf(sistema));
    expect(roto.values['sinVerificar']).toBe(1);
    expect(healthOf(sistema, roto)).toBe('broken');

    const sano = act(sistema, turn(sistema, startOf(sistema), 'perilla'));
    expect(sano.values['sinVerificar']).toBe(0);
    expect(healthOf(sistema, sano)).toBe('healthy');
  });
});

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
