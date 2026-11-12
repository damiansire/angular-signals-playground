import { bisectAngle, dotOffset } from './tusi-math';
import type { Anclajes, LineaEnReloj } from './prologo-guion';

/**
 * Dónde está cada cosa del prólogo en cada instante, como funciones puras de `t`. Es la mitad del
 * motor que no toca el DOM: el SVG de `prologo-anomalia.ts` solo copia estos números a atributos.
 * Puro significa que saltar a cualquier momento da lo mismo que reproducir hasta ahí, y que la
 * coreografía se puede verificar sin navegador (las naves entran en la luz, la exploradora nunca,
 * la bola pasa por donde están, el patrón final es el par de Tusi exacto).
 *
 * Coordenadas del `viewBox`: 1600 × 900, el centro es la anomalía.
 */

export const ANCHO = 1600;
export const ALTO = 900;
export const CX = ANCHO / 2;
export const CY = ALTO / 2;

export interface Punto {
  readonly x: number;
  readonly y: number;
}

export const clamp01 = (v: number): number => Math.max(0, Math.min(1, v));

/**
 * El tamaño de una letra dibujada en la escena, en unidades del `viewBox`, con un piso en píxeles
 * de pantalla. La escena entra entera con `meet`: en un celular vertical cada unidad mide un cuarto
 * de píxel, y los rótulos de los operadores quedaban de 5 px, ilegibles. `k` es píxeles por unidad.
 */
export const letraConPiso = (unidades: number, pisoPx: number, k: number): number =>
  k > 0 ? Math.max(unidades, pisoPx / k) : unidades;

/**
 * Con movimiento reducido el reloj del prólogo no corre: salta a la próxima parada que falta jugar
 * (el minijuego, el manual, el árbol) y, sin ninguna, al final. Una parada ya pasada no vuelve.
 */
export const saltoQuieto = (t: number, pendientes: readonly number[], fin: number): number =>
  Math.min(fin, ...pendientes.filter((p) => p >= t));

/** Lo más angosto que se recorta la escena en vertical: con menos, una nave de costado ya no entra. */
export const ANCHO_VERTICAL = 900;
/** El aire que la cámara deja alrededor de los personajes, en unidades del `viewBox`. */
const AIRE_DE_CAMARA = 170;

/**
 * Qué franja horizontal de la escena se ve. Apaisada, la escena entera: es como se compuso. En una
 * pantalla vertical la escena entera quedaba en una franja de 220 px de alto en un celular; ahí la
 * cámara toma toda la altura y solo el ancho que piden los personajes en pantalla, entre
 * `ANCHO_VERTICAL` y `ANCHO`, sin salirse del cuadro compuesto.
 */
export function encuadreVertical(
  actores: readonly Punto[],
  aspecto: number,
): { readonly x: number; readonly ancho: number } {
  if (aspecto >= 1 || actores.length === 0) {
    return aspecto >= 1
      ? { x: 0, ancho: ANCHO }
      : { x: CX - ANCHO_VERTICAL / 2, ancho: ANCHO_VERTICAL };
  }
  const xs = actores.map((p) => p.x);
  const desde = Math.min(...xs) - AIRE_DE_CAMARA;
  const hasta = Math.max(...xs) + AIRE_DE_CAMARA;
  const ancho = Math.min(ANCHO, Math.max(ANCHO_VERTICAL, hasta - desde));
  const x = Math.min(ANCHO - ancho, Math.max(0, (desde + hasta) / 2 - ancho / 2));
  return { x, ancho };
}

export const suave = (v: number): number => (v < 0.5 ? 2 * v * v : 1 - Math.pow(-2 * v + 2, 2) / 2);
/** La entrada con rebote de la skill (`back.out`), para lo que tiene que caer con peso. */
export const conRebote = (v: number, s = 1.9): number => {
  const p = clamp01(v) - 1;
  return 1 + (s + 1) * p * p * p + s * p * p;
};

export interface Tramo {
  readonly t0: number;
  readonly t1: number;
}

