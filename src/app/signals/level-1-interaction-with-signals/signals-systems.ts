import { ManipulableChallenge, SystemState } from '../../libs/manipulable-challenge';

/**
 * Sistemas del nivel 1: qué es un signal y cómo se lo toca. Los errores que usan de contraste son
 * los que de verdad comete alguien que recién llega: leer sin llamar, escribir a partir de la
 * función en vez del valor, y exponer un writable donde correspondía solo lectura.
 */

const K = 'perilla';
const knob = (label: string, positions = 2) => [{ id: K, positions, label }];

/** 1/1 · una variable común cambia sin avisarle a nadie. */
export const PLAIN_VARIABLE_SYSTEM: ManipulableChallenge = {
  knobs: knob('guardar el valor en una variable o en un signal'),
  gauges: [
    { id: 'cambios', label: 'cambios' },
    { id: 'avisos', label: 'avisos' },
  ],
  action: 'cambiar',
  start: { cambios: 0, avisos: 0 },
  code: (k) => [
    k[K] === 1
      ? { text: 'const total = signal(0);', knob: K }
      : { text: 'let total = 0;', knob: K },
    { text: '' },
    { text: k[K] === 1 ? 'total.set(total() + 1);' : 'total = total + 1;' },
  ],
  settle: (s: SystemState) => ({
    cambios: s.actions,
    avisos: s.knobs[K] === 1 ? s.actions : 0,
  }),
  healthy: (s: SystemState) => s.actions > 0 && s.values['avisos'] === s.values['cambios'],
  establishes: 'Una variable común cambia sin avisarle a nadie.',
};

/** 1/2 · un signal es un envoltorio que avisa a sus consumidores. */
export const WHAT_IS_SIGNAL_SYSTEM: ManipulableChallenge = {
  knobs: knob('suscribir o no al consumidor'),
  gauges: [{ id: 'enterados', label: 'consumidores enterados' }],
  action: 'cambiar el valor',
  start: { enterados: 0 },
  code: (k) => [
    { text: 'const total = signal(0);' },
    { text: '' },
    { text: 'effect(() => {' },
    k[K] === 1
      ? { text: '  mostrar(total());', knob: K }
      : { text: '  mostrar(valorGuardado);', knob: K },
    { text: '});' },
  ],
  settle: (s: SystemState) => ({ enterados: s.knobs[K] === 1 ? s.actions : 0 }),
  healthy: (s: SystemState) => s.actions > 0 && s.values['enterados'] === s.actions,
  establishes: 'Un signal avisa a quien lo consume cuando su valor cambia.',
};

/** 1/3 · no todos los signals se pueden escribir. */
export const SIGNAL_TYPES_SYSTEM: ManipulableChallenge = {
  knobs: knob('cambiar de qué tipo es el signal'),
  gauges: [{ id: 'aceptadas', label: 'escrituras aceptadas' }],
  action: 'escribir',
  start: { aceptadas: 0 },
  code: (k) => [
    k[K] === 1
      ? { text: 'const total = signal(0);', knob: K }
      : { text: 'const total = computed(() => a() + b());', knob: K },
    { text: '' },
    { text: 'total.set(10);' },
  ],
  // Un computed no tiene `.set`: es de solo lectura por construcción.
  settle: (s: SystemState) => ({ aceptadas: s.knobs[K] === 1 ? s.actions : 0 }),
  healthy: (s: SystemState) => s.actions > 0 && s.values['aceptadas'] === s.actions,
  establishes: 'Un computed es de solo lectura: no tiene set.',
};

/** 1/4 · un signal se lee llamándolo. */
export const READ_SIGNAL_SYSTEM: ManipulableChallenge = {
  knobs: knob('leer el signal o pasar la función'),
  gauges: [{ id: 'numero', label: 'número leído' }],
  action: 'leer',
  start: { numero: 0 },
  code: (k) => [
    { text: 'const total = signal(7);' },
    { text: '' },
    k[K] === 1
      ? { text: 'const doble = total() * 2;', knob: K }
      : { text: 'const doble = total * 2;', knob: K },
  ],
  // Multiplicar la FUNCIÓN da NaN: sin los paréntesis nunca leíste el valor.
  settle: (s: SystemState) => ({ numero: s.actions === 0 ? 0 : s.knobs[K] === 1 ? 14 : 0 }),
  healthy: (s: SystemState) => s.values['numero'] === 14,
  establishes: 'Un signal se lee llamándolo: total(), no total.',
};

/** 1/5 · set reemplaza el valor, y el valor anterior se lee. */
export const SET_SIGNAL_SYSTEM: ManipulableChallenge = {
  knobs: knob('cambiar de dónde sale el valor nuevo'),
  gauges: [{ id: 'valor', label: 'valor' }],
  action: 'sumar uno',
  start: { valor: 0 },
  code: (k) => [
    { text: 'const total = signal(0);' },
    { text: '' },
    k[K] === 1
      ? { text: 'total.set(total() + 1);', knob: K }
      : { text: 'total.set(total + 1);', knob: K },
  ],
  settle: (s: SystemState) => ({ valor: s.knobs[K] === 1 ? s.actions : 0 }),
  healthy: (s: SystemState) => s.actions >= 2 && s.values['valor'] === s.actions,
  establishes: 'set escribe un valor nuevo, y el anterior se lee llamando al signal.',
};

/** 1/6 · update calcula el valor nuevo a partir del anterior. */
export const UPDATE_SIGNAL_SYSTEM: ManipulableChallenge = {
  knobs: knob('escribir un valor fijo o derivarlo del anterior'),
  gauges: [{ id: 'valor', label: 'valor' }],
  action: 'sumar uno',
  start: { valor: 0 },
  code: (k) => [
    { text: 'const total = signal(0);' },
    { text: '' },
    k[K] === 1
      ? { text: 'total.update((n) => n + 1);', knob: K }
      : { text: 'total.set(1);', knob: K },
  ],
  // Con `set(1)` el contador queda clavado en 1 por más veces que lo toques.
  settle: (s: SystemState) => ({
    valor: s.actions === 0 ? 0 : s.knobs[K] === 1 ? s.actions : 1,
  }),
  healthy: (s: SystemState) => s.actions >= 2 && s.values['valor'] === s.actions,
  establishes: 'update calcula el valor nuevo a partir del anterior.',
};

/** 1/7 · asReadonly cierra la escritura desde afuera. */
export const READONLY_SIGNAL_SYSTEM: ManipulableChallenge = {
  knobs: knob('exponer el signal crudo o su vista de solo lectura'),
  gauges: [{ id: 'ajenas', label: 'escrituras ajenas' }],
  action: 'escribir desde afuera',
  start: { ajenas: 0 },
  code: (k) => [
    { text: 'private readonly _total = signal(0);' },
    { text: '' },
    k[K] === 1
      ? { text: 'readonly total = this._total.asReadonly();', knob: K }
      : { text: 'readonly total = this._total;', knob: K },
  ],
  settle: (s: SystemState) => ({ ajenas: s.knobs[K] === 1 ? 0 : s.actions }),
  healthy: (s: SystemState) => s.actions > 0 && s.values['ajenas'] === 0,
  establishes: 'asReadonly expone el valor sin dejar que lo escriban desde afuera.',
};
