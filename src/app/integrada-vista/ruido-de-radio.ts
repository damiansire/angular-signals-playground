import type { SalidaDeAudio } from '../libs/sonido';
import type { Musica } from './musica-del-presentimiento';

/**
 * La radio que se cruza apenas se toca la lamparita: estática, chasquidos sueltos y el silbido de
 * alguien buscando la frecuencia. Es la señal del sol que todavía no se entiende; cuando se apaga,
 * la voz llega limpia. Va antes de hablar para que el comienzo respire: el toque no dispara un
 * diálogo, prende una radio.
 */

/** Lo que cubre el plan, en segundos. La estática sigue en bucle si quien mira tarda más. */
export const DURA_LA_RADIO = 24;

export type GolpeDeRadio =
  /** Un chasquido corto de estática, como un rayo lejano en la banda. */
  | { readonly t: number; readonly tipo: 'chasquido'; readonly volumen: number }
  /** El silbido de dos señales que se pisan: sube o baja de tono mientras se busca la frecuencia. */
  | {
      readonly t: number;
      readonly tipo: 'silbido';
      readonly dura: number;
      readonly desde: number;
      readonly hasta: number;
      readonly volumen: number;
    };

/**
 * Un azar con semilla: el mismo plan siempre, así se puede probar. Propio y no el de `inicio-angie`,
 * que importa este módulo: tomarlo de ahí cerraría un ciclo.
 */
function azar(semilla: number): () => number {
  let s = semilla >>> 0;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 2 ** 32;
  };
}

/**
 * Los golpes de la radio sobre la estática de fondo. Los chasquidos caen irregulares, nunca dos
 * pegados; los silbidos van espaciados y alternan sube y baja, que es como suena girar el dial.
 */
export function planDeLaRadio(semilla = 7): readonly GolpeDeRadio[] {
  const r = azar(semilla);
  const golpes: GolpeDeRadio[] = [];
  for (let t = 0.25 + r() * 0.3; t < DURA_LA_RADIO; t += 0.18 + r() * 0.75) {
    golpes.push({ t, tipo: 'chasquido', volumen: 0.05 + r() * 0.07 });
  }
  let sube = true;
  for (let t = 0.6; t < DURA_LA_RADIO - 2; t += 2.6 + r() * 1.8) {
    const grave = 700 + r() * 300;
    const agudo = grave + 450 + r() * 400;
    golpes.push({
      t,
      tipo: 'silbido',
      dura: 1 + r() * 0.8,
      desde: sube ? grave : agudo,
      hasta: sube ? agudo : grave,
      volumen: 0.012 + r() * 0.008,
    });
    sube = !sube;
  }
  return golpes.sort((a, b) => a.t - b.t);
}

/** El sonido de un anillo que sale del sol: un tono que cae, como algo que se aleja. */
export interface SonidoDeOnda {
  readonly desde: number;
  readonly hasta: number;
  readonly dura: number;
  readonly volumen: number;
  /** Cuánto tiembla el tono, en Hz: la interferencia de la señal que todavía no se entiende. */
  readonly temblor: number;
}

/**
 * Cada anillo que sale del sol suena, así la señal se oye llegar y no es solo un dibujo. Con
 * interferencia el tono tiembla; sintonizada, la misma onda sale limpia y más suave, debajo de la voz.
 */
export function sonidoDeOnda(limpia: boolean): SonidoDeOnda {
  return limpia
    ? { desde: 520, hasta: 390, dura: 0.9, volumen: 0.022, temblor: 0 }
    : { desde: 520, hasta: 390, dura: 0.9, volumen: 0.035, temblor: 22 };
}

/** Un anillo que sale del sol. Sin audio, no suena y no tira. */
export function tocarOnda(salida: SalidaDeAudio, onda: SonidoDeOnda): void {
  const { ctx } = salida;
  try {
    const inicio = ctx.currentTime + 0.01;
    const env = ctx.createGain();
    env.gain.setValueAtTime(0, inicio);
    env.gain.linearRampToValueAtTime(onda.volumen, inicio + 0.04);
    env.gain.exponentialRampToValueAtTime(0.0001, inicio + onda.dura);
    env.connect(salida.salida);
    const osc = ctx.createOscillator();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(onda.desde, inicio);
    osc.frequency.exponentialRampToValueAtTime(onda.hasta, inicio + onda.dura);
    osc.connect(env);
    osc.start(inicio);
    osc.stop(inicio + onda.dura + 0.05);
    if (onda.temblor > 0) {
      const lfo = ctx.createOscillator();
      lfo.frequency.value = 13;
      const hondo = ctx.createGain();
      hondo.gain.value = onda.temblor;
      lfo.connect(hondo).connect(osc.frequency);
      lfo.start(inicio);
      lfo.stop(inicio + onda.dura + 0.05);
    }
  } catch {
    // Sin audio, la onda se ve y nada más.
  }
}

