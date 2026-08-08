/**
 * Agenda trabajo diferido (cuadros y timers) que se CORTA al destruir la vista.
 *
 * Vive aparte de `molecule-engine` porque su contrato es lo único del motor que no se puede
 * verificar mirando la pantalla: que después de cerrar no quede nada agendado. Ese contrato ya se
 * rompió una vez de verdad (las ondas del nacimiento y los pulsos seguían corriendo sobre nodos ya
 * sacados del documento), y adentro de una función de 1.200 líneas solo se podía probar montando
 * la app entera. Acá se prueba en aislamiento, que es donde este tipo de bug se ve.
 */
export interface FrameScheduler {
  /** Un cuadro, cancelable en bloque al cerrar. */
  raf: (fn: FrameRequestCallback) => void;
  /** Un timer, cancelable en bloque al cerrar. No ejecuta si ya se cerró. */
  later: (fn: () => void, ms: number) => void;
  /** Si ya se cerró. Lo consultan los loops largos para cortar a mitad de camino. */
  readonly cerrado: () => boolean;
  /** Cancela todo lo pendiente. Idempotente. */
  dispose: () => void;
}

export function createFrameScheduler(): FrameScheduler {
  let cerrado = false;
  const rafIds = new Set<number>();
  const timerIds = new Set<number>();

  return {
    raf: (fn) => {
      if (cerrado) return;
      const id = requestAnimationFrame((ts) => {
        rafIds.delete(id);
        // La cancelación puede llegar entre que el navegador agenda el cuadro y lo ejecuta.
        if (!cerrado) fn(ts);
      });
      rafIds.add(id);
    },

    later: (fn, ms) => {
      if (cerrado) return;
      const id = window.setTimeout(() => {
        timerIds.delete(id);
        if (!cerrado) fn();
      }, ms);
      timerIds.add(id);
    },

    cerrado: () => cerrado,

    dispose: () => {
      cerrado = true;
      rafIds.forEach((id) => cancelAnimationFrame(id));
      rafIds.clear();
      timerIds.forEach((id) => window.clearTimeout(id));
      timerIds.clear();
    },
  };
}
