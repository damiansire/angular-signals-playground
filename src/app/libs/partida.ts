/**
 * La partida guardada: lo que el jugador ya estableció, qué cinemáticas vio y si ya pasó por el
 * prólogo. Sin esto el recorrido era un juego que se borra al recargar: resolvías medio acto, la
 * pestaña se cerraba, y volvías a una molécula entera punteada.
 *
 * Vive en `localStorage` bajo `signals-cuaderno` (la clave que se decidió para "el cuaderno", al
 * lado de `signals-carrito`). Es un boundary externo: cualquiera lo puede editar a mano o dejarlo a
 * medio escribir, así que todo lo que entra se valida contra la forma real del recorrido y lo que
 * no encaja se descarta en silencio. Una partida rota no puede romper el recorrido.
 */

export const CLAVE_PARTIDA = 'signals-cuaderno';

/** Si el formato cambia de manera incompatible, se sube y las partidas viejas arrancan de cero. */
const VERSION = 1;

export interface Partida {
  /** Sub-niveles establecidos como `"concepto/sub"`, ambos desde 0 (la URL usa sub desde 1). */
  readonly establecidos: readonly string[];
  /** Cinemáticas ya vistas, por número de capítulo (12 es el final). */
  readonly cinematicas: readonly number[];
  /** Ya vio el prólogo completo o lo salteó a propósito: no se le vuelve a imponer. */
  readonly prologo: boolean;
}

export const PARTIDA_VACIA: Partida = { establecidos: [], cinematicas: [], prologo: false };

/** Cuántas cinemáticas existen: una por concepto más el final. */
const CINEMATICAS_MAX = 13;

/**
 * Lee una partida guardada. `subPorConcepto[c]` es la cantidad de sub-niveles del concepto `c`:
 * es lo que dice qué ids son posibles, así una partida vieja de cuando había otros sub-niveles no
 * deja marcas en lugares que ya no existen.
 */
export function leerPartida(crudo: string | null, subPorConcepto: readonly number[]): Partida {
  if (!crudo) return PARTIDA_VACIA;
  let dato: unknown;
  try {
    dato = JSON.parse(crudo);
  } catch {
    return PARTIDA_VACIA;
  }
  if (!esObjeto(dato) || dato['v'] !== VERSION) return PARTIDA_VACIA;

  const establecidos = new Set<string>();
  for (const id of arreglo(dato['establecidos'])) {
    if (typeof id !== 'string') continue;
    const par = parsearId(id);
    if (par && par.sub < (subPorConcepto[par.concepto] ?? 0))
      establecidos.add(idDe(par.concepto, par.sub));
  }

  const cinematicas = new Set<number>();
  for (const n of arreglo(dato['cinematicas'])) {
    if (Number.isInteger(n) && (n as number) >= 0 && (n as number) < CINEMATICAS_MAX) {
      cinematicas.add(n as number);
    }
  }

  return {
    establecidos: [...establecidos].sort(compararIds),
    cinematicas: [...cinematicas].sort((a, b) => a - b),
    prologo: dato['prologo'] === true,
  };
}

export function escribirPartida(partida: Partida): string {
  return JSON.stringify({ v: VERSION, ...partida });
}

export function idDe(concepto: number, sub: number): string {
  return `${concepto}/${sub}`;
}

export function conEstablecido(partida: Partida, concepto: number, sub: number): Partida {
  const id = idDe(concepto, sub);
  if (partida.establecidos.includes(id)) return partida;
  return { ...partida, establecidos: [...partida.establecidos, id].sort(compararIds) };
}

export function conCinematica(partida: Partida, capitulo: number): Partida {
  if (partida.cinematicas.includes(capitulo)) return partida;
  return { ...partida, cinematicas: [...partida.cinematicas, capitulo].sort((a, b) => a - b) };
}

export function conPrologo(partida: Partida): Partida {
  return partida.prologo ? partida : { ...partida, prologo: true };
}

/**
 * Conceptos con al menos un sub-nivel establecido. Es la regla que ya usaba el recorrido para
 * soldar el enlace entre átomos: alcanza con entender un tramo, no hace falta completarlo.
 */
export function conceptosEstablecidos(partida: Partida): ReadonlySet<number> {
  const conceptos = new Set<number>();
  for (const id of partida.establecidos) {
    const par = parsearId(id);
    if (par) conceptos.add(par.concepto);
  }
  return conceptos;
}

/** Sub-niveles establecidos de un concepto, como índices desde 0. */
export function subsEstablecidos(partida: Partida, concepto: number): ReadonlySet<number> {
  const subs = new Set<number>();
  for (const id of partida.establecidos) {
    const par = parsearId(id);
    if (par && par.concepto === concepto) subs.add(par.sub);
  }
  return subs;
}

/**
 * Lee y escribe contra un almacén real. En modo privado, con cuota llena o con el almacenamiento
 * bloqueado, `localStorage` tira al leer o al escribir: se juega igual, solo que sin guardar.
 */
export function cargarPartida(
  almacen: Pick<Storage, 'getItem'> | null,
  subPorConcepto: readonly number[],
): Partida {
  try {
    return leerPartida(almacen?.getItem(CLAVE_PARTIDA) ?? null, subPorConcepto);
  } catch {
    return PARTIDA_VACIA;
  }
}

export function guardarPartida(
  almacen: Pick<Storage, 'setItem'> | null,
  partida: Partida,
): boolean {
  try {
    almacen?.setItem(CLAVE_PARTIDA, escribirPartida(partida));
    return almacen !== null;
  } catch {
    return false;
  }
}

/** El almacén del navegador, o `null` si ni siquiera se puede tocar la propiedad. */
export function almacenDelNavegador(): Storage | null {
  try {
    return typeof localStorage === 'undefined' ? null : localStorage;
  } catch {
    return null;
  }
}

function parsearId(id: string): { concepto: number; sub: number } | null {
  const partes = /^(\d{1,2})\/(\d{1,2})$/.exec(id);
  if (!partes) return null;
  return { concepto: Number(partes[1]), sub: Number(partes[2]) };
}

function compararIds(a: string, b: string): number {
  const pa = parsearId(a);
  const pb = parsearId(b);
  if (!pa || !pb) return a.localeCompare(b);
  return pa.concepto - pb.concepto || pa.sub - pb.sub;
}

function esObjeto(v: unknown): v is Record<string, unknown> {
  return typeof v === 'object' && v !== null && !Array.isArray(v);
}

function arreglo(v: unknown): readonly unknown[] {
  return Array.isArray(v) ? v : [];
}