/** El volumen de la estática de fondo: se siente, no tapa la música que ya empezó. */
const ESTATICA = 0.05;

/** Un segundo de ruido blanco: sirve para la estática en bucle y para cada chasquido. */
function ruido(ctx: BaseAudioContext): AudioBuffer {
  const buf = ctx.createBuffer(1, ctx.sampleRate, ctx.sampleRate);
  const datos = buf.getChannelData(0);
  for (let i = 0; i < datos.length; i++) datos[i] = Math.random() * 2 - 1;
  return buf;
}

/**
 * Prende la radio en la salida común hasta que la apagan. Si algo del audio falla, queda en
 * silencio y no tira: la escena es la misma sin sonido.
 */
export function tocarRadio(salida: SalidaDeAudio, plan: readonly GolpeDeRadio[]): Musica {
  const { ctx } = salida;
  const fuentes: AudioScheduledSourceNode[] = [];
  let maestro: GainNode | null = null;
  try {
    maestro = ctx.createGain();
    const cero = ctx.currentTime + 0.02;
    maestro.gain.setValueAtTime(0, cero);
    maestro.gain.linearRampToValueAtTime(1, cero + 0.5);
    maestro.connect(salida.salida);
    const blanco = ruido(ctx);

    // La estática: ruido en la banda de una radio de onda corta, que respira irregular.
    const fondo = ctx.createBufferSource();
    fondo.buffer = blanco;
    fondo.loop = true;
    const banda = ctx.createBiquadFilter();
    banda.type = 'bandpass';
    banda.frequency.value = 1800;
    banda.Q.value = 0.7;
    const nivel = ctx.createGain();
    nivel.gain.value = ESTATICA;
    // Un vaivén lento del volumen: la señal entra y se va, como en una radio de verdad.
    const vaiven = ctx.createOscillator();
    vaiven.frequency.value = 0.7;
    const hondo = ctx.createGain();
    hondo.gain.value = ESTATICA * 0.45;
    vaiven.connect(hondo).connect(nivel.gain);
    fondo.connect(banda).connect(nivel).connect(maestro);
    fondo.start(cero);
    vaiven.start(cero);
    fuentes.push(fondo, vaiven);

    const agudos = ctx.createBiquadFilter();
    agudos.type = 'highpass';
    agudos.frequency.value = 2400;
    agudos.connect(maestro);
    for (const g of plan) {
      const inicio = cero + g.t;
      const env = ctx.createGain();
      env.gain.setValueAtTime(0, inicio);
      if (g.tipo === 'chasquido') {
        // Los más fuertes duran un poco más: un golpe grande retumba.
        const corto = 0.02 + g.volumen * 0.3;
        env.gain.linearRampToValueAtTime(g.volumen, inicio + 0.003);
        env.gain.exponentialRampToValueAtTime(0.0001, inicio + corto);
        const s = ctx.createBufferSource();
        s.buffer = blanco;
        s.connect(env).connect(agudos);
        // Cada chasquido lee otro tramo del mismo ruido: si no, todos sonarían iguales.
        s.start(inicio, (g.t * 0.37) % 0.9, corto + 0.01);
        fuentes.push(s);
      } else {
        env.gain.linearRampToValueAtTime(g.volumen, inicio + g.dura * 0.3);
        env.gain.linearRampToValueAtTime(0, inicio + g.dura);
        const osc = ctx.createOscillator();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(g.desde, inicio);
        osc.frequency.exponentialRampToValueAtTime(g.hasta, inicio + g.dura);
        osc.connect(env).connect(maestro);
        osc.start(inicio);
        osc.stop(inicio + g.dura + 0.05);
        fuentes.push(osc);
      }
    }
  } catch {
    // Sin audio, la radio se ve en las ondas del sol y nada más.
  }
  return {
    apagar(sale = 0.6) {
      try {
        const ahora = ctx.currentTime;
        maestro?.gain.cancelScheduledValues(ahora);
        maestro?.gain.setValueAtTime(maestro.gain.value, ahora);
        maestro?.gain.linearRampToValueAtTime(0, ahora + sale);
        for (const f of fuentes) f.stop(ahora + sale + 0.1);
      } catch {
        // Ya estaba apagada.
      }
    },
  };
}
