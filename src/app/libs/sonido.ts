/**
 * El sonido de toda la app, en un solo lugar.
 *
 * Antes había tres: la intro, el prólogo y el Estudio abrían cada uno su `AudioContext`, y el
 * prólogo además hablaba con `speechSynthesis`. Eso fallaba de muchas maneras según la máquina:
 * sin voces en español la voz no salía (y el reloj del diálogo cambiaba de ritmo según hubiera o
 * no voz), `getVoices()` llega vacío la primera vez, algunos navegadores no tienen Web Audio, y
 * crear un contexto antes de un gesto del usuario deja advertencias en la consola.
 *
 * Las reglas de este módulo:
 * - **Nada depende de que suene.** Si no hay Web Audio, o se rompe a mitad de camino, todo sigue
 *   igual y en silencio. Ningún método tira.
 * - **Un solo contexto, creado recién con un gesto** (click o tecla). Antes de eso, lo que se pida
 *   se descarta: no se encola para sonar todo junto después.
 * - **Todo se sintetiza.** Sin archivos ni red. Las voces de los personajes son "blips" con un
 *   timbre por personaje, al estilo de los RPG de texto: se distingue quién habla sin leer, y
 *   suena igual en cualquier máquina, cosa que una voz sintética del sistema no puede prometer.
 * - **Se congela con la pestaña oculta** y se respeta la preferencia guardada.
 */

export type Voz = 'cap' | 'naveA' | 'naveB' | 'nave4' | 'mascota' | 'voz' | 'todos';

export type Efecto = 'toque' | 'titulo' | 'beat' | 'transmision' | 'cierre';

export interface PerfilVoz {
  readonly onda: OscillatorType;
  /** Frecuencia central, en Hz. Lo que más separa a un personaje de otro. */
  readonly base: number;
  /** Cuántos semitonos se aleja como máximo de la base: la "melodía" de su forma de hablar. */
  readonly abanico: number;
  /** Duración de cada blip, en ms. */
  readonly blip: number;
  /** Separación entre blips, en ms: el ritmo al que habla. */
  readonly paso: number;
  readonly volumen: number;
}

/**
 * Un timbre por personaje. El capitán, grave y parejo; las naves, en el medio; la exploradora,
 * aguda y rápida (es la impaciente); la mascota, suave y lenta. Los volúmenes compensan que una
 * onda cuadrada suena mucho más fuerte que una senoidal al mismo valor.
 */
export const PERFILES: Readonly<Record<Voz, PerfilVoz>> = {
  cap: { onda: 'square', base: 147, abanico: 4, blip: 56, paso: 80, volumen: 0.035 },
  naveA: { onda: 'triangle', base: 262, abanico: 7, blip: 50, paso: 70, volumen: 0.09 },
  naveB: { onda: 'triangle', base: 208, abanico: 6, blip: 52, paso: 74, volumen: 0.09 },
  nave4: { onda: 'square', base: 392, abanico: 7, blip: 38, paso: 58, volumen: 0.028 },
  mascota: { onda: 'sine', base: 330, abanico: 4, blip: 92, paso: 108, volumen: 0.12 },
  voz: { onda: 'sine', base: 110, abanico: 3, blip: 120, paso: 140, volumen: 0.14 },
  todos: { onda: 'sawtooth', base: 196, abanico: 9, blip: 46, paso: 60, volumen: 0.03 },
};

export interface Blip {
  /** Cuándo suena, en ms desde que empieza la línea. */
  readonly t: number;
  readonly hz: number;
  readonly ms: number;
}

/** Ninguna línea suena más de esto: una frase larga se habla más rápido, no infinitamente. */
const MAX_BLIPS = 40;
/** Por debajo de este paso los blips se pegan y dejan de leerse como sílabas. */
const PASO_MINIMO = 38;

const SEMITONO_DE_VOCAL: Readonly<Record<string, number>> = {
  a: 0,
  á: 0,
  e: 2,
  é: 2,
  i: 4,
  í: 4,
  o: -2,
  ó: -2,
  u: -3,
  ú: -3,
  ü: -3,
};

