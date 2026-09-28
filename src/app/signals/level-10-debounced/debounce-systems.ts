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
};

/**
 * 10/3 · con `debounced()` la espera ya está hecha, pero solo la ve quien lee `.value()`: crear el
 * debounced y seguir leyendo la fuente cruda busca en cada tecla igual que antes.
 */
export const DEBOUNCED_NATIVE_SYSTEM: ManipulableChallenge = {
  knobs: knob('leer la consulta cruda o la debounced'),
  gauges: [{ id: 'busquedas', label: 'búsquedas' }],
  action: 'tipear una letra',
  start: { busquedas: 0 },
  code: (k) => [
    { text: 'const q = debounced(consulta, 300);' },
    { text: 'const resultados = resource({' },
    k[K] === 1
      ? { text: '  params: () => q.value(),', knob: K }
      : { text: '  params: () => consulta(),', knob: K },
    { text: '  loader: ({ params }) => buscar(params),' },
    { text: '});' },
  ],
  // Mientras espera, `q.value()` sostiene el último valor estable: los params no cambian hasta que
  // la ráfaga termina, y ahí sale un solo pedido.
  settle: (s: SystemState) => ({
    busquedas: s.knobs[K] === 1 ? Math.min(s.actions, 1) : s.actions,
  }),
  healthy: (s: SystemState) => s.actions >= 3 && s.values['busquedas'] === 1,
};
