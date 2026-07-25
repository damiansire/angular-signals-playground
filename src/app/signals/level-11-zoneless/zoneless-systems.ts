import { ManipulableChallenge, SystemState } from '../../libs/manipulable-challenge';

/**
 * Sistema del nivel 11, el cierre del recorrido. Contesta en números la pregunta que abrió el nivel
 * 0: sacar Zone.js no es una optimización suelta, es lo que se puede hacer recién cuando cada
 * cambio ya sabe a quién avisarle.
 */

const K = 'perilla';

/** 11/1 · sin Zone.js, cada cambio revisa solo a quien lo lee. */
export const ZONELESS_SYSTEM: ManipulableChallenge = {
  knobs: [{ id: K, positions: 2, label: 'sacar o volver a poner Zone.js' }],
  gauges: [{ id: 'revisados', label: 'nodos revisados' }],
  action: 'cambiar un valor',
  start: { revisados: 0 },
  code: (k) => [
    { text: 'bootstrapApplication(App, {' },
    { text: '  providers: [' },
    k[K] === 1
      ? { text: '    provideZonelessChangeDetection(),', knob: K }
      : { text: '    // con zone.js en los polyfills', knob: K },
    { text: '  ],' },
    { text: '});' },
  ],
  // Zone.js avisa que "pasó algo" sin saber qué, así que barre el árbol entero.
  settle: (s: SystemState) => ({
    revisados: s.actions === 0 ? 0 : s.knobs[K] === 1 ? 1 : 7,
  }),
  healthy: (s: SystemState) => s.actions > 0 && s.values['revisados'] === 1,
  establishes: 'Sin Zone.js, cada cambio revisa solo a quien lee ese valor.',
};
