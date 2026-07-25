import { ManipulableChallenge, SystemState } from '../../libs/manipulable-challenge';

/**
 * Sistemas manipulables de `effect`. El primero es el piloto de la mecánica: se construye uno solo
 * y se prueba antes de escribir el resto, porque si el gesto no produce el "ah" los demás repiten
 * el mismo error.
 */

const LECTURA = 'lectura';

/**
 * 3/1 · un effect solo reacciona a lo que LEE adentro de su función.
 *
 * El sistema arranca con la lectura afuera: apretás `count +1` y el log no se mueve. Mover la
 * lectura adentro crea la dependencia, así que el effect corre y el log se pone al día solo. Nadie
 * avisa que funcionó: los dos números lado a lado lo dicen.
 */
export const EFFECT_READS_SYSTEM: ManipulableChallenge = {
  knobs: [{ id: LECTURA, positions: 2, label: 'mover la lectura adentro o afuera del effect' }],
  gauges: [
    { id: 'count', label: 'count' },
    { id: 'log', label: 'último log' },
  ],
  action: 'count +1',
  start: { count: 0, log: 0 },

  code: (knobs) => {
    const adentro = knobs[LECTURA] === 1;
    return [
      // La declaración de afuera queda a la vista pero apagada: se ve que dejó de participar.
      { text: 'const c = count();', dead: adentro },
      { text: 'effect(() => {' },
      { text: adentro ? '  console.log(count());' : '  console.log(c);', knob: LECTURA },
      { text: '});' },
    ];
  },

  settle: (state: SystemState) => ({
    count: state.actions,
    // El effect solo se entera si la lectura ocurre adentro de su función. Si no, el log queda
    // clavado en lo último que llegó a ver.
    log: state.knobs[LECTURA] === 1 ? state.actions : state.values['log'],
  }),

  // Sano no es "la perilla está en la posición correcta": es haberlo VISTO seguir al menos una vez.
  healthy: (state: SystemState) =>
    state.actions > 0 && state.values['log'] === state.values['count'],

  establishes: 'Un effect solo reacciona a lo que lee adentro de su función.',
};
