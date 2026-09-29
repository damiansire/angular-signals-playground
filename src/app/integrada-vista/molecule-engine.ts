/**
 * Motor del recorrido "molécula reactiva" de la vista integrada (la raíz `/`).
 *
 * Es una animación imperativa (SVG + canvas + cámara con zoom + órbita de
 * sub-niveles + stepping por wheel) que no encaja en el modelo declarativo de
 * signals, así que vive aislada acá y el componente la arranca en
 * `afterNextRender`. `initMolecule` monta todo dentro de `root` y devuelve una
 * función de limpieza que corta rAF, timers y listeners (para el DestroyRef).
 *
 * El porqué de cada mecánica (cámara, acople del electrón actual, wheel = un
 * paso) está documentado donde ocurre.
 */
import { SISTEMA_ESTABLECIDO } from '../libs/manipulable-challenge';
import { createFrameScheduler } from './frame-scheduler';
import { cambiosDeMontaje, ordenarPorUrgencia } from './mount-window';

const NS = 'http://www.w3.org/2000/svg';

type AccentKey = 'source' | 'derived' | 'effect' | 'ink' | 'capstone';

const COL: Record<AccentKey, string> = {
  source: '#eb9b3c',
  derived: '#62c4ad',
  effect: '#ff5a4a',
  ink: '#9a9081',
  capstone: '#c98a2a',
};

const CLAVE_PAUSA_FONDO = 'signals-pausa';
/** Lo que el jugador abrió encima del recorrido: la pausa de la vida de fondo no lo toca. */
const PRIMER_PLANO = '.prologo, app-cinematica, app-bitacora';
function leerPausaFondo(): boolean {
  try {
    return localStorage.getItem(CLAVE_PAUSA_FONDO) === '1';
  } catch {
    return false;
  }
}
function guardarPausaFondo(pausa: boolean): void {
  try {
    if (pausa) localStorage.setItem(CLAVE_PAUSA_FONDO, '1');
    else localStorage.removeItem(CLAVE_PAUSA_FONDO);
  } catch {
    // Sin storage (modo privado, bloqueado) la pausa dura la visita: no es motivo para romper.
  }
}

/** Handle de un sub-nivel montado: su disposer y el nombre que va al topbar. */
/**
 * Reescribir `textContent` reemplaza el nodo de texto y ensucia el layout aunque el texto sea el
 * mismo; `render` corre en cada cuadro de scroll, así que solo se escribe cuando cambia.
 */
function ponerTexto(el: Element, texto: string): void {
  if (el.textContent !== texto) el.textContent = texto;
}

export interface SubHandle {
  dispose: () => void;
  /**
   * Nombre del sub-nivel. Lo declara quien monta, no se adivina leyendo el DOM montado.
   * El `| undefined` es explícito: con `exactOptionalPropertyTypes`, "ausente" y "presente pero
   * undefined" son cosas distintas, y quien monta puede pasar un título que no tiene.
   */
  title?: string | undefined;
}
/** Monta el componente real de un sub-nivel (concepto ci, sub si) y devuelve su handle. */
export type MountSub = (host: HTMLElement, conceptIdx: number, subIdx: number) => SubHandle;

interface RawConcept {
  name: string;
  code: string;
  accent: AccentKey;
  dotted: boolean;
  tagline?: string; // título de encuadre del nivel (topbar en vista molécula, antes de bucear)
  tip: string; // frase de la mascota-guía para este concepto (globo en la vista mapa)
}

interface Concept extends RawConcept {
  x: number;
  y: number;
  subN: number; // cantidad de sub-niveles reales
  card?: HTMLDivElement;
  subIdx: number;
  // Disposer del componente montado del sub actual. El `| undefined` explícito porque al
  // desmontar se le asigna undefined, y con `exactOptionalPropertyTypes` eso no es lo mismo que
  // borrar la propiedad.
  subDispose?: (() => void) | undefined;
  exampleTitle?: string; // nombre del sub-nivel actual (declarado por el handle), para el topbar
}

interface SubDot {
  g: SVGGElement;
  dot: SVGCircleElement;
  num: SVGTextElement;
  lx: number;
  ly: number;
}

/** Los 12 conceptos (metadata del atomo). Los sub-niveles reales se embeben en cada dive. */
const RAW: RawConcept[] = [
  {
    name: 'Introducción',
    code: 'detección de cambios',
    accent: 'ink',
    dotted: false,
    tagline: 'Cómo la pantalla sabe qué cambió',
    tip: 'Primero lo primero: ¿cómo se entera Angular de qué parte de la pantalla volver a dibujar?',
  },
  {
    name: 'Signals',
    tagline: 'El que avisa',
    code: 'signal()',
    accent: 'source',
    dotted: false,
    tip: 'Una caja con un valor. La leés, la cambiás, y quien la mira se entera solo.',
  },
  {
    name: 'Computed',
    tagline: 'El que se entera por otro',
    code: 'computed()',
    accent: 'derived',
    dotted: true,
    tip: 'Un valor que se arma a partir de otros. Cambian ellos, se recalcula solo. Vos no lo tocás.',
  },
  {
    name: 'Effects',
    tagline: 'El que sale a hacer algo',
    code: 'effect()',
    accent: 'effect',
    dotted: false,
    tip: 'Cuando algo cambia y hay que salir de Angular (loggear, tocar el DOM, guardar), eso es un effect.',
  },
  {
    name: 'Igualdad',
    tagline: '¿Cambió, o solo se parece?',
    code: 'equality',
    accent: 'source',
    dotted: false,
    tip: '¿Cambió de verdad? Angular compara antes de avisar. Acá decidís con qué criterio.',
  },
  {
    name: 'Linked',
    tagline: 'Cuando el observador interviene',
    code: 'linkedSignal()',
    accent: 'derived',
    dotted: true,
    tip: 'Un derivado que igual podés pisar a mano cuando querés. Lo mejor de los dos mundos.',
  },
  {
    name: 'Resource',
    tagline: 'El dato que todavía viaja',
    code: 'resource()',
    accent: 'derived',
    dotted: true,
    tip: 'Datos async como signal: te da cargando, error y valor, sin un subscribe suelto por ahí.',
  },
  {
    name: 'Inputs & Outputs',
    tagline: 'Los bordes del aparato',
    code: 'input · model',
    accent: 'source',
    dotted: false,
    tip: 'Cómo entran y salen datos de un componente, ahora también como signals.',
  },
  {
    name: 'Queries',
    tagline: 'Mirar la pantalla misma',
    code: 'viewChild',
    accent: 'ink',
    dotted: true,
    tip: 'Agarrar un pedazo del template (un hijo, un elemento) y tenerlo como signal.',
  },
  {
    name: 'After render',
    tagline: 'Medir después de pintar',
    code: 'afterRenderEffect()',
    accent: 'effect',
    dotted: false,
    tip: 'Correr algo justo después de que Angular pintó, con su limpieza incluida.',
  },
  {
    name: 'Debounce',
    tagline: 'Esperar a que se estabilice',
    code: 'debounce',
    accent: 'effect',
    dotted: true,
    tip: 'Esperá a que el usuario frene antes de reaccionar. Menos ruido, mejor señal.',
  },
  {
    name: 'Zoneless',
    tagline: 'Quien lee, avisa',
    code: 'zoneless',
    accent: 'capstone',
    dotted: false,
    tip: 'Sin Zone.js: los signals avisan solos cuándo repintar. Acá termina el viaje.',
  },
];

// Todos los conceptos usan el tratamiento "disolver el marco": la card deja de ser una ventana y su
// contenido flota en el campo del átomo (escena viva sin velo, aura grande), con el nivel/sub-nivel
// en el riel, el topbar y la constelación de la órbita.

/**
 * Cantidad de conceptos del recorrido (metadata hardcodeada en RAW). DEBE coincidir con
 * `signalsRoutesTree.length`: RAW y el árbol de rutas son dos fuentes de verdad acopladas por
 * índice. El guard de `initMolecule` lo verifica en runtime; un test lo ata en tiempo de build.
 */
export const CONCEPT_COUNT = RAW.length;

/**
 * El título de cada capítulo tal como se ve en el recorrido (su tagline). Las cinemáticas y la
 * bitácora lo leen de acá para que un capítulo se llame igual en todos lados.
 */
export const TITULOS_DE_CAPITULO: readonly string[] = RAW.map((r) => r.tagline ?? r.name);

/** El nombre corto de cada concepto (el de la API), en el orden del recorrido. */
export const NOMBRES_DE_CONCEPTO: readonly string[] = RAW.map((r) => r.name);

const CX = 410;
const CY = 290;
// El panel del recorrido (variante B) ocupa la franja izquierda; la molécula se corre a la DERECHA
// esta cantidad (unidades del viewBox 820×600) en la vista molécula, y vuelve al centro al bucear
// (lerp por diveDepth) para quedar alineada detrás de la card centrada. Ver el transform en render().
const PANEL_SHIFT = 128;
const ORX = 34;
const ORY = 11;
const NUC = 13;
/**
 * Parada de encuadre del átomo dentro del tramo de un concepto (`off[c] + PARADA_ATOMO`): ahí la cámara
 * ya encuadró el átomo y empieza el buceo, que dura hasta `PARADA_ATOMO + 0.7`. La usan el snap, la
 * cámara, el fade de la card, el riel y el deep-link: si divergen, cada uno encuadra en otro lado.
 */
const PARADA_ATOMO = 1.3;
/** Hasta dónde del scroll (`s`) la landing sigue a la vista: el recorrido arranca pasado este punto. */
const INTRO_HASTA = 0.12;
/** El concepto del medio (`resource`): el pico del recorrido, con su marca propia en el riel. */
const CONCEPTO_PICO = 6;

/**
 * Radio ocupado por un átomo: la órbita (ORX) más el electrón que la recorre. Dos átomos a menos
 * de 2×ATOM_CLOUD_R de distancia se pisan las nubes. Es la restricción que acota la espiral.
 */
export const ATOM_CLOUD_R = 38;

/**
 * Espiral de la cadena de conceptos. El átomo tiene tamaño FIJO (núcleo más nube, ver
 * `ATOM_CLOUD_R`) y la cámara auto-encuadra la espiral, así que lo que evita que las nubes se
 * pisen es el radio RELATIVO a ese tamaño fijo: radio base alto para despegar ya al átomo 1 del
 * centro, y crecimiento por paso calculado para que el primer gap (1→2, el más apretado) supere
 * el diámetro de la nube. `spec` ata ese invariante y el del encuadre, para que un retoque futuro
 * no los rompa en silencio.
 */
export const SPIRAL_R0 = 172;
export const SPIRAL_RSTEP = 24;
export const SPIRAL_STEP = 0.76;

/**
 * Encuadre de la molécula: mapea la extensión de la espiral a un zoom. Se aplana en
 * `WIDE_ZOOM_FLOOR` para llenar el alto del viewport con los 12 átomos sin cortar los de
 * arriba/abajo, y por eso mismo ese piso es el TECHO real de la espiral: si `outerRadius` crece
 * tanto que el zoom quedaría por debajo, el clamp lo frena y la molécula se sale del frame.
 */
export const WIDE_ZOOM_FLOOR = 0.6;
export function wideZoom(outerRadius: number): number {
  return Math.max(WIDE_ZOOM_FLOOR, Math.min(1.5, 310 / (outerRadius + 62)));
}

/** Posición del átomo `i`. El concepto 0 vive en el centro; el resto sale por la espiral. */
export function conceptPos(i: number): { x: number; y: number } {
  if (i === 0) return { x: CX, y: CY };
  const ang = (i - 1) * SPIRAL_STEP - Math.PI / 2;
  const r = SPIRAL_R0 + (i - 1) * SPIRAL_RSTEP;
  return { x: CX + r * Math.cos(ang), y: CY + r * Math.sin(ang) };
}

/**
 * Layout de scroll del recorrido: cada concepto ocupa [nace(1) + bucear(1)] = 2 unidades;
 * si tiene N sub-niveles, suma +1 unidad de scroll por cada uno (N + 1 en total). Devuelve
 * el offset de arranque de cada concepto, su largo y el total. Es la fuente de verdad de
 * cuánto scroll ocupa cada tramo; función pura para poder testearla sin DOM.
 */