/**
 * El plan de blips de una línea: una sílaba por grupo de vocales, con la altura según la vocal y
 * la consonante que la antecede, y pausas en los espacios y la puntuación. Es determinista (la
 * misma frase suena siempre igual, que es lo que la vuelve una voz y no ruido) y cabe entero en
 * el 85 % de la ventana de la línea, así nunca sigue hablando cuando el texto ya se fue.
 */
export function planDeBlips(texto: string, ventanaMs: number, perfil: PerfilVoz): readonly Blip[] {
  const limpio = texto.toLowerCase().replace(/\s+/g, ' ').trim();
  if (!limpio || ventanaMs <= 0) return [];

  const pregunta = /[?¿]\s*$/.test(limpio) || limpio.startsWith('¿');
  const crudos: { t: number; semitono: number }[] = [];
  let t = 0;
  let enVocal = false;
  let consonante = 0;
  for (const letra of limpio) {
    const vocal = SEMITONO_DE_VOCAL[letra];
    if (vocal !== undefined) {
      if (!enVocal) {
        const giro = (consonante % (perfil.abanico * 2 + 1)) - perfil.abanico;
        crudos.push({
          t,
          semitono: Math.max(-perfil.abanico, Math.min(perfil.abanico, vocal + giro / 3)),
        });
        t += perfil.paso;
      }
      enVocal = true;
      continue;
    }
    enVocal = false;
    if (letra === ' ') t += perfil.paso * 0.35;
    else if (/[.,;:!?¡¿…]/.test(letra)) t += perfil.paso * 1.6;
    else consonante = (consonante * 31 + letra.charCodeAt(0)) % 997;
  }
  if (!crudos.length) return [];

  const recortados = crudos.slice(0, MAX_BLIPS);
  if (pregunta) {
    // La pregunta sube al final: con eso alcanza para que se escuche como pregunta.
    const n = recortados.length;
    for (let i = Math.max(0, n - 2); i < n; i++) {
      recortados[i] = { ...recortados[i], semitono: recortados[i].semitono + 3 + (i - n + 2) * 2 };
    }
  }

  const largo = recortados[recortados.length - 1].t + perfil.blip;
  const tope = ventanaMs * 0.85;
  const escala = largo > tope ? Math.max(PASO_MINIMO / perfil.paso, tope / largo) : 1;

  return recortados
    .map((b) => ({
      t: Math.round(b.t * escala),
      hz: Math.round(perfil.base * Math.pow(2, b.semitono / 12) * 10) / 10,
      ms: perfil.blip,
    }))
    .filter((b) => b.t + b.ms <= Math.max(tope, perfil.blip));
}

export const CLAVE_SONIDO = 'signals-sonido';

/** Encendido salvo que el usuario lo haya apagado: el default es lo que casi todos van a usar. */
export function leerPreferencia(almacen: Pick<Storage, 'getItem'> | null): boolean {
  try {
    return almacen?.getItem(CLAVE_SONIDO) !== '0';
  } catch {
    return true;
  }
}

export interface SalidaDeAudio {
  readonly ctx: AudioContext;
  /** Donde conectar lo que se sintetice afuera: ya pasa por el volumen y el compresor comunes. */
  readonly salida: AudioNode;
}

export interface Sonido {
  /** Hay Web Audio y no se rompió. Antes del primer gesto dice si EXISTE, no si ya suena. */
  disponible(): boolean;
  /** La preferencia del usuario. */
  activo(): boolean;
  /** Prende, apaga o alterna. Devuelve el estado nuevo y lo guarda. */
  alternar(encendido?: boolean): boolean;
  /** Abre el contexto. Hay que llamarlo desde un gesto; también se engancha solo al primero. */
  desbloquear(): void;
  efecto(efecto: Efecto): void;
  /** Hace hablar a un personaje durante la ventana de una línea. */
  hablar(quien: Voz, texto: string, ventanaMs: number): void;
  /** Corta todo lo que está sonando o agendado. */
  callar(): void;
  /** Para quien sintetiza lo suyo (la intro, el prólogo). `null` si no hay audio todavía. */
  salida(): SalidaDeAudio | null;
  /** Avisa cuando cambia la preferencia, para que cada botón de sonido muestre lo mismo. */
  alCambiar(fn: (activo: boolean) => void): () => void;
  destruir(): void;
}

