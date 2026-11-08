import type { SalidaDeAudio } from '../libs/sonido';

/**
 * La música de la despedida de Angie: tranquila, pero con algo que se viene. Suena desde el toque
 * (antes no se puede: el navegador abre el audio recién con un gesto) hasta que cae la noche. Los
 * pensamientos los pasa quien mira, con un toque: por eso no hay horario, sino un fondo que sigue y
 * una fase por momento, que suena hasta que llega la siguiente.
 *
 * - Un fondo grave en re, quieto, que no cambia: la calma.
 * - Un acorde por pensamiento. "Ellos ya están aquí…" en re menor con novena: lo presiente.
 *   "La hora ha llegado…" en si bemol mayor con séptima: la decisión, más luminosa. Al volverse
 *   luz, la suspendida de la: queda sin resolver, porque lo que viene todavía no llegó.
 * - Una cajita de música encima: baja despacio en el primero, sube en el segundo y, cuando las
 *   piezas suben al sol, se va hacia arriba con ellas.
 *
 * Todo se sintetiza, como el resto del sonido de la app: sin archivos ni red.
 */

export type VozDeMusica = 'fondo' | 'acorde' | 'caja';

export interface NotaDeMusica {
  /** Desde el toque, en segundos. */
  readonly t: number;
  readonly hz: number;
  /** Cuánto se sostiene, en segundos (la caja: cuánto tarda en apagarse). */
  readonly dura: number;
  readonly voz: VozDeMusica;
  readonly volumen: number;
}

/** Los momentos de la despedida: los dos pensamientos y cuando se vuelve luz. */
export type FaseDelPresentimiento = 'presiente' | 'decide' | 'luz';

/** Si nadie toca, un pensamiento suena esto como mucho, en segundos: después se apaga solo. */
export const SOSTENIDO = 180;
/** Desde que se vuelve luz hasta que cae la noche y llega el prólogo, en segundos. */
export const HASTA_LA_NOCHE = 5;

const RE2 = 73.42;
const LA2 = 110;
/** Re menor con novena: re, fa, la, mi. */
const PRESIENTE = [146.83, 174.61, 220, 329.63];
/** Si bemol mayor con séptima y novena: si bemol, fa, la, do, re. */
const DECIDE = [116.54, 174.61, 220, 261.63, 293.66];
/** La suspendida: la, re, mi, la. Sin la tercera no resuelve. */
const SUSPENDIDA = [110, 146.83, 164.81, 220];
/** La cajita baja despacio mientras lo presiente: la, fa, mi, re. */
const BAJA = [440, 349.23, 329.63, 293.66];
/** Y sube cuando decide: la, do, re. */
const SUBE = [440, 523.25, 587.33];
/** Con las luces, hacia el sol. */
const AL_SOL = [587.33, 659.25, 698.46, 880, 1174.66, 1318.51, 1760];

type Nota = (desde: number, hz: number, dura: number, voz: VozDeMusica, volumen: number) => void;

function anotar(): { notas: NotaDeMusica[]; nota: Nota } {
  const notas: NotaDeMusica[] = [];
  const nota: Nota = (desde, hz, dura, voz, volumen) => {
    if (dura > 0) notas.push({ t: desde, hz, dura, voz, volumen });
  };
  return { notas, nota };
}

/** El fondo grave, quieto: sigue igual de un pensamiento al otro, así el cambio no se oye como corte. */
export function planDelFondo(dura: number): readonly NotaDeMusica[] {
  const { notas, nota } = anotar();
  nota(0, RE2, dura, 'fondo', 0.06);
  nota(0, LA2, dura, 'fondo', 0.035);
  return notas;
}

const FASES: Readonly<
  Record<
    FaseDelPresentimiento,
    {
      acorde: readonly number[];
      motivo: readonly number[];
      entra: number;
      paso: number;
      vol: number;
    }
  >
> = {
  presiente: { acorde: PRESIENTE, motivo: BAJA, entra: 0.5, paso: 0.55, vol: 0.05 },
  decide: { acorde: DECIDE, motivo: SUBE, entra: 0.4, paso: 0.5, vol: 0.05 },
  luz: { acorde: SUSPENDIDA, motivo: AL_SOL, entra: 0.5, paso: 0.32, vol: 0.04 },
};

/**
 * Lo que suena en un momento, desde que empieza: su acorde, sostenido `dura` segundos, y la cajita
 * encima. Si el momento dura poco, la caja toca menos notas en vez de pisar el siguiente.
 */
