/**
 * El recorrido se mueve con el scroll nativo y un snap obligatorio: al terminar cada gesto, el
 * navegador decide en qué parada encajar. Con la rueda, cuando la parada siguiente queda lejos (el
 * tramo de cámara entre dos conceptos mide 1.8 pantallas), un gesto corto terminaba más cerca de la
 * parada de partida y el snap lo devolvía ahí: el recorrido no avanzaba, ni para adelante ni para
 * atrás. No se vuelve a secuestrar la rueda (el scroll sigue siendo nativo, que es lo que se eligió
 * al dejar el wheel-jacking); solo se rescata ese caso: si el gesto empujó y el snap lo dejó donde
 * estaba, se da el paso que pidió, igual que la flecha.
 */

/** Empuje mínimo (px) para leer un gesto como pedido de moverse; menos es un roce. */
export const EMPUJE_MINIMO = 40;

/** El paso que falta dar: 0 si el snap ya movió el recorrido o si el gesto fue un roce. */
export function pasoDeRescate(desde: number, hasta: number, empuje: number): -1 | 0 | 1 {
  if (Math.abs(hasta - desde) > 0.05) return 0;
  if (Math.abs(empuje) < EMPUJE_MINIMO) return 0;
  return empuje > 0 ? 1 : -1;
}

/** La parada más cercana a `u` (en unidades de scroll). */
export function paradaMasCercana(u: number, paradas: readonly number[]): number {
  let mejor = paradas[0] ?? 0;
  for (const p of paradas) if (Math.abs(p - u) < Math.abs(mejor - u)) mejor = p;
  return mejor;
}

/**
 * Si la rueda la usa algo de adentro (una lista con scroll propio, un campo), es de ese elemento y
 * no del recorrido: rescatarla movería el recorrido mientras el jugador lee otra cosa.
 */
export function laRuedaEsDeAdentro(
  objetivo: EventTarget | null,
  recorrido: Element,
  dy: number,
): boolean {
  for (
    let n = objetivo instanceof Element ? objetivo : null;
    n && n !== recorrido;
    n = n.parentElement
  ) {
    if (n.matches('input, textarea, select')) return true;
    const oy = getComputedStyle(n).overflowY;
    if ((oy === 'auto' || oy === 'scroll') && n.scrollHeight > n.clientHeight + 1) {
      if (dy < 0 ? n.scrollTop > 0 : n.scrollTop + n.clientHeight < n.scrollHeight - 1) return true;
    }
  }
  return false;
}
