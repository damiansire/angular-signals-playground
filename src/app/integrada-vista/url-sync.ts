/**
 * Sync bidireccional URL↔estado del recorrido, como funciones puras (sin DOM ni Angular)
 * para poder testear ambas direcciones sobre fixtures. `buildWhereQuery` escribe la barra
 * mientras scrolleás; `parseWhereQuery` la relee en el boot (deep-link). El round-trip tiene
 * que cerrar: una URL que la vista escribe, la vista la tiene que poder reabrir.
 */

/** Punto del recorrido reflejado en la URL. `sub` es 1-based; 0 = vista molécula (átomo, sin sub-nivel). */
export interface WhereState {
  concept: number;
  sub: number;
}

/**
 * Query string (sin `?`) para un punto del recorrido. `subIdx` es 0-based dentro del concepto,
 * o -1 en la vista molécula (átomo enfocado, sin sub-nivel) → solo `nivel=`. `conceptIdx < 0` = landing
 * (hero, todavía sin entrar al recorrido) → query VACÍA, así la URL queda limpia (`/`) en el arranque.
 */
export function buildWhereQuery(conceptIdx: number, subIdx: number): string {
  if (conceptIdx < 0) return '';
  return subIdx >= 0 ? `nivel=${conceptIdx}&sub-nivel=${subIdx + 1}` : `nivel=${conceptIdx}`;
}

/**
 * Lee `?nivel=X(&sub-nivel=Z)` de un query string. Devuelve `null` si no hay un nivel válido.
 * `sub` es 1-based; vale 0 cuando la URL trae SOLO el nivel (vista molécula): así el deep-link
 * `?nivel=X` que la vista escribe en la molécula se puede reabrir (antes exigía `sub>=1` y caía a null).
 */
export function parseWhereQuery(search: string): WhereState | null {
  const params = new URLSearchParams(search);
  // `get` devuelve null si el parámetro no está, y `Number(null)` es 0: sin este guard, una URL
  // sin `nivel` se leería como el concepto 0 en vez de "no hay deep-link".
  const rawNivel = params.get('nivel');
  if (rawNivel === null || rawNivel.trim() === '') return null;
  const nivel = Number(rawNivel);
  if (!Number.isInteger(nivel) || nivel < 0) return null;
  const rawSub = params.get('sub-nivel');
  if (rawSub === null) return { concept: nivel, sub: 0 };
  const sub = Number(rawSub);
  if (!Number.isInteger(sub) || sub < 1) return null;
  return { concept: nivel, sub };
}
