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

/** Un borde de la pantalla, en las coordenadas del dibujo de la nave. */
export interface BordeDeLaPantalla {
  readonly izquierda: number;
  readonly arriba: number;
  readonly abajo: number;
}

/**
 * El haz que une la nariz de la nave con su pantalla, que está en otro elemento (el `render` de la
 * página): un triángulo de la nariz al borde izquierdo, que entra por debajo de las esquinas (30 de
 * 178 arriba y abajo), como el de la lámina que tenía la pantalla adentro. Sin él, la pantalla flotaba suelta y se leía como
 * una ventana aparte. `null` si la pantalla no queda adelante de la nariz (en el celular va abajo).
 */
export function trazoDelHaz(
  nariz: { x: number; y: number },
  borde: BordeDeLaPantalla,
): string | null {
  const alto = borde.abajo - borde.arriba;
  if (alto <= 0 || borde.izquierda - nariz.x < 12) return null;
  const margen = (alto * 30) / 178;
  const f = (n: number) => n.toFixed(1);
  return (
    `M${f(nariz.x)} ${f(nariz.y)}` +
    `L${f(borde.izquierda)} ${f(borde.arriba + margen)}` +
    `L${f(borde.izquierda)} ${f(borde.abajo - margen)}Z`
  );
}
