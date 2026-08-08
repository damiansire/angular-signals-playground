/**
 * Qué conceptos del recorrido deben estar montados en cada momento.
 *
 * Es política pura, sin DOM: decide QUÉ, y el motor hace el cómo. Vive aparte porque sus
 * invariantes son la clase de cosa que se rompe en silencio (una card en blanco, o un componente
 * que nadie desmonta) y adentro de la función de 1.200 líneas del motor solo se podía verificar
 * montando la app entera.
 *
 * El criterio es una ventana alrededor del concepto que se está mirando: el vecino se monta
 * mientras todavía estás en el actual, así se llega con la card ya llena.
 */
export interface CambiosDeMontaje {
  montar: number[];
  desmontar: number[];
}

/**
 * @param actual  concepto que se está mirando
 * @param total   cantidad de conceptos del recorrido
 * @param radio   cuántos vecinos a cada lado se mantienen montados
 * @param montados los que están montados AHORA
 */
export function cambiosDeMontaje(
  actual: number,
  total: number,
  radio: number,
  montados: ReadonlySet<number>,
): CambiosDeMontaje {
  const montar: number[] = [];
  const desmontar: number[] = [];

  for (let i = 0; i < total; i++) {
    const deberia = Math.abs(i - actual) <= radio;
    const esta = montados.has(i);
    if (deberia && !esta) montar.push(i);
    else if (!deberia && esta) desmontar.push(i);
  }

  return { montar, desmontar };
}

/**
 * El concepto que se está mirando va PRIMERO en la lista de montaje: es el único que se ve, y
 * montarlo tarde deja una card vacía a la vista. Los vecinos pueden esperar al drenaje.
 */
export function ordenarPorUrgencia(montar: readonly number[], actual: number): number[] {
  return [...montar].sort((a, b) => Math.abs(a - actual) - Math.abs(b - actual));
}
