/**
 * Las líneas del prólogo desde donde se retoma al recargar: el comienzo de cada tramo que se lee
 * solo. Volver justo antes del minijuego y del manual los abre otra vez, porque recargar a mitad
 * de una hoja es no haberla terminado.
 *
 * Vive aparte del guion a propósito: la vista lo necesita al arrancar, y el guion viaja con el
 * prólogo diferido. Que cada id exista en el guion y vaya en su orden lo verifica
 * `prologo-guion.spec.ts`.
 */
export const PUNTOS_DEL_PROLOGO: readonly string[] = [
  'anom-que-pasa',
  'anom-rxjs',
  'anom-manual',
  'dentro-vivos',
  'voz-supongo',
  'orden-caos-es-orden',
  'leccion-entiendes',
];
