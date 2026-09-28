/**
 * El modelo de las cinemáticas por capítulo: qué se dice, quién lo dice y qué beat visual dispara
 * cada línea. No dibuja nada, así que se prueba como función pura.
 *
 * Reusa el reloj del prólogo (`armarReloj`) a propósito: una línea declara cuánto texto tiene y el
 * reloj calcula cuándo entra. Con dos relojes, el prólogo y los capítulos respirarían distinto, y
 * es la misma tripulación hablando.
 */
import { armarReloj, type LineaGuion } from '../prologo-guion';

export type Hablante = 'cap' | 'naveA' | 'naveB' | 'nave4' | 'mascota' | 'todos';

export interface LineaCine extends LineaGuion {
  readonly quien: Hablante;
  /** Beat visual que se enciende cuando entra la línea. Los beats se acumulan: son estados. */
  readonly beat?: string;
  /** Solo en el final: la línea va solo si el jugador estableció todo, o solo si dejó deuda. */
  readonly si?: 'completo' | 'incompleto';
}

export interface Cinematica {
  /** 0..11 son los capítulos (uno por concepto); 12 es el final. */
  readonly capitulo: number;
  /** El tagline del concepto: el mismo título que ya tiene en el recorrido. */
  readonly titulo: string;
  /** La ley del mundo que el capítulo enseña. Se escribe en la bitácora al establecerlo. */
  readonly ley: string;
  /** Beats que se encienden antes de la primera línea, en este orden. */
  readonly apertura: readonly string[];
  /** Todos los beats que la escena sabe dibujar (los comunes más los propios). */
  readonly beats: readonly string[];
  readonly lineas: readonly LineaCine[];
}

export type LineaEnPantalla = LineaCine & { readonly t0: number; readonly t1: number };

export const CAPITULO_FINAL = 12;

/** Beats que dibuja el kit común de todas las escenas. */
export const BEATS_COMUNES = ['titulo', 'naves', 'mascota', 'transmision'] as const;

/** Las reglas duras del guion. Son la barra de diseño del juego convertida en chequeo. */
export const REGLAS_GUION = {
  /** Máximo de palabras en pantalla a la vez: una línea es todo lo que hay en pantalla. */
  palabras: 8,
  renglones: 2,
  columnas: 44,
  /** Líneas por capítulo; el pico (6) y el final tienen más aire. */
  lineas: { min: 4, max: 8, maxLargo: 10 },
  /** Un capítulo que dura más que esto deja de ser ceremonia y pasa a ser espera. */
  duracionMaxMs: 42000,
} as const;

/** Después de la última línea, lo que tarda la escena en asentarse antes de cerrar. */
export const COLA_MS = 1400;

/** Separación entre los beats de apertura: el entorno primero, el héroe después. */
export const PASO_APERTURA_MS = 520;

/** Capítulos con permiso para ser más largos: el pico del medio y la salida. */
const LARGOS = new Set([6, CAPITULO_FINAL]);

export function palabrasDe(txt: string): number {
  return txt.replace(/\n/g, ' ').split(/\s+/).filter(Boolean).length;
}

/** Las líneas que se juegan en esta partida (el final cambia según lo que quedó establecido). */
export function lineasPara(cine: Cinematica, completo: boolean): readonly LineaCine[] {
  return cine.lineas.filter((l) => l.si === undefined || (l.si === 'completo') === completo);
}

/**
 * El reloj de un capítulo. Sin voz sintética: el ritmo es el de lectura, y es el mismo en todas
 * las máquinas (antes el prólogo cambiaba de duración según hubiera voces en español).
 */
export function relojDe(cine: Cinematica, completo: boolean): readonly LineaEnPantalla[] {
  return armarReloj(lineasPara(cine, completo), false) as readonly LineaEnPantalla[];
}

export function duracionDe(reloj: readonly LineaEnPantalla[]): number {
  return reloj.length ? reloj[reloj.length - 1].t1 + COLA_MS : COLA_MS;
}

/**
 * Todo lo que está mal en un capítulo, en castellano. Vacío = se puede jugar. Chequea las dos
 * variantes del final, porque una puede estar bien y la otra no.
 */
export function problemasDe(cine: Cinematica): readonly string[] {
  const p: string[] = [];
  const nombre = `capítulo ${cine.capitulo}`;
  const conocidos = new Set([...BEATS_COMUNES, ...cine.beats]);
  const vistos = new Set<string>();

  if (!cine.titulo.trim()) p.push(`${nombre}: sin título`);
  if (!cine.ley.trim()) p.push(`${nombre}: sin ley`);
  if (palabrasDe(cine.ley) > 9) p.push(`${nombre}: la ley pasa de 9 palabras`);
  for (const b of cine.apertura) {
    if (!conocidos.has(b))
      p.push(`${nombre}: la apertura enciende "${b}", que la escena no declara`);
  }

  for (const l of cine.lineas) {
    const quien = `${nombre} "${l.id}"`;
    if (vistos.has(l.id)) p.push(`${quien}: id repetido`);
    vistos.add(l.id);
    if (!l.txt.trim()) p.push(`${quien}: sin texto`);
    if (palabrasDe(l.txt) > REGLAS_GUION.palabras) {
      p.push(`${quien}: ${palabrasDe(l.txt)} palabras, el techo es ${REGLAS_GUION.palabras}`);
    }
    const renglones = l.txt.split('\n');
    if (renglones.length > REGLAS_GUION.renglones) p.push(`${quien}: más de dos renglones`);
    for (const r of renglones) {
      if (r.length > REGLAS_GUION.columnas) p.push(`${quien}: renglón de ${r.length} columnas`);
    }
    // La raya delata redacción automática y no es la voz de nadie de esta tripulación.
    if (/[—–]/.test(l.txt)) p.push(`${quien}: usa raya`);
    if (l.beat && !conocidos.has(l.beat)) p.push(`${quien}: beat "${l.beat}" no declarado`);
    if (l.si && cine.capitulo !== CAPITULO_FINAL) p.push(`${quien}: "si" solo va en el final`);
  }
  if (/[—–]/.test(cine.ley)) p.push(`${nombre}: la ley usa raya`);

  const variantes = cine.capitulo === CAPITULO_FINAL ? [true, false] : [true];
  for (const completo of variantes) {
    const lineas = lineasPara(cine, completo);
    const max = LARGOS.has(cine.capitulo) ? REGLAS_GUION.lineas.maxLargo : REGLAS_GUION.lineas.max;
    if (lineas.length < REGLAS_GUION.lineas.min || lineas.length > max) {
      p.push(
        `${nombre}: ${lineas.length} líneas, tiene que tener entre ${REGLAS_GUION.lineas.min} y ${max}`,
      );
    }
    const dura = duracionDe(relojDe(cine, completo));
    if (dura > REGLAS_GUION.duracionMaxMs) p.push(`${nombre}: dura ${Math.round(dura / 1000)} s`);
  }
  return p;
}
