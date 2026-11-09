import { type MutationKind, renderCost } from '../../../../libs/render-pipeline';

/**
 * Dominio de la ley 3: el mismo cuadro corre con la propiedad que pone el hueco, y lo que cuesta
 * depende de ella. El hueco rota del cambio más caro al más barato. Funciones puras, sin DOM.
 */
export interface Cambio {
  readonly kind: MutationKind;
  /** Lo que se toca, como lo nombra el código. */
  readonly propiedad: string;
  /** El renglón real que corre en cada cuadro. */
  readonly renglon: string;
}

/** Del más caro al más barato: arranca moviendo la nave con `left`, que pasa por layout. */
export const CAMBIOS: readonly Cambio[] = [
  { kind: 'geometry', propiedad: 'left', renglon: "nave.style.left = t + 'px';" },
  { kind: 'textContent', propiedad: 'textContent', renglon: 'nave.textContent = t;' },
  { kind: 'color', propiedad: 'color', renglon: 'nave.style.color = tono(t);' },
  {
    kind: 'transform',
    propiedad: 'transform',
    renglon: "nave.style.transform = 'translateX(' + t + 'px)';",
  },
];

/** El cambio que sigue en la rueda del hueco. */
export function siguienteCambio(cambio: Cambio): Cambio {
  return CAMBIOS[(CAMBIOS.indexOf(cambio) + 1) % CAMBIOS.length];
}

/** La pantalla anda fluida: el cuadro no pasa por layout ni por paint. */
export function esBarato(cambio: Cambio): boolean {
  return renderCost(cambio.kind) === 'barato';
}

/** Lo último que corrió es lo que está en el código, y es barato. */
export function quedoFluida(actual: Cambio, corrido: Cambio | null): boolean {
  return corrido === actual && esBarato(actual);
}

/**
 * Lo próximo que hay que tocar, en el orden de los pasos: correr, y después, mientras no ande
 * fluida, el hueco y correr de nuevo con cada propiedad. Así se ven las cuatro una vez.
 */
export function queSigue(actual: Cambio, corrido: Cambio | null): 'correr' | 'propiedad' | null {
  if (quedoFluida(actual, corrido)) return null;
  return corrido === actual ? 'propiedad' : 'correr';
}
