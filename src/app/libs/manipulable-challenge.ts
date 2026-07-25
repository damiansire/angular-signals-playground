/**
 * Cierre de un sub-nivel donde el código ES el control: hay un solo bloque, el real, con una parte
 * que el usuario mueve, y una lectura del sistema que responde. No hay opciones enumeradas ni una
 * razón escrita al acertar, a propósito: elegir entre tres piezas enseña a elegir entre tres
 * piezas, y un cartel de "muy bien" avisa que lo llevaron de la mano. Acá la lectura es la única
 * respuesta, y el usuario decide solo si el sistema quedó sano.
 */

/** Una decisión del código que se cambia en el lugar. Cambiarla cicla entre sus posiciones. */
export interface Knob {
  readonly id: string;
  readonly positions: number;
  /** Para lectores de pantalla. Quien ve la pantalla lo lee del código mismo. */
  readonly label: string;
}

/** Un renglón del bloque. `knob` lo vuelve interactivo; `dead` lo muestra apagado pero presente. */
export interface CodeLine {
  readonly text: string;
  readonly knob?: string;
  readonly dead?: boolean;
}

/** Una lectura del sistema. Es lo único que le contesta al usuario, así que el rótulo va corto. */
export interface Gauge {
  readonly id: string;
  readonly label: string;
}

export type KnobPositions = Readonly<Record<string, number>>;
export type Readings = Readonly<Record<string, number>>;

export interface SystemState {
  readonly knobs: KnobPositions;
  /** Cuántas veces se accionó el sistema. */
  readonly actions: number;
  readonly values: Readings;
}

export interface ManipulableChallenge {
  readonly knobs: readonly Knob[];
  readonly gauges: readonly Gauge[];
  /** Verbo del botón que hace avanzar al sistema. */
  readonly action: string;
  /** Valores de arranque. El sistema empieza averiado: por eso hay algo que mirar. */
  readonly start: Readings;
  readonly code: (knobs: KnobPositions) => readonly CodeLine[];
  /**
   * Corre después de CADA cambio, sea accionar o mover una perilla. Acá vive la regla que el
   * sub-nivel enseña, y por eso es lo único que cada desafío escribe a mano.
   */
  readonly settle: (state: SystemState) => Readings;
  readonly healthy: (state: SystemState) => boolean;
  /** Lo que el enlace del recorrido guarda cuando el sistema queda sano. */
  readonly establishes: string;
}

/** El sistema arranca con todas las perillas en su primera posición, que es la avería. */
export function startOf(challenge: ManipulableChallenge): SystemState {
  const knobs: Record<string, number> = {};
  challenge.knobs.forEach((knob) => (knobs[knob.id] = 0));
  return { knobs, actions: 0, values: challenge.start };
}

/** Acciona el sistema una vez. */
export function act(challenge: ManipulableChallenge, state: SystemState): SystemState {
  const next: SystemState = { ...state, actions: state.actions + 1 };
  return { ...next, values: challenge.settle(next) };
}

/**
 * Mueve una perilla a su posición siguiente y deja que el sistema se acomode. Cicla en vez de
 * frenar en la última: probar y volver atrás tiene que costar lo mismo que probar.
 */
export function turn(
  challenge: ManipulableChallenge,
  state: SystemState,
  knobId: string,
): SystemState {
  const knob = challenge.knobs.find((k) => k.id === knobId);
  if (!knob) return state;

  const next: SystemState = {
    ...state,
    knobs: { ...state.knobs, [knobId]: (state.knobs[knobId] + 1) % knob.positions },
  };
  return { ...next, values: challenge.settle(next) };
}

/** Los rótulos y valores que se muestran, en el orden en que el desafío los declaró. */
export function readings(
  challenge: ManipulableChallenge,
  state: SystemState,
): readonly (Gauge & { readonly value: number })[] {
  return challenge.gauges.map((gauge) => ({ ...gauge, value: state.values[gauge.id] ?? 0 }));
}

/**
 * Presupuesto de forma. Con los 37 sub-niveles cerrando igual, la consistencia no se sostiene con
 * buena voluntad: si un desafío trae seis lecturas y otro dos, el cierre deja de leerse como el
 * mismo gesto. Estos números SON la forma del cierre, y por eso los verifica un test.
 */
export const SHAPE = {
  maxCodeLines: 6,
  /** El bloque mide 34rem a 0.76rem monoespaciada: pasadas ~74 columnas aparece scroll lateral. */
  maxCodeCols: 68,
  maxGauges: 2,
  maxGaugeWords: 2,
  maxActionWords: 4,
  maxEstablishesWords: 14,
} as const;

const words = (text: string): number => text.trim().split(/\s+/).filter(Boolean).length;

/**
 * Un desafío mal armado no se ve roto en pantalla: se ve como un sub-nivel que no se puede
 * resolver, o como un cierre que no se parece a los otros 36. Estas son las condiciones que el
 * contenido tiene que cumplir para llegar a shippear.
 */
export function malformed(challenge: ManipulableChallenge): readonly string[] {
  const problems: string[] = [];
  const start = startOf(challenge);

  // Resolubilidad: sin esto el sub-nivel es una pared, no un desafío.
  if (challenge.knobs.length === 0) problems.push('no tiene ninguna perilla que mover');
  if (challenge.knobs.some((k) => k.positions < 2)) {
    problems.push('tiene una perilla de una sola posición');
  }
  if (challenge.gauges.length === 0) problems.push('no tiene lectura que conteste');
  if (challenge.healthy(start)) problems.push('arranca sano, así que no hay nada que notar');
  if (challenge.establishes.trim() === '') problems.push('no deja línea establecida');

  // Forma: que los 37 cierres se lean como el mismo gesto.
  if (challenge.knobs.length > 1) {
    problems.push('tiene más de una perilla: es un puzzle, no un control');
  }
  if (challenge.gauges.length > SHAPE.maxGauges) problems.push('muestra demasiadas lecturas');
  if (challenge.gauges.some((g) => words(g.label) > SHAPE.maxGaugeWords)) {
    problems.push('el rótulo de una lectura es una frase, no una etiqueta');
  }
  if (words(challenge.action) > SHAPE.maxActionWords) {
    problems.push('el verbo de la acción es largo');
  }
  if (words(challenge.establishes) > SHAPE.maxEstablishesWords) {
    problems.push('la línea establecida es un párrafo, no una línea');
  }

  // El bloque tiene que leerse de un vistazo, y la perilla tiene que estar a la vista en TODAS sus
  // posiciones: una perilla que desaparece deja al sistema sin forma de arreglarse.
  const knob = challenge.knobs[0];
  for (let position = 0; knob && position < knob.positions; position++) {
    const lines = challenge.code({ [knob.id]: position });
    if (lines.length > SHAPE.maxCodeLines) {
      problems.push(`el bloque tiene ${lines.length} renglones en la posición ${position}`);
    }
    const ancha = lines.find((line) => line.text.length > SHAPE.maxCodeCols);
    if (ancha) {
      problems.push(`un renglón de ${ancha.text.length} columnas desborda el bloque`);
    }
    if (!lines.some((line) => line.knob)) {
      problems.push(`la perilla no se ve en la posición ${position}`);
    }
  }

  return problems;
}
