import type { SalidaDeAudio } from '../libs/sonido';
import { tocarPresentimiento, type Musica, type NotaDeMusica } from './musica-del-presentimiento';

/**
 * La música de la colina, mientras Angie espera en la piedra que alguien entre: melancólica, en re
 * menor como la despedida que viene, así el paso de una a la otra no se oye como un corte.
 *
 * Una vuelta de cuatro acordes, lenta, que se repite: re menor con novena, si bemol con séptima
 * mayor, sol menor con séptima y la con cuarta suspendida, que no resuelve y por eso vuelve a
 * empezar. Encima, una cajita que baja de a tres notas por acorde, como quien piensa en voz baja.
 */

/** Lo que dura una vuelta, en segundos. */
export const VUELTA = 16;
/** Lo que dura cada acorde de la vuelta. */
const COMPAS = VUELTA / 4;

interface Paso {
  /** El grave, una octava debajo del acorde: lo que sostiene. */
  readonly bajo: number;
  readonly acorde: readonly number[];
  /** La cajita: baja de a una nota por vez dentro del acorde. */
  readonly caja: readonly number[];
}

const PASOS: readonly Paso[] = [
  // Re menor con novena: re, fa, la, mi.
  { bajo: 73.42, acorde: [146.83, 174.61, 220, 329.63], caja: [440, 349.23, 329.63] },
  // Si bemol con séptima mayor: si bemol, re, fa, la.
  { bajo: 58.27, acorde: [116.54, 146.83, 174.61, 220], caja: [587.33, 523.25, 440] },
  // Sol menor con séptima: sol, si bemol, re, fa.
  { bajo: 98, acorde: [98, 116.54, 146.83, 174.61], caja: [466.16, 440, 392] },
  // La con cuarta suspendida y séptima: la, re, mi, sol. La cajita se queda a medio camino.
  { bajo: 55, acorde: [110, 146.83, 164.81, 196], caja: [329.63, 293.66] },
];

/** Cuándo entra cada nota de la cajita dentro de su acorde: espaciadas, sin apuro. */
const ENTRADAS = [0.5, 1.6, 2.6];

/** Una vuelta entera, desde su comienzo. */
export function planDeLaColina(): readonly NotaDeMusica[] {
  const notas: NotaDeMusica[] = [];
  PASOS.forEach((p, i) => {
    const desde = i * COMPAS;
    notas.push({ t: desde, hz: p.bajo, dura: COMPAS, voz: 'fondo', volumen: 0.045 });
    p.acorde.forEach((hz, j) =>
      notas.push({ t: desde, hz, dura: COMPAS, voz: 'acorde', volumen: 0.024 - j * 0.003 }),
    );
    p.caja.forEach((hz, j) =>
      notas.push({ t: desde + ENTRADAS[j], hz, dura: 2.2, voz: 'caja', volumen: 0.032 }),
    );
  });
  return notas.sort((a, b) => a.t - b.t);
}

/** Con cuánta anticipación se agenda la vuelta siguiente, en segundos: un timer nunca llega justo. */
const ANTICIPO = 1.5;
/** Sin sonido, cada cuánto se fija si volvió, en ms. */
const REVISA_MS = 1000;

/**
 * Suena vuelta tras vuelta hasta que la apagan. Cada vuelta se agenda en el reloj del audio pegada
 * a la anterior, así un timer que se atrasa no abre un hueco. Sin sonido espera: si alguien lo
 * prende en la colina, la música empieza ahí.
 */
export function tocarColina(salida: () => SalidaDeAudio | null): Musica {
  const plan = planDeLaColina();
  let vueltas: Musica[] = [];
  let cero: number | null = null;
  let apagada = false;
  let timer: ReturnType<typeof setTimeout> | undefined;
  const agendar = (): void => {
    if (apagada) return;
    const s = salida();
    if (!s) {
      cero = null;
      timer = setTimeout(agendar, REVISA_MS);
      return;
    }
    const ahora = s.ctx.currentTime;
    if (cero === null || cero < ahora) cero = ahora + 0.05;
    // Solo la que suena y la que viene: las anteriores ya se apagaron solas.
    vueltas = [...vueltas.slice(-1), tocarPresentimiento(s, plan, cero)];
    cero += VUELTA;
    timer = setTimeout(agendar, Math.max(0, cero - ahora - ANTICIPO) * 1000);
  };
  agendar();
  return {
    apagar(sale = 0.6) {
      apagada = true;
      clearTimeout(timer);
      for (const v of vueltas) v.apagar(sale);
    },
  };
}
