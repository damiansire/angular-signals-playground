/**
 * Lo que las láminas del manual deciden antes de mover nada: funciones puras, probadas sin
 * navegador. La lámina solo traduce el resultado a movimiento.
 */

/**
 * Qué posiciones del documento están a la vista, de menor a mayor. La demo guarda los nodos en el
 * orden en que se tocaron y la lámina los ubica por su lugar en el HTML; los ids que ya no están en
 * el árbol no cuentan.
 */
export function posicionesEnElDocumento(
  orden: readonly string[],
  visibles: readonly string[],
): number[] {
  const lugar = new Map(orden.map((id, i) => [id, i]));
  return [...new Set(visibles)]
    .map((id) => lugar.get(id))
    .filter((i): i is number => i !== undefined)
    .sort((a, b) => a - b);
}

export type Costo = 'barato' | 'medio' | 'caro';

/** Ruido con semilla, el mismo cada vez: la lámina no cambia entre una carga y otra. */
function ruido(k: number): number {
  const x = Math.sin(k * 91.7 + 17.3) * 43758.5453;
  return x - Math.floor(x);
}

/**
 * Cuánto tarda cada uno de los últimos `n` cuadros, en múltiplos del presupuesto de un cuadro
 * (16 ms = 1). Barato entra siempre; medio roza el límite y a veces se pasa; caro se pasa casi
 * siempre, con picos. Lo que se pasa de 1 es un cuadro que la pantalla no llegó a mostrar.
 */
export function cuadrosDelCosto(costo: Costo, n: number): number[] {
  return Array.from({ length: n }, (_, i) => {
    const r = ruido(i);
    if (costo === 'barato') return 0.25 + r * 0.3;
    if (costo === 'medio') return i % 5 === 3 ? 1.15 + r * 0.2 : 0.55 + r * 0.35;
    return i % 3 === 1 ? 1.6 + r * 0.35 : 1.05 + r * 0.4;
  });
}

/**
 * En cuántos saltos recorre el paisaje una vuelta: 0 es de corrido. Cuanto más cuesta el cambio,
 * menos cuadros llegan a la pantalla, y lo que se mueve avanza a los tirones.
 */
export function saltosDelPaisaje(costo: Costo): number {
  return costo === 'barato' ? 0 : costo === 'medio' ? 14 : 5;
}
