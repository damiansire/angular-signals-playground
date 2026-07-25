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

const LIMPIEZA = 'limpieza';

/**
 * 3/2 · el effect muere con el componente, el intervalo no.
 *
 * Destruís el componente y el reloj sigue latiendo. La posición del medio es el error más caro de
 * los tres porque PARECE correcta: devolver la limpieza es lo que se hace en React, y Angular
 * ignora lo que devuelvas, así que el clearInterval no llega a correr nunca.
 */
export const EFFECT_LEAK_SYSTEM: ManipulableChallenge = {
  knobs: [{ id: LIMPIEZA, positions: 3, label: 'cambiar cómo se registra la limpieza' }],
  gauges: [{ id: 'vivos', label: 'intervalos vivos' }],
  action: 'destruir el componente',
  start: { vivos: 1 },

  code: (knobs) => {
    const forma = knobs[LIMPIEZA];
    if (forma === 1) {
      return [
        { text: 'effect(() => {' },
        { text: '  const id = setInterval(tick, 1000);' },
        { text: '  return () => clearInterval(id);', knob: LIMPIEZA },
        { text: '});' },
      ];
    }
    if (forma === 2) {
      return [
        { text: 'effect((onCleanup) => {' },
        { text: '  const id = setInterval(tick, 1000);' },
        { text: '  onCleanup(() => clearInterval(id));', knob: LIMPIEZA },
        { text: '});' },
      ];
    }
    return [
      { text: 'effect(() => {' },
      { text: '  const id = setInterval(tick, 1000);' },
      { text: '  // nadie lo apaga', knob: LIMPIEZA },
      { text: '});' },
    ];
  },

  // Solo `onCleanup` corre de verdad: sin nada no se limpia, y lo que devolvés se descarta.
  settle: (state: SystemState) => ({
    vivos: state.actions > 0 && state.knobs[LIMPIEZA] === 2 ? 0 : 1,
  }),

  healthy: (state: SystemState) => state.actions > 0 && state.values['vivos'] === 0,

  establishes: 'La limpieza de un effect se registra con onCleanup, no devolviéndola.',
};

/**
 * 3/3 · onCleanup no corre solo al final: corre antes de CADA re-ejecución.
 *
 * Prendés y apagás varias veces y los relojes se acumulan. Las dos primeras posiciones limpian una
 * sola vez (al destruir el componente), así que entre re-ejecuciones no pasa nada.
 */
export const EFFECT_CLEANUP_SYSTEM: ManipulableChallenge = {
  knobs: [{ id: LIMPIEZA, positions: 3, label: 'cambiar dónde se limpia el intervalo' }],
  gauges: [
    { id: 'vivos', label: 'relojes vivos' },
    { id: 'esperado', label: 'esperado' },
  ],
  action: 'prender y apagar',
  start: { vivos: 1, esperado: 1 },

  code: (knobs) => {
    const forma = knobs[LIMPIEZA];
    if (forma === 1) {
      return [
        { text: 'effect(() => {' },
        { text: '  this.id = setInterval(tick, 1000);' },
        { text: '});' },
        { text: '' },
        { text: 'ngOnDestroy() { clearInterval(this.id); }', knob: LIMPIEZA },
      ];
    }
    if (forma === 2) {
      return [
        { text: 'effect((onCleanup) => {' },
        { text: '  const id = setInterval(tick, 1000);' },
        { text: '  onCleanup(() => clearInterval(id));', knob: LIMPIEZA },
        { text: '});' },
      ];
    }
    return [
      { text: 'const id = setInterval(tick, 1000);' },
      { text: 'inject(DestroyRef).onDestroy(' },
      { text: '  () => clearInterval(id),', knob: LIMPIEZA },
      { text: ');' },
    ];
  },

  // DestroyRef y ngOnDestroy corren UNA vez, al morir el componente: entre re-ejecuciones del
  // effect no limpian nada, así que cada vuelta deja un reloj más latiendo.
  settle: (state: SystemState) => ({
    vivos: state.knobs[LIMPIEZA] === 2 ? 1 : state.actions + 1,
    esperado: 1,
  }),

  // Con una sola vuelta no se nota la acumulación: hay que haberlo prendido y apagado dos veces.
  healthy: (state: SystemState) =>
    state.actions >= 2 && state.values['vivos'] === state.values['esperado'],

  establishes: 'onCleanup corre antes de cada re-ejecución del effect, no solo al final.',
};
