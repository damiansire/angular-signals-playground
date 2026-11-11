import type { Punto } from '../libs/partida';

/**
 * Qué sigue al entrar: la historia desde una línea de su comienzo (`null` es el principio), o el
 * viaje donde quedó, que también puede ser su último cuadro. No hay un tercer lugar: la app es una
 * sola historia (ADR 0008).
 */
export type Entrada =
  { readonly a: 'prologo'; readonly desde: string | null } | { readonly a: 'viaje' };

/**
 * Qué pasa al entrar desde la colina: siempre sigue la historia, aunque una partida vieja haya
 * quedado en la molécula, que ya no existe (ADR 0021). Con el comienzo ya visto, sigue el viaje; una
 * partida de antes del viaje lo arranca
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
 * Adónde lleva el toque del aviso de auriculares. El aviso existe para el gesto que deja sonar, y
 * la colina es el principio de la historia: con algo para retomar, el toque sigue directo ahí
 * (ADR 0015). Una partida que arrancaría la historia del principio no tiene dónde retomar, y pasa
 * por la colina como la primera vez.
 */
export function despuesDelAviso(
  punto: Punto | null,
  puntosDelPrologo: readonly string[],
  prologoVisto: boolean,
): 'colina' | Entrada {
  const entrada = entradaDeLaHistoria(punto, puntosDelPrologo, prologoVisto);
  return entrada.a === 'prologo' && entrada.desde === null ? 'colina' : entrada;
}
