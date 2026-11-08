/**
 * Aparte del resaltador a propósito: la vista lo usa, y el resaltador (con sus expresiones y su tabla
 * de palabras clave) viaja solo con el desafío diferido. Juntos, sumaban el resaltador al bundle
 * inicial.
 */

export interface Tramo {
  readonly texto: string;
  readonly codigo: boolean;
}

/**
 * Una frase de prosa con código entre comillas invertidas (`p - deriva`), partida en tramos. Así el
 * dato se escribe como se lee y la vista decide cómo mostrar cada parte.
 */
export function tramosDeFrase(frase: string): Tramo[] {
  return frase
    .split(/(`[^`]*`)/)
    .filter(Boolean)
    .map((parte) =>
      parte.startsWith('`') && parte.endsWith('`') && parte.length > 1
        ? { texto: parte.slice(1, -1), codigo: true }
        : { texto: parte, codigo: false },
    );
}
