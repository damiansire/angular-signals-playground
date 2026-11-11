import type { SalidaDeAudio } from '../libs/sonido';
import { tocarEnBucle, type Musica, type NotaDeMusica } from './musica-del-presentimiento';

/**
 * La música del manual de a bordo: para estudiar. La escena queda quieta mientras se lee, y el
 * zumbido de la anomalía, que es tensión pura, cansaba en una pantalla donde se lee un buen rato.
 *
 * Lo que la hace música de estudio (los requisitos están en `docs/sonido.md`):
 * - Fa mayor, cálida, y vecina del re menor de la colina y del prólogo: cambia el ánimo, no el mundo.
 * - Lenta y pareja: cuatro acordes de seis segundos, sin percusión ni golpes que llamen la atención.
 * - Sin melodía que se pegue: encima de los acordes caen notas sueltas, a veces ninguna, sacadas
 *   de lo que suena. Cambian en cada vuelta, así la repetición no se nota.
 * - Más baja que la colina: es el fondo de una pantalla que se lee.
 */

/** Lo que dura una vuelta, en segundos. */
export const VUELTA_DEL_MANUAL = 24;
const COMPAS = VUELTA_DEL_MANUAL / 4;

interface Paso {
  readonly bajo: number;
  readonly acorde: readonly number[];
  /** De dónde salen las notas sueltas: notas del acorde y sus tensiones suaves, en el medio. */
  readonly sueltas: readonly number[];
}

export const PASOS_DEL_MANUAL: readonly Paso[] = [
  // Fa con séptima mayor: fa, la, do, mi.
  { bajo: 87.31, acorde: [174.61, 220, 261.63, 329.63], sueltas: [392, 440, 523.25, 659.25] },
  // La menor con séptima: la, do, mi, sol.
  { bajo: 110, acorde: [220, 261.63, 329.63, 392], sueltas: [392, 440, 523.25, 659.25] },
  // Re menor con novena: re, fa, la, do.
  { bajo: 73.42, acorde: [146.83, 174.61, 220, 261.63], sueltas: [440, 523.25, 587.33, 659.25] },
  // Si bemol con séptima mayor: si bemol, re, fa, la. Vuelve a fa sin apuro.
  { bajo: 58.27, acorde: [116.54, 146.83, 174.61, 220], sueltas: [349.23, 440, 523.25, 587.33] },
];

/** Dónde puede caer una nota suelta dentro de su acorde, en segundos. */
const LUGARES = [0.8, 2.6, 4.2];

/** Un azar con semilla: la misma vuelta suena siempre igual, así se puede probar. */
function azar(semilla: number): () => number {
  let s = (semilla * 2654435761 + 1) >>> 0;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 2 ** 32;
  };
}

/**
 * La vuelta número `n`. Los acordes y el bajo son siempre los mismos; las notas sueltas cambian:
 * de cero a dos por acorde, nunca la misma dos veces seguidas.
 */
export function planDelManual(n = 0): readonly NotaDeMusica[] {
  const r = azar(n);
  const notas: NotaDeMusica[] = [];
  let anterior = 0;
  PASOS_DEL_MANUAL.forEach((p, i) => {
    const desde = i * COMPAS;
    notas.push({ t: desde, hz: p.bajo, dura: COMPAS, voz: 'fondo', volumen: 0.035 });
    p.acorde.forEach((hz, j) =>
      notas.push({ t: desde, hz, dura: COMPAS, voz: 'acorde', volumen: 0.02 - j * 0.0025 }),
    );
    const cuantas = r() < 0.3 ? 0 : r() < 0.6 ? 1 : 2;
    // Con una nota, uno de los tres lugares; con dos, los otros dos.
    const elegido = Math.floor(r() * LUGARES.length);
    const lugares =
      cuantas === 0 ? [] : LUGARES.filter((_, k) => (cuantas === 1) === (k === elegido));
    for (const lugar of lugares) {
      const opciones = p.sueltas.filter((hz) => hz !== anterior);
      anterior = opciones[Math.floor(r() * opciones.length)];
      notas.push({ t: desde + lugar, hz: anterior, dura: 2.8, voz: 'caja', volumen: 0.018 });
    }
  });
  return notas.sort((a, b) => a.t - b.t);
}

/** Suena mientras el manual está abierto. Sin sonido espera, y suena si lo prenden leyendo. */
export function tocarManual(salida: () => SalidaDeAudio | null): Musica {
  return tocarEnBucle(salida, VUELTA_DEL_MANUAL, planDelManual);
}
