/**
 * Modelo del desafío de cierre de un sub-nivel: el sistema queda averiado y el usuario elige la
 * pieza que lo repara. La mecánica es "diagnosticar", no "responder": el enunciado es el síntoma
 * visible, y equivocarse devuelve la razón por la que esa pieza no alcanza.
 *
 * Es agnóstico del framework a propósito (vive en `libs/`): acá está la regla, la pantalla la pone
 * el átomo `repair-challenge`.
 */

/** Una pieza candidata: el código que el usuario evalúa y por qué repara o no. */
export interface RepairPiece {
  readonly code: string;
  /** Se muestra al elegirla. En la correcta explica el porqué del arreglo, no felicita. */
  readonly why: string;
  /** Marca la única pieza que deja el sistema sano. */
  readonly repairs?: boolean;
}

export interface RepairChallenge {
  /** Lo que se ve mal antes de tocar nada, en una frase. */
  readonly symptom: string;
  /** La lectura averiada que el usuario mira mientras diagnostica. */
  readonly brokenReadout: string;
  /** La misma lectura una vez reparada. */
  readonly healthyReadout: string;
  readonly pieces: readonly RepairPiece[];
}

export interface RepairVerdict {
  readonly repaired: boolean;
  readonly why: string;
}

/** Índice de la única pieza que repara, o -1 si el desafío está mal armado. */
export function repairIndexOf(challenge: RepairChallenge): number {
  const found = challenge.pieces.reduce<number[]>(
    (acc, piece, index) => (piece.repairs ? [...acc, index] : acc),
    [],
  );
  return found.length === 1 ? found[0] : -1;
}

/** Veredicto de elegir la pieza `index`. La razón siempre viene de la pieza elegida. */
export function evaluateRepair(challenge: RepairChallenge, index: number): RepairVerdict {
  const piece = challenge.pieces[index];
  return { repaired: piece.repairs === true, why: piece.why };
}
