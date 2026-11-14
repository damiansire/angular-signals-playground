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
 * El cierre (ver el CSS del componente) es un círculo blando centrado en el ojo de Angie, que crece
 * con `--aa-aire`: con aire `a` tapa del todo hasta `NUCLEO * a` y se desvanece hasta `a`. Un círculo
 * que se cierra es el final de dibujo animado; las nubes oscuras que tenía antes se leían como el
 * humo de una explosión.
 */
export const NUCLEO = 0.86;

/** El aire con el que el círculo tapa el aviso entero: arranca sin que se note el recorte. */
export function aireQueCubre(x: number, y: number, ancho: number, alto: number): number {
  return (1.02 * Math.hypot(Math.max(x, ancho - x), Math.max(y, alto - y))) / NUCLEO;
}

/** El aire más grande con el que el círculo queda adentro del aviso, sin tocar sus bordes. */
export function aireQueCabe(x: number, y: number, ancho: number, alto: number): number {
  return 0.95 * Math.min(x, ancho - x, y, alto - y);
}

// ─── El viaje de la cámara, del ojo de Angie a la colina ───────────────────────────────────────

/**
 * Los dos tramos del viaje, en ms. Primero el aviso se aleja, adentro del ojo de Angie, y mientras
 * se achica se redondea en un círculo, hasta desaparecer: la noche era lo que ella miraba, y la pantalla queda toda del
 * negro de su ojo. Después la cámara se aleja, del ojo a la cara, a Angie en la piedra y a la colina
 * entera. Se pisan un poco: la cámara arranca cuando el aviso ya es una mota. Uno detrás del otro, la
 * pantalla quedaba un segundo y medio toda negra.
 */
export const SE_CIERRA_MS = 1700;
export const ALEJARSE_MS = 4200;
export const SE_ALEJA_DESDE_MS = SE_CIERRA_MS - 300;
export const VIAJE_MS = SE_ALEJA_DESDE_MS + ALEJARSE_MS;
/**
 * Cuándo aparece la colina debajo del aviso, con su capa: un momento antes de que arranque la
 * cámara, así cuando arranca ya está dibujada. Armarla es un tirón de un quinto de segundo a 3440 px:
 * cae con el aviso hecho un punto de pocas decenas de píxeles, y no con el aviso entero ni con la
 * cámara en marcha.
 */
export const LA_COLINA_APARECE_MS = SE_ALEJA_DESDE_MS - 200;

/**
 * Lo más que avanza el viaje de un cuadro al otro. Un tirón más largo no se salta: el viaje sigue
 * donde iba. A 20 cuadros por segundo todavía va a su paso.
 */
export const TIRON_MS = 50;

/** Hasta acá del cierre el borde se redondea: de la pantalla entera al círculo que cabe adentro. */
const REDONDEA = 0.4;
/** Hasta dónde se va en escala antes de cerrarse en cero: parejo, como algo que se aleja. */
const LEJOS = 0.004;

/** Lo que muestra la cámara en un instante del viaje. */
export interface CuadroDelViaje {
  /** La escala de la colina, con el ojo como punto fijo: de `profundidad` a 1. */
  readonly colina: number;
  /** La escala del aviso dentro de la colina (su escala en pantalla es `colina * aviso`). */
  readonly aviso: number;
  /** El radio del círculo, en px del aviso. */
  readonly aire: number;
}

/** Entra y sale suave: la cámara no arranca ni frena de golpe. */
const suave = (v: number): number => 0.5 - 0.5 * Math.cos(Math.PI * v);
const entre01 = (v: number): number => Math.min(1, Math.max(0, v));

