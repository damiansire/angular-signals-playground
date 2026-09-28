/** Lo que trae cada `datos/tripulacion/<id>.json`. */
export interface Tripulante {
  readonly nombre: string;
  readonly rol: string;
}

/**
 * El `parse` de httpResource. El genérico de `httpResource<Tripulante>` solo le cree al servidor:
 * es un cast, no mira la respuesta. Esto sí la mira, y si no tiene la forma esperada tira, con lo
 * que el resource pasa a error igual que con un 404 en vez de pintar un tripulante a medias.
 */
export function aTripulante(crudo: unknown): Tripulante {
  const t = (crudo ?? {}) as Partial<Record<keyof Tripulante, unknown>>;
  if (typeof t.nombre !== 'string' || typeof t.rol !== 'string') {
    throw new Error('La respuesta no tiene la forma de un tripulante');
  }
  return { nombre: t.nombre, rol: t.rol };
}
