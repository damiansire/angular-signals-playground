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

export interface Entrada {
  /** El prólogo ya se pasó: entrar va directo a la construcción de Tusi. */
  readonly saltarPrologo: boolean;
  /** La línea donde arranca el prólogo, o `null` para el principio. */
  readonly desde: string | null;
}

/**
 * Qué pasa al entrar desde la colina. Una línea guardada que el guion ya no tiene como punto se
 * ignora: el prólogo arranca del principio antes que en un lugar que no existe.
 */
export function entradaDeLaHistoria(
  punto: Punto | null,
  puntosDelPrologo: readonly string[],
): Entrada {
  if (punto?.lugar === 'construccion' || punto?.lugar === 'recorrido') {
    return { saltarPrologo: true, desde: null };
  }
  const desde = punto?.lugar === 'prologo' && puntosDelPrologo.includes(punto.linea);
  return { saltarPrologo: false, desde: desde ? punto.linea : null };
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
