import {
  act,
  malformed,
  solutionFor,
  ManipulableChallenge,
  readings,
  startOf,
  SystemState,
  turn,
} from './manipulable-challenge';
import {
  EFFECT_CLEANUP_SYSTEM,
  EFFECT_LEAK_SYSTEM,
  EFFECT_READS_SYSTEM,
} from '../signals/level-3-effect/effect-systems';
import {
  CUSTOM_EQUAL_SYSTEM,
  REFERENCE_EQUALITY_SYSTEM,
} from '../signals/level-4-signal-equality-functions/equality-systems';
import * as intro from '../signals/level-0-introduction/introduction-systems';
import * as uno from '../signals/level-1-interaction-with-signals/signals-systems';
import * as dos from '../signals/level-2-computed-signals/computed-systems';
import * as cinco from '../signals/level-5-linked-signal/linked-systems';
import * as seis from '../signals/level-6-resource/resource-systems';
import * as siete from '../signals/level-7-signal-io/io-systems';
import * as ocho from '../signals/level-8-queries-interop/queries-systems';
import * as nueve from '../signals/level-9-after-render-effect/after-render-systems';
import * as diez from '../signals/level-10-debounced/debounce-systems';
import * as once from '../signals/level-11-zoneless/zoneless-systems';

/** Sistema mínimo de prueba: una perilla de 3 posiciones y una lectura que la sigue. */
const TRES_POSICIONES: ManipulableChallenge = {
  knobs: [{ id: 'p', positions: 3, label: 'p' }],
  gauges: [{ id: 'v', label: 'v' }],
  action: 'accionar',
  start: { v: 0 },
  code: (knobs) => [{ text: `p=${knobs['p']}`, knob: 'p' }],
  settle: (s) => ({ v: s.knobs['p'] }),
  healthy: (s) => s.knobs['p'] === 2,
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
    const state = startOf(EFFECT_READS_SYSTEM);
    expect(readings(EFFECT_READS_SYSTEM, state).map((r) => r.id)).toEqual(['count', 'log']);
  });
});

// El piloto de la mecánica. Estos tests son la mecánica misma, no un detalle de implementación:
// si dejan de pasar, el sub-nivel enseña otra cosa.
describe('effect 3/1 · la lectura tiene que ocurrir adentro', () => {
  const sistema = EFFECT_READS_SYSTEM;

  function accionar(veces: number, desde: SystemState): SystemState {
    let state = desde;
    for (let i = 0; i < veces; i++) state = act(sistema, state);
    return state;
  }

  it('con la lectura afuera, el log no sigue al count', () => {
    const state = accionar(3, startOf(sistema));
    expect(state.values['count']).toBe(3);
    expect(state.values['log']).toBe(0);
  });

  it('no está sano mientras el log no siga', () => {
    expect(sistema.healthy(accionar(3, startOf(sistema)))).toBe(false);
  });

  it('mover la lectura adentro hace correr el effect: el log se pone al día solo', () => {
    const atrasado = accionar(3, startOf(sistema));
    const alDia = turn(sistema, atrasado, 'lectura');
    expect(alDia.values['log']).toBe(3);
    expect(sistema.healthy(alDia)).toBe(true);
  });

  it('con la lectura adentro, el log sigue accionando', () => {
    const state = accionar(2, turn(sistema, startOf(sistema), 'lectura'));
    expect(state.values['count']).toBe(2);
    expect(state.values['log']).toBe(2);
  });

  it('volver a sacar la lectura congela el log donde estaba', () => {
    let state = accionar(2, turn(sistema, startOf(sistema), 'lectura'));
    state = turn(sistema, state, 'lectura');
    state = accionar(3, state);
    expect(state.values['count']).toBe(5);
    expect(state.values['log']).toBe(2);
  });

  it('no está sano sin haberlo accionado, aunque la perilla esté bien puesta', () => {
    expect(sistema.healthy(turn(sistema, startOf(sistema), 'lectura'))).toBe(false);
  });

  it('apaga la declaración de afuera cuando deja de participar', () => {
    const afuera = sistema.code(startOf(sistema).knobs);
    const adentro = sistema.code(turn(sistema, startOf(sistema), 'lectura').knobs);
    expect(afuera[0].dead).toBeFalsy();
    expect(adentro[0].dead).toBe(true);
  });
});

describe('effect 3/2 · la limpieza se registra con onCleanup', () => {
  const sistema = EFFECT_LEAK_SYSTEM;

  it('sin limpiar, destruir el componente deja el intervalo latiendo', () => {
    expect(act(sistema, startOf(sistema)).values['vivos']).toBe(1);
  });

  it('devolver la limpieza al estilo React no apaga nada: Angular ignora el retorno', () => {
    const state = act(sistema, turn(sistema, startOf(sistema), 'limpieza'));
    expect(state.values['vivos']).toBe(1);
    expect(sistema.healthy(state)).toBe(false);
  });

  it('con onCleanup el intervalo muere junto al componente', () => {
    let state = turn(sistema, startOf(sistema), 'limpieza');
    state = act(sistema, turn(sistema, state, 'limpieza'));
    expect(state.values['vivos']).toBe(0);
    expect(sistema.healthy(state)).toBe(true);
  });
});

