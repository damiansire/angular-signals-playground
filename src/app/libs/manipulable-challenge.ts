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
  /**
   * Cuántas veces se accionó en la corrida vigente, no en total: mover una perilla cambia el
   * código y arranca otra corrida desde cero (ver `turn`).
   */
  readonly actions: number;
  readonly values: Readings;
}

export interface ManipulableChallenge {
  readonly knobs: readonly Knob[];
  readonly gauges: readonly Gauge[];
  /** Verbo del botón que hace avanzar al sistema. */
  readonly action: string;
  /**
   * Valores de una corrida antes de accionarla. Vale para TODAS las corridas, no solo la primera:
   * cada giro de la perilla vuelve a partir de acá.
   */
  readonly start: Readings;
  readonly code: (knobs: KnobPositions) => readonly CodeLine[];
  /**
   * Corre al accionar y al arrancar cada corrida nueva. Acá vive la regla que el sub-nivel enseña,
   * y por eso es lo único que cada desafío escribe a mano. Solo ve la corrida vigente, así que no
   * tiene forma de reescribir lo que pasó con el código anterior.
   */
  readonly settle: (state: SystemState) => Readings;
  /**
   * Si las lecturas son las sanas. No hace falta que pida haber accionado: `healthOf` ya no da por
   * sana una corrida que nunca corrió.
   */
  readonly healthy: (state: SystemState) => boolean;
}

/**
 * Cómo se lee el sistema. `idle` es una corrida sin accionar: sus números no dicen nada del código
 * todavía, así que no cuentan ni como avería ni como arreglo.
 */
export type Health = 'idle' | 'broken' | 'healthy';

/**
 * Evento con el que un sub-nivel avisa que su sistema quedó sano. Es el acoplamiento más flojo
 * posible entre el átomo y el motor del recorrido: ninguno de los dos se conoce, solo comparten
 * este nombre. Por eso es una constante y no un literal repetido en las dos puntas, que es como
 * estaba: un typo de un lado no rompía nada, simplemente el recorrido dejaba de marcar el avance.
 */
export const SISTEMA_ESTABLECIDO = 'sistema-establecido';

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
 * Mueve una perilla a su posición siguiente. Mover la perilla es cambiar el código, y eso arranca
 * una corrida nueva: lo que se accionó con el código anterior se descarta con su corrida. Recalcular
 * con esas mismas acciones hacía que el código nuevo sanara hacia atrás lo que pasó con el roto, y
 * alcanzaba con accionar primero y girar después para ganar sin entender nada.
 *
 * Cicla en vez de frenar en la última: probar y volver atrás tiene que costar lo mismo que probar.
 */
export function turn(
  challenge: ManipulableChallenge,
  state: SystemState,
  knobId: string,
): SystemState {
  const knob = challenge.knobs.find((k) => k.id === knobId);
  if (!knob) return state;

  const fresh: SystemState = {
    knobs: { ...state.knobs, [knobId]: (state.knobs[knobId] + 1) % knob.positions },
    actions: 0,
    values: challenge.start,
  };
  return { ...fresh, values: challenge.settle(fresh) };
}

/**
 * Sano exige lecturas sanas Y haber accionado lo suficiente en la corrida vigente. Mientras no hay
 * evidencia, la lectura es neutra: ni sano ni averiado. Sin esto un código que todavía no corrió
 * pasaba por arreglado solo porque sus números arrancan en el valor bueno, y al revés, un código
 * CORRECTO accionado una vez se pintaba de rojo en los desafíos que necesitan dos o tres vueltas
 * para mostrar la diferencia (3/3: una vuelta da "1 vivo, 1 esperado" con cualquier código).
 */
export function healthOf(challenge: ManipulableChallenge, state: SystemState): Health {
  if (state.actions < accionesParaSaber(challenge)) return 'idle';
  return challenge.healthy(state) ? 'healthy' : 'broken';
}

const PARA_SABER = new WeakMap<ManipulableChallenge, number>();

/**
 * Cuántas acciones de una corrida hacen falta para que la lectura diga algo: las del final de la
 * solución más corta (girar arranca una corrida nueva, así que lo que cuenta es lo accionado
 * después del último giro). Sale de la solución y no se declara a mano: si un desafío cambia, el
 * umbral lo acompaña solo. Se calcula una vez por desafío.
 */
export function accionesParaSaber(challenge: ManipulableChallenge): number {
  let n = PARA_SABER.get(challenge);
  if (n === undefined) {
    const camino = solutionFor(challenge) ?? [];
    let alFinal = 0;
    for (let i = camino.length - 1; i >= 0 && camino[i] === challenge.action; i--) alFinal++;
    n = Math.max(1, alFinal);
    PARA_SABER.set(challenge, n);
  }
  return n;
}

/** Los rótulos y valores que se muestran, en el orden en que el desafío los declaró. */
export function readings(
  challenge: ManipulableChallenge,
  state: SystemState,
): readonly (Gauge & { readonly value: number })[] {
  return challenge.gauges.map((gauge) => ({ ...gauge, value: state.values[gauge.id] ?? 0 }));
}

/**
 * Busca una secuencia de gestos que deje el sistema sano, explorando accionar y mover la perilla
 * hasta `maxSteps`. Es el chequeo que ningún test de forma alcanza: un desafío puede estar
 * perfectamente armado y ser IRRESOLUBLE si su `healthy` pide algo que sus propias lecturas nunca
 * llegan a dar. En pantalla eso no se ve roto, se ve como un sub-nivel que no cierra nunca.
 *
 * Devuelve los gestos en orden, o `null` si no hay forma de resolverlo.
 */
export function solutionFor(
  challenge: ManipulableChallenge,
  maxSteps = 8,
): readonly string[] | null {
  const seen = new Set<string>();
  const key = (s: SystemState): string => JSON.stringify([s.knobs, s.actions, s.values]);
  let frontier: { state: SystemState; path: readonly string[] }[] = [
    { state: startOf(challenge), path: [] },
  ];

  for (let step = 0; step < maxSteps; step++) {
    const next: typeof frontier = [];
    for (const { state, path } of frontier) {
      const moves: [string, SystemState][] = [
        [challenge.action, act(challenge, state)],
        ...challenge.knobs.map((k): [string, SystemState] => [
          `mover ${k.id}`,
          turn(challenge, state, k.id),
        ]),
      ];
      for (const [name, candidate] of moves) {
        // La regla cruda (sano y accionado), no `healthOf`: el umbral de evidencia de `healthOf`
        // se calcula justamente con esta búsqueda.
        if (candidate.actions > 0 && challenge.healthy(candidate)) return [...path, name];
        const id = key(candidate);
        if (seen.has(id)) continue;
        seen.add(id);
        next.push({ state: candidate, path: [...path, name] });
      }
    }
    frontier = next;
    if (!frontier.length) break;
  }
  return null;
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
  // Sin accionar nunca está sano, así que la pregunta útil es si el código de arranque ya anda.
  if (healthOf(challenge, act(challenge, start)) === 'healthy') {
    problems.push('arranca sano, así que no hay nada que notar');
  }

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