export function scrollLayout(subCounts: readonly (number | null)[]): {
  off: number[];
  len: number[];
  total: number;
} {
  const off: number[] = [];
  const len: number[] = [];
  let total = 0;
  subCounts.forEach((n, i) => {
    off[i] = total;
    len[i] = n ? n + 1 : 2;
    total += len[i];
  });
  return { off, len, total };
}

/** Offset relativo (unidades de scroll) del sub-nivel `k` dentro de su concepto. */
function subStopOffset(k: number): number {
  return k === 0 ? 1.95 : 2 + (k - 1) + 0.5;
}

/**
 * Puntos de scroll donde el recorrido debe frenar, uno por gesto: el inicio (overlay
 * "Scrolleá para empezar"), el átomo enfocado de cada concepto (molécula → adentro) y
 * cada uno de sus sub-niveles. `initMolecule` los usa para plantar los `.snap--stop`
 * (scroll-snap-stop: always) que hacen que un scroll largo de trackpad no salte pasos.
 * Función pura para poder testearla sin DOM.
 */
export function snapStops(subCounts: readonly (number | null)[]): number[] {
  const { off } = scrollLayout(subCounts);
  const stops: number[] = [0];
  subCounts.forEach((n, i) => {
    stops.push(off[i] + PARADA_ATOMO);
    const nsub = n ?? 0;
    for (let k = 0; k < nsub; k++) stops.push(off[i] + subStopOffset(k));
  });
  return stops;
}

function smoothstep(t: number): number {
  const x = Math.max(0, Math.min(1, t));
  return x * x * (3 - 2 * x);
}

function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

/** Geometría (en coords de la molécula) que necesita la cámara para un concepto. */
export interface CameraGeom {
  /** Zoom "wide" que encuadra la molécula hasta este concepto (`wideK`). */
  W: number;
  /** Centroide de la cadena hasta este concepto. */
  cen: { x: number; y: number };
  /** Átomo enfocado del concepto actual. */
  target: { x: number; y: number };
  /** Átomo del concepto anterior (o el centro para el primero). */
  parent: { x: number; y: number };
}

/**
 * Opacidad de los átomos que no son el actual (y de los enlaces) según la profundidad del buceo.
 * Mientras bajás se ven, y ahí cuentan de dónde venís; con el sub-nivel asentado se retiran, porque
 * la espiral los deja donde cae, sin mirar el contenido: en varios sub-niveles el vecino quedaba
 * encima de inputs y botones del demo. Adentro queda solo el átomo actual, detrás de la card.
 */
export function opacidadDeVecinos(diveDepth: number): number {
  // Termina de apagarse antes del buceo total: la parada del sub-nivel no asienta en 1 exacto (en los
  // conceptos lejanos queda cerca de 0.93 por el redondeo del scroll), y ahí tiene que dar 0 exacto
  // para que el motor los oculte.
  return 1 - smoothstep((diveDepth - 0.45) / 0.4);
}

/**
 * Estado de cámara (zoom `K`, punto de foco `fx`/`fy`, profundidad de buceo `diveDepth`) en la
 * posición de scroll `w` (0..len dentro del concepto): nace → wide → bucea al átomo, y en la zona
 * de sub-niveles (`w >= 2`) se queda adentro. `isFirst` = concepto 0 (nace en el centro, sin padre).
 * Función PURA: toda la geometría entra por `geom`, así se testea el corazón del motor sin DOM.
 */
export function cameraAt(
  w: number,
  isFirst: boolean,
  geom: CameraGeom,
): { K: number; fx: number; fy: number; diveDepth: number } {
  const { W, cen, target, parent } = geom;
  const FK = 2.7;
  if (w >= 2) {
    // En los sub-niveles la cámara mira el átomo actual de frente, el mismo punto donde terminó el
    // buceo. Inclinarse hacia el anterior para que asomara no sirve con el vecino retirado (ver
    // opacidadDeVecinos) y metía un salto al entrar al primer sub-nivel.
    return { K: FK, fx: target.x, fy: target.y, diveDepth: 1 };
  }
  if (isFirst) {
    if (w < PARADA_ATOMO) {
      return { K: W, fx: cen.x, fy: cen.y, diveDepth: 0 };
    }
    const t = smoothstep((w - PARADA_ATOMO) / 0.7);
    return {
      K: lerp(W, FK, t),
      fx: lerp(cen.x, target.x, t),
      fy: lerp(cen.y, target.y, t),
      diveDepth: Math.min(1, (w - PARADA_ATOMO) / 0.7),
    };
  }
  if (w < 0.7) {
    const t = smoothstep(w / 0.7);
    return {
      K: lerp(FK, W, t),
      fx: lerp(parent.x, cen.x, t),
      fy: lerp(parent.y, cen.y, t),
      diveDepth: 0,
    };
  }
  if (w < PARADA_ATOMO) {
    return { K: W, fx: cen.x, fy: cen.y, diveDepth: 0 };
  }
  const t = smoothstep((w - PARADA_ATOMO) / 0.7);
  return {
    K: lerp(W, FK, t),
    fx: lerp(cen.x, target.x, t),
    fy: lerp(cen.y, target.y, t),
    diveDepth: Math.min(1, (w - PARADA_ATOMO) / 0.7),
  };
}

