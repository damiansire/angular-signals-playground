import { ManipulableChallenge, SystemState } from '../../libs/manipulable-challenge';

/**
 * Sistemas del nivel 8: agarrar pedazos de la propia pantalla. El hilo de los cuatro es que una
 * query también es un signal, así que guardarse el resultado una vez es exactamente el error que
 * las queries como signals vinieron a borrar.
 */

const K = 'perilla';
const knob = (label: string, positions = 2) => [{ id: K, positions, label }];

/** 8/1 · el viewChild no existe todavía cuando se construye el componente. */
export const VIEW_CHILD_SYSTEM: ManipulableChallenge = {
  knobs: knob('leer la query al construir o después del render'),
  gauges: [{ id: 'encontrado', label: 'encontrado' }],
  action: 'montar',
  start: { encontrado: 0 },
  code: (k) => [
    { text: 'readonly caja = viewChild<ElementRef>("caja");' },
    { text: '' },
    k[K] === 1
      ? { text: 'afterRenderEffect(() => medir(this.caja()));', knob: K }
      : { text: 'const alto = this.caja()!.nativeElement.offsetHeight;', knob: K },
  ],
  // En el constructor la vista no se creó: la query devuelve undefined.
  settle: (s: SystemState) => ({ encontrado: s.actions > 0 && s.knobs[K] === 1 ? 1 : 0 }),
  healthy: (s: SystemState) => s.values['encontrado'] === 1,
  establishes: 'Una query recién tiene elemento después de que la vista se creó.',
};

/** 8/2 · untracked lee sin quedar suscripto. */
export const RXJS_INTEROP_SYSTEM: ManipulableChallenge = {
  knobs: knob('leer el signal auxiliar suscribiéndose o no'),
  gauges: [{ id: 'sobrantes', label: 'corridas sobrantes' }],
  action: 'cambiar el auxiliar',
  start: { sobrantes: 0 },
  code: (k) => [
    { text: 'effect(() => {' },
    { text: '  const q = consulta();' },
    k[K] === 1
      ? { text: '  enviar(q, untracked(pagina));', knob: K }
      : { text: '  enviar(q, pagina());', knob: K },
    { text: '});' },
  ],
  settle: (s: SystemState) => ({ sobrantes: s.knobs[K] === 1 ? 0 : s.actions }),
  healthy: (s: SystemState) => s.actions > 0 && s.values['sobrantes'] === 0,
  establishes: 'untracked lee un signal sin quedar suscripto a sus cambios.',
};

/** 8/3 · viewChildren se actualiza sola cuando la lista crece. */
export const VIEW_CHILDREN_SYSTEM: ManipulableChallenge = {
  knobs: knob('copiar la lista una vez o leer la query'),
  gauges: [
    { id: 'vistos', label: 'vistos' },
    { id: 'reales', label: 'reales' },
  ],
  action: 'agregar una fila',
  start: { vistos: 3, reales: 3 },
  code: (k) => [
    { text: 'readonly filas = viewChildren<ElementRef>("fila");' },
    { text: '' },
    k[K] === 1
      ? { text: 'const total = computed(() => this.filas().length);', knob: K }
      : { text: 'const total = this.filas().length;', knob: K },
  ],
  settle: (s: SystemState) => ({
    vistos: s.knobs[K] === 1 ? 3 + s.actions : 3,
    reales: 3 + s.actions,
  }),
  healthy: (s: SystemState) => s.actions > 0 && s.values['vistos'] === s.values['reales'],
  establishes: 'viewChildren es un signal: la lista se mantiene al día sola.',
};

/** 8/4 · lo que proyecta el padre no está en la vista del hijo. */
export const CONTENT_QUERY_SYSTEM: ManipulableChallenge = {
  knobs: knob('buscar en la vista propia o en lo proyectado'),
  gauges: [{ id: 'encontrados', label: 'encontrados' }],
  action: 'proyectar dos items',
  start: { encontrados: 0 },
  code: (k) => [
    { text: '// el padre proyecta <app-item> con ng-content' },
    { text: '' },
    k[K] === 1
      ? { text: 'readonly items = contentChildren(ItemComponent);', knob: K }
      : { text: 'readonly items = viewChildren(ItemComponent);', knob: K },
  ],
  settle: (s: SystemState) => ({ encontrados: s.actions > 0 && s.knobs[K] === 1 ? 2 : 0 }),
  healthy: (s: SystemState) => s.values['encontrados'] === 2,
  establishes: 'Lo que proyecta el padre se busca con content queries, no con view queries.',
};
