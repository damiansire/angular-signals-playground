import { ManipulableChallenge, SystemState } from '../../libs/manipulable-challenge';

/**
 * Sistemas del nivel 10: esperar a que el usuario frene. Las dos rutas, con RxJS y a mano, resuelven
 * el mismo problema y fallan igual si falta la pieza que cancela lo anterior.
 */

const K = 'perilla';
const knob = (label: string, positions = 2) => [{ id: K, positions, label }];

/** 10/1 · sin debounceTime sale una búsqueda por tecla. */
export const DEBOUNCE_RXJS_SYSTEM: ManipulableChallenge = {
  knobs: knob('esperar a que frene o disparar por tecla'),
  gauges: [{ id: 'busquedas', label: 'búsquedas' }],
  action: 'tipear una letra',
  start: { busquedas: 0 },
  code: (k) => [
    { text: 'const resultados = toSignal(' },
    { text: '  toObservable(consulta).pipe(' },
    k[K] === 1
      ? { text: '    debounceTime(300),', knob: K }
      : { text: '    // sin espera', knob: K },
    { text: '    switchMap(buscar),' },
    { text: '  ),' },
    { text: ');' },
  ],
  // Con la espera, la ráfaga entera colapsa en un solo pedido: el último.
  settle: (s: SystemState) => ({
    busquedas: s.knobs[K] === 1 ? Math.min(s.actions, 1) : s.actions,
  }),
  healthy: (s: SystemState) => s.actions >= 3 && s.values['busquedas'] === 1,
  establishes: 'debounceTime colapsa la ráfaga de teclas en un solo pedido.',
};

/** 10/2 · a mano es lo mismo: hay que cancelar el timer anterior. */
export const DEBOUNCE_MANUAL_SYSTEM: ManipulableChallenge = {
  knobs: knob('cancelar el timer anterior o dejarlo'),
  gauges: [{ id: 'timers', label: 'timers vivos' }],
  action: 'tipear una letra',
  start: { timers: 0 },
  code: (k) => [
    { text: 'effect((onCleanup) => {' },
    { text: '  const q = consulta();' },
    { text: '  const id = setTimeout(() => buscar(q), 300);' },
    k[K] === 1
      ? { text: '  onCleanup(() => clearTimeout(id));', knob: K }
      : { text: '  // el timer anterior sigue', knob: K },
    { text: '});' },
  ],
  settle: (s: SystemState) => ({
    timers: s.knobs[K] === 1 ? Math.min(s.actions, 1) : s.actions,
  }),
  healthy: (s: SystemState) => s.actions >= 3 && s.values['timers'] === 1,
  establishes: 'El debounce a mano necesita que onCleanup cancele el timer anterior.',
};
