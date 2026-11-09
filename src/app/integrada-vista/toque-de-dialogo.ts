/**
 * Lo que hace un toque sobre un diálogo que se escribe, en la colina y en las cinemáticas. Como en
 * un RPG: a medio escribir, el toque lo termina de escribir ya; escrito, pasa al siguiente. Antes
 * todo toque pasaba, y una ráfaga de clics se llevaba dos diálogos juntos sin leer ninguno.
 */
export type ToqueDeDialogo = 'completar' | 'pasar' | 'nada';

/**
 * Lo que espera el toque siguiente para pasar después de completar un diálogo: un doble clic, o
 * una ráfaga, completaba y pasaba en el mismo gesto, y el diálogo completo no se llegaba a ver.
 */
export const RESPIRO_MS = 350;

/**
 * `ms` es cuándo llega el toque desde que el diálogo empezó a escribirse; `seEscribeEn`, cuándo
 * termina solo; `completadoEn`, cuándo lo completó un toque anterior (`null` si ninguno).
 */
export function queHaceElToque(
  ms: number,
  seEscribeEn: number,
  completadoEn: number | null,
): ToqueDeDialogo {
  if (completadoEn !== null) return ms - completadoEn < RESPIRO_MS ? 'nada' : 'pasar';
  return ms < seEscribeEn ? 'completar' : 'pasar';
}