/** Los momentos que el dibujo acompaña, atados a la línea que los dispara y no a un segundo. */
export interface Momentos {
  readonly familia: Tramo;
  readonly helado: Tramo;
  readonly unas: Tramo;
  /** La exploradora vuelve a buscarlos dando una vuelta: el remate de "apúrense". */
  readonly vuelta: Tramo;
  readonly aguafiestas: Tramo;
  readonly sinControl: Tramo;
  readonly rxjs: number;
  readonly pipes: number;
  /** El fin de "¡Rápido, el manual de a bordo!": ahí se abre el manual, con la orden ya leída. */
  readonly manual: number;
  /** El fin de "Miren el árbol.": Angie muestra Signal Space, con la pregunta del viaje ya hecha. */
  readonly arbol: number;
  /** Los tres tirones del capitán: cada línea es un tirón más fuerte hacia el centro. */
  readonly tirones: readonly number[];
  readonly bala: Tramo;
  readonly lanza: number;
  readonly frena: number;
  readonly voz: number;
  readonly tirados: Tramo;
  readonly listos: Tramo;
}

export function momentosDe(reloj: readonly LineaEnReloj[]): Momentos {
  const en = (id: string): LineaEnReloj => {
    const l = reloj.find((x) => x.id === id);
    if (!l) throw new Error(`prologo-escena: falta la línea "${id}"`);
    return l;
  };
  const tramo = (id: string): Tramo => ({ t0: en(id).t0, t1: en(id).t1 });
  const apuren = en('casa-apuren');
  return {
    familia: tramo('casa-familia'),
    helado: tramo('casa-helado'),
    unas: tramo('casa-unas'),
    vuelta: { t0: apuren.t0, t1: apuren.t0 + 1900 },
    aguafiestas: tramo('linea-msxheigk'),
    sinControl: tramo('anom-sin-control'),
    rxjs: en('anom-rxjs').t0 + 400,
    pipes: en('anom-pipes').t0 + 300,
    manual: en('anom-manual').t1,
    arbol: en('leccion-arbol').t1,
    tirones: ['anom-fuerza', 'anom-velocidad', 'anom-leyes'].map((id) => en(id).t0),
    bala: { t0: en('dentro-cuidado').t0 - 300, t1: en('dentro-cuidado').t0 + 1300 },
    lanza: en('dentro-escapemos').t0,
    frena: en('dentro-esquivar').t0,
    voz: en('voz-supongo').t0,
    tirados: tramo('leccion-tirados'),
    listos: tramo('leccion-listos'),
  };
}

/* ── la formación, afuera ───────────────────────────────────────────────────────────────────── */

export interface Formacion {
  readonly x: number;
  readonly y: number;
  readonly s: number;
  readonly a: number;
  /** Cuánto la tira la anomalía (0 a 1): estira las naves y les abre los ojos. */
  readonly arrastre: number;
  /** Amplitud del temblor, en unidades del viewBox. El motor la convierte en sacudida. */
  readonly sacude: number;
}

/** Cuña: el capitán adelante, las dos escoltas atrás. `bob` es el desfase de su respiración. */
export const FORMACION = [
  { dx: 0, dy: 0, bob: 0 },
  { dx: -170, dy: -96, bob: 1.9 },
  { dx: -170, dy: 96, bob: 3.7 },
] as const;

/**
 * Dónde va la formación antes del salto, sin el temblor (que va aparte para que esto siga siendo
 * comparable entre cuadros). Crucero sin apuro, y después el arrastre hacia el centro, cada vez más
 * rápido y más chico: "no responden a tiempo" visto de afuera.
 */
export function formacionAfuera(t: number, T: Anclajes): Formacion {
  let x: number, y: number, s: number;
  let arrastre = 0;
  if (t < T.anomalia) {
    const p = clamp01(t / T.anomalia);
    x = ANCHO * (0.17 + p * 0.13);
    y = ALTO * (0.46 - p * 0.04);
    s = 1;
  } else {
    const p = Math.pow(clamp01((t - T.anomalia) / (T.zoom - T.anomalia)), 1.9);
    const x0 = ANCHO * 0.3,
      y0 = ALTO * 0.42;
    x = x0 + (CX - x0) * p;
    y = y0 + (CY - y0) * p;
    s = 1 - p * 0.9;
    arrastre = p;
  }
  // Se siente antes de que alguien pregunte: el temblor arranca en `temblor` y crece con el tirón.
  const tiembla = clamp01((t - T.temblor) / 1800);
  return {
    x,
    y,
    s,
    a: 1 - clamp01((t - (T.zoom - 500)) / 500),
    arrastre,
    sacude: tiembla * 4 + arrastre * 18,
  };
}

