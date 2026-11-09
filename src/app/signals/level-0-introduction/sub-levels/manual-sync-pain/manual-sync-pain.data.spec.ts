import {
  PANEL_INICIAL,
  PanelAMano,
  SpotId,
  deriveOutputs,
  diceQueSi,
  increment,
  staleSpots,
} from './manual-sync-pain.data';

const INCOMPLETO = new Set<SpotId>(['value']);
const COMPLETO = new Set<SpotId>(['value', 'mult2', 'mult3']);

const sumar = (veces: number, synced: ReadonlySet<SpotId>, desde = PANEL_INICIAL): PanelAMano =>
  Array.from({ length: veces }).reduce<PanelAMano>((p) => increment(p, synced), desde);

describe('manual-sync-pain (dominio "a mano no escala")', () => {
  it('deriva la verdad de cada spot desde count', () => {
    expect(deriveOutputs(4)).toEqual({ value: '4', mult2: 'Sí', mult3: 'No' });
    expect(deriveOutputs(6)).toEqual({ value: '6', mult2: 'Sí', mult3: 'Sí' });
    expect(deriveOutputs(1)).toEqual({ value: '1', mult2: 'No', mult3: 'No' });
  });

  it('arranca al día', () => {
    expect(staleSpots(PANEL_INICIAL)).toEqual([]);
  });

  it('handler incompleto: solo escribe el valor y los derivados quedan en el de cero', () => {
    const panel = sumar(4, INCOMPLETO);
    expect(panel.shown).toEqual({ value: '4', mult2: 'Sí', mult3: 'Sí' });
    expect(staleSpots(panel)).toEqual(['mult3']);
    expect(staleSpots(sumar(5, INCOMPLETO))).toEqual(['mult2', 'mult3']);
  });

  it('completar el handler no arregla el panel hasta la próxima corrida', () => {
    const roto = sumar(2, INCOMPLETO);
    expect(staleSpots(roto)).toEqual(['mult3']);
    const arreglado = sumar(1, COMPLETO, roto);
    expect(arreglado.shown).toEqual({ value: '3', mult2: 'No', mult3: 'Sí' });
    expect(staleSpots(arreglado)).toEqual([]);
  });

  it('handler completo: nunca hay viejos, para cualquier cuenta', () => {
    let panel = PANEL_INICIAL;
    for (let i = 0; i < 12; i++) {
      panel = increment(panel, COMPLETO);
      expect(staleSpots(panel)).toEqual([]);
    }
  });

  it('un múltiplo dice que sí; el número y el "No" no', () => {
    expect(diceQueSi(deriveOutputs(6).mult3)).toBeTrue();
    expect(diceQueSi(deriveOutputs(4).mult3)).toBeFalse();
    expect(diceQueSi(deriveOutputs(6).value)).toBeFalse();
  });
});
