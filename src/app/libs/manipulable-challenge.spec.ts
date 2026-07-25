import { malformed, ManipulableChallenge, readings, startOf, turn } from './manipulable-challenge';

/** Sistema mínimo de prueba: una perilla de 3 posiciones y una lectura que la sigue. */
const TRES_POSICIONES: ManipulableChallenge = {
  knobs: [{ id: 'p', positions: 3, label: 'p' }],
  gauges: [{ id: 'v', label: 'v' }],
  action: 'accionar',
  start: { v: 0 },
  code: (knobs) => [{ text: `p=${knobs['p']}`, knob: 'p' }],
  settle: (s) => ({ v: s.knobs['p'] }),
  healthy: (s) => s.knobs['p'] === 2,
  establishes: 'la perilla llegó a la última posición',
};

describe('startOf', () => {
  it('arranca con todas las perillas en su primera posición', () => {
    expect(startOf(TRES_POSICIONES).knobs).toEqual({ p: 0 });
  });

  it('arranca sin acciones y con los valores declarados', () => {
    const state = startOf(TRES_POSICIONES);
    expect(state.actions).toBe(0);
    expect(state.values).toEqual({ v: 0 });
  });
});

describe('turn', () => {
  it('cicla a la primera posición después de la última', () => {
    let state = startOf(TRES_POSICIONES);
    state = turn(TRES_POSICIONES, state, 'p');
    state = turn(TRES_POSICIONES, state, 'p');
    expect(state.knobs['p']).toBe(2);
    state = turn(TRES_POSICIONES, state, 'p');
    expect(state.knobs['p']).toBe(0);
  });

  it('deja que el sistema se acomode al mover la perilla', () => {
    const state = turn(TRES_POSICIONES, startOf(TRES_POSICIONES), 'p');
    expect(state.values['v']).toBe(1);
  });

  it('ignora una perilla que no existe en vez de romper', () => {
    const state = startOf(TRES_POSICIONES);
    expect(turn(TRES_POSICIONES, state, 'no-existe')).toBe(state);
  });
});

describe('readings', () => {
  it('devuelve los valores en el orden en que el desafío declaró las lecturas', () => {
    const state = startOf(TRES_POSICIONES);
    expect(readings(TRES_POSICIONES, state).map((r) => r.id)).toEqual(['v']);
  });
});

// Un sistema mal armado no se ve roto: se ve como un sub-nivel que no se puede resolver.
describe('detector de sistemas mal armados', () => {
  it('acepta un sistema bien armado', () => {
    expect(malformed(TRES_POSICIONES)).toEqual([]);
  });

  it('detecta un sistema que arranca sano', () => {
    const yaSano: ManipulableChallenge = { ...TRES_POSICIONES, healthy: () => true };
    expect(malformed(yaSano)).toContain('arranca sano, así que no hay nada que notar');
  });

  it('detecta un sistema sin perilla en el código', () => {
    const sinPerilla: ManipulableChallenge = {
      ...TRES_POSICIONES,
      code: () => [{ text: 'sin nada que tocar' }],
    };
    expect(malformed(sinPerilla)).toContain('su código no expone ninguna perilla');
  });
});
