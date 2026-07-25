/**
 * Modelo mental del pipeline de render del browser para el sub-nivel "de la
 * mutación al pixel". NO es una réplica exacta del motor: es la regla que enseña
 * por qué escribir de menos al DOM importa. Cada tipo de mutación dispara, de
 * `style` en adelante, un tramo distinto de la cadena.
 */
export type RenderStage = 'style' | 'layout' | 'paint' | 'composite';

export type MutationKind = 'transform' | 'opacity' | 'color' | 'textContent' | 'geometry';

/** Las etapas que corren DESPUÉS de que JS toca el DOM, en su orden canónico. */
export const RENDER_STAGES: readonly RenderStage[] = ['style', 'layout', 'paint', 'composite'];

const STAGES_BY_KIND: Record<MutationKind, readonly RenderStage[]> = {
  // transform/opacity viven en una capa ya compuesta: saltan layout y paint, pero NO style: tocar la
  // propiedad obliga igual a recalcular el estilo. Saltearlo contradecia al texto del sub-nivel
  // ("se saltea layout y paint enteros") ademas de ser incorrecto.
  transform: ['style', 'composite'],
  opacity: ['style', 'composite'],
  // color no cambia geometría: recalcula estilo y repinta, sin re-layout.
  color: ['style', 'paint', 'composite'],
  // texto y geometría (width, top…) cambian el tamaño/posición: cadena entera.
  textContent: ['style', 'layout', 'paint', 'composite'],
  geometry: ['style', 'layout', 'paint', 'composite'],
};

/** Etapas que dispara `kind`, siempre en el orden de `RENDER_STAGES`. */
export function stagesTriggered(kind: MutationKind): RenderStage[] {
  const triggered = new Set(STAGES_BY_KIND[kind]);
  return RENDER_STAGES.filter((stage) => triggered.has(stage));
}

export type RenderCost = 'barato' | 'medio' | 'caro';

/** Costo relativo: `layout` es lo caro; `paint` sin layout es medio; solo `composite` es barato. */
export function renderCost(kind: MutationKind): RenderCost {
  const stages = stagesTriggered(kind);
  if (stages.includes('layout')) return 'caro';
  if (stages.includes('paint')) return 'medio';
  return 'barato';
}