/** Temblor determinista: la misma sacudida para el mismo instante. */
export function temblor(t: number, amplitud: number, fase = 0): Punto {
  return {
    x: (Math.sin(t * 0.021 + fase) + Math.sin(t * 0.047 + fase * 2) * 0.4) * amplitud,
    y: (Math.cos(t * 0.017 + fase) + Math.cos(t * 0.039 + fase * 3) * 0.4) * amplitud,
  };
}

/**
 * La exploradora: adelante, impaciente, y la única que la anomalía no agarra. Cuando dice
 * "apúrense" se vuelve a buscarlos dando una vuelta (y el viento de esa vuelta les revienta el
 * globo del helado). Después del tirón sigue de largo hacia arriba: queda afuera, mirando.
 */
export function exploradora(
  t: number,
  T: Anclajes,
  M: Momentos,
): Punto & { a: number; vaiven: number } {
  const p = clamp01(t / T.anomalia);
  const escapa = suave(clamp01((t - T.anomalia) / 9000));
  let x = ANCHO * (0.42 + p * 0.16 + escapa * 0.2);
  let y = ALTO * (0.33 - p * 0.05 - escapa * 0.1);
  // Impaciente: adelanta y frena. Es lo único que la mueve, porque a ella no la tira nada.
  // Va aparte (`vaiven`) para que el rumbo no lo cuente: con él, la nariz se espejaba ida y vuelta.
  const vaiven = Math.sin(t * 0.0016) * 18;
  x += vaiven;
  const q = clamp01((t - M.vuelta.t0) / (M.vuelta.t1 - M.vuelta.t0));
  if (q > 0 && q < 1) {
    x -= Math.sin(Math.PI * q) * 330;
    // Baja recién lejos del centro: bajando enseguida pasaba rozando la anomalía.
    y += Math.pow(Math.sin(Math.PI * q), 2) * 90;
  }
  return { x, y, a: 1 - clamp01((t - T.zoom) / 400), vaiven };
}

/* ── la anomalía y la cámara ────────────────────────────────────────────────────────────────── */

/** Cuánto creció la anomalía: un punto entre las estrellas al principio, la pantalla entera al final. */
export function crecimiento(t: number, T: Anclajes): number {
  const acerca = clamp01((t - T.anomalia) / (T.zoom - T.anomalia));
  const traga = clamp01((t - (T.zoom - 300)) / 700);
  return 0.16 + acerca * 0.84 + Math.pow(traga, 2) * 9;
}

/** El salto: las estrellas se estiran en el instante en que las naves entran en la luz. */
export function warp(t: number, T: Anclajes): number {
  return clamp01(1 - Math.abs(t - (T.zoom + 250)) / 850);
}

/** Cuánto se ve el interior: entra detrás del destello del salto. */
export function adentro(t: number, T: Anclajes): number {
  return clamp01((t - (T.zoom + 150)) / 700);
}

/** El final se aclara: el caos era un problema de distancia, y de lejos es una figura sobre papel. */
export function claridad(t: number, T: Anclajes): number {
  return clamp01((t - T.orden) / 3400);
}

/**
 * La distancia al patrón. De cerca, bolas que se cruzan; de lejos, una figura. Termina en 0,88 y no
 * en 1: a escala completa el círculo de abajo se metía en el título.
 */
export const CERCA = 2.8;
export function zoom(t: number, T: Anclajes): number {
  if (t < T.zoom) return 0.05 + clamp01((t - T.anomalia) / (T.zoom - T.anomalia)) * 0.13;
  if (t < T.orden) return 0.16 + suave(clamp01((t - T.zoom) / 2200)) * (CERCA - 0.16);
  return CERCA - suave(clamp01((t - T.orden) / 3200)) * (CERCA - 0.88);
}

/* ── el patrón ──────────────────────────────────────────────────────────────────────────────── */

export const CUERDAS = 12;
export const ANGULOS = Array.from({ length: CUERDAS }, (_, k) => bisectAngle(k));
/**
 * Desfase y velocidad propios de cada cuerda: el caos. En el par de Tusi el círculo aparece PORQUE
 * los movimientos están sincronizados; cada punto a su ritmo es solo bolas cruzándose.
 */