export function planDeFase(
  fase: FaseDelPresentimiento,
  dura = fase === 'luz' ? HASTA_LA_NOCHE : SOSTENIDO,
): readonly NotaDeMusica[] {
  const { notas, nota } = anotar();
  const f = FASES[fase];
  f.acorde.forEach((hz, i) => nota(0, hz, dura, 'acorde', 0.03 - i * 0.003));
  // Con las luces, la caja termina un segundo antes de la noche: que se apague con el cielo.
  const hasta = fase === 'luz' ? dura - 1 : dura;
  f.motivo.forEach((hz, i) => {
    const cuando = f.entra + i * f.paso;
    if (cuando < hasta) nota(cuando, hz, 1.6, 'caja', f.vol);
  });
  return notas.sort((a, b) => a.t - b.t);
}

export interface Musica {
  /**
   * La baja de a poco, en `sale` segundos, y corta lo agendado: al pasar de un pensamiento al otro,
   * o cuando la despedida se interrumpe.
   */
  apagar(sale?: number): void;
}

/** Entradas y salidas de cada voz, en segundos: el fondo y los acordes entran como una marea. */
const ENVOLVENTE: Readonly<Record<VozDeMusica, { entra: number; sale: number }>> = {
  fondo: { entra: 2, sale: 2.4 },
  acorde: { entra: 1.2, sale: 1.4 },
  caja: { entra: 0.005, sale: 0 },
};

/**
 * Agenda el plan en la salida común. Si algo del audio falla, queda en silencio y no tira. `desde`,
 * en el reloj del audio: para pegar una vuelta a la anterior sin hueco; si no, arranca ya.
 */
export function tocarPresentimiento(
  salida: SalidaDeAudio,
  plan: readonly NotaDeMusica[],
  desde?: number,
): Musica {
  const { ctx } = salida;
  const osciladores: OscillatorNode[] = [];
  let maestro: GainNode | null = null;
  try {
    maestro = ctx.createGain();
    maestro.gain.value = 1;
    maestro.connect(salida.salida);
    // Los acordes van opacos, detrás: que se sientan más de lo que se oyen.
    const filtro = ctx.createBiquadFilter();
    filtro.type = 'lowpass';
    filtro.frequency.value = 900;
    filtro.connect(maestro);
    const cero = (desde ?? ctx.currentTime) + 0.02;
    for (const n of plan) {
      const inicio = cero + n.t;
      const env = ctx.createGain();
      env.connect(n.voz === 'caja' ? maestro : filtro);
      const { entra, sale } = ENVOLVENTE[n.voz];
      env.gain.setValueAtTime(0, inicio);
      env.gain.linearRampToValueAtTime(n.volumen, inicio + entra);
      let fin: number;
      if (n.voz === 'caja') {
        fin = inicio + n.dura;
        env.gain.exponentialRampToValueAtTime(0.0001, fin);
      } else {
        const suelta = inicio + Math.max(n.dura, entra);
        env.gain.setValueAtTime(n.volumen, suelta);
        fin = suelta + sale;
        env.gain.linearRampToValueAtTime(0, fin);
      }
      // La caja con sus armónicos, como la intro; los acordes, de a dos osciladores apenas
      // desafinados, que es lo que los hace respirar.
      const parciales: [number, number, OscillatorType][] =
        n.voz === 'caja'
          ? [
              [1, 1, 'sine'],
              [2, 0.35, 'sine'],
              [3, 0.12, 'sine'],
            ]
          : [
              [1, 0.6, n.voz === 'fondo' ? 'sine' : 'triangle'],
              [1.004, 0.6, n.voz === 'fondo' ? 'sine' : 'triangle'],
            ];
      for (const [mul, amp, onda] of parciales) {
        const osc = ctx.createOscillator();
        osc.type = onda;
        osc.frequency.value = n.hz * mul;
        const g = ctx.createGain();
        g.gain.value = amp;
        osc.connect(g).connect(env);
        osc.start(inicio);
        osc.stop(fin + 0.05);
        osciladores.push(osc);
      }
    }
  } catch {
    // Sin audio la despedida es la misma, en silencio.
  }
  return {
    apagar(sale = 0.6) {
      try {
        const ahora = ctx.currentTime;
        maestro?.gain.setValueAtTime(maestro.gain.value, ahora);
        maestro?.gain.linearRampToValueAtTime(0, ahora + sale);
        for (const osc of osciladores) osc.stop(ahora + sale + 0.1);
      } catch {
        // Ya estaba cortada.
      }
    },
  };
}
