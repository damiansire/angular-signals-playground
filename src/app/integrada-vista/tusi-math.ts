/**
 * Matemática del intro "par de Tusi": N puntos hacen movimiento armónico simple sobre N diámetros
 * repartidos cada π/n; sincronizados, sus posiciones caen en cada instante sobre un círculo (de radio
 * R/2) que parece rodar. Todo acá es función pura sobre números: se testea sin DOM ni navegador.
 */

/** Ángulo del diámetro k dentro de un total de n (repartidos uniformemente cada π/n). */
export function lineAngle(k: number, n: number): number {
  return (k * Math.PI) / n;
}

/**
 * Distancia con signo del punto al centro sobre su diámetro, en la fase `ph`: s = R·cos(ph − θ).
 * Es MAS puro: máximo (±R) en los extremos, cero al pasar por el centro.
 */
export function dotOffset(radius: number, ph: number, theta: number): number {
  return radius * Math.cos(ph - theta);
}

/**
 * Centro del círculo emergente (radio R/2) sobre el que caen los puntos de un mismo color en la fase
 * `ph`. `sign` +1 para un color y −1 para el opuesto (los dos círculos entrelazados).
 */
export function emergentCircleCenter(
  radius: number,
  ph: number,
  cx: number,
  cy: number,
  sign: 1 | -1,
): { x: number; y: number } {
  return {
    x: cx + (sign * radius * Math.cos(ph)) / 2,
    y: cy + (sign * radius * Math.sin(ph)) / 2,
  };
}

/** Fase en la que aparece la línea número `n` (1-indexado) si hacen falta `hitsPerLine` choques por línea. */
export function phaseForLine(n: number, hitsPerLine: number): number {
  return (n - 1) * hitsPerLine * Math.PI;
}

/**
 * Ángulo del diámetro número `k` (0-indexado) en orden de BISECCIÓN: cada línea nueva cae en la mitad
 * de un hueco existente, así las ya dibujadas nunca se mueven (a diferencia de repartir n cada π/n, que
 * rota todo en cada alta). Es la secuencia de van der Corput base 2 escalada a [0, π): 0 (horizontal),
 * π/2 (vertical), π/4, 3π/4, π/8, 5π/8, 3π/8, 7π/8… El ángulo de `k` no depende de cuántas líneas haya.
 */
export function bisectAngle(k: number): number {
  let frac = 0;
  let denom = 1;
  let n = k;
  while (n > 0) {
    denom *= 2;
    frac += (n % 2) / denom;
    n = Math.floor(n / 2);
  }
  return frac * Math.PI;
}

/** Grados de la escala de La menor natural (teclas blancas), en semitonos desde la tónica. */
const A_MINOR = [0, 2, 3, 5, 7, 8, 10] as const;

/**
 * Frecuencia (Hz) de la nota de la línea k: sube por la escala de La menor desde A3 (MIDI 57), una nota
 * fija por línea. Timbre y escala salen del video original (análisis FFT de los "pings" de cada choque).
 */
export function lineFreq(k: number): number {
  // La octava se pliega cada 3: con hasta 30 líneas, sin plegar, los agudos treparían a ~4.7 kHz y
  // sonaban estridentes cuando se juntan muchos puntos. Plegado, el tono queda contenido en A3–G6.
  const octave = Math.floor(k / 7) % 3;
  const midi = 57 + octave * 12 + A_MINOR[k % 7];
  return 440 * Math.pow(2, (midi - 69) / 12);
}

/** Línea en reposo (antes de arrancar): el epígrafe que resume la idea del intro. */
export const NARRATION_IDLE = 'Las cosas son sencillas si las analizás por partes';
/** Línea de cierre: el caos se reveló como un círculo. */
export const NARRATION_DONE = '¿Lo ves? Un círculo, hecho de puras líneas rectas.';

/** Etapas de la narración durante la construcción, por umbral de progreso ascendente (0..1). */
const NARRATION_STEPS: readonly { readonly at: number; readonly text: string }[] = [
  { at: 0, text: 'Una línea. Un punto que rebota contra el borde.' },
  { at: 0.2, text: 'Aparece otra, y otra. Cada choque llama a la que sigue.' },
  { at: 0.45, text: 'El caos, de a poco, tiene una forma.' },
  { at: 0.75, text: 'Seguí mirando, ya casi.' },
];

/**
 * Texto de la narración de la intro según el progreso de la construcción (reemplaza la barra de
 * recompensa por una sola línea que evoluciona). `started` false = reposo; `prog` >= 1 = círculo
 * completo. Función pura: se testea sin DOM.
 */
export function introNarration(prog: number, started: boolean): string {
  if (!started) return NARRATION_IDLE;
  if (prog >= 1) return NARRATION_DONE;
  let text = NARRATION_STEPS[0].text;
  for (const step of NARRATION_STEPS) if (prog >= step.at) text = step.text;
  return text;
}
