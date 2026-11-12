/**
 * Lo que piensa Angie en la colina: primero lo presiente, con la radio; después de hablar con el
 * sol, decide. Vive aparte de la escena para que `scripts/voces.mjs` lo lea sin cargar el DOM.
 */
export const LO_QUE_PRESIENTE = 'Así que… Ellos ya están aquí';
export const LO_QUE_DECIDE = 'Así que… La hora ha llegado';

/** El grupo `colina` de las voces: la nube termina en "…", y así se dice también. */
export const PENSAMIENTOS_DE_LA_COLINA = [
  { id: 'colina-presiente', quien: 'mascota', txt: `${LO_QUE_PRESIENTE}…` },
  { id: 'colina-decide', quien: 'mascota', txt: `${LO_QUE_DECIDE}…` },
] as const;
