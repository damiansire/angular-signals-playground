/**
 * Motor del recorrido "molécula reactiva" de `/integrada-vista`.
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
const NS = 'http://www.w3.org/2000/svg';

type AccentKey = 'source' | 'derived' | 'effect' | 'ink' | 'capstone';

const COL: Record<AccentKey, string> = {
  source: '#eb9b3c',
  derived: '#62c4ad',
  effect: '#ff5a4a',
  ink: '#9a9081',
  capstone: '#c98a2a',
};

/** API opcional de un sub-nivel que revela sus elementos de a uno (hoy, html-to-tree): el motor
 *  la usa para GATEAR el scroll — cada paso revela un tag y no te deja pasar hasta terminarlos. */
export interface RevealApi {
  steps: number;
  to: (n: number) => void;
}
/** Handle de un sub-nivel montado: su disposer + (si aplica) su API de reveal. */
export interface SubHandle {
  dispose: () => void;
  reveal: RevealApi | null;
}
/** Monta el componente real de un sub-nivel (concepto ci, sub si) y devuelve su handle. */
export type MountSub = (host: HTMLElement, conceptIdx: number, subIdx: number) => SubHandle;

interface RawConcept {
  name: string;
  code: string;
  accent: AccentKey;
  dotted: boolean;
  tagline?: string; // título de encuadre del nivel (topbar en vista molécula, antes de bucear)
}

interface Concept extends RawConcept {
  x: number;
  y: number;
  subN: number; // cantidad de sub-niveles reales
  subs: unknown[]; // longitud = subN (para la órbita / conteo)
  card?: HTMLDivElement;
  subIdx: number;
  subDispose?: () => void; // disposer del componente montado del sub actual
  subReveal?: RevealApi | null; // API de reveal del sub actual (si expone una), para gatear el scroll
  exampleTitle?: string; // título del sub-ejemplo actual (h1 del componente montado), para el topbar
}

interface SubDot {
  g: SVGGElement;
  dot: SVGCircleElement;
  num: SVGTextElement;
  /** Fracción base [0,1) sobre el perímetro de la órbita (rect redondeado). */
  frac: number;
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
  },
  { name: 'Signals', code: 'signal()', accent: 'source', dotted: false },
  { name: 'Computed', code: 'computed()', accent: 'derived', dotted: true },
  { name: 'Effects', code: 'effect()', accent: 'effect', dotted: false },
  { name: 'Igualdad', code: 'equality', accent: 'source', dotted: false },
  { name: 'Linked', code: 'linkedSignal()', accent: 'derived', dotted: true },
  { name: 'Resource', code: 'resource()', accent: 'derived', dotted: true },
  { name: 'Inputs & Outputs', code: 'input · model', accent: 'source', dotted: false },
  { name: 'Queries', code: 'viewChild', accent: 'ink', dotted: true },
  { name: 'After render', code: 'afterRenderEffect()', accent: 'effect', dotted: false },
  { name: 'Debounce', code: 'debounce', accent: 'effect', dotted: true },
  { name: 'Zoneless', code: 'zoneless', accent: 'capstone', dotted: false },
];

// Conceptos que usan el tratamiento "disolver el marco": la card deja de ser una ventana y su
// contenido flota en el campo del átomo (escena viva sin velo, aura grande). Experimento acotado
// (hoy nivel 0); agregar índices acá lo extiende a más conceptos.
const DISSOLVE = new Set<number>([0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11]);

/**
 * Cantidad de conceptos del recorrido (metadata hardcodeada en RAW). DEBE coincidir con
 * `signalsRoutesTree.length`: RAW y el árbol de rutas son dos fuentes de verdad acopladas por
 * índice. El guard de `initMolecule` lo verifica en runtime; un test lo ata en tiempo de build.
 */
export const CONCEPT_COUNT = RAW.length;

const CX = 410;
const CY = 290;
const ORX = 34;
const ORY = 11;
const NUC = 13;
const SPIN = 55;
const VISITED = '#8791a8';

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
    stops.push(off[i] + 1.3);
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

/** Perímetro de un rectángulo redondeado (para repartir electrones sobre él). */
function rrectPerimeter(w: number, h: number, r: number): number {
  return 2 * (w - 2 * r) + 2 * (h - 2 * r) + 2 * Math.PI * r;
}

/**
 * Punto a distancia `d` sobre el perímetro de un rect redondeado (L,T,R,B, radio r),
 * en sentido horario arrancando por el borde superior. Así los electrones ENVUELVEN la
 * card (siguen su contorno por fuera) en vez de una elipse que la corta.
 */