const DESFASE = [0, 2.31, 4.87, 1.06, 5.42, 3.19, 0.74, 2.95, 4.13, 1.72, 3.86, 5.09];
const VELOCIDAD = [1, 1.47, 0.72, 1.83, 0.61, 1.29, 1.68, 0.86, 1.12, 1.05, 0.79, 1.55];

/** Radio del patrón a escala 1. */
export const RADIO = 336;

export interface Fusion {
  /** Cuánto se juntaron las bolas en sus dos nubes. */
  readonly p: number;
  /** 1 hasta el choque; después las bolas quedaron absorbidas en la mascota. */
  readonly vivo: number;
  readonly a: Punto;
  readonly b: Punto;
}

/**
 * Las bolas se juntan en dos nubes por debajo de la voz, tan lento que casi no se nota que empezó;
 * el último tramo (el acercamiento) cuelga del choque, así un reclamo más largo hace esperar a las
 * moléculas formadas en vez de estirar la nucleación.
 */
export function fusionEn(t: number, T: Anclajes): Fusion | null {
  if (t < T.fusion || t >= T.orden) return null;
  const ACERCA = 1400;
  const reunion = Math.min(15000, Math.max(2000, T.choque - ACERCA - T.fusion));
  const p = Math.pow(clamp01((t - T.fusion) / reunion), 0.62);
  const acerca = suave(clamp01((t - (T.choque - ACERCA)) / ACERCA));
  const sep = 240 * (1 - acerca);
  return {
    p,
    vivo: 1 - clamp01((t - T.choque) / 260),
    a: { x: CX - sep, y: CY },
    b: { x: CX + sep, y: CY },
  };
}

/** La sincronía llega DESPUÉS de que la mascota lo dice: primero la afirmación, después el mundo. */
export const sincronia = (t: number, T: Anclajes): number => clamp01((t - T.orden - 600) / 3000);
export const circulos = (t: number, T: Anclajes): number => clamp01((t - T.orden - 2600) / 2000);
/** Al final las cuerdas reaparecen de a una, dibujándose. */
export const cuerdasVisibles = (t: number, T: Anclajes): number =>
  t >= T.orden ? clamp01((t - T.orden - 300) / 3600) * CUERDAS + 0.6 : CUERDAS;

export interface Bola extends Punto {
  /** 1 para la ámbar, -1 para la verde: cada color va a su núcleo y a su círculo. */
  readonly signo: 1 | -1;
  readonly cuerda: number;
}

/**
 * Las 24 bolas. Cada cuerda a su fase propia mientras hay caos; con `sync` en 1 todas comparten la
 * misma fase y caen exactamente sobre el par de Tusi (`dotOffset`), que es lo que el final revela.
 */
export function bolas(t: number, radio: number, sync: number, fusion: Fusion | null): Bola[] {
  const base = t * 0.0011;
  const fuera: Bola[] = [];
  for (let i = 0; i < CUERDAS; i++) {
    const th = ANGULOS[i];
    const suelto = base * VELOCIDAD[i] + DESFASE[i] + Math.sin(t * 0.0021 + i * 2.7) * 0.45;
    const ph = suelto + (base - suelto) * suave(sync);
    for (const signo of [1, -1] as const) {
      const s = dotOffset(radio, ph, th) * signo;
      let x = CX + Math.cos(th) * s;
      let y = CY + Math.sin(th) * s;
      if (fusion) {
        // Los mismos puntos se van a orbitar su núcleo: no nacen átomos, se arman con lo que había.
        const nucleo = signo > 0 ? fusion.a : fusion.b;
        const giro = t * 0.004 * signo + i * 0.8;
        const r = 42 + (i % 3) * 16;
        x += (nucleo.x + Math.cos(giro) * r - x) * fusion.p;
        y += (nucleo.y + Math.sin(giro) * r * 0.4 - y) * fusion.p;
      }
      fuera.push({ x, y, signo, cuerda: i });
    }
  }
  return fuera;
}

