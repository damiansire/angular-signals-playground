import type { Punto } from '../libs/partida';

/**
 * Qué sigue al entrar: la historia desde una línea de su comienzo (`null` es el principio), o el
 * viaje donde quedó, que también puede ser su último cuadro. No hay un tercer lugar: la app es una
 * sola historia, y la molécula solo se abre con un link (ADR 0008).
 */
export type Entrada =
  { readonly a: 'prologo'; readonly desde: string | null } | { readonly a: 'viaje' };

/**
 * Qué pasa al entrar desde la colina: siempre sigue la historia, aunque la partida haya quedado en
 * la molécula. Con el comienzo ya visto, sigue el viaje; una partida de antes del viaje lo arranca
 * del principio. Una línea guardada que el guion ya no tiene como punto se ignora: el comienzo
 * arranca del principio antes que en un lugar que no existe.
 */
export function entradaDeLaHistoria(
  punto: Punto | null,
  puntosDelPrologo: readonly string[],
  prologoVisto: boolean,
): Entrada {
  if (prologoVisto || punto?.lugar === 'viaje') return { a: 'viaje' };
  const desde = punto?.lugar === 'prologo' && puntosDelPrologo.includes(punto.linea);
  return { a: 'prologo', desde: desde ? punto.linea : null };
}

/**
 * El lugar que se guarda cuando el recorrido avisa dónde está. Volver a la landing desde el
 * recorrido es estar en la construcción. Mientras la historia todavía no llegó al recorrido, la
 * landing no pisa el punto del prólogo: la vista la reporta al arrancar, antes de entrar.
 */
export function puntoDelRecorrido(
  actual: Punto | null,
  concepto: number,
  sub: number,
): Punto | null {
  if (concepto >= 0) return { lugar: 'recorrido', concepto, sub };
  return actual?.lugar === 'recorrido' ? { lugar: 'construccion' } : actual;
}