/**
 * El cuadro del viaje en el ms `t`. Como en Powers of Ten, la cámara se aleja en escala: cada tramo
 * de tiempo divide la escala por lo mismo, así el ojo, la cara, Angie y la colina duran parecido. En
 * línea recta, el ojo pasaba en un parpadeo y la colina se arrastraba.
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
  const colina = colinaEn(t, S0);
  if (t >= SE_CIERRA_MS) return { colina, aviso: 0, aire: cabe };
  const u = entre01(t / SE_CIERRA_MS);
  // Se aleja desde el primer cuadro y al final se cierra en cero: no queda ningún punto. El negro del
  // ojo aparece alrededor porque el aviso se achica, no porque lo tape: quieto mientras el círculo se
  // cerraba encima, el negro avanzaba hacia el medio y no se leía alejarse. Arranca despacio en
  // escala: parejo, a los 200 ms ya iba por un tercio y se leía como un salto, no como alejarse.
  const v = u * u;
  // El borde se redondea mientras se aleja, parejo en escala: en línea recta casi todo el tramo
  // seguía siendo el rectángulo de la pantalla.
  const aire = cubre * (cabe / cubre) ** Math.min(1, u / REDONDEA);
  return { colina, aviso: ((1 - v) * LEJOS ** v) / colina, aire };
}

/** La escala de la colina: quieta en la profundidad hasta que arranca, y después se aleja. */
function colinaEn(t: number, S0: number): number {
  const v = entre01((t - SE_ALEJA_DESDE_MS) / ALEJARSE_MS);
  // Casi todo parejo en escala, con un poco de arranque y llegada suaves.
  const p = 0.55 * v + 0.45 * suave(v);
  return S0 ** (1 - p);
}

/**
 * Cuánto de la distancia entre el ojo y el medio de la pantalla corre la cámara: entera mientras la
 * colina está a `profundidad` (el aviso se cierra en el medio) y nada al llegar a 1 (la colina en su
 * lugar). Va en escala, como el viaje: en pantalla, lineal, la colina ya llegaba de costado cuando
 * todavía se veía solo la cara.
 */
export function corridaDeLaCamara(colina: number, profundidad: number): number {
  if (profundidad <= 1) return 0;
  return entre01(Math.log(colina) / Math.log(profundidad));
}

/**
 * De qué tan cerca arranca la colina: desde ADENTRO del ojo, con toda la pantalla de su negro.
 * `mancha` es el negro que se puede llenar, en el dibujo del ojo (lejos de su brillo y del párpado);
 * `dx` y `dy`, una esquina de la pantalla vista desde su centro, en ese mismo dibujo. La esquina
 * tiene que caer adentro: con la mancha en media pantalla, se veía la cara desde el primer cuadro.
 * Con margen y con tope, que de más no muestra nada distinto.
 */
export function profundidadDelViaje(
  mancha: { readonly ancho: number; readonly alto: number },
  dx: number,
  dy: number,
): number {
  const a = Math.max(mancha.ancho, 1) / 2;
  const b = Math.max(mancha.alto, 1) / 2;
  const s = MARGEN * Math.hypot(dx / a, dy / b);
  return Math.min(TOPE, Math.max(6, s));
}
const MARGEN = 1.2;
const TOPE = 900;

/**
 * La profundidad que deja las cuatro esquinas adentro de la mancha. Va en el dibujo del ojo y no en
 * su caja de pantalla: Angie está girada y estirada por sus muelles, y medida por la caja la cámara
 * arrancaba con un borde a la vista. `alOjo` es la inversa de su matriz de pantalla (solo la parte
 * lineal) y `esquinas`, cada esquina menos el centro de la mancha, en píxeles.
 */
export function profundidadDesdeElOjo(
  mancha: { readonly ancho: number; readonly alto: number },
  alOjo: { readonly a: number; readonly b: number; readonly c: number; readonly d: number },
  esquinas: readonly (readonly [number, number])[],
): number {
  const { a, b, c, d } = alOjo;
  return Math.max(
    ...esquinas.map(([x, y]) =>
      profundidadDelViaje(mancha, Math.abs(a * x + c * y), Math.abs(b * x + d * y)),
    ),
  );
}

/**
 * Los loops de la colina que van quietos mientras viaja la cámara. Lo que anima queda dibujado a la
 * escala más grande que alcanzó, contando la de la escena, y no la baja mientras siga animando:
 * después de alejarse desde el ojo, los juncos, las nubes y Angie quedaban a decenas de aumentos,
 * cientos de megas de memoria de video, y con poca (Opera Neon con otras pestañas) a la colina le
 * faltaban pedazos. Los del aviso no, que se va, ni los que ya frenó la pausa de fondo: soltarlos
 * sería despausarlos.
 */
