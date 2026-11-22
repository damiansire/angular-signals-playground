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
export const LLAMADO = 'Haz click en cualquier lado para continuar';
/** Lo mismo en una pantalla táctil, donde no hay click ni cursor: se toca. */
export const LLAMADO_TACTIL = 'Toca en cualquier lado para continuar';

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

// ─── The fall: Angie turns into light, crosses space and lands on the hill ────────────────────

/*
 * After the touch Angie squashes, jumps and bursts into a pink star. The camera tilts up after it,
 * the notice's night slides away and space opens with Angie's little planet far off. The star arcs
 * down onto it while the camera dives to the top of the planet, through its clouds; under them the
 * hill appears, at night, and the star lands on the stone. There Angie comes back and the sun rises
 * (the hill does that part: `aterrizar` in `inicio-angie.ts`). It is her arrival in Signal Space,
 * long before the crew: the start of the wait on the hill.
 *
 * The hill is never scaled: it appears at its real size under the clouds. Only the planet is, and
 * it is a small SVG redrawn every frame, so no layer ever grows past the screen.
 */

/** Moments of the fall, in ms from its start (the end of the sound test, or the touch without it). */
export const SE_VUELVE_LUZ_MS = 600;
/** The hill is drawn again under the notice a moment before the far layers start to fade. */
export const LA_COLINA_APARECE_MS = 3700;
export const SE_VA_LO_LEJANO_DESDE_MS = 3900;
export const SE_VA_LO_LEJANO_HASTA_MS = 4200;
/** The star touches the stone. */
export const CHOQUE_MS = 4300;
/**
 * The longest step of the clock from one frame to the next. A longer hitch is not skipped: the fall
 * goes on where it was. At 20 frames per second it still goes at its pace.
 */
export const TIRON_MS = 50;

/** The radius of the star's light, before its scale: the hill's light on the stone starts at it. */
export const RADIO_DE_LA_LUZ = 70;

/** How many lights trail behind the star. */
export const LARGO_DE_LA_COLA = 18;

/** The planet, in its own units: radius 300, and the hill on top up to 335. */
export const RADIO_DEL_PLANETA = 300;
/**
 * Where the stone's drawing (the hill's, 1080 × 1080) sits on the planet: its base on the hill. At
 * the end of the dive this box lands exactly on the hill's stone.
 */
export const CAJA_DE_LA_PIEDRA = { x: -39.3, y: -402.8, lado: 78.6 } as const;
/** Base of the stone in its drawing: the shadow's ellipse, at 1000 of 1080. */
export const BASE_DE_LA_PIEDRA = 1000 / 1080;
const SUELO_DE_LA_PIEDRA = CAJA_DE_LA_PIEDRA.y + BASE_DE_LA_PIEDRA * CAJA_DE_LA_PIEDRA.lado;

export interface PuntoDelAviso {
  readonly x: number;
  readonly y: number;
}

/** What the fall measures before starting, in px of the notice. */
export interface EscenarioDeLaCaida {
  readonly ancho: number;
  readonly alto: number;
  /** Middle of the notice's Angie. */
  readonly angie: PuntoDelAviso;
  /** The hill's stone: the middle of its base and the width of its box. */
  readonly piedra: PuntoDelAviso & { readonly ancho: number };
}

export interface Circulo extends PuntoDelAviso {
  readonly r: number;
  readonly opacidad: number;
}

export interface CuadroDeLaCaida {
  /** The title and the call under it. */
  readonly texto: { readonly opacidad: number; readonly dy: number };
  /** The notice's Angie: squash, jump, burst. Scale around her feet. */
  readonly angie: {
    readonly dy: number;
    readonly sx: number;
    readonly sy: number;
    readonly brillo: number;
    readonly opacidad: number;
  };
  /** The notice's night (sky, stars, hills), sliding down as the camera tilts up after the star. */
  readonly noche: { readonly dy: number; readonly opacidad: number };
  /** Space behind the planet. */
  readonly espacio: number;
  /** Space, planet and atmosphere together: they fade to leave the hill. */
  readonly lejos: number;
  /** The planet: its centre on screen, its scale and the angle of its night side. */
  readonly planeta: {
    readonly x: number;
    readonly y: number;
    readonly k: number;
    readonly opacidad: number;
    readonly sombra: number;
  };
  readonly solLejano: PuntoDelAviso & { readonly escala: number; readonly opacidad: number };
  readonly estrella: PuntoDelAviso & {
    readonly escala: number;
    readonly opacidad: number;
    readonly giro: number;
  };
  /** The tail, from the star backwards. */
  readonly cola: readonly Circulo[];
  /** The light she turns into. */
  readonly destello: Circulo;
  /** The light on the stone. */
  readonly atmosfera: number;
  /** The clouds the camera crosses before the hill. */
  readonly nubes: readonly (PuntoDelAviso & {
    readonly escala: number;
    readonly opacidad: number;
  })[];
}

