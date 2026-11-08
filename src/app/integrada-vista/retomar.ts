import type { Punto } from '../libs/partida';
import type { WhereState } from './url-sync';

/**
 * Dónde abre el recorrido al cargar. Un link manda, porque alguien lo eligió; si no hay, el lugar
 * del recorrido donde quedó la partida. Antes del recorrido no hay nada que abrir: la historia
 * sigue desde la colina.
 */
export function inicioDelRecorrido(
  punto: Punto | null,
  deepLink: WhereState | null,
): WhereState | null {
  if (deepLink) return deepLink;
  if (punto?.lugar !== 'recorrido') return null;
  return { concept: punto.concepto, sub: punto.sub + 1 };
}

/**
 * Qué sigue al entrar: el prólogo desde una línea (`null` es el principio), el viaje donde quedó, o
 * el mapa, si el viaje se dejó por él. El mapa arranca con la construcción de Tusi.
 */
export type Entrada =
  | { readonly a: 'prologo'; readonly desde: string | null }
  | { readonly a: 'viaje' }
  | { readonly a: 'mapa' };

/**
 * Qué pasa al entrar desde la colina. Una línea guardada que el guion ya no tiene como punto se
 * ignora: el prólogo arranca del principio antes que en un lugar que no existe.
 */
export function entradaDeLaHistoria(
  punto: Punto | null,
  puntosDelPrologo: readonly string[],
): Entrada {
  if (punto?.lugar === 'viaje') return { a: 'viaje' };
  if (punto?.lugar === 'construccion' || punto?.lugar === 'recorrido') return { a: 'mapa' };
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
