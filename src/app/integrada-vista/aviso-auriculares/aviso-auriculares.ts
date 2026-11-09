import type { SalidaDeAudio } from '../../libs/sonido';
import { azar } from '../inicio-angie';

/**
 * La prueba de auriculares que suena al activar el sonido: una cajita de música primero en el oído
 * izquierdo, después en el derecho y al final en los dos. Con auriculares se oye moverse de lado a
 * lado, y eso es lo que dice que están bien puestos; el dibujo enciende cada copa cuando le toca.
 */

export type Lado = 'izquierda' | 'derecha' | 'ambos';

export interface NotaDePrueba {
  /** Desde el toque, en segundos. */
  readonly t: number;
  readonly hz: number;
  readonly lado: Lado;
  /** Cuánto tarda en apagarse, en segundos. */
  readonly dura: number;
  readonly volumen: number;
}

/** No del todo a un lado: el 100% en un solo oído se siente como un auricular roto. */
export const PANEO: Readonly<Record<Lado, number>> = { izquierda: -0.85, derecha: 0.85, ambos: 0 };

/** Re mayor: re y la a la izquierda, mi y si a la derecha, y el acorde entero en el medio. */
export function planDeLaPrueba(): readonly NotaDePrueba[] {
  const caja = (t: number, hz: number, lado: Lado, volumen = 0.07): NotaDePrueba => ({
    t,
    hz,
    lado,
    dura: 1.4,
    volumen,
  });
  return [
    caja(0, 587.33, 'izquierda'),
    caja(0.14, 880, 'izquierda'),
    caja(0.46, 659.25, 'derecha'),
    caja(0.6, 987.77, 'derecha'),
    // El acorde se arpegia: cuatro notas juntas en el mismo instante suenan a golpe, no a cajita.
    caja(0.98, 587.33, 'ambos', 0.05),
    caja(1.04, 739.99, 'ambos', 0.05),
    caja(1.1, 880, 'ambos', 0.05),
    caja(1.16, 1174.66, 'ambos', 0.05),
  ];
}

/** Cuándo empieza a sonar cada lado: el dibujo enciende esa copa en ese momento. */
export function cuandoSuena(plan: readonly NotaDePrueba[], lado: Lado): number {
  const primera = plan.find((n) => n.lado === lado);
  if (!primera) throw new Error(`prueba de auriculares: no suena nada del lado ${lado}`);
  return primera.t;
}

/** El telón sube con la última nota todavía sonando: esperar el silencio se sentía lento. */
export function cuandoSeAbre(plan: readonly NotaDePrueba[]): number {
  return Math.max(...plan.map((n) => n.t)) + 0.3;
}

/** Agenda la prueba en la salida común. Sin audio, o con un navegador sin paneo, no tira. */
export function tocarPrueba(salida: SalidaDeAudio, plan: readonly NotaDePrueba[]): void {
  const { ctx } = salida;
  try {
    const cero = ctx.currentTime + 0.02;
    for (const n of plan) {
      const desde = cero + n.t;
      const fin = desde + n.dura;
      const env = ctx.createGain();
      env.gain.setValueAtTime(0, desde);
      env.gain.linearRampToValueAtTime(n.volumen, desde + 0.006);
      env.gain.exponentialRampToValueAtTime(0.0001, fin);
      if (typeof ctx.createStereoPanner === 'function') {
        const paneo = ctx.createStereoPanner();
        paneo.pan.value = PANEO[n.lado];
        env.connect(paneo).connect(salida.salida);
      } else {
        env.connect(salida.salida);
      }
      // Los armónicos, como la cajita de la despedida: así las dos músicas son del mismo mundo.
      for (const [mul, amp] of [
        [1, 1],
        [2, 0.35],
        [3, 0.12],
      ] as const) {
        const osc = ctx.createOscillator();
        osc.frequency.value = n.hz * mul;
        const g = ctx.createGain();
        g.gain.value = amp;
        osc.connect(g).connect(env);
        osc.start(desde);
        osc.stop(fin + 0.05);
      }
    }
  } catch {
    // Sin audio la cortina sube igual, en silencio.
  }
}

export interface EstrellaDelAlba {
  readonly x: number;
  readonly y: number;
  readonly r: number;
  /** Desfase del titileo, en segundos: todas a la vez se leían como un cartel encendiéndose. */
  readonly retraso: number;
}

