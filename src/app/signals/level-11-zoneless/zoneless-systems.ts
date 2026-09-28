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
  // Desde v21 zoneless es el default: Zone.js solo vuelve si alguien lo pide con
  // provideZoneChangeDetection(). Tener zone.js en los polyfills, solo, ya no lo trae de vuelta.
  code: (k) => [
    { text: 'bootstrapApplication(App, {' },
    { text: '  providers: [' },
    k[K] === 1
      ? { text: '    // zoneless por defecto desde v21', knob: K }
      : { text: '    provideZoneChangeDetection(),', knob: K },
    { text: '  ],' },
    { text: '});' },
  ],
  // Zone.js avisa que "pasó algo" sin saber qué, así que barre el árbol entero.
  settle: (s: SystemState) => ({
    revisados: s.actions === 0 ? 0 : s.knobs[K] === 1 ? 1 : 7,
  }),
  healthy: (s: SystemState) => s.actions > 0 && s.values['revisados'] === 1,
};