function rrectPoint(
  L: number,
  T: number,
  R: number,
  B: number,
  r: number,
  d: number,
): { x: number; y: number } {
  const sTop = R - L - 2 * r;
  const sSide = B - T - 2 * r;
  const arc = (Math.PI * r) / 2;
  let x =
    ((d % (2 * sTop + 2 * sSide + 4 * arc)) + 2 * sTop + 2 * sSide + 4 * arc) %
    (2 * sTop + 2 * sSide + 4 * arc);
  if (x < sTop) return { x: L + r + x, y: T };
  x -= sTop;
  if (x < arc) {
    const a = -Math.PI / 2 + (x / arc) * (Math.PI / 2);
    return { x: R - r + r * Math.cos(a), y: T + r + r * Math.sin(a) };
  }
  x -= arc;
  if (x < sSide) return { x: R, y: T + r + x };
  x -= sSide;
  if (x < arc) {
    const a = (x / arc) * (Math.PI / 2);
    return { x: R - r + r * Math.cos(a), y: B - r + r * Math.sin(a) };
  }
  x -= arc;
  if (x < sTop) return { x: R - r - x, y: B };
  x -= sTop;
  if (x < arc) {
    const a = Math.PI / 2 + (x / arc) * (Math.PI / 2);
    return { x: L + r + r * Math.cos(a), y: B - r + r * Math.sin(a) };
  }
  x -= arc;
  if (x < sSide) return { x: L, y: B - r - x };
  x -= sSide;
  const a = Math.PI + (x / arc) * (Math.PI / 2);
  return { x: L + r + r * Math.cos(a), y: T + r + r * Math.sin(a) };
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
  const C: Concept[] = RAW.map((r, i) => ({
    ...r,
    x: 0,
    y: 0,
    subN: subCounts[i] ?? 0,
    subs: Array.from({ length: subCounts[i] ?? 0 }, () => ({})),
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

  // rAF con teardown: guardamos los ids pendientes para cancelarlos al destruir.
  let destroyed = false;
  const rafIds = new Set<number>();
  const raf = (fn: FrameRequestCallback): void => {
    const id = requestAnimationFrame((ts) => {
      rafIds.delete(id);
      fn(ts);
    });
    rafIds.add(id);
  };

  // Layout de scroll (ver scrollLayout): cada concepto arranca en off[i] y ocupa len[i].
  const { off, len, total: TOTAL } = scrollLayout(C.map((c) => c.subN || null));

  const pos = (i: number): { x: number; y: number } => {
    if (i === 0) return { x: CX, y: CY };
    // Espiral de la cadena. El átomo tiene tamaño FIJO (núcleo + nube de electrones ~38 de radio)
    // y la cámara auto-encuadra el espiral, así que lo que evita que las nubes se pisen es el
    // radio del espiral RELATIVO a ese tamaño fijo: radio base alto (135) para despegar ya al
    // átomo 1 del centro, y crecimiento por paso (26) calculado para que el primer gap (1→2, el
    // más apretado) supere el diámetro de la nube. Los internos dejan de amontonarse.
    const ang = (i - 1) * 0.76 - Math.PI / 2;
    const r = 172 + (i - 1) * 24;
    return { x: CX + r * Math.cos(ang), y: CY + r * Math.sin(ang) };
  };
  C.forEach((cc, i) => {
    const pp = pos(i);
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
  // Encuadre de la molécula: mapea el radio del espiral a un radio en pantalla objetivo. El
  // espiral es más grande ahora (radio base 135), así que el piso sube a 0.6 para llenar más el
  // alto del viewport en la vista completa (12 átomos) sin que los de arriba/abajo se corten.
  const wideK = (c: number): number => Math.max(0.6, Math.min(1.2, 265 / (outerRadius(c) + 62)));
  const centroid = (c: number): { x: number; y: number } => {
    let sx = 0;
    let sy = 0;
    for (let i = 0; i <= c; i++) {
      sx += C[i].x;
      sy += C[i].y;
    }
    return { x: sx / (c + 1), y: sy / (c + 1) };
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
  const contentEl = q<HTMLDivElement>('#content')!;

  for (let s = 0; s < 60; s++) {
    const st = el('circle', {
      class: 'star',
      cx: (Math.random() * 820).toFixed(0),
      cy: (Math.random() * 600).toFixed(0),
      r: (Math.random() * 1.3 + 0.4).toFixed(1),
    });
    st.style.animationDelay = (-Math.random() * 3).toFixed(1) + 's';
    st.style.animationDuration = (2 + Math.random() * 3).toFixed(1) + 's';
    starsG.appendChild(st);
  }

  const bondEls: SVGLineElement[] = [];
  for (let i = 1; i < N; i++) {
    const ln = el('line', {
      class: 'bond',
      x1: C[i - 1].x,
      y1: C[i - 1].y,
      x2: C[i].x,
      y2: C[i].y,
    });
    bondsG.appendChild(ln);
    bondEls.push(ln);
  }

  const opath = (): string =>
    `M ${-ORX} 0 A ${ORX} ${ORY} 0 1 0 ${ORX} 0 A ${ORX} ${ORY} 0 1 0 ${-ORX} 0`;
  const atomEls: SVGGElement[] = [];
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
        'fill-opacity': cc.dotted ? 0.4 : 0.95,
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
    atomsG.appendChild(g);
    atomEls.push(g);
  });

  // Órbita de sub-niveles: los electrones ENVUELVEN la card recorriendo un rect redondeado
  // que la abraza por fuera (el actual se resalta en su lugar, sin volar hasta arriba).
  const suborbit = el('svg', { class: 'suborbit', viewBox: '0 0 900 600' });
  const subRing = el('rect', { class: 'sub-ring', rx: 40 });
  // En dissolve los electrones dejan de orbitar la card: se acomodan en fila fija, uno por
  // sub-nivel, sobre un arco angosto pegado al topbar (la "constelación" del recorrido). subArc
  // es la curva punteada que los conecta; solo se pinta cuando el concepto es dissolve.
  const subArcId = 'sub-arc-' + Math.random().toString(36).slice(2);
  const subArc = el('path', { class: 'sub-arc', id: subArcId });
  // La vida del arco: un pulso viaja recorriéndolo en loop (SMIL, no rAF — se mueve solo,
  // sin costo de JS) y un sonar respira alrededor del nodo actual. Ambos son gratis en reposo:
  // no dependen de que el usuario interactúe para sentirse "vivos".
  const subSpark = el('circle', { class: 'sub-spark', r: 4 });
  const subSparkMotion = el('animateMotion', {
    dur: '2.6s',
    repeatCount: 'indefinite',
    keyPoints: '0;1',
    keyTimes: '0;1',
    calcMode: 'linear',
  });
  const subSparkMpath = document.createElementNS('http://www.w3.org/2000/svg', 'mpath');
  subSparkMpath.setAttributeNS('http://www.w3.org/1999/xlink', 'href', '#' + subArcId);
  subSparkMotion.appendChild(subSparkMpath);
  subSpark.appendChild(subSparkMotion);
  const subSonar = el('circle', { class: 'sub-sonar', r: 16 });
  // La "pelota" del sub-nivel actual: un grupo (sonar + disco + número) que se DESLIZA de un dot
  // al siguiente al cambiar de nivel (transición de transform) y sólo entonces — en el boot aparece
  // directo en su lugar. Es el ÚNICO marcador del actual en dissolve (el dot de abajo se oculta),
  // así el highlight "viaja" en vez de saltar por handoff de tamaño entre dos dots distintos.
  const subPuckDot = el('circle', { class: 'sub-puck-dot', r: 22 });
  const subPuckNum = el('text', { class: 'sub-puck-n', y: 5 });
  const subPuckG = el('g', { class: 'sub-puck' });
  subPuckG.appendChild(subSonar);
  subPuckG.appendChild(subPuckDot);
  subPuckG.appendChild(subPuckNum);
  const subEG = el('g', {});
  suborbit.appendChild(subRing);
  suborbit.appendChild(subArc);
  suborbit.appendChild(subSpark);
  suborbit.appendChild(subEG);
  suborbit.appendChild(subPuckG);

  let orbitFor = -1;
  let subDots: SubDot[] = [];
  // Estado de la pelota: dónde quedó, para decidir snap (boot / concepto nuevo) vs glide (cambió
  // el sub-nivel dentro del mismo concepto).
  let puckIdx = -1;
  let puckConcept = -1;

  // El orbe del sub-nivel nuevo NACE en el electrón actual y se fusiona al centro de la card.
  function fuse(cc: Concept): void {
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
    const subnumEl = card.querySelector('.subnum'); // solo en el header clásico (no-dissolve)
    if (subnumEl) subnumEl.textContent = String(cc.subIdx + 1);
    // Montar el componente REAL del sub-nivel actual, desmontando el del sub anterior.
    const host = card.querySelector<HTMLElement>('.subhost')!;
    cc.subDispose?.();
    host.textContent = '';
    const handle = mountSub(host, C.indexOf(cc), cc.subIdx);
    cc.subDispose = handle.dispose;
    cc.subReveal = handle.reveal;
    // Re-estampar: cada mount trae su propio árbol nuevo (Angular no le pone el atributo
    // de encapsulación de integrada-vista), así que sin esto el CSS de armonización de
    // .subhost (h1/botones) nunca matchea nada.
    stampTree(host);
    // El título del sub-ejemplo (h1 del componente) se promueve al topbar; lo guardamos acá,
    // recién montado, y render() lo refleja. En dissolve el h1 se oculta (no se duplica).
    cc.exampleTitle = host.querySelector('h1')?.textContent?.trim() ?? '';
    fuse(cc);
    replay(card.querySelector('.subbody'), 'warp');
  }

  function subScrollTo(cc: Concept, k: number): void {
    const ci = C.indexOf(cc);
    goToUnit(stopS(ci, k));
  }

  // Construye los electrones UNA vez por concepto; su posición la maneja orbitLoop.
  function paintOrbit(cc: Concept): void {
    const col = COL[cc.accent];
    const nsub = cc.subN;
    subRing.setAttribute('stroke', col);
    subArc.setAttribute('stroke', col);
    subSpark.setAttribute('fill', col);
    subSonar.setAttribute('stroke', col);
    subPuckDot.setAttribute('fill', col);
    subEG.textContent = '';
    subDots = [];
    for (let k = 0; k < nsub; k++) {
      // Repartidos parejo sobre el perímetro; arrancan por arriba (fracción 0 = borde superior).
      const frac = k / nsub;
      const g = el('g', { class: 'sub-e' });
      const dot = el('circle', { class: 'sub-dot', cx: 450, cy: 90, r: 12 });
      const num = el('text', { class: 'sub-n', x: 450, y: 94 });
      num.textContent = String(k + 1);
      g.appendChild(dot);
      g.appendChild(num);
      const idx = k;
      g.addEventListener('click', () => subScrollTo(cc, idx));
      subEG.appendChild(g);
      subDots.push({ g, dot, num, frac, lx: 450, ly: 90 });
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
      o.g.setAttribute('class', 'sub-e ' + state);
      o.dot.setAttribute('r', String(state === 'current' ? 22 : state === 'visited' ? 13 : 12));
      if (state === 'current') {
        o.dot.setAttribute('fill', col);
        o.dot.setAttribute('filter', 'url(#glow)');
      } else if (state === 'visited') {
        o.dot.setAttribute('fill', VISITED);
        o.dot.removeAttribute('filter');
      } else {
        o.dot.removeAttribute('fill');
        o.dot.removeAttribute('filter');
      }
    }
  }

  // Loop VIVO: los electrones recorren un rect redondeado que ABRAZA la card por fuera.
  // El actual se resalta en su lugar (no vuela hasta arriba, que se leía forzado).
  function orbitLoop(ts: number): void {
    if (destroyed) return;
    const vis = orbitFor >= 0 && subDots.length > 0 && (+suborbit.style.opacity || 0) > 0.05;
    if (vis) {
      const cc = C[orbitFor];
      const t = (ts || 0) / 1000;
      let ccx = 450;
      let ccy = 300;
      let hw = 380;
      let hh = 190;
      let topbarY = -1e9;
      let bottomY = 1e9;
      let railX = -1e9;
      // Bordes del bloque título+contador (`.tb-center`) en coords del suborbit: el arco de
      // sub-niveles arranca ANTES de su borde izquierdo y termina DESPUÉS del derecho, así ningún
      // dot (ni el activo, agrandado) pisa el texto — el título queda "enmarcado" por el arco.
      let blockL = 360;
      let blockR = 540;
      let blockBottomY = -1e9;
      const m0 = suborbit.getScreenCTM();
      if (m0 && cc.card) {
        const m = m0.inverse();
        const cr = cc.card.getBoundingClientRect();
        const p = suborbit.createSVGPoint();
        p.x = cr.left;
        p.y = cr.top;
        const tl = p.matrixTransform(m);
        p.x = cr.right;
        p.y = cr.bottom;
        const br = p.matrixTransform(m);
        ccx = (tl.x + br.x) / 2;
        ccy = (tl.y + br.y) / 2;
        hw = (br.x - tl.x) / 2;
        hh = (br.y - tl.y) / 2;
        // Límites de chrome (topbar arriba, pastilla de controles abajo, riel de conceptos a
        // la izquierda) para que la órbita no cruce ninguno: se clampea el rect contra ellos.
        p.x = 0;
        p.y = topbarEl ? topbarEl.getBoundingClientRect().bottom : 0;
        topbarY = p.matrixTransform(m).y;
        // Sin pastilla de controles abajo, el único chrome inferior es el caption tenue:
        // la órbita puede bajar casi hasta el borde (antes reservaba 92px para la pastilla).
        p.y = window.innerHeight - 40;
        bottomY = p.matrixTransform(m).y;
        p.x = railEl ? railEl.getBoundingClientRect().right : 0;
        p.y = 0;
        railX = p.matrixTransform(m).x;
        if (tbCenterEl) {
          const tr = tbCenterEl.getBoundingClientRect();
          p.x = tr.left;
          p.y = tr.top;
          const bl = p.matrixTransform(m);
          p.x = tr.right;
          p.y = tr.bottom;
          const brc = p.matrixTransform(m);
          blockL = bl.x;
          blockR = brc.x;
          blockBottomY = brc.y;
        }
      }
      // Rect redondeado que envuelve la card por fuera (PAD de separación), clampeado al chrome.
      // El riel MANDA siempre en el lado izquierdo: si el margen hacia el riel es menor al PAD
      // completo, el rect se pega más a la card (o incluso roza su borde) en vez de invadir el
      // riel. Pisar el riel es un bug de legibilidad real (números pegados); rozar la card es
      // solo estético — entre las dos, gana la que no rompe la lectura.
      const PAD = 30;
      const L = Math.max(ccx - hw - PAD, railX + 22);
      const R = ccx + hw + PAD;
      const T = Math.max(ccy - hh - PAD, topbarY + 22);
      const B = Math.min(ccy + hh + PAD, bottomY - 12);
      const rad = Math.min(40, (R - L) / 2, (B - T) / 2);
      subRing.setAttribute('x', L.toFixed(1));
      subRing.setAttribute('y', T.toFixed(1));
      subRing.setAttribute('width', (R - L).toFixed(1));
      subRing.setAttribute('height', (B - T).toFixed(1));
      subRing.setAttribute('rx', rad.toFixed(1));
      // En dissolve los electrones dejan de orbitar la card: se leen mejor como una CONSTELACIÓN
      // fija del recorrido (uno por sub-nivel, en su propio lugar, izquierda a derecha) que como
      // puntos volando alrededor de un contenido sin marco. En el resto se mantiene el recorrido
      // giratorio sobre el rect redondeado que abraza la card.
      const dissolve = DISSOLVE.has(orbitFor);
      if (dissolve) {
        const nsub = subDots.length;
        // Opción A: el arco ARRANCA antes del bloque título+contador y TERMINA después, curvando
        // hacia abajo (∪) para enmarcarlo. Los extremos lo flanquean por los costados (fuera del
        // texto) y los pasos del medio hunden por debajo; el título flota dentro del arco. El
        // margen izquierdo deja lugar para el dot ACTIVO agrandado + su sonar cuando el paso 1 es
        // el actual, así nunca colisiona con el contador. Escala parejo de 2 a 10+ pasos porque el
        // ancho lo fija el título (no la cantidad de dots): sumar pasos sólo los reparte en la curva.
        const archL = blockL - 46;
        const archR = blockR + 40;
        const archCX = (archL + archR) / 2;
        // Separación bajo el título: da aire a los extremos para que el dot ACTIVO agrandado no
        // roce el borde superior de la ventana cuando el paso actual es un extremo (p.ej. sub-1).
        const archY = (blockBottomY > -1e8 ? blockBottomY : topbarY + 40) + 18;
        const archDepth = 42;
        for (let k = 0; k < nsub; k++) {
          const o = subDots[k];
          const frac = nsub > 1 ? k / (nsub - 1) : 0.5;
          o.lx = archL + (archR - archL) * frac;
          o.ly = archY + archDepth * Math.sin(Math.PI * frac);
          o.dot.setAttribute('cx', o.lx.toFixed(1));
          o.dot.setAttribute('cy', o.ly.toFixed(1));
          o.num.setAttribute('x', o.lx.toFixed(1));
          o.num.setAttribute('y', (o.ly + 4).toFixed(1));
        }
        subArc.setAttribute(
          'd',
          `M ${archL.toFixed(1)} ${archY.toFixed(1)} Q ${archCX.toFixed(1)} ${(archY + archDepth * 2).toFixed(1)} ${archR.toFixed(1)} ${archY.toFixed(1)}`,
        );
        // La pelota se coloca sobre el dot actual: en el boot / cambio de concepto aparece DIRECTO
        // (transición apagada), y al cambiar de sub-nivel DENTRO del concepto DESLIZA (la transición
        // de transform la hace el CSS). Si no cambió nada no se toca: el arco está anclado al topbar
        // (estable), así que no hay que perseguirlo cuadro a cuadro (y no se reinicia el glide).
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
      } else {
        const per = rrectPerimeter(R - L, B - T, rad);
        const cur = cc.subIdx;
        for (let k = 0; k < subDots.length; k++) {
          const o = subDots[k];
          // El sub-nivel actual queda fijo arriba del todo (12 en punto), sin el giro continuo:
          // es "dónde estoy", no debería moverse solo. Los demás recorren el contorno.
          const pt =
            k === cur
              ? { x: (L + R) / 2, y: T }
              : rrectPoint(L, T, R, B, rad, (o.frac + t / SPIN) * per);
          o.lx = pt.x;
          o.ly = pt.y;
          o.dot.setAttribute('cx', o.lx.toFixed(1));
          o.dot.setAttribute('cy', o.ly.toFixed(1));
          o.num.setAttribute('x', o.lx.toFixed(1));
          o.num.setAttribute('y', (o.ly + 4).toFixed(1));
        }
      }
    }
    raf(orbitLoop);
  }

  // Velo: al bucear, oscurece sutilmente el fondo alrededor del card (spotlight) para que el
  // color del concepto resalte parejo (si no, el teal se funde con el fondo verdoso de la página).
  const diveVeil = document.createElement('div');
  diveVeil.className = 'dive-veil';
  stamp(diveVeil);
  contentEl.appendChild(diveVeil);

  // Aura del concepto: al bucear, el átomo actual "crece" y se vuelve el fondo de color
  // donde vive el ejemplo, así el card no aparece como un rectángulo suelto sino nacido del
  // átomo. Su color y su escala/opacidad las maneja render() según el concepto y el diveDepth.
  const diveAura = document.createElement('div');
  diveAura.className = 'dive-aura';
  stamp(diveAura);
  contentEl.appendChild(diveAura);

  // ---- Contenido de cada concepto: cada sub-nivel embebe el componente REAL del nivel ----
  C.forEach((cc, i) => {
    const card = document.createElement('div');
    card.className = 'card live card--sub' + (DISSOLVE.has(i) ? ' card--dissolve' : '');
    card.style.setProperty('--glow', COL[cc.accent]);
    // En modo "disolver el marco" la info se depura: el nombre del concepto se PROMUEVE a título
    // del espacio (el nivel ya lo dice el riel, "Adentro" es obvio) y el sub-nivel queda como un
    // contador pegado a ese título (su otra casa son los electrones de la órbita). En el resto,
    // el header meta clásico (Adentro · X · nivel N + sub-nivel Y/N).
    const header = DISSOLVE.has(i)
      ? '' // en dissolve el nivel/sub-nivel viven en el riel, el topbar y la órbita; sin header en la card
      : `<p class="card__k">Adentro · ${cc.name} · nivel ${i}</p>` +
        `<p class="subtop">sub-nivel <b class="subnum">1</b> / ${cc.subN}</p>`;
    card.innerHTML = `<span class="subflash"></span>${header}<div class="subbody"><div class="subhost"></div></div>`;
    contentEl.appendChild(card);
    cc.card = card;
    stamp(card);
    stampTree(card); // estampar ANTES de montar el componente real (para no tocar sus internals)
    cc.subIdx = 0;
    renderSubCard(cc);
  });
  contentEl.appendChild(suborbit);

  // ---- Onda reactiva al nacer un átomo ----
  function ripat(i: number): void {
    const r = el('circle', {
      class: 'ripple',
      cx: C[i].x,
      cy: C[i].y,
      r: NUC + 8,
      stroke: COL[C[i].accent],
    });
    ripG.appendChild(r);
    window.setTimeout(() => r.remove(), 810);
  }
  let lastBorn = 0;
  // Último (nivel, sub-nivel) reportado a la URL, para no reescribirla en cada frame.
  let whereC = -2;
  let whereSub = -2;
  function propagate(idx: number, rev: number): void {
    ripat(idx);
    for (let j = 0; j < rev; j++) {
      const a = atomEls[j];
      window.setTimeout(
        () => {
          a.classList.add('pulse');
          window.setTimeout(() => a.classList.remove('pulse'), 480);
        },
        Math.abs(idx - j) * 60,
      );
    }
  }

  const capS = q<HTMLElement>('#capS')!;
  const stage = q<HTMLDivElement>('#stage')!;
  const track = q<HTMLDivElement>('#track')!;
  const railDot = q<HTMLElement>('#railDot');
  const introEl = q<HTMLElement>('.intro');
  const topbarEl = q<HTMLElement>('.topbar');
  const tbTitleEl = q<HTMLElement>('.tb-title');
  const tbCenterEl = q<HTMLElement>('.tb-center');
  const tbCountEl = q<HTMLElement>('.tb-count');
  const captionEl = q<HTMLElement>('.caption');
  const spaceSpineEl = q<HTMLElement>('#spaceSpine');
  const railEl = q<HTMLElement>('.rail');
  const railTicksOl = q<HTMLElement>('#railTicks')!;
  for (let t = 0; t < N; t++) {
    const li = document.createElement('li');
    li.textContent = String(t);
    stamp(li);
    railTicksOl.appendChild(li);
  }
  const railTicks = Array.from(root.querySelectorAll<HTMLElement>('#railTicks li'));

  // ---- Gate de reveal (hoy html-to-tree): mientras estás parado en un sub-nivel que revela sus
  // elementos de a uno, el scroll NO avanza — cada paso revela/oculta un tag (click real) hasta
  // terminarlos, para no pasarse sin querer. `render` arma/desarma el gate según dónde estás. ----
  let activeReveal: RevealApi | null = null; // API del sub actual si está asentado y es "revelable"
  let revealN = 0; // cuántos tags revelados ahora
  let gateReady = false; // ¿estamos asentados en el sub revelable? (gate activo)
  let lastRenderS = 0; // posición previa, para saber la dirección de entrada
  let wheelAccum = 0; // acumulador de deltaY del trackpad (throttle: un reveal por tramo)
  const WHEEL_STEP = 90; // px de scroll por reveal (amortigua el momentum del trackpad)
  const HTT_STOP = off[0] + subStopOffset(0); // parada de scroll de html-to-tree (concepto 0, sub 0)

  // ---- render(s): dibuja el estado del recorrido en la posición de scroll s (0..TOTAL) ----
  function render(sIn: number): void {
    const s = Math.max(0, Math.min(TOTAL - 0.0001, sIn));
    let c = 0;
    while (c < N - 1 && s >= off[c] + len[c]) c++;
    const w = s - off[c];
    const parent = c > 0 ? C[c - 1] : { x: CX, y: CY };
    const birth = smoothstep(Math.max(0, Math.min(1, w / 0.7)));

    // Cámara: nace → wide → bucea al átomo; en la zona de sub-niveles (w>=2) se queda adentro.
    const W = wideK(c);
    const cen = centroid(c);
    const FK = 2.7;
    let K: number;
    let fx: number;
    let fy: number;
    let diveDepth: number;
    if (w >= 2) {
      K = FK;
      fx = C[c].x;
      fy = C[c].y;
      diveDepth = 1;
    } else if (c === 0) {
      if (w < 1.3) {
        K = W;
        fx = cen.x;
        fy = cen.y;
      } else {
        const t = smoothstep((w - 1.3) / 0.7);
        K = lerp(W, FK, t);
        fx = lerp(cen.x, C[0].x, t);
        fy = lerp(cen.y, C[0].y, t);
      }
      diveDepth = w > 1.3 ? Math.min(1, (w - 1.3) / 0.7) : 0;
    } else if (w < 0.7) {
      const t = smoothstep(w / 0.7);
      K = lerp(FK, W, t);
      fx = lerp(parent.x, cen.x, t);
      fy = lerp(parent.y, cen.y, t);
      diveDepth = 0;
    } else if (w < 1.3) {
      K = W;
      fx = cen.x;
      fy = cen.y;
      diveDepth = 0;
    } else {
      const t = smoothstep((w - 1.3) / 0.7);
      K = lerp(W, FK, t);
      fx = lerp(cen.x, C[c].x, t);
      fy = lerp(cen.y, C[c].y, t);
      diveDepth = Math.min(1, (w - 1.3) / 0.7);
    }
    sceneG.setAttribute(
      'transform',
      `translate(${(CX - K * fx).toFixed(1)},${(300 - K * fy).toFixed(1)}) scale(${K.toFixed(3)})`,
    );
    // La cámara ya centró y agrandó el átomo detrás de la card (K llega a FK=2.7): dejarlo
    // brillar de fondo, en vez de apagarlo casi del todo, es lo que hace que la card se lea
    // "parada sobre el átomo" en vez de "algo nuevo que tapó la escena".
    // Conceptos "disolver el marco": la card no es una ventana sino el interior del átomo, así
    // que al bucear NO se atenúa la escena (sin velo, molécula viva) y el aura crece más para
    // volverse la sala. En el resto, la atmósfera normal (escena tenue de fondo + velo suave).
    const dissolve = DISSOLVE.has(c);
    sceneG.style.opacity = (1 - (dissolve ? 0.1 : 0.62) * diveDepth).toFixed(2);

    // El aura del concepto crece desde el átomo (chica) hasta el fondo del card (grande),
    // tomando el color del concepto: el card queda "nacido" del átomo, no suelto. El velo
    // es una atmósfera suave (no un scrim de modal): apenas entona el entorno para que el
    // color resalte parejo en todos los conceptos, sin apagar la escena.
    diveAura.style.setProperty('--glow', COL[C[c].accent]);
    diveAura.style.opacity = ((dissolve ? 0.92 : 0.72) * diveDepth).toFixed(3);
    diveAura.style.transform = `scale(${((dissolve ? 0.5 : 0.32) + (dissolve ? 1.15 : 0.68) * diveDepth).toFixed(3)})`;
    diveVeil.style.opacity = ((dissolve ? 0 : 0.32) * diveDepth).toFixed(3);
    // El topbar y el riel acompañan la misma atmósfera al bucear (en vez de quedar fijos y
    // brillantes mientras todo se apaga alrededor, que es la gramática visual de un modal
    // sobre un app-shell). Siguen legibles/clickeables, solo bajan de intensidad.
    // En dissolve el topbar deja de ser chrome tenue: su centro muestra el TÍTULO del sub-ejemplo
    // actual (promovido desde el h1 del demo) con protagonismo, así que se mantiene presente. En
    // el resto conserva "El recorrido" y se atenúa al bucear. El caption inferior sí se va (abajo).
    if (topbarEl) {
      topbarEl.classList.toggle('contextual', dissolve);
      topbarEl.style.opacity = dissolve ? '1' : (1 - 0.4 * diveDepth).toFixed(3);
    }
    if (railEl) railEl.style.opacity = (1 - 0.35 * diveDepth).toFixed(3);
    if (captionEl)
      captionEl.style.opacity = dissolve ? Math.max(0, 1 - diveDepth / 0.5).toFixed(2) : '1';
    // Título vertical del concepto (espina de identidad) pegado al riel: aparece al bucear en
    // dissolve, con el color del concepto. Es la casa del nombre en la escena.
    if (spaceSpineEl) {
      if (dissolve) {
        if (spaceSpineEl.textContent !== C[c].name) spaceSpineEl.textContent = C[c].name;
        spaceSpineEl.style.setProperty('--glow', COL[C[c].accent]);
        spaceSpineEl.style.opacity = Math.min(1, diveDepth / 0.55).toFixed(2);
      } else {
        spaceSpineEl.style.opacity = '0';
      }
    }

    const dc = C[c];
    if (dc.subN > 0) {
      const M = dc.subN;
      const si = w < 2 ? 0 : Math.min(M - 1, 1 + Math.floor(w - 2));
      if (dc.subIdx !== si) {
        dc.subIdx = si;
        renderSubCard(dc);
        if (orbitFor === c) updateOrbitFill(dc);
      }
    }
    // Título del topbar en dissolve: antes de bucear (vista molécula) enmarca el nivel con su
    // tagline; adentro, el título del sub-ejemplo actual. Va DESPUÉS de renderSubCard para leer
    // el exampleTitle recién montado (si no, va un sub-nivel atrasado). En el resto, "El recorrido".
    if (tbTitleEl) {
      // Adentro: título del sub-ejemplo; si el sub-nivel no tiene h1 propio, cae al tagline del
      // nivel (no al nombre, que ya está en la espina vertical). Antes de bucear: el tagline.
      tbTitleEl.textContent = dissolve
        ? diveDepth > 0.5
          ? dc.exampleTitle || dc.tagline || dc.name
          : dc.tagline || dc.name
        : 'El recorrido';
    }
    // El contador de sub-nivel vive a nivel del título (en el topbar, como prefijo), no adentro
    // de la card. Solo cuando estás en un sub-ejemplo (buceado en dissolve).
    if (tbCountEl) {
      tbCountEl.textContent =
        dissolve && diveDepth > 0.5 && dc.subN > 0 ? `${dc.subIdx + 1} / ${dc.subN}` : '';
    }
    if (dc.subN > 0 && diveDepth > 0.35) {
      if (orbitFor !== c) {
        paintOrbit(dc);
        orbitFor = c;
      }
      suborbit.classList.add('on');
      // En conceptos dissolve se oculta el anillo punteado (deja solo los electrones): con la
      // card sin marco, el rect punteado volvería a leerse como el borde de una ventana.
      suborbit.classList.toggle('dissolve', dissolve);
      suborbit.style.opacity = Math.min(1, (diveDepth - 0.35) / 0.4).toFixed(2);
    } else if (orbitFor !== -1) {
      suborbit.classList.remove('on');
      suborbit.style.opacity = '0';
      orbitFor = -1;
    }

    atomEls.forEach((g, i) => {
      const orb = g.querySelector<SVGGElement>('.orb')!;
      // El nombre del átomo se desvanece al bucear en dissolve: su rol de etiqueta lo toma el
      // título promovido dentro de la card, no debe repetirse en la escena. Solo el actual.
      g.classList.toggle('dived-dissolve', i === c && dissolve && diveDepth > 0.4);
      if (i < c) {
        g.classList.add('on');
        g.classList.remove('current');
        g.setAttribute('transform', `translate(${C[i].x},${C[i].y})`);
        orb.style.transform = 'scale(1)';
        g.style.opacity = '1';
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

    bondEls.forEach((ln, j) => {
      if (j + 1 < c) {
        ln.classList.add('on');
        ln.setAttribute('x2', String(C[j + 1].x));
        ln.setAttribute('y2', String(C[j + 1].y));
      } else if (j + 1 === c) {
        ln.classList.toggle('on', birth > 0.12);
        ln.setAttribute('x1', String(C[j].x));
        ln.setAttribute('y1', String(C[j].y));
        ln.setAttribute('x2', lerp(parent.x, C[j + 1].x, birth).toFixed(1));
        ln.setAttribute('y2', lerp(parent.y, C[j + 1].y, birth).toFixed(1));
      } else {
        ln.classList.remove('on');
      }
    });

    C.forEach((cc, i) => {
      const cs = off[i];
      const ce = off[i] + len[i];
      let amt: number;
      if (s < cs + 1.3) amt = 0;
      else if (s < cs + 2) amt = (s - (cs + 1.3)) / 0.7;
      else if (s < ce) amt = 1;
      else amt = 1 - (s - ce) / 0.5;
      amt = Math.max(0, Math.min(1, amt));
      const card = cc.card!;
      card.style.opacity = amt.toFixed(2);
      // Escala casi plana: un pop 0.9→1 sincronizado con el fade es la curva típica de
      // "se abrió un diálogo". La cámara ya hizo el zoom hacia el átomo (sceneG arriba);
      // el card solo necesita asentar, no volver a "aparecer creciendo" por su cuenta.
      card.style.transform = `scale(${(0.97 + 0.03 * amt).toFixed(3)})`;
      // Cada card embebe el componente real del sub-nivel: siempre interactivo cuando está visible.
      card.style.pointerEvents = amt > 0.6 ? 'auto' : 'none';
    });

    if (w > 0.7 && lastBorn < c + 1) {
      propagate(c, c + 1);
      lastBorn = c + 1;
    }
    if (s < 0.05) lastBorn = 0;
    capS.textContent = (w > 1.3 ? 'Adentro · ' : 'Molécula · ') + C[c].name;
    if (railDot) railDot.style.top = ((s / TOTAL) * 100).toFixed(1) + '%';
    for (let ti = 0; ti < railTicks.length; ti++) railTicks[ti].classList.toggle('on', ti === c);
    if (introEl) introEl.style.opacity = s < 0.12 ? '1' : '0';

    // Reflejar en la URL el nivel actual y, si estás adentro, el sub-nivel. -1 = vista molécula.
    const subNow = w > 1.3 && dc.subN > 0 ? dc.subIdx : -1;
    if (whereC !== c || whereSub !== subNow) {
      whereC = c;
      whereSub = subNow;
      onWhere(c, subNow);
    }

    // Arma/desarma el gate de reveal. "Asentado" = adentro (diveDepth alto), cerca de la parada del
    // sub revelable, y con el componente ya sabiendo cuántos pasos tiene. Al asentar recién, arranca
    // en 0 si venís de arriba (buceo) o lleno si venís de abajo (para ir quitando al subir).
    const revealApi = w > 1.3 && dc.subReveal ? dc.subReveal : null;
    const settled =
      !!revealApi && diveDepth > 0.85 && Math.abs(s - HTT_STOP) < 0.12 && revealApi.steps > 0;
    if (settled && !gateReady && revealApi) {
      activeReveal = revealApi;
      revealN = lastRenderS > s + 0.02 ? revealApi.steps : 0;
      wheelAccum = 0;
      revealApi.to(revealN);
    }
    gateReady = settled;
    if (!settled) activeReveal = null;
    lastRenderS = s;
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
  const prefersReducedMotion = (): boolean =>
    typeof window.matchMedia === 'function' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  function goToUnit(u: number): void {
    cancelAnimationFrame(scrollAnimId);
    const to = u * unit();
    const from = stage.scrollTop;
    const dist = to - from;
    if (prefersReducedMotion() || Math.abs(dist) < 1) {
      stage.scrollTop = to;
      render(u);
      return;
    }
    stage.style.scrollSnapType = 'none';
    // Duración proporcional a la distancia, acotada: pasos cortos (sub-niveles contiguos) no se
    // arrastran y saltos largos (cambio de concepto) no vuelan.
    const dur = Math.min(620, 220 + Math.abs(dist) * 0.35);
    let start = -1;
    const tick = (ts: number): void => {
      if (destroyed) return;
      if (start < 0) start = ts;
      const p = Math.min(1, (ts - start) / dur);
      const top = from + dist * easeInOut(p);
      stage.scrollTop = top;
      render(top / unit());
      if (p < 1) {
        scrollAnimId = requestAnimationFrame(tick);
      } else {
        stage.scrollTop = to; // asentar exacto en la parada
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
    a.style.top = ((s / (TOTAL + 0.2)) * 100).toFixed(3) + '%';
    stamp(a);
    snaps.appendChild(a);
  }
  track.appendChild(snaps);

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
    track.style.height = (TOTAL + 0.2) * unit() + 'px';
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
  // Un paso del gate de reveal. Devuelve true si lo consumió (reveló/ocultó un tag); false si no hay
  // gate o estás en el borde, y ahí el llamador deja seguir el scroll/step normal (avanza de sub-nivel).
  const revealStep = (dir: 1 | -1): boolean => {
    if (!gateReady || !activeReveal) return false;
    if (dir > 0 && revealN < activeReveal.steps) {
      revealN++;
      activeReveal.to(revealN);
      return true;
    }
    if (dir < 0 && revealN > 0) {
      revealN--;
      activeReveal.to(revealN);
      return true;
    }
    return false;
  };
  const onPrev = (): void => {
    if (!revealStep(-1)) stepTo(-1);
  };
  const onNext = (): void => {
    if (!revealStep(1)) stepTo(1);
  };
  // Con el gate activo el wheel NO scrollea: se acumula y cada tramo revela/oculta un tag (el
  // acumulador amortigua el momentum del trackpad para que sea de a uno). En el borde (todo revelado
  // y bajás, o nada revelado y subís) NO se previene: ahí el scroll avanza/retrocede de sub-nivel.
  const onWheelGate = (e: WheelEvent): void => {
    if (!gateReady || !activeReveal) return;
    // Sólo gateamos cuando estás REALMENTE asentado en la parada; si venís bajando/subiendo hacia
    // ella (aún no snapeaste), dejamos que el scroll termine de aterrizar antes de empezar a revelar.
    if (Math.abs(stage.scrollTop / unit() - HTT_STOP) > 0.06) return;
    const dir = e.deltaY > 0 ? 1 : e.deltaY < 0 ? -1 : 0;
    if (dir === 0) return;
    const atEdge = dir > 0 ? revealN >= activeReveal.steps : revealN <= 0;
    if (atEdge) return;
    e.preventDefault();
    if (wheelAccum !== 0 && wheelAccum > 0 !== dir > 0) wheelAccum = 0;
    wheelAccum += e.deltaY;
    if (Math.abs(wheelAccum) >= WHEEL_STEP) {
      wheelAccum = 0;
      revealStep(dir);
    }
  };
  // Teclado: mismas reglas para flechas / AvPág / espacio mientras el gate está activo.
  const onKeyGate = (e: KeyboardEvent): void => {
    if (!gateReady || !activeReveal) return;
    if (Math.abs(stage.scrollTop / unit() - HTT_STOP) > 0.06) return;
    const down = e.key === 'ArrowDown' || e.key === 'PageDown' || e.key === ' ';
    const up = e.key === 'ArrowUp' || e.key === 'PageUp';
    if (down && revealN < activeReveal.steps) {
      e.preventDefault();
      revealStep(1);
    } else if (up && revealN > 0) {
      e.preventDefault();
      revealStep(-1);
    }
  };

  stage.addEventListener('scroll', onScroll, { passive: true });
  stage.addEventListener('wheel', onWheelGate, { passive: false });
  window.addEventListener('keydown', onKeyGate);
  window.addEventListener('resize', onResize);
  // Los pasos viven arriba y abajo del riel vertical (el eje que mueven): ▲ = anterior
  // (scroll hacia 0), ▼ = siguiente (scroll hacia 11). Cada click avanza un paso del
  // recorrido (nivel o sub-nivel) dejando que el snap asiente en la próxima parada.
  q<HTMLElement>('#railUp')?.addEventListener('click', onPrev);
  q<HTMLElement>('#railDown')?.addEventListener('click', onNext);

  // Posición de apertura: normalmente 0 (arriba, con el overlay). Con deep-link (?nivel&sub-nivel)
  // arranca scrolleado directo a ese sub-nivel, clampeado al rango real de conceptos/sub-niveles.
  const bootScroll = (): number => {
    if (!initial) return 0;
    const c = Math.max(0, Math.min(N - 1, Math.round(initial.concept)));
    // Sin sub-nivel (deep-link `?nivel=X` en vista molécula): encuadrar el ÁTOMO del concepto
    // (parada `off[c] + 1.3`, ver snapStops), no el tope de su tramo. Así `?nivel=7` reabre
    // en el átomo 7 en vez de aterrizar arriba de todo.
    if (C[c].subN <= 0 || initial.sub < 1) return off[c] + 1.3;
    const k = Math.max(0, Math.min(C[c].subN - 1, Math.round(initial.sub) - 1));
    return stopS(c, k);
  };
  // El navegador restaura el scroll del stage al recargar; queremos abrir en la posición que
  // decide bootScroll (arriba, o el deep-link). Lo forzamos en el boot, en el próximo frame y
  // al `load` (por si la restauración del navegador llega tarde y la pisa).
  const openAt = (): void => {
    const s = bootScroll();
    stage.scrollTop = s * unit();
    render(s);
  };
  const bootTimer = window.setTimeout(() => {
    track.style.height = (TOTAL + 0.2) * unit() + 'px';
    openAt();
    raf(openAt);
  }, 30);
  window.addEventListener('load', openAt);

  raf(orbitLoop);

  return () => {
    destroyed = true;
    window.clearTimeout(bootTimer);
    cancelAnimationFrame(scrollAnimId);
    rafIds.forEach((id) => cancelAnimationFrame(id));
    stage.removeEventListener('scroll', onScroll);
    stage.removeEventListener('wheel', onWheelGate);
    window.removeEventListener('keydown', onKeyGate);
    window.removeEventListener('resize', onResize);
    window.removeEventListener('load', openAt);
    C.forEach((cc) => cc.subDispose?.());
  };
}