/**
 * Las estrellas de antes del amanecer, en el dibujo de 1920 × 1080. Solo en la mitad de arriba: abajo
 * ya clarea.
 */
export function estrellasDelAlba(semilla: number, cantidad: number): EstrellaDelAlba[] {
  const r = azar(semilla);
  return Array.from({ length: cantidad }, () => ({
    x: Math.round(r() * 1920),
    y: Math.round(r() * r() * 600),
    r: +(1 + r() * 2.2).toFixed(1),
    retraso: +(r() * 4).toFixed(2),
  }));
}

/** Lo que invita a seguir: no es un botón a la vista, es la frase que dice que se toca en cualquier lado. */
export const LLAMADO = 'Hacé click en cualquier lado para continuar';
/** Lo mismo en una pantalla táctil, donde no hay click ni cursor: se toca. */
export const LLAMADO_TACTIL = 'Tocá en cualquier lado para continuar';

export interface LetraDelLlamado {
  readonly c: string;
  /** Su lugar en la frase entera: la ola la recorre de punta a punta, sin reiniciar en cada palabra. */
  readonly i: number;
}

/** La frase en palabras y letras, para que una ola la recorra. Las palabras no se cortan al bajar de renglón. */
export function letrasDelLlamado(frase: string): LetraDelLlamado[][] {
  let i = 0;
  return frase
    .split(' ')
    .filter(Boolean)
    .map((palabra) => [...palabra].map((c) => ({ c, i: i++ })));
}

/**
 * La bocanada (ver el CSS del componente) es un círculo blando centrado en la boca de Angie, que
 * crece con `--aa-aire`: con aire `a` tapa del todo hasta `NUCLEO * a` y se desvanece hasta `a`. Un
 * círculo que se cierra en la boca es el final de dibujo animado; las nubes oscuras que tenía antes
 * se leían como el humo de una explosión.
 */
export const NUCLEO = 0.86;

/** El aire con el que la bocanada tapa el aviso entero: arranca sin que se note el recorte. */
export function aireQueCubre(x: number, y: number, ancho: number, alto: number): number {
  return (1.02 * Math.hypot(Math.max(x, ancho - x), Math.max(y, alto - y))) / NUCLEO;
}

/** El aire más grande con el que la bocanada queda adentro del aviso, sin tocar sus bordes. */
export function aireQueCabe(x: number, y: number, ancho: number, alto: number): number {
  return 0.95 * Math.min(x, ancho - x, y, alto - y);
}

// ─── El viaje de la cámara, de la boca a la colina ─────────────────────────────────────────────

/**
 * Los tres tramos del viaje, en ms. Primero la bocanada: el aviso se cierra en un circulito delante
 * de la boca de Angie, que se ve enorme detrás. Después la cámara se aleja, de la boca a la cara, a
 * Angie en la piedra y a la colina entera. Al final el circulito entra y la boca se cierra.
 */
export const BOCANADA_MS = 1300;
export const ALEJARSE_MS = 4200;
export const TRAGA_MS = 450;
export const VIAJE_MS = BOCANADA_MS + ALEJARSE_MS + TRAGA_MS;

/** Hasta acá de la bocanada el aviso sigue del tamaño de la pantalla: el círculo se cierra adentro. */
const ENCAJA = 0.45;
/**
 * Cuánto se achica el aviso: se va lejos, a un puntito, y la pantalla queda toda del color de la
 * boca abierta. Con más, quedaba un círculo grande y no se leía que se iba.
 */
export const CHICO = 0.07;
/**
 * Cuánto se resiste el circulito a achicarse con el mundo (de 0 a 1): con 0 se perdía en un píxel
 * antes de ver la cara; con esto llega a la colina como un punto que todavía se ve.
 */
const PERSISTE = 0.25;

/** Lo que muestra la cámara en un instante del viaje. */
export interface CuadroDelViaje {
  /** La escala de la colina, con la boca como punto fijo: de `profundidad` a 1. */
  readonly colina: number;
  /** La escala del aviso dentro de la colina (su escala en pantalla es `colina * aviso`). */
  readonly aviso: number;
  /** El radio de la bocanada, en px del aviso. */
  readonly aire: number;
  /** La boca de Angie, abierta hasta que el circulito llega. */
  readonly bocaAbierta: boolean;
}