export function loopsQueSeRedibujan(animaciones: readonly Animation[], aviso: Node): Animation[] {
  return animaciones.filter((a) => {
    const blanco = (a.effect as KeyframeEffect | null)?.target;
    return esLoopQueCorre(a) && !(blanco && aviso.contains(blanco));
  });
}

/** Un loop que corre: sin fin, y no frenado ya por la pausa de fondo. */
export function esLoopQueCorre(a: Animation): boolean {
  const efecto = a.effect;
  if (!(efecto instanceof KeyframeEffect) || a.playbackRate === 0) return false;
  return efecto.getComputedTiming().iterations === Infinity;
}

/**
 * Cuánto más afuera de la pantalla se mira si la gema la tapa: lo medido es el cuadro anterior, y entre
 * uno y otro la cámara se aleja unos pocos por ciento. Sin margen, el primer cuadro destapado mostraba
 * el hueco donde debía estar la colina.
 */
const MARGEN_DE_TAPA = 1.15;

/**
 * Si la gema de Angie tapa la pantalla entera: cada esquina, algo más afuera, cae adentro de alguna
 * de sus piezas. La gema es convexa, así que con las esquinas adentro está adentro todo. `piezas` son
 * las de la pose que se ve; `pantalla`, el rectángulo en coordenadas de cliente.
 */
export function laGemaTapaLaPantalla(
  piezas: readonly SVGGeometryElement[],
  pantalla: {
    readonly left: number;
    readonly top: number;
    readonly width: number;
    readonly height: number;
  },
): boolean {
  if (!piezas.length) return false;
  const cx = pantalla.left + pantalla.width / 2;
  const cy = pantalla.top + pantalla.height / 2;
  const alPieza = piezas.map((p) => ({ p, m: p.getScreenCTM()?.inverse() }));
  return [
    [-1, -1],
    [1, -1],
    [-1, 1],
    [1, 1],
  ].every(([sx, sy]) => {
    const x = cx + (sx * MARGEN_DE_TAPA * pantalla.width) / 2;
    const y = cy + (sy * MARGEN_DE_TAPA * pantalla.height) / 2;
    return alPieza.some(
      ({ p, m }) => !!m && p.isPointInFill(new DOMPoint(x, y).matrixTransform(m)),
    );
  });
}

// ─── La colina dibujada por escalones, dentro de una capa que no crece ─────────────────────────
//
// La cámara reparte su escala en dos: la colina lleva una escala que solo cambia por escalones (la
// «dibujada»), y un contenedor suyo, que es la capa (`will-change: transform`), lleva lo que falta,
// de la holgura a 1, cuadro a cuadro. La capa mide lo que la pantalla y el navegador la dibuja una
// sola vez, a la holgura: nunca ocupa más de holgura² veces los píxeles que se ven, y entre un
// escalón y otro solo la achica.
//
// Antes la capa era la colina misma, agrandada cientos de veces: el navegador le dibujaba por
// adelantado lo que rodea a la pantalla hasta llenar la memoria de video (109 MB de un tope de 128,
// 190 de 256), y cada redibujado, que la creaba de nuevo, pedía memoria cuando la capa vieja todavía
// no había devuelto la suya. Con poca, el cuadro salía sin dibujar: el flash del color de fondo.

/**
 * Cuánto más grande de lo que se ve queda dibujada la colina al empezar un escalón: ∛2 de lado, 1,6×
 * los píxeles de la pantalla, y 27 escalones del ojo a la colina. Con √2 (2× los píxeles, 18
 * escalones) cada escalón pedía dos veces esa capa, 126 MB a 3440 px, y con 128 MB de memoria de
 * video no entraba junto con el aviso.
 */
export const HOLGURA_DE_DIBUJO = Math.cbrt(2);

/**
 * La escala a la que se dibuja la colina cuando la cámara está en `escala`: la del final del escalón,
 * así lo que la capa agrega va de `holgura` a 1 y nunca la achica por debajo de la pantalla. Nunca
 * menos que 1: el último escalón ya es la colina en su lugar.
 */