describe('effect 3/3 · onCleanup corre antes de cada re-ejecución', () => {
  const sistema = EFFECT_CLEANUP_SYSTEM;

  function vueltas(n: number, desde: SystemState): SystemState {
    let state = desde;
    for (let i = 0; i < n; i++) state = act(sistema, state);
    return state;
  }

  it('limpiar al destruir acumula un reloj por vuelta', () => {
    const state = vueltas(3, startOf(sistema));
    expect(state.values['vivos']).toBe(4);
    expect(sistema.healthy(state)).toBe(false);
  });

  it('ngOnDestroy tampoco alcanza: limpia una vez y solo el último', () => {
    expect(vueltas(3, turn(sistema, startOf(sistema), 'limpieza')).values['vivos']).toBe(4);
  });

  it('con onCleanup queda uno solo, por más vueltas que des', () => {
    let state = turn(sistema, startOf(sistema), 'limpieza');
    state = vueltas(5, turn(sistema, state, 'limpieza'));
    expect(state.values['vivos']).toBe(1);
    expect(sistema.healthy(state)).toBe(true);
  });

  it('una sola vuelta no alcanza para notar la acumulación', () => {
    let state = turn(sistema, startOf(sistema), 'limpieza');
    state = act(sistema, turn(sistema, state, 'limpieza'));
    expect(sistema.healthy(state)).toBe(false);
  });
});

describe('igualdad 4/1 · un signal compara por referencia', () => {
  const sistema = REFERENCE_EQUALITY_SYSTEM;

  it('mutar en el lugar cambia el dato y no avisa a nadie', () => {
    const state = act(sistema, act(sistema, startOf(sistema)));
    expect(state.values['cambios']).toBe(2);
    expect(state.values['avisos']).toBe(0);
    expect(sistema.healthy(state)).toBe(false);
  });

  it('devolver un objeto nuevo avisa por cada cambio', () => {
    const state = act(sistema, turn(sistema, startOf(sistema), 'escritura'));
    expect(state.values['avisos']).toBe(state.values['cambios']);
    expect(sistema.healthy(state)).toBe(true);
  });
});

describe('igualdad 4/2 · con equal propio lo equivalente deja de ser un cambio', () => {
  const sistema = CUSTOM_EQUAL_SYSTEM;

  function cargar(n: number, desde: SystemState): SystemState {
    let state = desde;
    for (let i = 0; i < n; i++) state = act(sistema, state);
    return state;
  }

  it('por referencia, cada carga de lo mismo recalcula de nuevo', () => {
    const state = cargar(3, startOf(sistema));
    expect(state.values['recalculos']).toBe(3);
    expect(sistema.healthy(state)).toBe(false);
  });

  it('con equal propio solo recalcula la primera', () => {
    const state = cargar(3, turn(sistema, startOf(sistema), 'comparacion'));
    expect(state.values['recalculos']).toBe(1);
    expect(sistema.healthy(state)).toBe(true);
  });

  it('con una sola carga todavía no hay desperdicio que notar', () => {
    expect(sistema.healthy(cargar(1, turn(sistema, startOf(sistema), 'comparacion')))).toBe(false);
  });
});

// Un sistema mal armado no se ve roto: se ve como un sub-nivel que no se puede resolver.
describe('sistemas publicados', () => {
  const PUBLICADOS: readonly (readonly [string, ManipulableChallenge])[] = [
    ['3/1 lee adentro', EFFECT_READS_SYSTEM],
    ['3/2 leak del intervalo', EFFECT_LEAK_SYSTEM],
    ['3/3 onCleanup por re-ejecución', EFFECT_CLEANUP_SYSTEM],
    ['4/1 igualdad por referencia', REFERENCE_EQUALITY_SYSTEM],
    ['4/2 equal propio', CUSTOM_EQUAL_SYSTEM],
    ...Object.entries({
      ...intro,
      ...uno,
      ...dos,
      ...cinco,
      ...seis,
      ...siete,
      ...ocho,
      ...nueve,
      ...diez,
      ...once,
    }).map(([nombre, sistema]) => [nombre, sistema as ManipulableChallenge] as const),
  ];

  PUBLICADOS.forEach(([nombre, sistema]) => {
    it(`${nombre} está bien armado`, () => {
      expect(malformed(sistema)).toEqual([]);
    });

    it(`${nombre} se puede resolver`, () => {
      expect(solutionFor(sistema)).not.toBeNull();
    });

    // Un desafío que se resuelve sin tocar la perilla no enseña nada: alcanza con insistir en el
    // botón hasta que los números den. La perilla ES la decisión que el sub-nivel pone a prueba.
    it(`${nombre} exige mover la perilla, no solo insistir`, () => {
      const pasos = solutionFor(sistema) ?? [];
      expect(pasos.some((paso) => paso.startsWith('mover'))).toBe(true);
    });
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
    expect(malformed(sinPerilla)).toContain('la perilla no se ve en la posición 0');
  });
});
