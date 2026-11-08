import type { SalidaDeAudio } from '../libs/sonido';

/**
 * La música de la despedida de Angie: tranquila, pero con algo que se viene. Suena desde el toque
 * (antes no se puede: el navegador abre el audio recién con un gesto) hasta que cae la noche.
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

/** Los tiempos de la despedida que la música acompaña, en segundos desde el toque. */
export interface TiemposDelPresentimiento {
  /** Cuando aparece "Ellos ya están aquí…". */
  readonly presiente: number;
  /** Cuando cambia a "La hora ha llegado…". */
  readonly decide: number;
  /** Cuando se termina de pensar y empieza a volverse luz. */
  readonly seVuelveLuz: number;
  /** Cuando ya es de noche y llega el prólogo: ahí la música ya se fue. */
  readonly noche: number;
}

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

/** Cuánto se pisan dos acordes seguidos: sin cruce, el cambio se oye como un corte. */
const CRUCE = 0.6;

export function planDelPresentimiento(t: TiemposDelPresentimiento): readonly NotaDeMusica[] {
  const notas: NotaDeMusica[] = [];
  const nota = (
    desde: number,
    hz: number,
    dura: number,
    voz: VozDeMusica,
    volumen: number,
  ): void => {
    if (dura > 0) notas.push({ t: desde, hz, dura, voz, volumen });
  };

  nota(0, RE2, t.noche, 'fondo', 0.06);
  nota(0, LA2, t.noche, 'fondo', 0.035);

  const acorde = (hzs: readonly number[], desde: number, hasta: number): void =>
    hzs.forEach((hz, i) => nota(desde, hz, hasta - desde, 'acorde', 0.03 - i * 0.003));
  acorde(PRESIENTE, t.presiente, t.decide + CRUCE);
  acorde(DECIDE, t.decide, t.seVuelveLuz + CRUCE);
  acorde(SUSPENDIDA, t.seVuelveLuz, t.noche);

  // Cada motivo entra en su ventana: si un pensamiento dura poco, la caja toca menos notas.
  const motivo = (
    hzs: readonly number[],
    desde: number,
    hasta: number,
    paso: number,
    volumen: number,
  ): void =>
    hzs.forEach((hz, i) => {
      const cuando = desde + i * paso;
      if (cuando < hasta) nota(cuando, hz, 1.6, 'caja', volumen);
    });
  motivo(BAJA, t.presiente + 0.5, t.decide, 0.55, 0.05);
  motivo(SUBE, t.decide + 0.4, t.seVuelveLuz, 0.5, 0.05);
  motivo(AL_SOL, t.seVuelveLuz + 0.5, t.noche - 1, 0.32, 0.04);

  return notas.sort((a, b) => a.t - b.t);
}

export interface Musica {
  /** La baja de a poco y corta lo agendado: para cuando la despedida se interrumpe. */
  apagar(): void;
}

/** Entradas y salidas de cada voz, en segundos: el fondo y los acordes entran como una marea. */
const ENVOLVENTE: Readonly<Record<VozDeMusica, { entra: number; sale: number }>> = {
  fondo: { entra: 2, sale: 2.4 },
  acorde: { entra: 1.2, sale: 1.4 },
  caja: { entra: 0.005, sale: 0 },
};

/** Agenda el plan en la salida común. Si algo del audio falla, queda en silencio y no tira. */
export function tocarPresentimiento(salida: SalidaDeAudio, plan: readonly NotaDeMusica[]): Musica {
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
    const cero = ctx.currentTime + 0.02;
    for (const n of plan) {
      const desde = cero + n.t;
      const env = ctx.createGain();
      env.connect(n.voz === 'caja' ? maestro : filtro);
      const { entra, sale } = ENVOLVENTE[n.voz];
      env.gain.setValueAtTime(0, desde);
      env.gain.linearRampToValueAtTime(n.volumen, desde + entra);
      let fin: number;
      if (n.voz === 'caja') {
        fin = desde + n.dura;
        env.gain.exponentialRampToValueAtTime(0.0001, fin);
      } else {
        const suelta = desde + Math.max(n.dura, entra);
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
        osc.start(desde);
        osc.stop(fin + 0.05);
        osciladores.push(osc);
      }
    }
  } catch {
    // Sin audio la despedida es la misma, en silencio.
  }
  return {
    apagar() {
      try {
        const ahora = ctx.currentTime;
        maestro?.gain.setValueAtTime(maestro.gain.value, ahora);
        maestro?.gain.linearRampToValueAtTime(0, ahora + 0.6);
        for (const osc of osciladores) osc.stop(ahora + 0.7);
      } catch {
        // Ya estaba cortada.
      }
    },
  };
}