export function initMolecule(
  root: HTMLElement,
  mountSub: MountSub,
  subCounts: number[],
  enc: string | null = null,
  // Avisa dónde está el recorrido para reflejarlo en la URL: `conceptIdx` = nivel actual;
  // `subIdx` = sub-nivel (0-based) cuando estás ADENTRO, o -1 en la vista molécula. Solo se
  // llama cuando cambia el par (nivel, sub-nivel), no en cada frame.
  onWhere: (conceptIdx: number, subIdx: number) => void,
  // Deep-link: si viene con `concept` (nivel) y `sub` (sub-nivel 1-based), el recorrido abre
  // scrolleado directo a ese sub-nivel en vez de arriba con el overlay. `sub` 0/ausente = vista
  // molécula: abre encuadrando el átomo del concepto. Se clampea al rango real.
  initial: { concept: number; sub: number } | null = null,
  // Avisa cuándo la landing entra y sale de vista. El motor es el ÚNICO que sabe esto (lo decide
  // el scroll), y la landing necesita saberlo para cortar su audio y dejar de dibujar. Antes lo
  // averiguaba sondeando el `style.opacity` que el motor escribe acá abajo: un módulo leyendo el
  // detalle de implementación de otro, que se rompía en silencio con solo cambiar el fade a una
  // clase. Se llama solo en el CAMBIO, no por frame.
  onIntroVisible: ((visible: boolean) => void) | null = null,
  // La partida guardada: lo que ya se estableció en otra visita (ids "concepto/sub", sub desde 0)
  // entra como punto de partida, y cada establecimiento nuevo se avisa para guardarlo. El motor no
  // sabe de `localStorage`: guardar es asunto de quien lo monta.
  partida: {
    readonly establecidos: ReadonlySet<string>;
    readonly alEstablecer: (conceptIdx: number, subIdx: number) => void;
  } | null = null,
): () => void {
  // RAW (metadata de los 12 conceptos) y `subCounts` (derivado de signalsRoutesTree) están
  // acoplados por índice: si no cuadran, un concepto se pintaría sin sub-niveles o se descartaría
  // en silencio. Fallamos ruidoso en el boot en vez de degradar mudo.
  if (subCounts.length !== RAW.length) {
    throw new Error(
      `molecule-engine: subCounts tiene ${subCounts.length} conceptos pero RAW tiene ${RAW.length}. ` +
        `RAW y signalsRoutesTree deben mantener la misma cantidad de conceptos.`,
    );
  }
  /** El concepto donde abre el recorrido: el del deep-link, o el primero. */
  const conceptoDeApertura = initial
    ? Math.max(0, Math.min(RAW.length - 1, Math.round(initial.concept)))
    : 0;
  const C: Concept[] = RAW.map((r, i) => ({
    ...r,
    x: 0,
    y: 0,
    subN: subCounts[i] ?? 0,
    subIdx: 0,
  }));
  const N = C.length;

  // Angular (ViewEncapsulation.Emulated) scopea el CSS del componente a un atributo
  // `_ngcontent-*` que solo llevan los elementos del TEMPLATE. El motor crea la molécula,
  // las cards y la órbita imperativamente, así que hay que estamparles ese atributo a mano
  // para que el CSS del componente les aplique. `enc` es ese nombre de atributo.
  const stamp = (e: Element): void => {
    if (enc) e.setAttribute(enc, '');
  };
  const stampTree = (r: Element): void => {
    if (enc) r.querySelectorAll('*').forEach(stamp);
  };

  // Cuadros y timers que se cortan al destruir. La lógica vive en `frame-scheduler`, donde se
  // puede probar en aislamiento: es el contrato del motor que no se ve mirando la pantalla.
  const agenda = createFrameScheduler();
  const raf = agenda.raf;
  const later = agenda.later;

  // Layout de scroll (ver scrollLayout): cada concepto arranca en off[i] y ocupa len[i].
  const { off, len, total: TOTAL } = scrollLayout(C.map((c) => c.subN || null));
  // Unidad de cola de la pista. Cada concepto bucea usando parte del tramo del SIGUIENTE (su
  // `nace`), así que a los intermedios les alcanza el largo propio. El ÚLTIMO concepto no tiene
  // siguiente del que tomar prestado: sin una unidad extra al final, el scroll frena antes de
  // completar su buceo y el sub-nivel del último concepto (Zoneless) queda inalcanzable. Con +1
  // el scroll llega a `w = TOTAL` y el dive del último concepto se completa como el de los demás.
  const TRACK_TAIL = 1;

  C.forEach((cc, i) => {
    const pp = conceptPos(i);
    cc.x = pp.x;
    cc.y = pp.y;
  });

  const outerRadius = (c: number): number => {
    let m = 0;
    for (let i = 0; i <= c; i++) {
      const d = Math.hypot(C[i].x - CX, C[i].y - CY);
      if (d > m) m = d;
    }
    return m;
  };
  const wideK = (c: number): number => wideZoom(outerRadius(c));
  // Centro del ENCUADRE de la vista molécula: el centro de la bounding-box de los átomos nacidos
  // (0..c), NO el centroide de masa. El centroide de masa se corría hacia la zona más densa del
  // espiral y dejaba medio viewport muerto (design-review A8); el centro de la caja reparte la
  // constelación pareja en el frame.
  const frameCenter = (c: number): { x: number; y: number } => {
    let minx = Infinity;
    let maxx = -Infinity;
    let miny = Infinity;
    let maxy = -Infinity;
    for (let i = 0; i <= c; i++) {
      if (C[i].x < minx) minx = C[i].x;
      if (C[i].x > maxx) maxx = C[i].x;
      if (C[i].y < miny) miny = C[i].y;
      if (C[i].y > maxy) maxy = C[i].y;
    }
    return { x: (minx + maxx) / 2, y: (miny + maxy) / 2 };
  };

  function el<K extends keyof SVGElementTagNameMap>(
    tag: K,
    attrs?: Record<string, string | number>,
  ): SVGElementTagNameMap[K] {
    const e = document.createElementNS(NS, tag);
    if (attrs) for (const k in attrs) e.setAttribute(k, String(attrs[k]));
    stamp(e);
    return e;
  }

  const q = <T extends Element>(sel: string): T | null => root.querySelector<T>(sel);

  const starsG = q<SVGGElement>('#stars')!;
  const sceneG = q<SVGGElement>('#scene')!;
  const bondsG = q<SVGGElement>('#bonds')!;
  const atomsG = q<SVGGElement>('#atoms')!;
  const ripG = q<SVGGElement>('#ripples')!;

  // prefers-reduced-motion: con reduce apagamos la vida ambiente SMIL (los electrones en órbita).
  // El SMIL no respeta el `@media (prefers-reduced-motion)` del CSS, así que hay que gatearlo acá:
  // congelamos el timeline de la escena (los electrones tienen `begin` negativo → quedan quietos ya
  // distribuidos, no amontonados) y ocultamos el electrón del ascensor. El glide ya va instantáneo
  // (goToUnit) y el CSS apaga breath/sonar/warp/puck. El SENTIDO se mantiene: el estado avanza, sin
  // desplazamiento. Se escucha el cambio: el CSS reacciona solo si la preferencia cambia en plena
  // sesión, y sin esto el SMIL quedaba del otro lado (ver `aplicarMovimiento`).
  const mqlReduce =
    typeof window.matchMedia === 'function'
      ? window.matchMedia('(prefers-reduced-motion: reduce)')
      : null;
  let reduceMotion = mqlReduce?.matches ?? false;
  const contentEl = q<HTMLDivElement>('#content')!;

  for (let s = 0; s < 30; s++) {
    const st = el('circle', {
      class: 'star',
      cx: (Math.random() * 820).toFixed(0),
      cy: (Math.random() * 600).toFixed(0),
      r: (Math.random() * 1.3 + 0.4).toFixed(1),
    });
    starsG.appendChild(st);
  }

  // Cuánto se exagera el arco por encima del geométricamente exacto (1 = calcado a la espiral).
  // Por encima de ~1.6 los enlaces empiezan a abombarse y a invadir la nube de los átomos vecinos.
  const BOND_BOW = 1.35;

  // Enlace entre dos átomos: la cadena ya está dispuesta sobre una espiral (ver `pos`), así que el
  // enlace TRAZA ese arco en vez de cortarlo por la cuerda. El punto de control de la cuadrática se
  // corre radialmente desde el centro de la espiral, de modo que el punto medio de la curva caiga
  // sobre el radio promedio de los extremos. Antes el control se corría perpendicular al segmento
  // y siempre hacia el mismo lado: como la cadena da más de media vuelta, en buena parte del
  // recorrido eso comba EN CONTRA de la espiral y la curva se lee recta.
  const bondPath = (x1: number, y1: number, x2: number, y2: number): string => {
    const mx = (x1 + x2) / 2;
    const my = (y1 + y2) / 2;
    const dx = mx - CX;
    const dy = my - CY;
    const d = Math.hypot(dx, dy);
    // El átomo 0 vive en el centro de la espiral: ese enlace es un rayo y no admite arco.
    if (d < 1) return `M ${x1.toFixed(1)} ${y1.toFixed(1)} L ${x2.toFixed(1)} ${y2.toFixed(1)}`;
    const rMid = (Math.hypot(x1 - CX, y1 - CY) + Math.hypot(x2 - CX, y2 - CY)) / 2;
    const k = (d + 2 * (rMid - d) * BOND_BOW) / d;
    const cx = CX + dx * k;
    const cy = CY + dy * k;
    return `M ${x1.toFixed(1)} ${y1.toFixed(1)} Q ${cx.toFixed(1)} ${cy.toFixed(1)} ${x2.toFixed(1)} ${y2.toFixed(1)}`;
  };
  const bondEls: SVGPathElement[] = [];
  for (let i = 1; i < N; i++) {
    const ln = el('path', {
      class: 'bond',
      d: bondPath(C[i - 1].x, C[i - 1].y, C[i].x, C[i].y),
      fill: 'none',
    });
    bondsG.appendChild(ln);
    bondEls.push(ln);
  }

  const opath = (): string =>
    `M ${-ORX} 0 A ${ORX} ${ORY} 0 1 0 ${ORX} 0 A ${ORX} ${ORY} 0 1 0 ${-ORX} 0`;
  const atomEls: SVGGElement[] = [];
  // Referencia al `.orb` de cada átomo, cacheada acá: render() la lee 12 veces por frame de scroll;
  // sin el cache haría 12 querySelector('.orb') por frame.
  const orbEls: SVGGElement[] = [];
  C.forEach((cc, i) => {
    const accent = COL[cc.accent];
    const g = el('g', {
      class: 'atom ' + cc.accent + (cc.dotted ? ' dotted' : ''),
      transform: `translate(${cc.x},${cc.y})`,
    });
    const orb = el('g', { class: 'orb' });
    orb.appendChild(el('circle', { class: 'halo', cx: 0, cy: 0, r: NUC + 34, stroke: accent }));
    // Un electrón por sub-nivel: el átomo MUESTRA cuántos sub-niveles tiene el concepto
    // (Introducción = 4 → 4 electrones). Al bucear, estos mismos electrones se apagan y su rol
    // pasa a los sub-dots numerados que orbitan la card (ver .suborbit): se leen como los mismos
    // electrones que salieron a orbitar afuera. Fallback a 1 para conceptos sin sub-niveles.
    const nO = Math.max(1, cc.subN);
    // Cada electrón va en su propio anillo, inclinado distinto, para que se lean como N
    // partículas separadas (nube 3D) y no una fila. Tilts repartidos en abanico y duraciones
    // escalonadas para que no laten sincronizados; generados (no tabla fija) para servir a
    // cualquier N de sub-niveles sin romper.
    const tiltOf = (o: number): number =>
      nO === 1 ? 20 + i * 12 : -66 + (o * 132) / (nO - 1) + i * 7;
    const durOf = (o: number): number => 2.6 + (o % 3) * 0.6;
    // Cada anillo TEJE el núcleo: media elipse detrás (backG) y media delante (frontG) → 3D real.
    const arc = (sweep: number): string => `M ${-ORX} 0 A ${ORX} ${ORY} 0 0 ${sweep} ${ORX} 0`;
    const backG = el('g', {});
    const frontG = el('g', {});
    for (let o = 0; o < nO; o++) {
      const tilt = tiltOf(o);
      const dur = durOf(o);
      const backOg = el('g', { transform: `rotate(${tilt})` });
      backOg.appendChild(el('path', { class: 'ring', d: arc(0), stroke: accent }));
      backG.appendChild(backOg);
      const frontOg = el('g', { transform: `rotate(${tilt})` });
      frontOg.appendChild(el('path', { class: 'ring', d: arc(1), stroke: accent }));
      const e = el('circle', { class: 'electron', r: 4, fill: accent, style: 'color:' + accent });
      e.appendChild(
        el('animateMotion', {
          dur: dur + 's',
          repeatCount: 'indefinite',
          path: opath(),
          // Fase repartida sobre el perímetro (o/nO) para que en cualquier instante los N
          // electrones estén distribuidos alrededor del núcleo, no amontonados.
          begin: ((-o * dur) / nO).toFixed(2) + 's',
        }),
      );
      frontOg.appendChild(e);
      frontG.appendChild(frontOg);
    }
    orb.appendChild(backG);
    orb.appendChild(
      el('circle', {
        class: 'nucleus',
        cx: 0,
        cy: 0,
        r: NUC,
        fill: accent,
        // Los conceptos "derived" (dotted) se dibujan más livianos a propósito, pero a 0.4 el núcleo
        // teal casi desaparecía sobre el fondo claro (flower invisible). 0.62 los hace presentes sin
        // perder que lean más tenues que los sólidos (0.95).
        'fill-opacity': cc.dotted ? 0.62 : 0.95,
        style: 'color:' + accent,
      }),
    );
    orb.appendChild(frontG);
    g.appendChild(orb);
    const ddx = cc.x - CX;
    const ddy = cc.y - CY;
    const ddl = Math.hypot(ddx, ddy) || 1;
    const nm = el('text', {
      class: 'aname',
      x: (i === 0 ? 0 : (ddx / ddl) * (NUC + 32)).toFixed(0),
      y: (i === 0 ? NUC + 44 : (ddy / ddl) * (NUC + 32) + 5).toFixed(0),
    });
    nm.textContent = cc.name;
    g.appendChild(nm);
    // Entrada (concepto 0): es el frame más vacío del recorrido. Le sumamos un subtítulo bajo el
    // nombre (cuántos capítulos + cue de scroll) para llenarlo e invitar a bucear, SIN sacar el
    // átomo ni el nombre. Solo lo muestra el átomo actual (la entrada); se apaga al bucear.
    if (i === 0) {
      const sub = el('text', { class: 'asub', x: '0', y: (NUC + 66).toFixed(0) });
      sub.textContent = `${cc.subN} capítulos · scrolleá para bucear ↓`;
      g.appendChild(sub);
    }
    atomsG.appendChild(g);
    atomEls.push(g);
    orbEls.push(orb);
  });

  // Órbita de sub-niveles: los electrones ENVUELVEN la card recorriendo un rect redondeado
  // que la abraza por fuera (el actual se resalta en su lugar, sin volar hasta arriba).
  const suborbit = el('svg', { class: 'suborbit', viewBox: '0 0 900 600' });
  // Los electrones se acomodan en fila fija, uno por sub-nivel, sobre un arco angosto pegado al
  // topbar (la "constelación" del recorrido). subArc es la curva punteada que los conecta.
  const subArc = el('path', { class: 'sub-arc' });
  // La vida del arco: un sonar respira alrededor del nodo actual (SMIL, no rAF — se mueve solo, sin
  // costo de JS). Es gratis en reposo: no depende de que el usuario interactúe para sentirse vivo.
  // Sonar chico (r10): en la barra izquierda, pegada a la espina "Signals", un sonar grande al
  // expandirse pisaba el wordmark cuando el sub-nivel actual caía a su altura. Ceñido al riel no lo toca.
  const subSonar = el('circle', { class: 'sub-sonar', r: 10 });
  // El sub-nivel actual es un MINI-ÁTOMO que sube el riel (el "electrón-ascensor"): sonar + núcleo +
  // un electrón orbitando. Se DESLIZA de una parada a la siguiente (transición de transform) y en el
  // boot aparece directo. Es el único marcador del actual (el dot de abajo se oculta), así el
  // resaltado "viaja" en vez de saltar. Distinto del riel de conceptos (plano): éste tiene vida.
  // El núcleo del sub-nivel actual: MÁS CHICO que la órbita (r12 < rx17) para que el electrón se vea
  // orbitando POR FUERA (si el núcleo es más grande, la órbita queda escondida detrás y se pierde la
  // identidad de átomo — era el bug). El path SMIL del electrón (abajo) matchea la órbita.
  const subPuckDot = el('circle', { class: 'sub-puck-dot', r: 12 });
  const subPuckOrbit = el('ellipse', { class: 'sub-puck-orbit', rx: 17, ry: 8 });
  const subPuckE = el('circle', { class: 'sub-puck-e', r: 3.4 });
  // El electrón recorre la órbita en loop (SMIL): la vida en reposo del ascensor. Con reduce se oculta.
  subPuckE.appendChild(
    el('animateMotion', {
      dur: '1.9s',
      repeatCount: 'indefinite',
      path: 'M 17 0 A 17 8 0 1 1 -17 0 A 17 8 0 1 1 17 0',
    }),
  );
  const subPuckNum = el('text', { class: 'sub-puck-n', y: 5 });
  const subPuckG = el('g', { class: 'sub-puck' });
  subPuckG.appendChild(subSonar);
  subPuckG.appendChild(subPuckOrbit);
  subPuckG.appendChild(subPuckDot);
  subPuckG.appendChild(subPuckE);
  subPuckG.appendChild(subPuckNum);
  const subEG = el('g', {});
  suborbit.appendChild(subArc);
  suborbit.appendChild(subEG);
  suborbit.appendChild(subPuckG);

  let orbitFor = -1;
  let subDots: SubDot[] = [];
  // Espejo del "el índice se ve": evita reescribir tabindex en cada frame del loop de órbita.
  let orbitFocusable = false;
  // ¿Hay que recalcular la geometría de la órbita? La constelación de sub-niveles está anclada al
  // topbar (estable): solo se mueve si algo se movió (scroll/resize/cambio de sub-nivel). Con este
  // flag, estando parado dentro de un concepto orbitLoop no fuerza reflow ni reescribe los dots.
  let orbitDirty = true;
  // SVGPoint reusable para las conversiones de coordenadas de orbitLoop (evita alocar uno por frame).
  const orbitPoint = suborbit.createSVGPoint();
  // Estado de la pelota: dónde quedó, para decidir snap (boot / concepto nuevo) vs glide (cambió
  // el sub-nivel dentro del mismo concepto).
  let puckIdx = -1;
  let puckConcept = -1;
  // Profundidad de buceo del frame actual (0 = molécula, 1 = adentro): render() la publica y
  // orbitLoop la lee para abrir la barra de sub-niveles hacia los bordes según cuánto entraste.
  let curDive = 0;

  // El orbe del sub-nivel nuevo NACE en el electrón actual y se fusiona al centro de la card.
  function fuse(cc: Concept): void {
    if (reduceMotion) return;
    const card = cc.card;
    if (!card) return;
    const flash = card.querySelector<HTMLElement>('.subflash');
    if (!flash) return;
    let dx = 0;
    let dy = 0;
    const dot = subDots[cc.subIdx]?.dot;
    if (dot) {
      const db = dot.getBoundingClientRect();
      const cb = card.getBoundingClientRect();
      dx = db.left + db.width / 2 - (cb.left + cb.width / 2);
      dy = db.top + db.height / 2 - (cb.top + cb.height / 2);
    }
    flash.style.transition = 'none';
    flash.style.opacity = '0.9';
    flash.style.transform = `translate(${dx.toFixed(0)}px,${dy.toFixed(0)}px) scale(0.3)`;
    void flash.offsetWidth;
    flash.style.transition = 'transform 0.95s cubic-bezier(.22,.68,.24,1), opacity 0.95s ease-out';
    flash.style.transform = 'translate(0px,0px) scale(2.2)';
    flash.style.opacity = '0';
  }

  function replay(node: Element | null, cls: string): void {
    if (!node) return;
    node.classList.remove(cls);
    void (node as HTMLElement).offsetWidth;
    node.classList.add(cls);
  }

  function renderSubCard(cc: Concept): void {
    const card = cc.card!;
    // Montar el componente REAL del sub-nivel actual, desmontando el del sub anterior.
    const host = card.querySelector<HTMLElement>('.subhost')!;
    cc.subDispose?.();
    host.textContent = '';
    const handle = mountSub(host, C.indexOf(cc), cc.subIdx);
    cc.subDispose = handle.dispose;
    // Re-estampar: cada mount trae su propio árbol nuevo (Angular no le pone el atributo
    // de encapsulación de integrada-vista), así que sin esto el CSS de armonización de
    // .subhost (h1/botones) nunca matchea nada.
    stampTree(host);
    // El nombre del sub-nivel viene del handle, no del DOM montado. Antes salía de
    // `host.querySelector('h1')`, y como ningún sub-nivel tiene <h1> propio, el primero que
    // encontraba era el del formulario de demo embebido: el topbar mostraba "Damian Sire!".
    cc.exampleTitle = handle.title ?? '';
    // Las dos animaciones de entrada leen geometría (`getBoundingClientRect` en `fuse`, el
    // `offsetWidth` que reinicia la transición en `replay`), y acá arriba se acaba de montar un
    // árbol de componentes entero: leerla con el layout sucio fuerza un recálculo sincrónico de
    // TODA la página. Medido con un trace: 630 ms de reflow forzado en el boot, casi todo acá.
    // Corren al frame siguiente, con el layout ya resuelto. Las dos duran ~1 s: arrancar un frame
    // más tarde no se ve, y el reflow deja de ser forzado.
    const subbody = card.querySelector('.subbody');
    // Solo para la card en pantalla: los vecinos que se montan de antemano están en opacidad 0, y la
    // entrada les costaba dos reflows y un blur que no veía nadie.
    raf(() => {
      if (C.indexOf(cc) !== liveConcept) return;
      fuse(cc);
      replay(subbody, 'warp');
    });
  }

  /**
   * Cuántos conceptos a cada lado del actual se mantienen montados. 1 alcanza: el vecino se monta
   * mientras todavía estás en el actual, así que llegás con la card ya llena.
   */
  const VENTANA_MONTAJE = 1;
  let drenajeAgendado = false;

  /** Los que están montados AHORA. La política (`mount-window`) decide sobre esto. */
  const montados = (): Set<number> => {
    const s = new Set<number>();
    C.forEach((cc, i) => {
      if (cc.subDispose) s.add(i);
    });
    return s;
  };

  function desmontarSub(cc: Concept): void {
    cc.subDispose?.();
    cc.subDispose = undefined;
    cc.exampleTitle = '';
    const host = cc.card?.querySelector<HTMLElement>('.subhost');
    if (host) host.textContent = '';
  }

  /**
   * Montar un sub-nivel es caro (createComponent + su primera detección de cambios + reflow) y
   * hacerlo dentro del frame de scroll es lo que produce el tirón. Solo el concepto que se está
   * MIRANDO se monta en el acto, porque si no se ve una card vacía; los vecinos y los desmontajes
   * se drenan fuera del frame, donde nadie los nota.
   */
  function asegurarMontajes(actual: number): void {
    const { montar, desmontar } = cambiosDeMontaje(actual, N, VENTANA_MONTAJE, montados());
    if (!montar.length && !desmontar.length) return;

    // El que se está mirando, ya. El resto puede esperar al drenaje.
    if (montar.includes(actual)) renderSubCard(C[actual]);
    if (montar.length === 1 && montar[0] === actual && !desmontar.length) return;

    if (drenajeAgendado) return;
    drenajeAgendado = true;
    later(() => {
      drenajeAgendado = false;
      const ahora = cambiosDeMontaje(liveConcept, N, VENTANA_MONTAJE, montados());
      for (const i of ordenarPorUrgencia(ahora.montar, liveConcept)) renderSubCard(C[i]);
      for (const i of ahora.desmontar) desmontarSub(C[i]);
    }, 0);
  }

  function subScrollTo(cc: Concept, k: number): void {
    const ci = C.indexOf(cc);
    goToUnit(stopS(ci, k));
  }

  // Construye los electrones UNA vez por concepto; su posición la maneja orbitLoop.
  function paintOrbit(cc: Concept): void {
    const col = COL[cc.accent];
    const nsub = cc.subN;
    subArc.setAttribute('stroke', col);
    subSonar.setAttribute('stroke', col);
    subPuckDot.setAttribute('fill', col);
    subPuckOrbit.setAttribute('stroke', col);
    // `color` para que el drop-shadow (currentColor) del glow constante del nodo activo tome el
    // color del concepto (ver .sub-puck-dot en el CSS).
    subPuckDot.style.color = col;
    subEG.textContent = '';
    subDots = [];
    for (let k = 0; k < nsub; k++) {
      // Cada parada del índice es un BOTÓN de verdad, no un adorno con listener: sin rol, foco ni
      // nombre accesible el índice era navegable sólo con mouse (con teclado quedaba únicamente el
      // avance secuencial por flechas/PageDown, sin poder saltar a un capítulo).
      const g = el('g', {
        class: 'sub-e',
        role: 'button',
        tabindex: '-1',
        'aria-label': `Sub-nivel ${k + 1} de ${cc.name}`,
      });
      const dot = el('circle', { class: 'sub-dot', cx: 450, cy: 90, r: 12 });
      const num = el('text', { class: 'sub-n', x: 450, y: 94 });
      num.textContent = String(k + 1);
      g.appendChild(dot);
      g.appendChild(num);
      const idx = k;
      g.addEventListener('click', () => subScrollTo(cc, idx));
      g.addEventListener('keydown', (ev) => {
        const e = ev as KeyboardEvent;
        if (e.key !== 'Enter' && e.key !== ' ') return;
        e.preventDefault(); // Space no debe scrollear la página al activar la parada.
        subScrollTo(cc, idx);
      });
      subEG.appendChild(g);
      subDots.push({ g, dot, num, lx: 450, ly: 90 });
    }
    updateOrbitFill(cc);
  }

  // 3 estados: pendiente (gris), ACTUAL (color del concepto + glow), VISTO (color aparte).
  function updateOrbitFill(cc: Concept): void {
    const col = COL[cc.accent];
    for (let k = 0; k < subDots.length; k++) {
      const o = subDots[k];
      const cur = cc.subIdx;
      const state = k === cur ? 'current' : k < cur ? 'visited' : 'pending';
      const sellado = subsEstablecidos.has(`${C.indexOf(cc)}/${k}`);
      o.g.setAttribute('class', 'sub-e ' + state + (sellado ? ' est' : ''));
      o.g.setAttribute(
        'aria-label',
        `Sub-nivel ${k + 1} de ${cc.name}${sellado ? ', establecido' : ''}`,
      );
      // La parada actual la dibuja el puck (su `g` va a opacidad 0), así que no puede ser un destino
      // de foco: el anillo quedaría invisible. Se marca con aria-current y sale del tab-order, igual
      // que todas cuando el índice todavía no se ve.
      o.g.setAttribute('tabindex', orbitFocusable && state !== 'current' ? '0' : '-1');
      if (state === 'current') o.g.setAttribute('aria-current', 'true');
      else o.g.removeAttribute('aria-current');
      // Espina de energía: los sub-niveles son ORBES en el conducto, teñidos del color del concepto.
      // VISITADO = orbe encendido (ya cargado), PENDIENTE = orbe tenue (sin cargar), ACTUAL = lo tapa el
      // átomo-puck. Inline style (no presentation attribute) porque el `fill` de `.sub-dot` en CSS lo
      // pisaría. La opacidad separa cargado de sin-cargar; el glow refuerza el "encendido".
      o.dot.setAttribute('r', String(state === 'current' ? 18 : state === 'visited' ? 8 : 6));
      o.dot.style.fill = col;
      // Establecido = sellado con un anillo de tinta. Es independiente de visitado/pendiente: un
      // sub-nivel puede estar resuelto y ser el de más adelante, y eso se tiene que ver igual.
      o.dot.style.stroke = sellado ? '#201d16' : 'none';
      o.dot.style.strokeWidth = sellado ? '2.5' : '0';
      if (state === 'pending') {
        o.dot.style.fillOpacity = '0.28';
        o.dot.removeAttribute('filter');
      } else {
        o.dot.style.fillOpacity = state === 'current' ? '1' : '0.92';
        o.dot.setAttribute('filter', 'url(#glow)');
      }
    }
  }

  // Constelación de sub-niveles: uno por sub-nivel sobre un arco fijo pegado al topbar, con la
  // pelota (sub-nivel actual) que desliza entre ellos. El arco está anclado al topbar (estable),
  // así que la geometría solo se recalcula cuando `orbitDirty` lo pide (scroll/resize/cambio de
  // sub-nivel): estando parado dentro de un concepto, el loop no fuerza reflow ni reescribe dots.
  function orbitLoop(): void {
    if (agenda.cerrado()) return;
    const vis = orbitFor >= 0 && subDots.length > 0 && (+suborbit.style.opacity || 0) > 0.05;
    // Las paradas son focusables; mientras el índice no se ve (vista molécula, landing) salen del
    // tab-order para no dejar tabs fantasma sobre controles invisibles. `inert` no sirve acá: es un
    // atributo de HTML y estas paradas son nodos SVG.
    if (vis !== orbitFocusable) {
      orbitFocusable = vis;
      if (vis) updateOrbitFill(C[orbitFor]);
      else for (const o of subDots) o.g.setAttribute('tabindex', '-1');
    }
    if (vis && orbitDirty) {
      orbitDirty = false;
      const cc = C[orbitFor];
      const nsub = subDots.length;
      const m0 = suborbit.getScreenCTM();
      if (m0 && cc.card) {
        const m = m0.inverse();
        const p = orbitPoint;
        const toSvg = (sx: number, sy: number): DOMPoint => {
          p.x = sx;
          p.y = sy;
          return p.matrixTransform(m);
        };
        // UNA sola barra vertical a la IZQUIERDA que MORPHea: en la vista molécula muestra los 12
        // conceptos (el riel .rail); al bucear, su cuerpo se absorbe y la barra se DESPLIEGA en los
        // sub-niveles del concepto actual. Una se transforma en la otra sobre el mismo eje.
        // El eje X del sub-track SIGUE al riel real (su borde izquierdo + el offset del eje), así queda
        // alineado con las paradas de concepto en cualquier viewport (el riel tiene margen responsivo).
        const railR = railEl?.getBoundingClientRect();
        const topbarBot = topbarEl ? topbarEl.getBoundingClientRect().bottom : 56;
        const barXpx = railR ? railR.left + 9 : 30;
        // Los sub-niveles se despliegan a lo largo del riel, con AIRE arriba/abajo (el margen evita que
        // el primero/último queden pegados a los bordes). Fallback al topbar/borde si aún no hay layout.
        const endTopPx = railR ? railR.top + 20 : topbarBot + 34;
        const endBotPx = railR ? railR.bottom - 20 : window.innerHeight - 44;
        // El morph se DESPLIEGA DESDE ARRIBA: el sub-nivel 1 (primero) queda FIJO en el borde de arriba
        // y los demás se abren hacia abajo a medida que entrás (`dd` 0→1, lo publica render()). Antes los
        // extremos arrancaban en la posición del concepto (media altura en los niveles del medio) y el
        // nodo activo viajaba por el CENTRO — se leía como "se va al centro". Anclando el tope arriba,
        // el primero nunca cruza el centro.
        const dd = Math.max(0, Math.min(1, (curDive - 0.35) / 0.5));
        const topY = toSvg(barXpx, endTopPx).y;
        const botY = toSvg(barXpx, lerp(endTopPx, endBotPx, dd)).y;
        const barX = toSvg(barXpx, (endTopPx + endBotPx) / 2).x;
        for (let k = 0; k < nsub; k++) {
          const o = subDots[k];
          o.lx = barX;
          o.ly = nsub > 1 ? topY + (botY - topY) * (k / (nsub - 1)) : (topY + botY) / 2;
          o.dot.setAttribute('cx', o.lx.toFixed(1));
          o.dot.setAttribute('cy', o.ly.toFixed(1));
          o.num.setAttribute('x', o.lx.toFixed(1));
          o.num.setAttribute('y', (o.ly + 4).toFixed(1));
        }
        // El riel es la línea vertical (subArc repurposeado) del primer al último electrón: el "hilo de
        // energía" por el que sube el electrón-actual.
        subArc.setAttribute(
          'd',
          `M ${barX.toFixed(1)} ${subDots[0].ly.toFixed(1)} L ${barX.toFixed(1)} ${subDots[nsub - 1].ly.toFixed(1)}`,
        );
      }
      // La pelota se coloca sobre el dot actual: en el boot / cambio de concepto aparece DIRECTO
      // (transición apagada), y al cambiar de sub-nivel DENTRO del concepto DESLIZA (la transición
      // de transform la hace el CSS).
      const curDot = subDots[cc.subIdx];
      if (curDot) {
        const boot = puckConcept !== orbitFor || puckIdx < 0;
        if (boot || puckIdx !== cc.subIdx) {
          const to = `translate(${curDot.lx.toFixed(1)},${curDot.ly.toFixed(1)})`;
          if (boot) {
            subPuckG.style.transition = 'none';
            subPuckG.setAttribute('transform', to);
            void suborbit.getBoundingClientRect();
            subPuckG.style.transition = '';
          } else {
            subPuckG.setAttribute('transform', to);
          }
          subPuckNum.textContent = String(cc.subIdx + 1);
          puckIdx = cc.subIdx;
          puckConcept = orbitFor;
        }
      }
    }
  }
  // orbitLoop corre ON-DEMAND, no en un rAF perpetuo a 60fps que quemaba CPU aun en reposo: se agenda
  // un ÚNICO frame cuando algo cambió (scroll/resize/cambio de sub-nivel, vía `requestOrbit`). Estando
  // parado no hay ningún wakeup. La transición del puck entre paradas la hace el CSS, no el loop.
  let orbitRaf = 0;
  const requestOrbit = (): void => {
    if (orbitRaf || agenda.cerrado()) return;
    orbitRaf = requestAnimationFrame(() => {
      orbitRaf = 0;
      orbitLoop();
    });
  };

  // Aura del concepto: al bucear, el átomo actual "crece" y se vuelve el fondo de color
  // donde vive el ejemplo, así el card no aparece como un rectángulo suelto sino nacido del
  // átomo. Su color y su escala/opacidad las maneja render() según el concepto y el diveDepth.
  const diveAura = document.createElement('div');
  diveAura.className = 'dive-aura';
  stamp(diveAura);
  contentEl.appendChild(diveAura);

  // ---- Contenido de cada concepto: cada sub-nivel embebe el componente REAL del nivel ----
  C.forEach((cc) => {
    const card = document.createElement('div');
    // Todos los conceptos usan el tratamiento "disolver el marco": la card no es una ventana, el
    // nivel/sub-nivel viven en el riel, el topbar y la órbita (sin header meta dentro de la card).
    card.className = 'card live card--sub card--dissolve';
    // La card NUNCA lleva transform: la pista de la mascota es un overlay `position: fixed` dentro de
    // la card, y CUALQUIER transform (incluido el viejo pop de escala 0.97→1) la vuelve el bloque
    // contenedor de ese fixed y la mascota se anclaba al centro de la card al cambiar de sub-nivel.
    // Sin transform ancla siempre a la esquina del viewport; la card entra solo por opacidad (fade).
    card.style.transform = 'none';
    card.style.setProperty('--glow', COL[cc.accent]);
    card.innerHTML = `<span class="subflash"></span><div class="subbody"><div class="subhost"></div></div>`;
    contentEl.appendChild(card);
    cc.card = card;
    stamp(card);
    stampTree(card); // estampar ANTES de montar el componente real (para no tocar sus internals)
    cc.subIdx = 0;
    // El contenido NO se monta acá. Montar los 12 sub-niveles de una, antes del primer frame útil,
    // costaba un frame de ~835ms (medido en dev): doce createComponent con su primera detección de
    // cambios y su reflow, en bloque, para once cards que todavía no se ven. Los monta `render()`
    // por proximidad.
  });

  // Salvo el concepto donde ABRE el recorrido, que se monta ya: es el único que se ve en el primer
  // frame, y esperar al primer `render()` deja su card vacía a la vista. Uno, no doce.
  {
    renderSubCard(C[conceptoDeApertura]);
  }
  contentEl.appendChild(suborbit);

  // ---- Onda reactiva al nacer un átomo ----
  function ripat(i: number): void {
    if (reduceMotion) return;
    const r = el('circle', {
      class: 'ripple',
      cx: C[i].x,
      cy: C[i].y,
      r: NUC + 8,
      stroke: COL[C[i].accent],
    });
    ripG.appendChild(r);
    later(() => r.remove(), 810);
  }
  // Arranca en null (y no en true) para que el primer render avise siempre, sin depender de
  // adivinar en qué estado nace la landing.
  let ultimaIntroVisible: boolean | null = null;
  let lastBorn = 0;
  // Último (nivel, sub-nivel) reportado a la URL, para no reescribirla en cada frame.
  let whereC = -2;
  let whereSub = -2;
  function propagate(idx: number, rev: number): void {
    ripat(idx);
    for (let j = 0; j < rev; j++) {
      const a = atomEls[j];
      later(
        () => {
          a.classList.add('pulse');
          later(() => a.classList.remove('pulse'), 480);
        },
        Math.abs(idx - j) * 60,
      );
    }
  }

  const capS = q<HTMLElement>('#capS')!;
  const stage = q<HTMLDivElement>('#stage')!;

  /**
   * Conceptos ya establecidos: los 37 sub-niveles cierran con su desafío, así que TODOS los enlaces
   * nacen al resolver y ninguno se enciende por pasar scrolleando. Alcanza con establecer un
   * sub-nivel del concepto: el enlace marca que entendiste el tramo, no que lo completaste entero.
   */
  const established = new Set<number>();
  /** Sub-niveles establecidos ("concepto/sub"), para sellar su parada en la barra de sub-niveles. */
  const subsEstablecidos = new Set<string>(partida?.establecidos ?? []);
  for (const id of subsEstablecidos) {
    const concepto = Number(id.split('/')[0]);
    if (Number.isInteger(concepto) && concepto >= 0 && concepto < C.length)
      established.add(concepto);
  }
  // Arranca en el concepto donde ABRE el recorrido, no en 0: la entrada de la card inicial (el `raf`
  // de renderSubCard) se cancela si su card no es la del concepto vivo, y con un deep-link a otro
  // concepto no corría nunca: la pista de la mascota quedaba invisible pero clickeable.
  let liveConcept = conceptoDeApertura;
  /**
   * Un deslizamiento largo del riel (del 0 al 11) atraviesa todos los conceptos del medio en 620 ms.
   * Mientras dura, `render` no monta componentes ni cambia de sub-nivel ni escribe la URL: eran
   * decenas de `createComponent` sincrónicos para cards que asoman un cuadro, justo el tirón que la
   * ventana de montaje existe para evitar. El `render` del final, ya asentado, hace todo eso una vez.
   */
  let enTransito = false;
  const track = q<HTMLDivElement>('#track')!;
  const railFillEl = q<HTMLElement>('#railFill');
  const railLineEl = q<HTMLElement>('.rail-line');
  const railEl = q<HTMLElement>('.rail');
  const introEl = q<HTMLElement>('.intro');
  const topbarEl = q<HTMLElement>('.topbar');
  const tbLinksEl = q<HTMLElement>('.tb-links');
  const tbTitleEl = q<HTMLElement>('.tb-title');
  const tbCenterEl = q<HTMLElement>('.tb-center');
  const tbCountEl = q<HTMLElement>('.tb-count');
  const captionEl = q<HTMLElement>('.caption');
  const spaceSpineEl = q<HTMLElement>('#spaceSpine');
  const railHeadEl = q<HTMLElement>('.rail-head');
  const recGuideEl = q<HTMLElement>('.rec-guide');
  const recGuideBubbleEl = q<HTMLElement>('.rec-guide__bubble');
  const railCountEl = q<HTMLElement>('#railCount');
  const tbQEl = q<HTMLElement>('#tbQ');
  const railSegEl = q<HTMLElement>('#railSeg');
  const railTicksOl = q<HTMLElement>('#railTicks')!;

  // Los 12 conceptos, agrupados en 3 ACTOS (chunking tipo battle-pass). Un acto arranca en su
  // primer concepto; el motor inserta la cabecera antes de esa parada. Índices atados a RAW.
  const ACTS: { at: number; label: string }[] = [
    { at: 0, label: 'Acto I · quién avisa' },
    { at: 4, label: 'Acto II · con qué precisión' },
    { at: 7, label: 'Acto III · el aparato completo' },
  ];

  // Barra segmentada del progreso (una marca por concepto): render() enciende las de los ya hechos.
  const railSegs: HTMLElement[] = [];
  for (let i = 0; i < N; i++) {
    const seg = document.createElement('i');
    stamp(seg);
    railSegEl?.appendChild(seg);
    railSegs.push(seg);
  }

  // Paradas del riel: número + nombre por concepto, con su marca-átomo (el actual = átomo vivo), el
  // badge "estás acá" y el trofeo del capstone (Zoneless). render() les pone hecho / estás acá /
  // bloqueado. Las cabeceras de acto se intercalan en el mismo <ol> (aria-hidden, decorativas).
  const railStops: HTMLElement[] = [];
  const railStopBtns: HTMLButtonElement[] = [];
  for (let i = 0; i < N; i++) {
    const act = ACTS.find((a) => a.at === i);
    if (act) {
      const h = document.createElement('li');
      h.className = 'rail-act';
      h.textContent = act.label;
      // Rótulo visual de agrupación: el nombre real del concepto ya viaja en el aria-label de cada
      // botón, así que la cabecera no se anuncia por separado (evita duplicar en lectores de pantalla).
      h.setAttribute('aria-hidden', 'true');
      stamp(h);
      railTicksOl.appendChild(h);
    }
    const li = document.createElement('li');
    li.className = 'rail-stop';
    li.style.setProperty('--nc', COL[C[i].accent]);
    // Marca especial de la parada. El final ya tenía su trofeo; el 6 (`resource`) suma el suyo
    // porque es el PICO del medio: es donde el sistema deja de ser sincrónico y el dato empieza a
    // tardar. Con 12 paradas, el medio es donde la información se muere si todas se tratan igual.
    // Reusa la clase del trofeo a propósito: es el mismo slot, y no cuesta CSS nueva.
    const mark = i === N - 1 ? '🏆' : i === CONCEPTO_PICO ? '◆' : '';
    const trophy = mark ? `<span class="rail-trophy" aria-hidden="true">${mark}</span>` : '';
    // Cada parada es un BOTÓN real: click (y Enter/Espacio) navega al concepto. Antes el riel era
    // decorativo (aria-hidden) y solo se navegaba por scroll/teclado ↑↓; ahora también saltás tocando
    // el índice. La marca-átomo va aria-hidden: es decoración, el nombre lo lleva el aria-label.
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'rail-stop-btn';
    const rol =
      i === N - 1 ? ', el cierre' : i === CONCEPTO_PICO ? ', donde el dato empieza a tardar' : '';
    btn.setAttribute('aria-label', `Ir al concepto ${i}: ${C[i].name}${rol}`);
    btn.innerHTML =
      `<span class="rail-mark" aria-hidden="true"><i class="rail-halo"></i><i class="rail-orb"></i><i class="rail-core"></i></span>` +
      `<span class="rail-num">${i}</span>` +
      `<span class="rail-name">${C[i].name}</span>` +
      trophy +
      `<span class="rail-badge">estás acá</span>`;
    // Salta al ENCUADRE del átomo del concepto (misma parada que el deep-link `?nivel=i`): desde ahí
    // se bucea scrolleando. goToUnit ya sincroniza la URL y respeta reduced-motion.
    btn.addEventListener('click', () => goToUnit(off[i] + PARADA_ATOMO));
    li.appendChild(btn);
    stamp(li);
    stampTree(li);
    railTicksOl.appendChild(li);
    railStops.push(li);
    railStopBtns.push(btn);
  }

  // ---- render(s): dibuja el estado del recorrido en la posición de scroll s (0..TOTAL) ----
  function render(sIn: number): void {
    const s = Math.max(0, Math.min(TOTAL - 0.0001, sIn));
    let c = 0;
    while (c < N - 1 && s >= off[c] + len[c]) c++;
    const w = s - off[c];
    const parent = c > 0 ? C[c - 1] : { x: CX, y: CY };
    const birth = smoothstep(Math.max(0, Math.min(1, w / 0.7)));

    // Cámara: nace → wide → bucea al átomo; en la zona de sub-niveles (w>=2) se queda adentro.
    // La matemática vive en `cameraAt` (pura, testeada); acá solo se aplica al DOM.
    const { K, fx, fy, diveDepth } = cameraAt(w, c === 0, {
      W: wideK(c),
      cen: frameCenter(c),
      target: C[c],
      parent,
    });
    // En la vista molécula la escena se corre a la derecha (PANEL_SHIFT) para despejar el panel del
    // recorrido; al bucear (diveDepth→1) el shift se apaga y el átomo actual queda centrado bajo la card.
    // En pantallas angostas el panel se colapsa a un riel fino (CSS), así que no hace falta correr nada.
    const shiftNow = window.innerWidth <= 820 ? 0 : PANEL_SHIFT;
    const frameShift = shiftNow * (1 - diveDepth);
    sceneG.setAttribute(
      'transform',
      `translate(${(CX + frameShift - K * fx).toFixed(1)},${(300 - K * fy).toFixed(1)}) scale(${K.toFixed(3)})`,
    );
    // La cámara ya centró y agrandó el átomo detrás de la card (K llega a FK=2.7). La card no es
    // una ventana sino el interior del átomo: al bucear la escena casi no se atenúa (molécula viva,
    // sin velo) y el aura crece para volverse la sala, así la card se lee "parada sobre el átomo".
    sceneG.style.opacity = (1 - 0.1 * diveDepth).toFixed(2);
    curDive = diveDepth; // publicar para orbitLoop (apertura de la barra hacia los bordes)

    // El aura del concepto crece desde el átomo (chica) hasta el fondo del card (grande),
    // tomando el color del concepto: el card queda "nacido" del átomo, no suelto.
    diveAura.style.setProperty('--glow', COL[C[c].accent]);
    // 0.72 (antes 0.92): a pleno buceo el aura teñía el viewport entero y el color del concepto
    // pasaba de identificar a dominar, comiéndole contraste al contenido (los chips y el código
    // peleaban contra el fondo). Sigue leyéndose que la card nace del átomo, sin gritar.
    diveAura.style.opacity = (0.72 * diveDepth).toFixed(3);
    diveAura.style.transform = `scale(${(0.5 + 1.15 * diveDepth).toFixed(3)})`;
    // El topbar deja de ser chrome tenue: su centro muestra el TÍTULO del sub-ejemplo actual
    // (promovido desde el h1 del demo) con protagonismo, así que se mantiene presente al bucear.
    // El riel se atenúa y el caption inferior se va.
    if (topbarEl) {
      topbarEl.classList.add('contextual');
      // En la landing (s≈0) el topbar se atenúa como el título: su banda y "Practicá" no deben flotar
      // sobre la portada (ni cruzar como franja clara el intro en tema oscuro). Gana presencia al
      // scrollear y, al bucear (s alto), queda en 1.
      topbarEl.style.opacity = Math.max(0, Math.min(1, (s - 0.03) / 0.09)).toFixed(2);
    }
    // Como el índice: invisibles en la landing, sus controles (bitácora, práctica, pausa) no pueden
    // quedar en el tab-order ni recibir clicks. Va sobre los links y no sobre el topbar, cuyo `inert`
    // maneja la intro mientras no se elige clima.
    const linksApagados = s < INTRO_HASTA;
    if (tbLinksEl && tbLinksEl.inert !== linksApagados) tbLinksEl.inert = linksApagados;
    // En la pantalla inicial (overlay de bienvenida, s≈0) el título del topbar (el tagline del concepto
    // 0, "Cómo la pantalla sabe qué cambió") competía con el "Angular Signals" del intro. Se oculta
    // hasta que empezás a scrollear, desvaneciéndose a la par que el intro.
    if (tbCenterEl)
      tbCenterEl.style.opacity = Math.max(0, Math.min(1, (s - 0.03) / 0.09)).toFixed(2);
    // El riel hace ZOOM-IN al bucear: en vez de desvanecer el cuerpo entero de golpe (se leía como un
    // CORTE), los ticks se SEPARAN alrededor del concepto activo (que queda fijo) y crecen, los lejanos
    // salen del cuadro, mientras se apagan y el track de concepto se desvanece; su lugar lo toma la barra
    // de sub-niveles. Da la sensación de "meterse" en el concepto (antes se COMPRIMÍAN hacia el activo,
    // que se leía al revés).
    // `railProg` (0..1) = avance por la escala de conceptos, anclado a la posición de los ticks (no al
    // scroll continuo, que desalineaba porque cada concepto ocupa distinto scroll según sus sub-niveles).
    const railProg = Math.min(
      1,
      (c + Math.max(0, Math.min(1, (w - PARADA_ATOMO) / Math.max(0.8, len[c] - 1)))) / (N - 1),
    );
    // Fade de los ticks ADELANTADO respecto a la aparición de los sub-niveles (suborbit, 0.35→0.75):
    // los conceptos hacen zoom y se apagan primero, y los sub-niveles entran después, para que el punto
    // medio del morph no muestre las dos escalas pisadas a la vez.
    const morphT = Math.max(0, Math.min(1, (diveDepth - 0.15) / 0.35));
    // El panel nombrado se DESVANECE al bucear (cross-fade con la barra de sub-niveles que se abre en
    // el mismo eje); el eje queda visible. Antes los ticks
    // hacían zoom-spread, que no encaja en filas con número + nombre.
    if (railHeadEl) railHeadEl.style.opacity = (1 - morphT).toFixed(3);
    railTicksOl.style.opacity = (1 - morphT).toFixed(3);
    // Los botones del índice sólo son interactivos con el panel de conceptos presente: no en la
    // landing (intro tapando, s<0.12) ni al bucear (morphT→1, los ticks se desvanecen). `inert` los
    // saca del foco y de los clicks cuando no se ven, así no hay tabs ni clicks fantasma sobre ellos.
    railTicksOl.inert = s < INTRO_HASTA || morphT > 0.5;
    if (railLineEl) railLineEl.style.opacity = (0.5 * (1 - morphT)).toFixed(3);
    if (captionEl) captionEl.style.opacity = Math.max(0, 1 - diveDepth / 0.5).toFixed(2);
    // Título vertical del concepto (espina de identidad) pegado al riel: aparece al bucear, con
    // el color del concepto. Es la casa del nombre en la escena.
    if (spaceSpineEl) {
      ponerTexto(spaceSpineEl, C[c].name);
      spaceSpineEl.style.setProperty('--glow', COL[C[c].accent]);
      spaceSpineEl.style.opacity = Math.min(1, diveDepth / 0.55).toFixed(2);
    }

    // La mascota-guía acompaña la vista mapa: su globo da el tip del concepto actual. Se apaga al
    // bucear (adentro mandan la card y la espina) y mientras el intro está visible (s < INTRO_HASTA).
    if (recGuideEl) {
      if (recGuideBubbleEl && recGuideBubbleEl.textContent !== C[c].tip) {
        recGuideBubbleEl.textContent = C[c].tip;
      }
      recGuideEl.style.opacity = (s < INTRO_HASTA ? 0 : Math.max(0, 1 - diveDepth / 0.5)).toFixed(
        2,
      );
    }

    const dc = C[c];
    if (dc.subN > 0 && !enTransito) {
      const M = dc.subN;
      const si = w < 2 ? 0 : Math.min(M - 1, 1 + Math.floor(w - 2));
      if (dc.subIdx !== si) {
        dc.subIdx = si;
        renderSubCard(dc);
        if (orbitFor === c) updateOrbitFill(dc);
      }
    }
    // Título del topbar: antes de bucear (vista molécula) enmarca el nivel con su tagline; adentro,
    // el título del sub-ejemplo actual. Va DESPUÉS de renderSubCard para leer el exampleTitle recién
    // montado (si no, va un sub-nivel atrasado). Si el sub-nivel no tiene h1 propio, cae al tagline
    // del nivel (no al nombre, que ya está en la espina vertical).
    if (tbTitleEl) {
      ponerTexto(
        tbTitleEl,
        diveDepth > 0.5 ? dc.exampleTitle || dc.tagline || dc.name : dc.tagline || dc.name,
      );
    }
    // El contador de sub-nivel vive a nivel del título (en el topbar, como prefijo), no adentro
    // de la card. Solo cuando estás en un sub-ejemplo (buceado).
    if (tbCountEl) {
      ponerTexto(tbCountEl, diveDepth > 0.5 && dc.subN > 1 ? `${dc.subIdx + 1} / ${dc.subN}` : '');
    }
    // El ascensor solo tiene sentido con una SERIE de sub-niveles; con uno solo (p.ej. Zoneless) no
    // hay "dónde vas de N", así que no se muestra (ni el contador 1/1). El componente igual se monta.
    if (dc.subN > 1 && diveDepth > 0.35) {
      if (orbitFor !== c) {
        paintOrbit(dc);
        orbitFor = c;
      }
      suborbit.classList.add('on');
      // Se oculta el anillo punteado (deja solo los electrones): con la card sin marco, el rect
      // punteado se leería como el borde de una ventana.
      suborbit.classList.add('dissolve');
      suborbit.style.opacity = Math.min(1, (diveDepth - 0.35) / 0.4).toFixed(2);
    } else if (orbitFor !== -1) {
      suborbit.classList.remove('on');
      suborbit.style.opacity = '0';
      orbitFor = -1;
    }

    // Al bucear se apagan TODOS los nombres de átomo (el título vive en la card); ver el CSS #atoms.diving.
    atomsG.classList.toggle('diving', diveDepth > 0.4);
    // Los átomos anteriores y los enlaces se retiran al asentar el sub-nivel. Del todo apagados, además
    // se ocultan y los enlaces dejan de fluir: una animación infinita en opacidad 0 es trabajo que
    // nadie ve.
    const vecinos = opacidadDeVecinos(diveDepth);
    bondsG.style.opacity = vecinos.toFixed(3);
    sceneG.classList.toggle('vecinos-fuera', vecinos === 0);
    atomEls.forEach((g, i) => {
      const orb = orbEls[i];
      // El nombre del átomo se desvanece al bucear: su rol de etiqueta lo toma el título promovido
      // dentro de la card, no debe repetirse en la escena. Solo el actual.
      g.classList.toggle('dived-dissolve', i === c && diveDepth > 0.4);
      // El concepto anterior INMEDIATO se realza mientras buceás: es el "de dónde venís", y con sus
      // anillos punteados a 0.45 se leía como un fantasma. Al asentar se retira con los demás.
      g.classList.toggle('peek-prev', i === c - 1 && diveDepth > 0.4);
      if (i < c) {
        g.classList.add('on');
        g.classList.remove('current');
        g.setAttribute('transform', `translate(${C[i].x},${C[i].y})`);
        orb.style.transform = 'scale(1)';
        g.style.opacity = vecinos.toFixed(3);
      } else if (i === c) {
        g.classList.add('on');
        g.classList.toggle('current', w > 0.45);
        const px = lerp(parent.x, C[i].x, birth);
        const py = lerp(parent.y, C[i].y, birth);
        g.setAttribute('transform', `translate(${px.toFixed(1)},${py.toFixed(1)})`);
        orb.style.transform = `scale(${(0.42 + 0.58 * birth).toFixed(3)})`;
        g.style.opacity = (0.4 + 0.6 * birth).toFixed(2);
      } else {
        g.classList.remove('on', 'current');
        g.style.opacity = '0';
      }
    });

    liveConcept = c;
    if (!enTransito) asegurarMontajes(c);
    bondEls.forEach((ln, j) => {
      if (j + 1 < c) {
        // El enlace nace al establecer, no al pasar scrolleando: la molécula se une porque
        // entendiste. Sin resolver queda punteado, como deuda a la vista.
        ln.classList.toggle('on', established.has(j));
        ln.setAttribute('d', bondPath(C[j].x, C[j].y, C[j + 1].x, C[j + 1].y));
      } else if (j + 1 === c) {
        ln.classList.toggle('on', birth > 0.12);
        ln.setAttribute(
          'd',
          bondPath(
            C[j].x,
            C[j].y,
            lerp(parent.x, C[j + 1].x, birth),
            lerp(parent.y, C[j + 1].y, birth),
          ),
        );
      } else {
        ln.classList.remove('on');
      }
    });

    C.forEach((cc, i) => {
      const cs = off[i];
      const ce = off[i] + len[i];
      let amt: number;
      if (s < cs + PARADA_ATOMO) amt = 0;
      else if (s < cs + 2) amt = (s - (cs + PARADA_ATOMO)) / 0.7;
      else if (s < ce) amt = 1;
      else amt = 1 - (s - ce) / 0.5;
      amt = Math.max(0, Math.min(1, amt));
      const card = cc.card!;
      card.style.opacity = amt.toFixed(2);
      // Cada card embebe el componente real del sub-nivel: siempre interactivo cuando está visible.
      const live = amt > 0.6;
      card.style.pointerEvents = live ? 'auto' : 'none';
      // Las 12 cards están pre-montadas en el DOM; las que no son la visible quedan `inert` para que
      // sus controles (inputs, botones de los demos) no sean alcanzables por Tab ni por lectores de
      // pantalla mientras están ocultas. Solo la card viva participa del tab-order y del árbol de a11y.
      card.inert = !live;
    });

    if (w > 0.7 && lastBorn < c + 1) {
      propagate(c, c + 1);
      lastBorn = c + 1;
    }
    if (s < 0.05) lastBorn = 0;
    // El nombre del concepto ya vive en el label del átomo y en el topbar: el caption solo marca el
    // MODO (evita la triple repetición del nombre en la vista molécula).
    ponerTexto(capS, diveDepth > 0.5 ? 'Adentro' : 'Molécula');
    // El llenado del eje se ancla a la posición del concepto activo (progreso del recorrido).
    if (railFillEl) railFillEl.style.transform = `scaleY(${railProg.toFixed(3)})`;
    // Contador goal-gradient ("te faltan N") + segmentos + estado por parada: hecho / estás acá /
    // bloqueado. `done = c` (conceptos previos), `here = c`, y "te faltan" cuenta el actual + los que faltan.
    // El hilo de punta a punta: la pregunta acompaña el recorrido y en el último capítulo se
    // transforma en la respuesta, en el mismo lugar, sin que aparezca un cartel nuevo. En la
    // landing no va: todavía no la hicimos.
    if (tbQEl) {
      const enElCierre = c === N - 1;
      const texto =
        s < INTRO_HASTA ? '' : enElCierre ? 'Quien lee, avisa.' : '¿Quién le avisó a la pantalla?';
      ponerTexto(tbQEl, texto);
      tbQEl.classList.toggle('tb-q--answered', enElCierre);
    }

    // "te faltan N" era un contador de pendientes: presiona a completar en un recorrido que se
    // presenta como una investigación, y lo que la app HACE le gana a lo que dice. Ahora nombra la
    // deuda real (lo que quedó sin establecer) en vez de apurar, y cuenta lo que entendiste, no
    // hasta dónde scrolleaste.
    if (railCountEl) {
      const pendientes = N - established.size;
      ponerTexto(
        railCountEl,
        pendientes === 0 ? 'todo establecido' : `${pendientes} sin establecer`,
      );
    }
    for (let si = 0; si < railSegs.length; si++) railSegs[si].classList.toggle('on', si < c);
    for (let si = 0; si < railStops.length; si++) {
      const st = railStops[si];
      st.classList.toggle('done', si < c);
      st.classList.toggle('here', si === c);
      st.classList.toggle('lock', si > c);
      // aria-current marca el concepto actual para lectores de pantalla (paso del recorrido).
      if (si === c) railStopBtns[si].setAttribute('aria-current', 'step');
      else railStopBtns[si].removeAttribute('aria-current');
    }
    if (introEl) {
      const introVisible = s < INTRO_HASTA;
      introEl.style.opacity = introVisible ? '1' : '0';
      // El intro ahora tiene controles interactivos (Tusi): al desvanecerse no debe capturar clicks
      // sobre el recorrido que quedó debajo.
      introEl.style.pointerEvents = introVisible ? '' : 'none';
      if (introVisible !== ultimaIntroVisible) {
        ultimaIntroVisible = introVisible;
        onIntroVisible?.(introVisible);
      }
    }
    // En la landing (intro "Primera luz" + hero) el panel del recorrido queda OCULTO: es rico (nombres,
    // actos, contador) y a media opacidad competía con la entrada. Aparece al empezar a scrollear el
    // recorrido. Fade propio del `.rail` entero (independiente del morph interno).
    if (railEl) railEl.style.opacity = Math.min(1, s / 0.14).toFixed(2);

    // Reflejar en la URL el nivel actual y, si estás adentro, el sub-nivel. -1 = vista molécula. Se
    // keyea por `diveDepth > 0.5` (el mismo umbral que el título del topbar), NO por `w > 1.3`: en la
    // parada de encuadre del átomo (w≈1.3) el `>` estricto flipeaba por redondeo sub-pixel y dejaba la
    // URL/caption en "sub-nivel 1 / Adentro" con la card ya disuelta. Así el estado reportado = el visual.
    const subNow = diveDepth > 0.5 && dc.subN > 0 ? dc.subIdx : -1;
    // En la landing (hero visible, s < INTRO_HASTA) todavía no entraste al recorrido: reportamos concepto -1
    // para que la URL quede LIMPIA (`/`) en el arranque, no `?nivel=0`. Apenas empezás, ya refleja el nivel.
    const cForUrl = s < INTRO_HASTA ? -1 : c;
    if (!enTransito && (whereC !== cForUrl || whereSub !== subNow)) {
      whereC = cForUrl;
      whereSub = subNow;
      onWhere(cForUrl, subNow);
    }

    // La vista se movió (scroll/nav/cambio de sub-nivel): marcamos la órbita como sucia y agendamos
    // un frame para recalcularla. Estando parado, render() no corre → no se agenda nada.
    orbitDirty = true;
    requestOrbit();
  }

  // ---- Scroll 100% NATIVO + snap ----
  // El navegador maneja el scroll (suave y familiar). Anclas invisibles con
  // scroll-snap-stop: always hacen que un gesto largo de trackpad frene en CADA
  // parada (inicio, átomo de cada concepto, cada sub-nivel) en vez de saltear varias.
  const unit = (): number => stage.clientHeight;
  const stopS = (c: number, k: number): number => off[c] + subStopOffset(k);

  // Desliza el recorrido hasta una parada (nivel/sub-nivel) con una animación propia por rAF.
  // NO usamos `scrollTo({behavior:'smooth'})`: con `scroll-snap-type: mandatory` el navegador
  // lo descarta y el contenedor no se mueve (la flecha no navegaría). Movemos `scrollTop`
  // nosotros con easing y renderizamos cada cuadro (así la cámara acompaña el desplazamiento);
  // apagamos el snap durante la animación y lo restauramos al asentar en la parada exacta, que
  // ya es un punto de snap, así no hay reajuste visible. Con `prefers-reduced-motion` o un
  // salto nulo vamos directo, sin animar.
  const easeInOut = (p: number): number => (p < 0.5 ? 2 * p * p : 1 - Math.pow(-2 * p + 2, 2) / 2);
  let scrollAnimId = 0;
  /** Ya navegó (flecha, riel o gesto): a partir de ahí la posición de apertura no se reimpone. */
  let usuarioMovio = false;
  function goToUnit(u: number): void {
    cancelAnimationFrame(scrollAnimId);
    usuarioMovio = true;
    enTransito = false;
    // Cancelar la animación en curso deja huérfano el scrollSnapType:'none' que ella había puesto:
    // el tick que lo iba a restituir ya no corre más. Se restituye acá, antes de decidir si esta
    // llamada anima o no, porque las dos salidas cortas de abajo (reduced-motion, o destino a menos
    // de 1px) hacían `return` sin tocarlo y el snap quedaba apagado para el resto de la sesión.
    stage.style.scrollSnapType = '';
    const to = u * unit();
    const from = stage.scrollTop;
    const dist = to - from;
    if (reduceMotion || Math.abs(dist) < 1) {
      stage.scrollTop = to;
      render(u);
      return;
    }
    stage.style.scrollSnapType = 'none';
    enTransito = true;
    // Duración proporcional a la distancia, acotada: pasos cortos (sub-niveles contiguos) no se
    // arrastran y saltos largos (cambio de concepto) no vuelan.
    const dur = Math.min(620, 220 + Math.abs(dist) * 0.35);
    let start = -1;
    const tick = (ts: number): void => {
      if (agenda.cerrado()) return;
      if (start < 0) start = ts;
      const p = Math.min(1, (ts - start) / dur);
      const top = from + dist * easeInOut(p);
      stage.scrollTop = top;
      render(top / unit());
      if (p < 1) {
        scrollAnimId = requestAnimationFrame(tick);
      } else {
        stage.scrollTop = to; // asentar exacto en la parada
        enTransito = false;
        render(u);
        stage.style.scrollSnapType = '';
      }
    };
    scrollAnimId = requestAnimationFrame(tick);
  }

  const snaps = document.createElement('div');
  snaps.className = 'snaps';
  snaps.setAttribute('aria-hidden', 'true');
  stamp(snaps);
  for (const s of snapStops(C.map((c) => c.subN || null))) {
    const a = document.createElement('div');
    a.className = 'snap snap--stop';
    // El % del ancla mapea la unidad de scroll `s` contra el ALTO del track, que mide
    // (TOTAL + TRACK_TAIL) unidades. Con un divisor distinto (antes 0.2) el snap descansaba en un
    // scrollTop que, releído como `s`, quedaba inflado: en la parada de intro al concepto (off[c]+1.3)
    // la card recibía opacidad residual (fantasma detrás de la molécula) y la espina asomaba sobre el
    // índice. Con el mismo divisor que el track, el ancla cae en su unidad exacta y en reposo amt=0.
    a.style.top = ((s / (TOTAL + TRACK_TAIL)) * 100).toFixed(3) + '%';
    stamp(a);
    snaps.appendChild(a);
  }
  track.appendChild(snaps);

  // Un gesto propio durante el deslizamiento lo corta: seguir escribiendo scrollTop 620 ms le peleaba
  // la rueda al usuario, con el snap apagado. Se devuelve el snap y el scroll nativo sigue solo.
  const onGesto = (): void => {
    usuarioMovio = true;
    if (!enTransito) return;
    cancelAnimationFrame(scrollAnimId);
    enTransito = false;
    stage.style.scrollSnapType = '';
    render(stage.scrollTop / unit());
  };

  let ticking = false;
  const onScroll = (): void => {
    if (ticking) return;
    ticking = true;
    raf(() => {
      ticking = false;
      render(stage.scrollTop / unit());
    });
  };
  const onResize = (): void => {
    track.style.height = (TOTAL + TRACK_TAIL) * unit() + 'px';
    // El snap reencaja la parada solo, pero la escena (el encuadre angosto/ancho, la cámara) quedaba
    // dibujada con la geometría vieja hasta el próximo scroll.
    render(stage.scrollTop / unit());
    orbitDirty = true; // cambió la geometría: que orbitLoop reubique la constelación
    requestOrbit();
  };
  // Los pasos saltan a la parada ADYACENTE (nivel o sub-nivel), no un desplazamiento fijo:
  // con scroll-snap mandatory un medio-paso queda por debajo del intervalo de snap y el
  // navegador lo devuelve a la misma parada (la flecha no haría nada). Con la lista real de
  // paradas ordenada, cada click avanza exactamente una — que es "avanzar de a un paso".
  const stopUnits = snapStops(C.map((c) => c.subN || null))
    .slice()
    .sort((a, b) => a - b);
  const stepTo = (dir: 1 | -1): void => {
    const cur = stage.scrollTop / unit();
    const eps = 0.05;
    const target =
      dir > 0
        ? (stopUnits.find((s) => s > cur + eps) ?? stopUnits[stopUnits.length - 1])
        : ([...stopUnits].reverse().find((s) => s < cur - eps) ?? stopUnits[0]);
    goToUnit(target);
  };
  const onPrev = (): void => stepTo(-1);
  const onNext = (): void => stepTo(1);
  // Teclado: ↑/↓ (y AvPág) navegan el recorrido paso a paso — la vía accesible además del scroll.
  const onKeyNav = (e: KeyboardEvent): void => {
    // Un overlay modal (el prólogo) consume las teclas de desplazamiento antes de que lleguen acá, y
    // con modificadores la flecha es de otro atajo (Alt+← del navegador, Ctrl+↓ del lector).
    if (e.defaultPrevented || e.altKey || e.ctrlKey || e.metaKey) return;
    // No secuestramos las flechas dentro de un campo editable del demo (ni el espacio, que activa
    // botones): solo ▲/▼ y AvPág mueven el recorrido.
    const t = e.target as HTMLElement | null;
    if (t && (t.isContentEditable || t.tagName === 'INPUT' || t.tagName === 'TEXTAREA')) return;
    if (e.key === 'ArrowDown' || e.key === 'PageDown') {
      e.preventDefault();
      onNext();
    } else if (e.key === 'ArrowUp' || e.key === 'PageUp') {
      e.preventDefault();
      onPrev();
    }
  };

  // El cierre del sub-nivel avisa por evento del DOM cuando el sistema queda sano. Es a propósito
  // el acoplamiento más flojo posible: el átomo no conoce al motor ni el motor al átomo, y el
  // evento solo puede venir de la card montada, así que se atribuye al concepto en pantalla.
  const onEstablished = (e: Event): void => {
    // Por el target y no por `liveConcept`: en el fade de salida la card del concepto anterior sigue
    // viva (amt > 0.6) cuando `liveConcept` ya es el siguiente.
    const card = (e.target as Element | null)?.closest('.card');
    const i = C.findIndex((cc) => cc.card === card);
    const concepto = i >= 0 ? i : liveConcept;
    const sub = C[concepto].subIdx;
    established.add(concepto);
    subsEstablecidos.add(`${concepto}/${sub}`);
    partida?.alEstablecer(concepto, sub);
    if (orbitFor === concepto) updateOrbitFill(C[concepto]);
    render(stage.scrollTop / unit());
  };
  stage.addEventListener(SISTEMA_ESTABLECIDO, onEstablished);
  stage.addEventListener('scroll', onScroll, { passive: true });
  stage.addEventListener('wheel', onGesto, { passive: true });
  stage.addEventListener('touchstart', onGesto, { passive: true });
  window.addEventListener('keydown', onKeyNav);
  window.addEventListener('resize', onResize);

  // Posición de apertura: normalmente 0 (arriba, con el overlay). Con deep-link (?nivel&sub-nivel)
  // arranca scrolleado directo a ese sub-nivel, clampeado al rango real de conceptos/sub-niveles.
  const bootScroll = (): number => {
    if (!initial) return 0;
    const c = Math.max(0, Math.min(N - 1, Math.round(initial.concept)));
    // Sin sub-nivel (deep-link `?nivel=X` en vista molécula): encuadrar el ÁTOMO del concepto
    // (parada `off[c] + 1.3`, ver snapStops), no el tope de su tramo. Así `?nivel=7` reabre
    // en el átomo 7 en vez de aterrizar arriba de todo.
    if (C[c].subN <= 0 || initial.sub < 1) return off[c] + PARADA_ATOMO;
    const k = Math.max(0, Math.min(C[c].subN - 1, Math.round(initial.sub) - 1));
    return stopS(c, k);
  };
  // El navegador restaura el scroll del stage al recargar; queremos abrir en la posición que
  // decide bootScroll (arriba, o el deep-link). Lo forzamos en el boot, en el próximo frame y
  // al `load` (por si la restauración del navegador llega tarde y la pisa).
  const openAt = (): void => {
    // Si la restauración del navegador llega tarde ya no importa: pisar la posición de alguien que
    // ya scrolleó o clickeó el riel lo tiraba de vuelta al arranque.
    if (usuarioMovio) return;
    const s = bootScroll();
    stage.scrollTop = s * unit();
    render(s);
  };
  later(() => {
    track.style.height = (TOTAL + TRACK_TAIL) * unit() + 'px';
    openAt();
    raf(openAt);
    // Con el clock del SMIL ya corriendo: congelado con reduce, los electrones (begin negativo)
    // quedan quietos ya distribuidos alrededor de sus núcleos. También cubre abrir en una pestaña de
    // fondo, que antes animaba hasta el primer visibilitychange, y volver con la pausa guardada.
    aplicarPausa();
  }, 30);
  window.addEventListener('load', openAt, { once: true });

  // Ahorro de CPU/GPU cuando la pestaña NO está visible: el navegador throttlea rAF en background pero
  // NO el SMIL (electrones/sonar) ni las animaciones CSS (halos/intro), que siguen quemando ciclos
  // (y el ventilador) con la vista oculta. Oculta o con reduce, el SMIL queda congelado; el CSS de
  // reduce ya lo resuelve su media query y el de pestaña oculta, la clase `anims-frozen`.
  const molSvg = sceneG.ownerSVGElement;
  function aplicarMovimiento(): void {
    const oculta = document.hidden;
    root.classList.toggle('anims-frozen', oculta);
    subPuckE.style.display = reduceMotion ? 'none' : '';
    for (const svg of [molSvg, suborbit]) {
      if (oculta || reduceMotion || pausaFondo) svg?.pauseAnimations();
      else svg?.unpauseAnimations();
    }
  }

  // Pausa de la vida de fondo (WCAG 2.2.2): halos, sonar, electrones y los loops de los demos se
  // mueven sin fin al lado del contenido, y la preferencia del sistema no puede ser el único freno.
  // No reusa el congelado de la pestaña oculta: `animation-play-state` deja cada animación en el
  // cuadro en que está, y una entrada que todavía no arrancó queda en su primer cuadro, invisible
  // (la bitácora quedaba afuera de la pantalla y el recorrido, inerte detrás). Acá los loops se
  // detienen y lo que tiene fin salta a su estado final, también lo que arranca con la pausa puesta.
  // Lo que el jugador abrió encima no es fondo. Se recuerda por visitante; el storage puede no estar.
  // Los loops se frenan con velocidad 0 y no con pause()/play(): esos le sacan al CSS el control de
  // `animation-play-state` para siempre (la pestaña oculta dejaba de congelarlos), y play() revive
  // como animación suelta un loop que el CSS ya canceló (halos latiendo en paradas que dejaron de
  // ser la actual). A un loop cancelado, devolverle la velocidad no lo arranca.
  let pausaFondo = leerPausaFondo();
  const frenadas = new Set<Animation>();
  const aquietar = (a: Animation): void => {
    const efecto = a.effect;
    if (!(a instanceof CSSAnimation) || !(efecto instanceof KeyframeEffect)) return;
    if (efecto.target?.closest(PRIMER_PLANO)) return;
    if (efecto.getComputedTiming().iterations === Infinity) {
      a.playbackRate = 0;
      frenadas.add(a);
    } else {
      a.finish();
    }
  };
  const aplicarPausa = (): void => {
    root.classList.toggle('fondo-en-pausa', pausaFondo);
    if (pausaFondo) {
      root.getAnimations({ subtree: true }).forEach(aquietar);
    } else {
      for (const a of frenadas) a.playbackRate = 1;
      frenadas.clear();
    }
    aplicarMovimiento();
  };
  const onAnimacionNueva = (e: AnimationEvent): void => {
    if (!pausaFondo || !(e.target instanceof Element)) return;
    // Lo que el CSS canceló durante la pausa (un sub-nivel que se fue) no se retiene hasta reanudar.
    for (const a of frenadas) if (a.playState === 'idle') frenadas.delete(a);
    e.target.getAnimations({ subtree: true }).forEach(aquietar);
  };
  const btnPausa = document.createElement('button');
  btnPausa.type = 'button';
  btnPausa.className = 'tb-pausa';
  btnPausa.innerHTML =
    '<span class="tb-pausa__icono" aria-hidden="true"></span><span class="tb-pausa__texto"></span>';
  stamp(btnPausa);
  stampTree(btnPausa);
  q('.tb-links')?.appendChild(btnPausa);
  // La etiqueta dice lo que hace el botón, así que cambia con el estado (y por eso no lleva
  // aria-pressed): una etiqueta fija con el ícono de play pegado a "Pausar" se contradecía.
  const pintarPausa = (): void => {
    const etiqueta = pausaFondo ? 'Reanudar animaciones' : 'Pausar animaciones';
    btnPausa.querySelector('.tb-pausa__texto')!.textContent = etiqueta;
    btnPausa.title = etiqueta;
    btnPausa.classList.toggle('tb-pausa--activa', pausaFondo);
  };
  pintarPausa();
  const onPausaFondo = (): void => {
    pausaFondo = !pausaFondo;
    pintarPausa();
    guardarPausaFondo(pausaFondo);
    aplicarPausa();
  };
  btnPausa.addEventListener('click', onPausaFondo);
  root.addEventListener('animationstart', onAnimacionNueva);
  const onVisibility = (): void => aplicarMovimiento();
  const onReduceChange = (e: MediaQueryListEvent): void => {
    reduceMotion = e.matches;
    aplicarMovimiento();
  };
  mqlReduce?.addEventListener('change', onReduceChange);
  document.addEventListener('visibilitychange', onVisibility);

  requestOrbit();

  return () => {
    // Todo lo agendado por `raf`/`later` (incluidos el timer de arranque y el drenaje de montajes)
    // se corta de una: por eso pasan por la agenda y no por window.setTimeout suelto.
    agenda.dispose();
    cancelAnimationFrame(scrollAnimId);
    cancelAnimationFrame(orbitRaf);
    stage.removeEventListener(SISTEMA_ESTABLECIDO, onEstablished);
    stage.removeEventListener('scroll', onScroll);
    stage.removeEventListener('wheel', onGesto);
    stage.removeEventListener('touchstart', onGesto);
    window.removeEventListener('keydown', onKeyNav);
    window.removeEventListener('resize', onResize);
    window.removeEventListener('load', openAt);
    document.removeEventListener('visibilitychange', onVisibility);
    mqlReduce?.removeEventListener('change', onReduceChange);
    btnPausa.removeEventListener('click', onPausaFondo);
    btnPausa.remove();
    root.removeEventListener('animationstart', onAnimacionNueva);
    frenadas.clear();
    C.forEach((cc) => cc.subDispose?.());
  };
}