const entre01 = (v: number): number => Math.min(1, Math.max(0, v));
const tramo = (t: number, a: number, b: number): number => entre01((t - a) / (b - a));
const suave = (v: number): number => 0.5 - 0.5 * Math.cos(Math.PI * v);
const acelera = (v: number): number => v * v;
const frena = (v: number): number => 1 - (1 - v) * (1 - v);
const entre = (a: number, b: number, v: number): number => a + (b - a) * v;
/** Even in scale: equal stretches of time multiply the scale by the same. */
const enEscala = (a: number, b: number, v: number): number => a * (b / a) ** v;
const curva = (
  p0: PuntoDelAviso,
  p1: PuntoDelAviso,
  p2: PuntoDelAviso,
  u: number,
): PuntoDelAviso => ({
  x: (1 - u) ** 2 * p0.x + 2 * (1 - u) * u * p1.x + u * u * p2.x,
  y: (1 - u) ** 2 * p0.y + 2 * (1 - u) * u * p1.y + u * u * p2.y,
});
/** How big the screen is, against 1920 × 1080: the light, its tail and the clouds go with it. */
const tamano = (e: EscenarioDeLaCaida): number => Math.sqrt((e.ancho * e.alto) / (1920 * 1080));

/** The camera dives from `BUSCA_DESDE_MS` to the crash. */
const BUSCA_DESDE_MS = 1100;

/**
 * Where the camera puts the planet. It aims at the top of the planet (where the stone is) and gets
 * closer evenly in scale, so the far planet and the near hill last about the same; at the crash the
 * stone's box is exactly where the hill's stone is.
 */
export function camaraDelPlaneta(
  t: number,
  e: EscenarioDeLaCaida,
): { x: number; y: number; k: number } {
  const p = tramo(t, BUSCA_DESDE_MS, CHOQUE_MS);
  const lejos = Math.min(Math.max(0.06 * e.alto, 36), 0.16 * e.ancho);
  const k = enEscala(
    lejos / RADIO_DEL_PLANETA,
    e.piedra.ancho / CAJA_DE_LA_PIEDRA.lado,
    0.35 * p + 0.65 * suave(p),
  );
  const cima = {
    x: entre(0.4 * e.ancho, e.piedra.x, suave(p)),
    y: entre(0.61 * e.alto, e.piedra.y, suave(p)),
  };
  return { x: cima.x, y: cima.y - SUELO_DE_LA_PIEDRA * k, k };
}

/** Where the star is at `t`: it rises from Angie, hangs a moment and falls onto the stone. */
export function dondeVaLaEstrella(t: number, e: EscenarioDeLaCaida): PuntoDelAviso {
  const nace = { x: e.angie.x, y: e.angie.y - 0.11 * e.alto };
  const arriba = { x: 0.68 * e.ancho, y: 0.16 * e.alto };
  if (t < 1700) {
    return curva(nace, { x: 0.58 * e.ancho, y: 0.13 * e.alto }, arriba, frena(tramo(t, 600, 1700)));
  }
  const c = camaraDelPlaneta(t, e);
  // Toward the middle of the stone, which moves as the camera gets closer.
  const piedra = { x: c.x, y: c.y + (SUELO_DE_LA_PIEDRA - 34) * c.k };
  const u = tramo(t, 1700, CHOQUE_MS);
  return curva(
    arriba,
    { x: 0.74 * e.ancho, y: 0.48 * e.alto },
    piedra,
    0.5 * acelera(u) + 0.5 * suave(u),
  );
}

