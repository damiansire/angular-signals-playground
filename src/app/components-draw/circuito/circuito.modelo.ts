/**
 * El modelo del circuito, sin navegador: qué nodos arrancan una propagación cuando cambian varios
 * valores a la vez y por dónde viaja. Vive aparte porque es lo que hace que la pantalla cuente la
 * verdad del grafo de signals, y eso se prueba como función pura.
 */

/** Fuente, derivado, consumidor (lo que lee) o caja (una variable común, que no avisa a nadie). */
export type TonoNodo = 'fuente' | 'derivado' | 'consumidor' | 'caja';

export interface NodoCircuito {
  readonly id: string;
  readonly nombre: string;
  readonly valor?: string;
  readonly tono: TonoNodo;
  /** Columna y fila en la grilla del circuito, desde 1. */
  readonly col: number;
  readonly fila: number;
  /** Cuántas filas ocupa: un nodo puede ir centrado frente a los dos que tiene al lado. */
  readonly alto?: number;
  /** Si tiene, es un botón de verdad y este es su nombre accesible. */
  readonly accion?: string;
  /** Solo lectura: lleva candado. */
  readonly cerrado?: boolean;
  /** Elegido en un grupo de opciones: se anuncia con `aria-pressed`. */
  readonly elegido?: boolean;
}

export interface EnlaceCircuito {
  readonly de: string;
  readonly a: string;
  /** `false` = la dependencia no existe en esta corrida: el cable queda colgando y no lleva nada. */
  readonly vivo?: boolean;
}

export function claveDeEnlace(enlace: EnlaceCircuito): string {
  return `${enlace.de}>${enlace.a}`;
}

/**
 * De los nodos que cambiaron, los que arrancan la propagación: los que no recibieron el cambio de
 * otro nodo que también cambió. Sin esto, escribir en `firstName` dispararía a la vez a `firstName` y
 * a `fullName`, y el derivado reaccionaría antes de que le llegue el aviso: la causa después del
 * efecto.
 */
export function origenesDelCambio(
  antes: ReadonlyMap<string, string>,
  ahora: ReadonlyMap<string, string>,
  enlaces: readonly EnlaceCircuito[],
): string[] {
  const cambiaron = [...ahora.keys()].filter(
    (id) => antes.has(id) && antes.get(id) !== ahora.get(id),
  );
  const conjunto = new Set(cambiaron);
  return cambiaron.filter(
    (id) => !enlaces.some((e) => e.vivo !== false && e.a === id && conjunto.has(e.de)),
  );
}

export interface CurvaDeCable {
  readonly x0: number;
  readonly y0: number;
  readonly cx: number;
  readonly cy: number;
  readonly x1: number;
  readonly y1: number;
}

/** Punto de la curva cuadrática en `t` entre 0 y 1: por donde va el pulso. */
export function puntoDelCable(c: CurvaDeCable, t: number): { x: number; y: number } {
  const u = 1 - t;
  return {
    x: u * u * c.x0 + 2 * u * t * c.cx + t * t * c.x1,
    y: u * u * c.y0 + 2 * u * t * c.cy + t * t * c.y1,
  };
}
