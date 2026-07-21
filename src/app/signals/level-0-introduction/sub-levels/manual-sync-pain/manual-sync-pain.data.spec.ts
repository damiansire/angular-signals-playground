import { deriveOutputs, renderedUnderHandler, staleSpots, SpotId } from './manual-sync-pain.data';

describe('manual-sync-pain (dominio "a mano no escala")', () => {
  it('deriva la verdad de cada spot desde count', () => {
    expect(deriveOutputs(4)).toEqual({ value: '4', mult2: 'Sí', mult3: 'No' });
    expect(deriveOutputs(6)).toEqual({ value: '6', mult2: 'Sí', mult3: 'Sí' });
    expect(deriveOutputs(1)).toEqual({ value: '1', mult2: 'No', mult3: 'No' });
  });

  it('handler incompleto (solo value): los derivados quedan viejos', () => {
    const synced = new Set<SpotId>(['value']);
    // count=4: mult2 debería ser "Sí" pero quedó en el inicial (count=0 → "Sí"), mult3 "No" vs inicial "Sí".
    expect(renderedUnderHandler(4, synced)).toEqual({ value: '4', mult2: 'Sí', mult3: 'Sí' });
    expect(staleSpots(4, synced)).toEqual(['mult3']);
    // count=5: mult2 debería "No" (quedó "Sí"), mult3 "No" (quedó "Sí") → dos viejos.
    expect(staleSpots(5, synced)).toEqual(['mult2', 'mult3']);
  });

  it('handler completo (los tres spots): nunca hay viejos, para cualquier count', () => {
    const synced = new Set<SpotId>(['value', 'mult2', 'mult3']);
    for (let count = 0; count <= 12; count++) {
      expect(staleSpots(count, synced)).toEqual([]);
    }
  });
});