/** The clouds the camera goes through, against the middle of the screen, and their size. */
export const NUBES_DEL_PASO = [
  [-520, -160, 1.3],
  [480, -60, 1.6],
  [-300, 260, 1.8],
  [340, 300, 1.4],
  [40, -320, 1.2],
] as const;
const NUBES_DESDE_MS = 3450;
const NUBES_HASTA_MS = 4350;

export function cuadroDeLaCaida(t: number, e: EscenarioDeLaCaida): CuadroDeLaCaida {
  const tam = tamano(e);
  const fuera = tramo(t, 0, 350);

  // Angie: squashes on her feet, jumps, and bursts into light at the top of the jump.
  const aplasta = suave(tramo(t, 0, 250));
  const salto = frena(tramo(t, 250, 600));
  const estira = t > 250 ? 1 + 0.1 * Math.sin(Math.PI * tramo(t, 250, 600)) : 1;
  const nace = acelera(tramo(t, 520, 700));
  const angie = {
    dy: -0.13 * e.alto * salto,
    sx: ((1 + 0.08 * aplasta) * (1 - nace)) / estira,
    sy: (1 - 0.13 * aplasta) * estira * (1 - nace),
    brillo: 1 + 2.5 * tramo(t, 420, 680),
    opacidad: 1 - tramo(t, 640, 720),
  };
  const centroDelDestello = { x: e.angie.x, y: e.angie.y - 0.11 * e.alto };
  const d = tramo(t, 560, 950);
  const destello = {
    ...centroDelDestello,
    r: (40 + 260 * frena(d)) * tam,
    opacidad: d > 0 && d < 1 ? Math.min(1, d * 6) * (1 - d) : 0,
  };

  // The camera tilts up after the star: the notice's night slides down and space opens.
  const inclina = suave(tramo(t, 700, 2100));
  const noche = { dy: 0.88 * e.alto * inclina, opacidad: 1 - tramo(t, 1300, 2100) };

  const c = camaraDelPlaneta(t, e);
  const p = tramo(t, BUSCA_DESDE_MS, CHOQUE_MS);
  const aparece = tramo(t, BUSCA_DESDE_MS, 1700);
  const planeta = { ...c, opacidad: aparece, sombra: entre(200, 172, p) };
  const solLejano = {
    x: 0.77 * e.ancho,
    y: 0.26 * e.alto,
    escala: (0.55 + 0.2 * p) * tam,
    opacidad: aparece * (1 - tramo(t, 3000, 3700)),
  };

  const viva = t >= SE_VUELVE_LUZ_MS && t < CHOQUE_MS + 80;
  const donde = dondeVaLaEstrella(t, e);
  const escala = (0.6 + 0.4 * tramo(t, 600, 800)) * (1 + 0.7 * tramo(t, 3300, CHOQUE_MS)) * tam;
  const estrella = {
    ...donde,
    escala,
    opacidad: viva ? 1 - tramo(t, CHOQUE_MS, CHOQUE_MS + 80) : 0,
    giro: (t * 0.12) % 360,
  };
  const cola = Array.from({ length: LARGO_DE_LA_COLA }, (_, i) => {
    const antes = t - (i + 1) * 28;
    const q = dondeVaLaEstrella(Math.max(SE_VUELVE_LUZ_MS, antes), e);
    const hay = viva && antes > SE_VUELVE_LUZ_MS;
    return {
      ...q,
      r: hay ? (12 - i * 0.6) * escala : 0,
      opacidad: (1 - i / LARGO_DE_LA_COLA) * 0.8,
    };
  });

  const nubes = NUBES_DEL_PASO.map(([x, y, s], i) => {
    const dura = (NUBES_HASTA_MS - NUBES_DESDE_MS) * 0.55;
    const desde =
      NUBES_DESDE_MS + ((NUBES_HASTA_MS - NUBES_DESDE_MS - dura) * i) / (NUBES_DEL_PASO.length - 1);
    const v = tramo(t, desde, desde + dura);
    const lejos = enEscala(0.3, 6, acelera(v));
    return {
      x: e.ancho / 2 + x * tam * lejos,
      y: e.alto / 2 + y * tam * lejos,
      escala: enEscala(0.4, 9, acelera(v)) * s * tam,
      opacidad: v <= 0 || v >= 1 ? 0 : Math.min(1, v * 5) * (1 - acelera(v)) * 0.96,
    };
  });

  return {
    texto: { opacidad: 1 - fuera, dy: 30 * fuera * tam },
    angie,
    noche,
    // Opaque before the night starts to slide: half there, the page showed through it.
    espacio: tramo(t, 300, 700),
    lejos: 1 - tramo(t, SE_VA_LO_LEJANO_DESDE_MS, SE_VA_LO_LEJANO_HASTA_MS),
    planeta,
    solLejano,
    estrella,
    cola,
    destello,
    atmosfera: 0.95 * tramo(t, 3000, 4100),
    nubes,
  };
}

