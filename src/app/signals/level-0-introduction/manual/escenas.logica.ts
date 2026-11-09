/**
 * Lo que las láminas del manual deciden antes de mover nada: funciones puras, probadas sin
 * navegador. La lámina solo traduce el resultado a movimiento.
 */

export type Costo = 'barato' | 'medio' | 'caro';

/**
 * En cuántos saltos recorre el paisaje una vuelta: 0 es de corrido. Cuanto más cuesta el cambio,
 * menos cuadros llegan a la pantalla, y lo que se mueve avanza a los tirones.
 */
export function saltosDelPaisaje(costo: Costo): number {
  return costo === 'barato' ? 0 : costo === 'medio' ? 14 : 5;
}

/** La franja de la lámina que una escena angosta no puede recortar: desde dónde, cuánto y su centro. */
export interface LoQueImporta {
  readonly x: number;
  readonly ancho: number;
  readonly centro: number;
}

/** El de la mayoría: la nave, con su fuego, y su pantalla con su marco. */
const LO_QUE_IMPORTA: LoQueImporta = { x: 4, ancho: 394, centro: 130 };
/** El cielo entero del escenario mide 340 de alto: más alto, quedaría sin pintar. */
export const ALTO_DEL_CIELO = 340;
/** Por debajo de este ancho (px) la escena encuadra la nave y su pantalla, sin cielo de sobra. */
export const ESCENA_ANGOSTA = 560;

/**
 * El `viewBox` de una escena angosta: justo el ancho de la nave y su pantalla, y el alto que pida la
 * ventanilla. Con el cielo de sobra del escenario, a 390 px la escena quedaba a 0.69 y los rótulos
 * de la pantalla en 8 px; encuadrada, a 0.99. `null` es "el de siempre": ancha, o tan alta que el
 * cielo pintado (`altoDelCielo`) no la cubriría.
 */
export function cieloAngosto(
  ancho: number,
  alto: number,
  {
    altoDelCielo = ALTO_DEL_CIELO,
    importa = LO_QUE_IMPORTA,
  }: { altoDelCielo?: number; importa?: LoQueImporta } = {},
): string | null {
  if (ancho <= 0 || alto <= 0 || ancho >= ESCENA_ANGOSTA) return null;
  const h = (importa.ancho * alto) / ancho;
  if (h > altoDelCielo) return null;
  const y = importa.centro - h / 2;
  return `${importa.x} ${y.toFixed(1)} ${importa.ancho} ${h.toFixed(1)}`;
}
