/**
 * Las reglas de una línea de la tripulación, donde sea que hable: una cinemática, una hoja del viaje
 * o la práctica. Viven acá porque las comparten áreas que no se conocen entre sí, y con una copia
 * por área la práctica terminaba hablando distinto que el viaje.
 */

/** El techo de una línea: es todo lo que hay en pantalla mientras se dice. */
export const REGLAS_DE_LINEA = {
  palabras: 8,
  renglones: 2,
  columnas: 44,
} as const;

export interface PalabraDeLinea {
  readonly txt: string;
  /** La primera palabra de un renglón nuevo: el salto lo decide el guion, no el ancho de la caja. */
  readonly corte: boolean;
}

export function palabrasDe(txt: string): number {
  return txt.replace(/\n/g, ' ').split(/\s+/).filter(Boolean).length;
}

/** Las palabras de una línea, para que entren de a una. */
export function palabrasDeLinea(txt: string): PalabraDeLinea[] {
  return txt.split('\n').flatMap((renglon, r) =>
    renglon
      .split(/\s+/)
      .filter(Boolean)
      .map((palabra, k) => ({ txt: palabra, corte: r > 0 && k === 0 })),
  );
}

/** Todo lo que una línea rompe de las reglas, en castellano. Vacío = se puede decir. */
export function problemasDeLinea(txt: string): readonly string[] {
  const p: string[] = [];
  const palabras = palabrasDe(txt);
  if (palabras > REGLAS_DE_LINEA.palabras) {
    p.push(`${palabras} palabras, el techo es ${REGLAS_DE_LINEA.palabras}`);
  }
  const renglones = txt.split('\n');
  if (renglones.length > REGLAS_DE_LINEA.renglones) p.push('más de dos renglones');
  for (const r of renglones) {
    if (r.length > REGLAS_DE_LINEA.columnas) p.push(`renglón de ${r.length} columnas`);
  }
  // La raya delata redacción automática y no es la voz de nadie de esta tripulación.
  if (/[—–]/.test(txt)) p.push('usa raya');
  return p;
}