// ─── Angie's little planet ───────────────────────────────────────────────────────────────────

export interface DibujoDelPlaneta {
  /** Darker meadows inside the disc. */
  readonly praderas: readonly { cx: number; cy: number; rx: number; ry: number; giro: number }[];
  readonly flores: readonly { cx: number; cy: number; r: number; color: string }[];
  /** Grass tufts around the rim: the angle and the path, drawn standing on the top. */
  readonly matas: readonly { giro: number; alto: number; d: string }[];
  readonly juncos: readonly { giro: number; d: string }[];
  /** Little clouds floating around it: angle, distance and size. */
  readonly nubes: readonly { giro: number; distancia: number; escala: number }[];
}

/** The hill on top of the planet, where the stone sits. Also cuts the planet's light. */
export const LOMA_DEL_PLANETA =
  'M-190 -288C-120 -294 -80 -335 0 -335C80 -335 120 -294 190 -288L150 -230L-150 -230Z';

const COLORES_DE_FLOR = ['#ffffff', '#ffd46a', '#ff9fcf'] as const;

/** The planet's details, with a seed: the same planet on every visit. */
export function dibujoDelPlaneta(semilla: number): DibujoDelPlaneta {
  const r = azar(semilla);
  const praderas = Array.from({ length: 7 }, () => {
    const a = r() * Math.PI * 2;
    const d = 90 + r() * 150;
    return {
      cx: +(Math.cos(a) * d).toFixed(1),
      cy: +(Math.sin(a) * d).toFixed(1),
      rx: +(40 + r() * 50).toFixed(1),
      ry: +(22 + r() * 26).toFixed(1),
      giro: +((a * 180) / Math.PI + 90).toFixed(1),
    };
  });
  const flores = Array.from({ length: 70 }, (_, i) => {
    const a = r() * Math.PI * 2;
    const d = 200 + r() * 92;
    return {
      cx: +(Math.cos(a) * d).toFixed(1),
      cy: +(Math.sin(a) * d).toFixed(1),
      r: +(2 + r() * 2.4).toFixed(1),
      color: COLORES_DE_FLOR[i % COLORES_DE_FLOR.length],
    };
  });
  const matas = Array.from({ length: 120 }, (_, i) => {
    const giro = +((i / 120) * 360 + r() * 2).toFixed(1);
    const h = 8 + r() * 9;
    // On the hill they stand higher: the hill reaches 335 around the top.
    const sobreLaLoma = Math.abs(((giro + 180) % 360) - 180) < 22;
    const f = (v: number): string => v.toFixed(1);
    return {
      giro,
      alto: sobreLaLoma ? 333 : RADIO_DEL_PLANETA - 1,
      d: `M-4 0Q-5 ${f(-h * 0.6)} -7 ${f(-h)}M0 0Q0 ${f(-h * 0.7)} 1 ${f(-h * 1.25)}M4 0Q5 ${f(-h * 0.6)} 7 ${f(-h * 0.9)}`,
    };
  });
  const juncos = [62, 118, 160, 205, 250, 300].map((giro) => ({
    giro,
    d: [0, 1, 2, 3]
      .map((j) => `M${j * 5 - 8} 0Q${j * 6 - 8} -22 ${j * 9 - 14} ${-36 - j * 6}`)
      .join(''),
  }));
  const nubes = (
    [
      [-40, 352, 1.1],
      [35, 345, 0.9],
      [100, 350, 1],
      [170, 342, 1.2],
      [235, 355, 0.85],
      [290, 347, 1],
    ] as const
  ).map(([giro, distancia, escala]) => ({ giro, distancia, escala }));
  return { praderas, flores, matas, juncos, nubes };
}
