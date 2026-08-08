import { ManipulableChallenge, SystemState } from '../../libs/manipulable-challenge';

/**
 * Sistemas del nivel 2: derivar. Los tres muestran lo mismo desde ángulos distintos, que un
 * computed no es azúcar sintáctica sino una promesa: se mantiene al día solo, sabe de qué depende
 * en cada corrida, y no trabaja si nadie lo mira.
 */

const K = 'perilla';
const knob = (label: string, positions = 2) => [{ id: K, positions, label }];

/** 2/1 · un derivado a mano se desincroniza; un computed no puede. */
export const COMPUTED_BASIC_SYSTEM: ManipulableChallenge = {
  knobs: knob('derivar a mano o con computed'),
  gauges: [{ id: 'desfasado', label: 'desfasado' }],
  action: 'cambiar el precio',
  start: { desfasado: 0 },
  code: (k) => [
    { text: 'const precio = signal(100);' },
    { text: '' },
    k[K] === 1
      ? { text: 'const conIva = computed(() => precio() * 1.21);', knob: K }
      : { text: 'let conIva = precio() * 1.21;', knob: K },
  ],
  // El derivado a mano guarda un número viejo: nadie lo vuelve a calcular.
  settle: (s: SystemState) => ({ desfasado: s.actions > 0 && s.knobs[K] !== 1 ? 1 : 0 }),
  healthy: (s: SystemState) => s.actions > 0 && s.values['desfasado'] === 0,
};

/** 2/2 · las dependencias son las que se LEEN en cada corrida, no las que están escritas. */
export const COMPUTED_DYNAMIC_DEPS_SYSTEM: ManipulableChallenge = {
  knobs: knob('leer las dos ramas o solo la que corresponde'),
  gauges: [{ id: 'recalculos', label: 'recálculos' }],
  action: 'cambiar la rama muerta',
  start: { recalculos: 0 },
  code: (k) => [
    { text: 'const total = computed(() => {' },
    k[K] === 1
      ? { text: '  return modo() === "a" ? a() : b();', knob: K }
      : { text: '  const [x, y] = [a(), b()];', knob: K },
    { text: '  return modo() === "a" ? x : y;', dead: k[K] === 1 },
    { text: '});' },
  ],
  // Leyendo las dos siempre, el computed se despierta por una rama que ni siquiera usa.
  settle: (s: SystemState) => ({ recalculos: s.knobs[K] === 1 ? 0 : s.actions }),
  healthy: (s: SystemState) => s.actions > 0 && s.values['recalculos'] === 0,
};

/** 2/3 · perezoso y memoizado: no corre si nadie mira, y no repite si nada cambió. */
export const COMPUTED_MEMO_SYSTEM: ManipulableChallenge = {
  knobs: knob('usar una función o un computed'),
  gauges: [{ id: 'ejecuciones', label: 'ejecuciones' }],
  action: 'leer el total',
  start: { ejecuciones: 0 },
  code: (k) => [
    { text: 'const items = signal(cargar());' },
    { text: '' },
    k[K] === 1
      ? { text: 'const total = computed(() => caro(items()));', knob: K }
      : { text: 'const total = () => caro(items());', knob: K },
  ],
  // La función corre entera en cada lectura; el computed guarda lo que ya resolvió.
  settle: (s: SystemState) => ({
    ejecuciones: s.knobs[K] === 1 ? Math.min(s.actions, 1) : s.actions,
  }),
  healthy: (s: SystemState) => s.actions >= 3 && s.values['ejecuciones'] === 1,
};
