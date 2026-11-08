import type { Health, SystemState } from '../libs/manipulable-challenge';
import type { HuecoDelPrologo } from './operadores-del-prologo';

/**
 * La ayuda del minijuego de operadores, aparte de sus datos: la vista la usa, y los datos viajan con
 * el prólogo diferido. Importados desde la vista, pasaban el bundle inicial de su presupuesto.
 */

/** Lo que el desafío deja después de cada toque. */
export interface Corrida {
  readonly estado: SystemState;
  readonly salud: Health;
}

/** El operador que está puesto en el hueco con esa posición de la perilla. */
export function operadorEn(hueco: HuecoDelPrologo, estado: SystemState): string {
  const linea = hueco.sistema.code(estado.knobs).find((l) => l.knob);
  return linea?.text.trim().match(/^\w+/)?.[0] ?? '';
}

/**
 * La ayuda de la otra nave: solo cuando la corrida ya demostró que el operador no sirve. Antes de
 * accionar no hay nada que explicar, y con el sano tampoco.
 */
export function pistaDe(hueco: HuecoDelPrologo, corrida: Corrida | null): string | null {
  if (!corrida || corrida.salud !== 'broken') return null;
  return hueco.pistas[operadorEn(hueco, corrida.estado)] ?? null;
}
