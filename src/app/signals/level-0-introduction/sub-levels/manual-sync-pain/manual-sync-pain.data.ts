/**
 * Dominio del sub-nivel "a mano no escala": un mismo `count` alimenta varias vistas del DOM
 * (el valor y dos derivados). Un handler escrito a mano tiene que actualizar CADA lugar; si
 * te olvidás uno, queda viejo. Todo es función pura sobre `count` + qué spots sincroniza el
 * handler, así se testea sin DOM.
 */
export type SpotId = 'value' | 'mult2' | 'mult3';

export interface Spot {
  id: SpotId;
  label: string;
}

export const SPOTS: readonly Spot[] = [
  { id: 'value', label: 'El valor es' },
  { id: 'mult2', label: 'Múltiplo de 2' },
  { id: 'mult3', label: 'Múltiplo de 3' },
];

/** La verdad: lo que cada spot DEBERÍA mostrar para un `count` dado. */
export function deriveOutputs(count: number): Record<SpotId, string> {
  return {
    value: String(count),
    mult2: count % 2 === 0 ? 'Sí' : 'No',
    mult3: count % 3 === 0 ? 'Sí' : 'No',
  };
}

/**
 * Lo que el DOM muestra REALMENTE tras `count` incrementos con un handler que solo actualiza
 * `synced`: los spots que el handler NO toca quedan clavados en su valor inicial (count = 0).
 */
export function renderedUnderHandler(
  count: number,
  synced: ReadonlySet<SpotId>,
): Record<SpotId, string> {
  const truth = deriveOutputs(count);
  const initial = deriveOutputs(0);
  const rendered = {} as Record<SpotId, string>;
  for (const spot of SPOTS) {
    rendered[spot.id] = synced.has(spot.id) ? truth[spot.id] : initial[spot.id];
  }
  return rendered;
}

/** Los spots que quedaron viejos: rendered ≠ verdad. */
export function staleSpots(count: number, synced: ReadonlySet<SpotId>): SpotId[] {
  const truth = deriveOutputs(count);
  const rendered = renderedUnderHandler(count, synced);
  return SPOTS.filter((spot) => rendered[spot.id] !== truth[spot.id]).map((spot) => spot.id);
}
