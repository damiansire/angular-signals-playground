import { ManipulableChallenge, SystemState } from '../../libs/manipulable-challenge';

/**
 * Sistemas del nivel 9: el momento después del render. Medir el DOM antes de que Angular le
 * aplique el cambio devuelve el valor viejo sin avisar, que es peor que un error: el código
 * parece andar.
 */

const K = 'perilla';
const knob = (label: string, positions = 2) => [{ id: K, positions, label }];

/** 9/1 · medir en un effect lee el DOM del render anterior. */
export const AFTER_RENDER_SYSTEM: ManipulableChallenge = {
  knobs: knob('medir en el effect o después del render'),
  gauges: [
    { id: 'medido', label: 'alto medido' },
    { id: 'real', label: 'alto real' },
  ],
  action: 'sumar una fila',
  start: { medido: 200, real: 200 },
  code: (k) => [
    k[K] === 1
      ? { text: 'afterRenderEffect(() => {', knob: K }
      : { text: 'effect(() => {', knob: K },
    { text: '  filas(); // re-mide al crecer' },
    { text: '  const alto = panel().nativeElement.offsetHeight;' },
    { text: '  acomodar(alto);' },
    { text: '});' },
  ],
  // offsetHeight no miente: fuerza el layout y da el alto de lo que HAY en el DOM. El problema
  // es cuándo: effect corre antes de que Angular renderice la fila nueva, así que mide el panel
  // del render anterior y queda siempre una fila atrás.
  settle: (s: SystemState) => {
    const real = 200 + 40 * s.actions;
    const atrasado = s.actions > 0 && s.knobs[K] !== 1;
    return { medido: atrasado ? real - 40 : real, real };
  },
  healthy: (s: SystemState) => s.actions > 0 && s.values['medido'] === s.values['real'],
};

/** 9/2 · sin limpieza, cada corrida deja su listener colgado. */
export const ON_CLEANUP_SYSTEM: ManipulableChallenge = {
  knobs: knob('registrar la limpieza del listener o no'),
  gauges: [
    { id: 'vivos', label: 'listeners vivos' },
    { id: 'esperado', label: 'esperado' },
  ],
  action: 'cambiar de panel',
  start: { vivos: 1, esperado: 1 },
  code: (k) => [
    { text: 'afterRenderEffect((onCleanup) => {' },
    { text: '  const off = escuchar(panel());' },
    k[K] === 1
      ? { text: '  onCleanup(off);', knob: K }
      : { text: '  // el listener queda', knob: K },
    { text: '});' },
  ],
  settle: (s: SystemState) => ({
    vivos: s.knobs[K] === 1 ? 1 : s.actions + 1,
    esperado: 1,
  }),
  healthy: (s: SystemState) => s.actions >= 2 && s.values['vivos'] === s.values['esperado'],
};