/** La bola que dispara el grito: cruza en diagonal justo por donde derivan las naves. */
export function bala(t: number, M: Momentos): Punto | null {
  if (t < M.bala.t0 || t > M.bala.t1) return null;
  const q = (t - M.bala.t0) / (M.bala.t1 - M.bala.t0);
  return { x: ANCHO * (1.06 - q * 1.28), y: ALTO * (0.64 - q * 0.62) };
}

/* ── las naves, adentro ─────────────────────────────────────────────────────────────────────── */

/** Donde derivan al reaparecer: arriba a la izquierda, fuera del centro donde nace todo. */
export const DERIVA: Punto = { x: ANCHO * 0.24, y: ALTO * 0.26 };

/**
 * Después del choque rodean a la mascota para escucharla: dos de un lado, una del otro, mirándola.
 * `mira` es hacia dónde apunta la nariz (1 derecha, -1 izquierda).
 */
export const RONDA: readonly (Punto & { mira: 1 | -1 })[] = [
  { x: 520, y: 330, mira: 1 },
  { x: 410, y: 210, mira: 1 },
  { x: 1110, y: 270, mira: -1 },
];

export interface NaveAdentro extends Punto {
  readonly s: number;
  readonly a: number;
  readonly mira: 1 | -1;
  /** 1 mientras esquivan sueltas; 0 en ronda o saliendo. */
  readonly suelta: number;
}

/** Las naves del otro lado: reaparecen, esquivan, se lanzan y frenan, rodean a la mascota, salen. */
export function naveAdentro(i: number, t: number, T: Anclajes, M: Momentos): NaveAdentro | null {
  const reaparece = T.zoom + 900;
  if (t < reaparece) return null;
  const f = FORMACION[i];
  const e = clamp01((t - reaparece) / 700);
  let x = DERIVA.x + Math.sin(t * 0.0007) * 26 + f.dx * 1.1;
  let y = DERIVA.y + Math.sin(t * 0.0011 + 1.3) * 16 + f.dy * 1.1;
  // Se lanzan hacia adelante cuando el capitán decide escapar y frenan de golpe cuando ella dice
  // que apenas puede esquivar: el intento y el "no me pidas" son el mismo gesto.
  const lanza = suave(clamp01((t - M.lanza) / 1100));
  const frena = suave(clamp01((t - M.frena) / 500));
  x += (lanza - frena) * ANCHO * 0.19;
  y -= (lanza - frena) * ALTO * 0.05;
  const ronda = suave(clamp01((t - T.choque - 500) / 1900));
  const r = RONDA[i];
  x += (r.x - x) * ronda;
  y += (r.y - y) * ronda;
  const sale = suave(clamp01((t - T.orden) / 3200));
  x += (ANCHO * 1.08 - x) * sale;
  y += (ALTO * 0.12 - y) * sale;
  const mira: 1 | -1 = ronda > 0.5 && sale < 0.2 ? r.mira : 1;
  return {
    x,
    y,
    s: (0.76 - sale * 0.5) * e,
    a: e * (1 - clamp01((sale - 0.85) / 0.15)),
    mira,
    suelta: (1 - ronda) * (t < T.orden ? 1 : 0),
  };
}

/**
 * Esquivar de verdad: se apartan de las bolas que tienen encima con fuerza inversa a la distancia.
 * Si mañana una pasa más cerca, la maniobra cambia sola.
 */
export function esquive(p: Punto, cercanas: readonly Punto[], radio = 150): Punto {
  let ex = 0,
    ey = 0;
  for (const b of cercanas) {
    const dx = p.x - b.x,
      dy = p.y - b.y;
    const d2 = dx * dx + dy * dy;
    if (d2 < radio * radio && d2 > 4) {
      const d = Math.sqrt(d2);
      const fuerza = 1 - d / radio;
      ex += (dx / d) * fuerza;
      ey += (dy / d) * fuerza;
    }
  }
  return { x: ex * 70, y: ey * 70 };
}

/* ── los operadores ─────────────────────────────────────────────────────────────────────────── */

export interface Disparo {
  readonly nave: number;
  readonly txt: string;
  readonly d: number;
  readonly lado: 1 | -1;
}

