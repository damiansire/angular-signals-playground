/**
 * Cómo se mueve la mascota con música en los auriculares: no baila para nadie, la sigue para ella.
 * Cabecea en cada tiempo, se mece de un lado al otro cada medio compás con la cabeza adelantada al
 * cuerpo, marca el pulso con un pie y después con el otro, y en el primer tiempo del compás se le
 * levantan las cejas. Cada tiempo mueve destinos y suma impulsos: lo demás lo hacen sus muelles,
 * así un toque en el medio se suma en vez de cortar la movida.
 */

/** Los muelles de la mascota que se mueven con la música. */
export type ParteQueEscucha =
  'aplastar' | 'giro' | 'torcer' | 'x' | 'cara' | 'brazoR' | 'foco' | 'piernas' | 'cejas';

export interface Movida {
  /** Adónde va cada parte en este tiempo: la pose del medio compás. */
  readonly destinos: Readonly<Partial<Record<ParteQueEscucha, number>>>;
  /** Lo que se suma a la velocidad: el golpe del pulso. */
  readonly impulsos: Readonly<Partial<Record<ParteQueEscucha, number>>>;
}

/** Tiempos por compás. */
export const TIEMPOS = 4;

/**
 * Un tiempo, a 100 por minuto: el compás entero (2,4 s) dura lo mismo que el latido de las ondas de
 * los auriculares, así lo que se ve y lo que ella oye van juntos.
 */
export const TIEMPO_MS = 600;

/** El primero del compás pesa más: es el que se siente en el cuerpo. */
const CABECEO = 1.5;
const CABECEO_FUERTE = 2.4;

/** La movida del `tiempo`-ésimo tiempo desde que empezó a escuchar. */
export function movidaDelTiempo(tiempo: number): Movida {
  const enCompas = ((tiempo % TIEMPOS) + TIEMPOS) % TIEMPOS;
  const primero = enCompas === 0;
  // Se mece cada medio compás: dos tiempos hacia un lado, dos hacia el otro.
  const lado = enCompas < TIEMPOS / 2 ? 1 : -1;
  // El pie que marca cambia en cada tiempo.
  const pie = tiempo % 2 === 0 ? 1 : -1;
  return {
    destinos: {
      giro: 4 * lado,
      torcer: -1.5 * lado,
      x: 10 * lado,
      cara: 8 * lado,
      // La mano libre acompaña el vaivén; la de la idea la sostiene, y la idea se hamaca sola.
      brazoR: lado === 1 ? -22 : 4,
    },
    impulsos: {
      aplastar: primero ? CABECEO_FUERTE : CABECEO,
      piernas: 46 * pie,
      foco: 70 * lado,
      ...(primero ? { cejas: -130 } : {}),
    },
  };
}
