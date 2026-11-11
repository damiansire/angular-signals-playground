import type { RouteItem } from '../interfaces/route-item.interface';
import type { PaginaDelManual } from './manual-de-a-bordo';

/**
 * El viaje: lo que sigue al prólogo. Cada etapa es un capítulo, con su cinemática primero y después
 * sus pantallas como páginas de la misma hoja del manual. No hay "Nivel N" a la vista: la hoja dice
 * el nombre de la etapa, que es un lugar de la historia (`docs/historia/recorrido.md`).
 */
export interface EtapaDelViaje {
  /** El número de capítulo: el mismo de la cinemática y del `path` en `signalsRoutesTree`. */
  readonly capitulo: number;
  readonly nombre: string;
  /** El arco ordena la meta de la tripulación: leer el mundo, hablar con ella, la verdad. */
  readonly arco: 'I' | 'II' | 'III';
}

export const ETAPAS_DEL_VIAJE: readonly EtapaDelViaje[] = [
  { capitulo: 1, nombre: 'La caja que avisa', arco: 'I' },
  { capitulo: 2, nombre: 'La molécula punteada', arco: 'I' },
  { capitulo: 3, nombre: 'La baliza', arco: 'I' },
  { capitulo: 4, nombre: 'Las coordenadas gemelas', arco: 'I' },
  { capitulo: 5, nombre: 'El mapa de rutas', arco: 'II' },
  { capitulo: 6, nombre: 'La transmisión', arco: 'II' },
  { capitulo: 7, nombre: 'El repetidor', arco: 'II' },
  { capitulo: 8, nombre: 'Los pipes se traducen', arco: 'II' },
  { capitulo: 9, nombre: 'La antena', arco: 'III' },
  { capitulo: 10, nombre: 'La tormenta', arco: 'III' },
  { capitulo: 11, nombre: 'Quien lee, avisa', arco: 'III' },
];

export function etapaDe(capitulo: number): EtapaDelViaje | null {
  return ETAPAS_DEL_VIAJE.find((e) => e.capitulo === capitulo) ?? null;
}

/**
 * Las pantallas de un capítulo como páginas. Cada pantalla trae su propio título y su desafío, así
 * que la página no suma ley ni frase de la nave. Una pantalla sin componente no es página.
 */
export function paginasDeEtapa(capitulo: number, subs: readonly RouteItem[]): PaginaDelManual[] {
  return subs.flatMap((sub) => {
    const { component, loadComponent } = sub;
    const cargar = loadComponent ?? (component ? () => Promise.resolve({ component }) : null);
    return cargar
      ? [{ id: `${capitulo}/${sub.path}`, ley: sub.title ?? '', enLaNave: '', cargar }]
      : [];
  });
}

/**
 * Después de la hoja de un concepto viene la cinemática del siguiente; después del último, el
 * cierre (el concepto que sigue al último): la revelación y el final. Un concepto sin pantallas se
 * saltea entero, sin cinemática suelta.
 */
/**
 * El fin: el concepto que sigue al último, con la página 0. La historia ya se contó y queda su último
 * cuadro; recargar vuelve ahí, no a la revelación.
 */
export function finDelViaje(subPorConcepto: readonly number[]): {
  readonly concepto: number;
  readonly pagina: number;
} {
  return { concepto: subPorConcepto.length, pagina: 0 };
}

export function esElFin(
  lugar: { readonly concepto: number; readonly pagina: number },
  subPorConcepto: readonly number[],
): boolean {
  return lugar.concepto >= subPorConcepto.length && lugar.pagina >= 0;
}

/**
 * Dónde abre el viaje un link `?nivel=X(&sub-nivel=Z)`: la página Z del concepto, o su cinemática si
 * el link trae solo el nivel. La molécula ya no existe (ADR 0019): los links que la abrían llevan a
 * la misma pantalla, en la hoja. Un sub-nivel de más cae en la última página; un concepto sin
 * pantallas no es un lugar.
 */
export function lugarDelLink(
  concepto: number,
  sub: number,
  subPorConcepto: readonly number[],
): { readonly concepto: number; readonly pagina: number } | null {
  const paginas = subPorConcepto[concepto];
  if (!paginas) return null;
  return { concepto, pagina: sub > 0 ? Math.min(sub, paginas) - 1 : -1 };
}

export function siguienteEtapa(
  concepto: number,
  subPorConcepto: readonly number[],
): { readonly concepto: number; readonly pagina: number } {
  for (let c = concepto + 1; c < subPorConcepto.length; c++) {
    if (subPorConcepto[c] > 0) return { concepto: c, pagina: -1 };
  }
  return { concepto: subPorConcepto.length, pagina: -1 };
}