export interface EntornoSonido {
  readonly crearContexto?: () => AudioContext | null;
  readonly almacen?: Pick<Storage, 'getItem' | 'setItem'> | null;
  /** De dónde escuchar el primer gesto y la visibilidad. `null` en tests que no los necesitan. */
  readonly documento?: Pick<
    Document,
    'addEventListener' | 'removeEventListener' | 'visibilityState'
  > | null;
}

/** Más voces a la vez que esto se vuelve barro y cuesta CPU en máquinas chicas. */
const MAX_VIVAS = 24;

function contextoDelNavegador(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  const Ctor =
    window.AudioContext ??
    (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  return Ctor ? new Ctor() : null;
}

function existeWebAudio(): boolean {
  if (typeof window === 'undefined') return false;
  return (
    'AudioContext' in window ||
    'webkitAudioContext' in (window as unknown as Record<string, unknown>)
  );
}

export function crearSonido(entorno: EntornoSonido = {}): Sonido {
  const crearContexto = entorno.crearContexto ?? contextoDelNavegador;
  const almacen = entorno.almacen ?? null;
  const documento = entorno.documento ?? null;

  let ctx: AudioContext | null = null;
  let salidaComun: GainNode | null = null;
  let roto = entorno.crearContexto ? false : !existeWebAudio();
  let encendido = leerPreferencia(almacen);
  let vivas = 0;
  const agendadas = new Set<OscillatorNode>();
  const oyentes = new Set<(activo: boolean) => void>();

  /** Cualquier falla del audio lo apaga para siempre en esta sesión, sin ruido en pantalla. */
  function aSalvo(fn: () => void): void {
    if (roto) return;
    try {
      fn();
    } catch {
      roto = true;
    }
  }

  function listo(): boolean {
    return !roto && encendido && ctx !== null && salidaComun !== null && ctx.state !== 'closed';
  }

  function tono(
    hz: number,
    desde: number,
    ms: number,
    onda: OscillatorType,
    volumen: number,
  ): void {
    if (!ctx || !salidaComun || vivas >= MAX_VIVAS) return;
    const osc = ctx.createOscillator();
    const env = ctx.createGain();
    osc.type = onda;
    osc.frequency.setValueAtTime(hz, desde);
    const fin = desde + ms / 1000;
    env.gain.setValueAtTime(0, desde);
    env.gain.linearRampToValueAtTime(volumen, desde + Math.min(0.012, ms / 3000));
    env.gain.exponentialRampToValueAtTime(0.0001, fin);
    osc.connect(env).connect(salidaComun);
    vivas++;
    agendadas.add(osc);
    osc.onended = () => {
      vivas--;
      agendadas.delete(osc);
    };
    osc.start(desde);
    osc.stop(fin + 0.02);
  }

  function desbloquear(): void {
    aSalvo(() => {
      if (!ctx) {
        ctx = crearContexto();
        if (!ctx) {
          roto = true;
          return;
        }
        const compresor = ctx.createDynamicsCompressor();
        compresor.connect(ctx.destination);
        salidaComun = ctx.createGain();
        salidaComun.gain.value = encendido ? 0.7 : 0;
        salidaComun.connect(compresor);
      }
      if (ctx.state === 'suspended' && documento?.visibilityState !== 'hidden') {
        // `resume()` devuelve una promesa que puede rechazar (política de autoplay): se ignora a
        // propósito, el próximo gesto lo vuelve a intentar.
        void ctx.resume().catch(() => undefined);
      }
    });
  }

  const alGesto = (): void => desbloquear();
  const alCambiarVisibilidad = (): void => {
    aSalvo(() => {
      if (!ctx) return;
      if (documento?.visibilityState === 'hidden') void ctx.suspend().catch(() => undefined);
      else if (encendido) void ctx.resume().catch(() => undefined);
    });
  };
  documento?.addEventListener('pointerdown', alGesto, { capture: true, passive: true });
  documento?.addEventListener('keydown', alGesto, { capture: true });
  documento?.addEventListener('visibilitychange', alCambiarVisibilidad);

  function callar(): void {
    for (const osc of agendadas) {
      try {
        osc.stop();
      } catch {
        // Ya había terminado: no hay nada que cortar.
      }
    }
    agendadas.clear();
    vivas = 0;
  }

  return {
    disponible: () => !roto,
    activo: () => encendido,
    alternar(valor) {
      encendido = valor ?? !encendido;
      try {
        almacen?.setItem(CLAVE_SONIDO, encendido ? '1' : '0');
      } catch {
        // Sin almacenamiento la preferencia dura lo que dura la pestaña, que ya es algo.
      }
      aSalvo(() => {
        if (salidaComun) salidaComun.gain.value = encendido ? 0.7 : 0;
      });
      if (!encendido) callar();
      for (const fn of oyentes) fn(encendido);
      return encendido;
    },
    desbloquear,
    efecto(efecto) {
      if (!listo()) return;
      aSalvo(() => {
        const ahora = ctx!.currentTime + 0.01;
        switch (efecto) {
          case 'toque':
            tono(660, ahora, 45, 'sine', 0.05);
            break;
          case 'titulo':
            // La menor, como la intro: el mismo mundo suena igual en todas sus puertas.
            tono(220, ahora, 1400, 'sine', 0.05);
            tono(329.6, ahora + 0.09, 1300, 'sine', 0.04);
            tono(440, ahora + 0.18, 1200, 'sine', 0.025);
            break;
          case 'beat':
            tono(174.6, ahora, 260, 'triangle', 0.05);
            break;
          case 'transmision':
            for (let i = 0; i < 3; i++) tono(880, ahora + i * 0.11, 55, 'square', 0.018);
            break;
          case 'cierre':
            tono(440, ahora, 220, 'sine', 0.05);
            tono(329.6, ahora + 0.16, 420, 'sine', 0.045);
            break;
        }
      });
    },
    hablar(quien, texto, ventanaMs) {
      if (!listo()) return;
      aSalvo(() => {
        const perfil = PERFILES[quien];
        const ahora = ctx!.currentTime + 0.02;
        for (const b of planDeBlips(texto, ventanaMs, perfil)) {
          tono(b.hz, ahora + b.t / 1000, b.ms, perfil.onda, perfil.volumen);
        }
      });
    },
    callar,
    salida: () => (listo() && ctx && salidaComun ? { ctx, salida: salidaComun } : null),
    alCambiar(fn) {
      oyentes.add(fn);
      return () => oyentes.delete(fn);
    },
    destruir() {
      callar();
      oyentes.clear();
      documento?.removeEventListener('pointerdown', alGesto, { capture: true });
      documento?.removeEventListener('keydown', alGesto, { capture: true });
      documento?.removeEventListener('visibilitychange', alCambiarVisibilidad);
      aSalvo(() => void ctx?.close().catch(() => undefined));
      ctx = null;
      salidaComun = null;
    },
  };
}

let compartido: Sonido | null = null;

/**
 * El director de sonido de la app: uno solo, compartido por la intro, el prólogo, las cinemáticas
 * y el Estudio. Se crea recién cuando alguien lo pide, así una pantalla que no suena no paga nada.
 */
export function sonido(): Sonido {
  compartido ??= crearSonido({
    almacen: almacenSiSePuede(),
    documento: typeof document === 'undefined' ? null : document,
  });
  return compartido;
}

/** Con el almacenamiento bloqueado, hasta leer la propiedad `localStorage` tira. */
function almacenSiSePuede(): Storage | null {
  try {
    return typeof localStorage === 'undefined' ? null : localStorage;
  } catch {
    return null;
  }
}
