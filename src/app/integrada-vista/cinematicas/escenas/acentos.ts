/**
 * El color de cada capítulo en las cinemáticas y en su etapa del viaje: el acento que tenía su átomo
 * en la molécula, ya retirada (ADR 0021). El final usa el dorado del cierre.
 */
export const ACENTOS: readonly string[] = [
  '#9a9081', // 0 · Introducción (ink)
  '#eb9b3c', // 1 · Signals (source)
  '#62c4ad', // 2 · Computed (derived)
  '#ff5a4a', // 3 · Effects (effect)
  '#eb9b3c', // 4 · Igualdad (source)
  '#62c4ad', // 5 · Linked (derived)
  '#62c4ad', // 6 · Resource (derived)
  '#eb9b3c', // 7 · Inputs & Outputs (source)
  '#9a9081', // 8 · Queries (ink)
  '#ff5a4a', // 9 · After render (effect)
  '#ff5a4a', // 10 · Debounce (effect)
  '#c98a2a', // 11 · Zoneless (capstone)
  '#c98a2a', // 12 · Final
  '#c98a2a', // 13 · La revelación
];

export function acentoDe(capitulo: number): string {
  return ACENTOS[capitulo] ?? ACENTOS[0];
}
