import { ManipulableChallenge, SystemState } from '../../libs/manipulable-challenge';

/**
 * Sistemas del nivel 9: el momento después de pintar. Medir el DOM antes de que exista devuelve
 * ceros silenciosos, que es peor que un error: el código parece andar.
 */

const K = 'perilla';
const knob = (label: string, positions = 2) => [{ id: K, positions, label }];

/** 9/1 · medir el DOM antes de que se pinte devuelve cero. */
export const AFTER_RENDER_SYSTEM: ManipulableChallenge = {
  knobs: knob('medir en el effect o después del render'),
  gauges: [{ id: 'alto', label: 'alto medido' }],
  action: 'mostrar el panel',
  start: { alto: 0 },
  code: (k) => [
    k[K] === 1
      ? { text: 'afterRenderEffect(() => {', knob: K }
      : { text: 'effect(() => {', knob: K },
    { text: '  const alto = panel().nativeElement.offsetHeight;' },
    { text: '  acomodar(alto);' },
    { text: '});' },
  ],
  // Antes del paint el elemento existe pero todavía no tiene caja: offsetHeight da 0.
  settle: (s: SystemState) => ({ alto: s.actions > 0 && s.knobs[K] === 1 ? 240 : 0 }),
  healthy: (s: SystemState) => s.values['alto'] > 0,
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
