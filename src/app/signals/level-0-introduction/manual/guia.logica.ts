/**
 * La mano que guía en cada página del manual: lo que decide antes de moverse, en funciones puras.
 * La página dice qué hay que tocar (un selector); esto elige el próximo, dónde apoyar el dedo y
 * cuándo "Mostrame" ya hizo todo lo que había para hacer.
 */

/** El primero que falta tocar, en el orden en que se lee; `null` si ya se tocaron todos. */
export function siguienteSinTocar(
  orden: readonly string[],
  tocados: readonly string[],
): string | null {
  const hechos = new Set(tocados);
  return orden.find((id) => !hechos.has(id)) ?? null;
}

export interface Caja {
  readonly left: number;
  readonly top: number;
  readonly width: number;
  readonly height: number;
}

/**
 * Dónde apoya el dedo, relativo al marco de la página. La mano entra desde abajo a la derecha, con
 * el dedo sobre el borde derecho del objetivo y a media altura: más abajo parecía señalar el
 * renglón de abajo, y en una pastilla ancha, a una proporción del ancho, tapaba lo que dice.
 */
export function puntaDeLaMano(objetivo: Caja, marco: Caja): { x: number; y: number } {
  return {
    x: Math.round(
      objetivo.left - marco.left + objetivo.width - Math.min(14, objetivo.width * 0.15),
    ),
    y: Math.round(objetivo.top - marco.top + objetivo.height * 0.6),
  };
}

/**
 * "Mostrame" toca lo que la página señala hasta que no señala nada. Si después de un toque señala lo
 * mismo, la página no avanza sola con ese toque: se para ahí en vez de tocarlo para siempre.
 */
export function sigueMostrando(
  antes: string | null,
  ahora: string | null,
  pasos: number,
  tope: number,
): boolean {
  return ahora !== null && ahora !== antes && pasos < tope;
}
