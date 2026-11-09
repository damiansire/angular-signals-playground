import { ManipulableChallenge, SystemState } from '../../libs/manipulable-challenge';

/**
 * Sistemas del nivel 0. Acá todavía no hay API que aprender: el nivel arma el argumento de por qué
 * hacen falta los signals, así que la perilla no es una opción de la librería sino una decisión
 * sobre quién avisa. Las cinco leyes del manual llevan su desafío adentro de la página, sobre el
 * mismo código que la demo: ya no son sistemas de perilla.
 */

const K = 'perilla';
const knob = (label: string, positions = 2) => [{ id: K, positions, label }];

/** 0/6 · el signal avisa QUIÉN lo lee, así que se re-chequea solo eso. */
export const SIGNAL_NOTIFY_SYSTEM: ManipulableChallenge = {
  knobs: knob('cambiar cómo se entera Angular'),
  gauges: [{ id: 'revisados', label: 'nodos revisados' }],
  action: 'cambiar el valor',
  start: { revisados: 0 },
  code: (k) => [
    k[K] === 1
      ? { text: 'const total = signal(0);', knob: K }
      : { text: 'let total = 0; // Zone.js avisa', knob: K },
    { text: '' },
    // La escritura sigue a la declaración: un number no tiene .set, y un contraste que no compila
    // deja de ser una alternativa creíble.
    { text: k[K] === 1 ? 'total.set(42);' : 'total = 42;' },
  ],
  // Zone.js no sabe QUÉ cambió, así que barre el árbol; el signal apunta a sus lectores.
  settle: (s: SystemState) => ({
    revisados: s.actions === 0 ? 0 : s.knobs[K] === 1 ? 2 : 7,
  }),
  healthy: (s: SystemState) => s.actions > 0 && s.values['revisados'] === 2,
};
