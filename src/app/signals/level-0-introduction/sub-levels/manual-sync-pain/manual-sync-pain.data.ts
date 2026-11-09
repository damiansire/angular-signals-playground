/**
 * Dominio del sub-nivel "a mano no escala": un mismo `count` alimenta varias vistas del DOM
 * (el valor y dos derivados). Un handler escrito a mano tiene que actualizar CADA lugar; si
 * te olvidás uno, queda viejo. Todo es función pura sobre el panel + qué spots sincroniza el
 * handler, así se testea sin DOM.
 */
export type SpotId = 'value' | 'mult2' | 'mult3';

export interface Spot {
  id: SpotId;
  /** El selector con que el handler lo busca, que es también su rótulo en el panel de la nave. */
  selector: string;
}

export const SPOTS: readonly Spot[] = [
  { id: 'value', selector: '#count' },
  { id: 'mult2', selector: '#mult2' },
  { id: 'mult3', selector: '#mult3' },
];

/** La verdad: lo que cada spot DEBERÍA mostrar para un `count` dado. */
export function deriveOutputs(count: number): Record<SpotId, string> {
  return {
    value: String(count),
    mult2: count % 2 === 0 ? 'Sí' : 'No',
    mult3: count % 3 === 0 ? 'Sí' : 'No',
  };
}

/** El panel como lo deja el DOM: la cuenta y lo que cada lugar muestra de verdad en pantalla. */
export interface PanelAMano {
  readonly count: number;
  readonly shown: Readonly<Record<SpotId, string>>;
}

export const PANEL_INICIAL: PanelAMano = { count: 0, shown: deriveOutputs(0) };

/**
 * Una corrida de `increment()`: sube la cuenta y escribe SOLO los lugares que el handler nombra.
 * Completar el handler no arregla el panel por sí solo: lo arregla la próxima corrida.
 */
export function increment(panel: PanelAMano, synced: ReadonlySet<SpotId>): PanelAMano {
  const count = panel.count + 1;
  const truth = deriveOutputs(count);
  const shown = { ...panel.shown };
  for (const spot of SPOTS) {
    if (synced.has(spot.id)) shown[spot.id] = truth[spot.id];
  }
  return { count, shown };
}

/** Los spots que quedaron viejos: lo que muestran ≠ la verdad de la cuenta. */
export function staleSpots(panel: PanelAMano): SpotId[] {
  const truth = deriveOutputs(panel.count);
  return SPOTS.filter((spot) => panel.shown[spot.id] !== truth[spot.id]).map((spot) => spot.id);
}
