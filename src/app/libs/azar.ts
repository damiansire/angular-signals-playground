/**
 * Pseudoazar con semilla: el mismo número da siempre el mismo resultado, entre 0 y 1. Así un cielo de
 * estrellas, un parpadeo o una queja salen iguales en cada visita y en cada test, sin guardar nada.
 */
export function azar(k: number): number {
  const x = Math.sin(k * 127.1 + 311.7) * 43758.5453;
  return x - Math.floor(x);
}
