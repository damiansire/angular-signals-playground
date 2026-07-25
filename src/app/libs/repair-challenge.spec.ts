import { evaluateRepair, RepairChallenge, repairIndexOf } from './repair-challenge';
import {
  EFFECT_CLEANUP_CHALLENGE,
  EFFECT_LEAK_CHALLENGE,
  EFFECT_READS_CHALLENGE,
} from '../signals/level-3-effect/effect-challenges';

const SHIPPED: readonly (readonly [string, RepairChallenge])[] = [
  ['3/1 lee adentro', EFFECT_READS_CHALLENGE],
  ['3/2 leak del intervalo', EFFECT_LEAK_CHALLENGE],
  ['3/3 onCleanup por re-ejecución', EFFECT_CLEANUP_CHALLENGE],
];

describe('repairIndexOf', () => {
  it('devuelve el índice de la única pieza que repara', () => {
    const challenge: RepairChallenge = {
      symptom: 's',
      brokenReadout: 'b',
      healthyReadout: 'h',
      pieces: [
        { code: 'a', why: 'no' },
        { code: 'b', why: 'sí', repairs: true },
      ],
    };
    expect(repairIndexOf(challenge)).toBe(1);
  });

  it('devuelve -1 si ninguna pieza repara', () => {
    const challenge: RepairChallenge = {
      symptom: 's',
      brokenReadout: 'b',
      healthyReadout: 'h',
      pieces: [
        { code: 'a', why: 'no' },
        { code: 'b', why: 'no' },
      ],
    };
    expect(repairIndexOf(challenge)).toBe(-1);
  });

  it('devuelve -1 si hay más de una pieza que repara', () => {
    const challenge: RepairChallenge = {
      symptom: 's',
      brokenReadout: 'b',
      healthyReadout: 'h',
      pieces: [
        { code: 'a', why: 'sí', repairs: true },
        { code: 'b', why: 'sí', repairs: true },
      ],
    };
    expect(repairIndexOf(challenge)).toBe(-1);
  });
});

describe('evaluateRepair', () => {
  const challenge: RepairChallenge = {
    symptom: 's',
    brokenReadout: 'b',
    healthyReadout: 'h',
    pieces: [
      { code: 'a', why: 'esta no alcanza' },
      { code: 'b', why: 'esta sí', repairs: true },
    ],
  };

  it('repara con la pieza correcta y explica por qué', () => {
    expect(evaluateRepair(challenge, 1)).toEqual({ repaired: true, why: 'esta sí' });
  });

  it('no repara con la pieza equivocada y devuelve su razón, no la de la correcta', () => {
    expect(evaluateRepair(challenge, 0)).toEqual({ repaired: false, why: 'esta no alcanza' });
  });
});

// Los desafíos que se publican son contenido, no código: este bloque es el que evita que un
// desafío llegue a pantalla sin respuesta correcta, con dos, o con una razón vacía.
describe('desafíos publicados de effect', () => {
  SHIPPED.forEach(([name, challenge]) => {
    describe(name, () => {
      it('tiene exactamente una pieza que repara', () => {
        expect(repairIndexOf(challenge)).toBeGreaterThanOrEqual(0);
      });

      it('ofrece al menos tres piezas para que el acierto no sea por descarte', () => {
        expect(challenge.pieces.length).toBeGreaterThanOrEqual(3);
      });

      it('explica cada pieza, también las equivocadas', () => {
        challenge.pieces.forEach((piece) => {
          expect(piece.why.length).toBeGreaterThan(20);
          expect(piece.code.length).toBeGreaterThan(0);
        });
      });

      it('cambia la lectura al reparar', () => {
        expect(challenge.brokenReadout).not.toBe(challenge.healthyReadout);
      });
    });
  });
});