/** Cuatro vivos como mucho, y bien separados: el nombre del operador ES el contenido del beat. */
export const OPERADORES: readonly Disparo[] = [
  { nave: 0, txt: 'switchMap', d: 0, lado: -1 },
  { nave: 1, txt: 'retry', d: 760, lado: 1 },
  { nave: 2, txt: 'mergeMap', d: 1520, lado: -1 },
  { nave: 0, txt: 'catchError', d: 2280, lado: 1 },
  { nave: 1, txt: 'concatMap', d: 3040, lado: -1 },
  { nave: 2, txt: 'takeUntil', d: 3800, lado: 1 },
  { nave: 0, txt: 'debounceTime', d: 4560, lado: -1 },
];
export const PIPES: readonly Disparo[] = [
  { nave: 1, txt: 'pipe', d: 0, lado: 1 },
  { nave: 2, txt: 'pipe', d: 620, lado: -1 },
  { nave: 0, txt: 'pipe', d: 1240, lado: 1 },
  { nave: 1, txt: 'pipe', d: 1860, lado: -1 },
  { nave: 2, txt: 'pipe', d: 2480, lado: 1 },
];
export const VUELO = 1400;

/**
 * Cuánto se ve el nombre de un disparo. Con la letra de escritorio dura casi todo el vuelo; con la
 * del piso de un celular (`agrandado`) es casi tres veces más ancha, y el "pipe" que se apagaba
 * quedaba debajo del siguiente ("pippipe"). Agrandado, se apaga antes de que salga el próximo: los
 * `pipe` salen cada 620 ms, el 44 % de un vuelo.
 */
export function opacidadDelRotulo(p: Proyectil, agrandado: boolean): number {
  const visible = clamp01(p.vida * 1.6);
  return agrandado ? Math.min(visible, clamp01((0.42 - p.p) / 0.12)) : visible;
}

export interface Proyectil extends Punto {
  readonly txt: string;
  readonly lado: 1 | -1;
  /** 0 a 1: aparece, brilla y se apaga antes de llegar. */
  readonly vida: number;
  readonly p: number;
}

/**
 * Salen del casco de su nave (la posición REAL en el instante del disparo), van derecho a la
 * anomalía abriéndose en abanico y se apagan a mitad de camino: desplegaron todo y no alcanzó.
 */
export function proyectiles(
  t: number,
  tanda: readonly Disparo[],
  desde: number,
  T: Anclajes,
): Proyectil[] {
  const fuera: Proyectil[] = [];
  for (const op of tanda) {
    const p = (t - (desde + op.d)) / VUELO;
    if (p <= 0 || p >= 1) continue;
    const cuna = formacionAfuera(desde + op.d, T);
    const f = FORMACION[op.nave];
    const ox = cuna.x + f.dx * cuna.s,
      oy = cuna.y + f.dy * cuna.s;
    const avance = suave(p) * 0.6;
    const dx = CX - ox,
      dy = CY - oy,
      d = Math.hypot(dx, dy) || 1;
    fuera.push({
      x: ox + dx * avance + (-dy / d) * op.lado * 64 * p,
      y: oy + dy * avance + (dx / d) * op.lado * 64 * p,
      txt: op.txt,
      lado: op.lado,
      vida: clamp01(p / 0.12) * clamp01((1 - p) / 0.4),
      p,
    });
  }
  return fuera;
}

/* ── la mascota ─────────────────────────────────────────────────────────────────────────────── */

/**
 * Nace del choque y sube un poco (le deja lugar al diálogo de abajo y se lee flotando); al llegar
 * el orden se corre abajo a la izquierda y le deja el centro al patrón. `escala` es la del nacimiento,
 * sin el rebote, que lo pone un muelle.
 */
export function mascota(t: number, T: Anclajes): (Punto & { escala: number; a: number }) | null {
  if (t < T.choque) return null;
  const n = clamp01((t - T.choque) / 520);
  const flota = suave(clamp01((t - T.choque - 400) / 1400)) * ALTO * 0.08;
  const respira =
    Math.sin((t - T.choque) * 0.00105) * ALTO * 0.012 * suave(clamp01((t - T.choque) / 1200));
  const va = suave(clamp01((t - T.orden) / 2600));
  return {
    x: CX - va * ANCHO * 0.33,
    y: CY - flota + respira + va * ALTO * 0.36,
    escala: (0.25 + suave(n) * 0.75) * (1 - va * 0.32),
    a: n,
  };
}