/** Entra y sale suave: la cámara no arranca ni frena de golpe. */
const suave = (v: number): number => 0.5 - 0.5 * Math.cos(Math.PI * v);
const entre01 = (v: number): number => Math.min(1, Math.max(0, v));

/**
 * El cuadro del viaje en el ms `t`. Como en Powers of Ten, la cámara se aleja en escala: cada tramo
 * de tiempo divide la escala por lo mismo, así la boca, la cara, Angie y la colina duran parecido. En
 * línea recta, la boca pasaba en un parpadeo y la colina se arrastraba.
 *
 * `profundidad` es de qué tan cerca arranca la colina; `cubre` y `cabe`, el aire que tapa el aviso
 * entero y el que entra justo adentro (`aireQueCubre`, `aireQueCabe`).
 */
export function cuadroDelViaje(
  t: number,
  profundidad: number,
  cubre: number,
  cabe: number,
): CuadroDelViaje {
  const S0 = profundidad;
  if (t < BOCANADA_MS) {
    const u = entre01(t / BOCANADA_MS);
    if (u < ENCAJA) {
      // Parejo en escala: en línea recta casi todo el tramo pasaba con la pantalla tapada.
      return {
        colina: S0,
        aviso: 1 / S0,
        aire: cubre * (cabe / cubre) ** (u / ENCAJA),
        bocaAbierta: true,
      };
    }
    const v = suave((u - ENCAJA) / (1 - ENCAJA));
    return { colina: S0, aviso: CHICO ** v / S0, aire: cabe, bocaAbierta: true };
  }
  if (t < BOCANADA_MS + ALEJARSE_MS) {
    const v = entre01((t - BOCANADA_MS) / ALEJARSE_MS);
    // Casi todo parejo en escala, con un poco de arranque y llegada suaves.
    const p = 0.55 * v + 0.45 * suave(v);
    const colina = S0 ** (1 - p);
    return {
      colina,
      aviso: (CHICO * (colina / S0) ** PERSISTE) / colina,
      aire: cabe,
      bocaAbierta: true,
    };
  }
  const w = entre01((t - BOCANADA_MS - ALEJARSE_MS) / TRAGA_MS);
  // El circulito entra en la boca: se achica acelerando, como algo que se traga.
  const llegada = CHICO * S0 ** -PERSISTE;
  return { colina: 1, aviso: llegada * (1 - w * w), aire: cabe, bocaAbierta: w < 0.7 };
}

/**
 * De qué tan cerca arranca la colina: desde ADENTRO de la boca abierta, con toda la pantalla de su
 * color. `boca` es el tamaño de la "o" en su propio dibujo; `dx` y `dy`, una esquina de la pantalla
 * vista desde su centro, en ese mismo dibujo. La esquina tiene que caer adentro de la boca, que es
 * casi una elipse: con la boca en media pantalla, se veía la cara desde el primer cuadro y no había
 * adentro. Con margen y con tope, que de más no muestra nada distinto.
 */
export function profundidadDelViaje(
  boca: { readonly ancho: number; readonly alto: number },
  dx: number,
  dy: number,
): number {
  const a = Math.max(boca.ancho, 1) / 2;
  const b = Math.max(boca.alto, 1) / 2;
  const s = 2 * Math.hypot(dx / a, dy / b);
  return Math.min(400, Math.max(6, s));
}

/**
 * La profundidad que deja las cuatro esquinas adentro de la "o". Va en el dibujo de la boca y no en
 * su caja de pantalla: la "o" está girada y estirada por su muelle, y medida por la caja la cámara
 * arrancaba con medio borde de la boca a la vista. `aLaBoca` es la inversa de su matriz de pantalla
 * (solo la parte lineal) y `esquinas`, cada esquina menos el centro de la boca, en píxeles.
 */
export function profundidadDesdeLaBoca(
  boca: { readonly ancho: number; readonly alto: number },
  aLaBoca: { readonly a: number; readonly b: number; readonly c: number; readonly d: number },
  esquinas: readonly (readonly [number, number])[],
): number {
  const { a, b, c, d } = aLaBoca;
  return Math.max(
    ...esquinas.map(([x, y]) =>
      profundidadDelViaje(boca, Math.abs(a * x + c * y), Math.abs(b * x + d * y)),
    ),
  );
}