export function escalaDeDibujo(escala: number, holgura = HOLGURA_DE_DIBUJO): number {
  return Math.max(1, escala / holgura);
}

/**
 * Cuántos cuadros se dejan pasar entre soltar unas capas y pedir otras: entre que la cámara se va y
 * que despiertan los loops. El navegador tarda un par de cuadros en devolver la memoria de video de
 * las capas que se van: todo en el mismo cuadro, lo nuevo no entraba y a la colina le faltaba una
 * franja.
 */
export const CUADROS_DE_ESPERA = 3;

/** Si toca otro escalón: la cámara ya llegó a la escala dibujada y todavía no es la de la colina. */
export function tocaRedibujar(escala: number, dibujadaA: number): boolean {
  return dibujadaA > 1 && escala <= dibujadaA;
}

interface Punto {
  readonly x: number;
  readonly y: number;
}

/** Cómo quedó dibujada la colina en el último escalón: su escala, su punto fijo y su corrida. */
export interface Dibujada {
  readonly escala: number;
  readonly ojo: Punto;
  readonly corrida: Punto;
}

/**
 * Lo que la capa agrega encima de la colina dibujada para que en pantalla quede a `escala`, con el
 * ojo en `ojo` y corrida `corrida`: una escala alrededor del ojo dibujado y una corrida. El ojo se
 * mueve apenas entre un escalón y otro, y a cientos de aumentos eso son cientos de píxeles: la
 * corrida lo compensa.
 */
export function camaraSobreLoDibujado(
  dibujada: Dibujada,
  escala: number,
  ojo: Punto,
  corrida: Punto,
): { readonly escala: number; readonly corrida: Punto } {
  const k = escala / dibujada.escala;
  return {
    escala: k,
    corrida: {
      x: (ojo.x - dibujada.ojo.x) * (1 - escala) + corrida.x - k * dibujada.corrida.x,
      y: (ojo.y - dibujada.ojo.y) * (1 - escala) + corrida.y - k * dibujada.corrida.y,
    },
  };
}

/**
 * Si la capa, agrandada `escala` alrededor de `origen` y corrida, sigue tapando su propio lugar: la
 * capa está recortada a su caja, y si no la tapa asoma lo de atrás por un borde. `caja` es la capa
 * sin agrandar, en las mismas coordenadas que `origen`. Con medio píxel de tolerancia.
 */
export function laCapaTapaSuLugar(
  escala: number,
  corrida: Punto,
  origen: Punto,
  caja: { readonly x: number; readonly y: number; readonly ancho: number; readonly alto: number },
): boolean {
  if (escala < 1 - 1e-9) return false;
  const izquierda = origen.x + escala * (caja.x - origen.x) + corrida.x;
  const arriba = origen.y + escala * (caja.y - origen.y) + corrida.y;
  return (
    izquierda <= caja.x + 0.5 &&
    arriba <= caja.y + 0.5 &&
    izquierda + escala * caja.ancho >= caja.x + caja.ancho - 0.5 &&
    arriba + escala * caja.alto >= caja.y + caja.alto - 0.5
  );
}

/**
 * Las propiedades que mueve una animación, escritas como en CSS: las que `commitStyles` deja fijas
 * en el estilo del elemento mientras va quieta, y que hay que sacar cuando vuelve a moverse.
 */
export function propiedadesAnimadas(cuadros: readonly object[]): string[] {
  const internas = new Set(['offset', 'computedOffset', 'easing', 'composite']);
  const nombres = new Set(cuadros.flatMap((c) => Object.keys(c)).filter((k) => !internas.has(k)));
  return [...nombres].map((k) => k.replace(/[A-Z]/g, (m) => '-' + m.toLowerCase()));
}

/**
 * La marca de `data-quieto` que apaga el pulso de un pseudo-elemento mientras viaja la cámara, o
 * `null` si el loop es de un elemento (ese se aquieta con `commitStyles`).
 */
export function marcaDelPseudo(pseudo: string | null): string | null {
  if (pseudo === '::before') return 'antes';
  if (pseudo === '::after') return 'despues';
  return null;
}
