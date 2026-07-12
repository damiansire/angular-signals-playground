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

/** Instrumentos reales del Lab embebibles. */
export type LabKind = 'computed' | 'effect' | 'signal' | 'manual';

interface Sub {
  t: string;
  code?: string;
  c?: string;
  demo?: 'set' | 'update';
  value?: number;
  /** Si está, este sub-nivel muestra el instrumento REAL del Lab en vez de texto. */
  lab?: 'signal' | 'manual';
}

interface RawConcept {
  name: string;
  code: string;
  accent: AccentKey;
  dotted: boolean;
  p: string;
  demo: string;
  subs?: Sub[];
}

interface Concept extends RawConcept {
  x: number;
  y: number;
  card?: HTMLDivElement;
  subIdx: number;
  entered: boolean;
  stop: number;
}

interface SubDot {
  g: SVGGElement;
  dot: SVGCircleElement;
  num: SVGTextElement;
  phi: number;
  lx: number;
  ly: number;
  dockT: number;
}

/** Los 12 conceptos. Introducción (4) y Signals (7) traen sub-niveles reales. */
const RAW: RawConcept[] = [
  {
    name: 'Introducción',
    code: 'detección de cambios',
    accent: 'ink',
    dotted: false,
    p: 'Cómo Angular decide qué volver a dibujar. El punto de partida.',
    demo: '',
    subs: [
      {
        t: 'HTML → árbol',
        code: '<div><p>Hola</p></div>',
        c: 'El HTML que escribís se representa internamente como un árbol de nodos (el DOM).',
      },
      {
        t: 'Variables en pantalla',
        code: "let nombre = 'Ada';",
        c: 'Una variable y sus cambios se reflejan en la vista: del HTML al JavaScript a Angular.',
      },
      {
        t: 'Detección vieja (Zone.js)',
        code: '// click / timer / fetch → revisa TODO el árbol',
        c: 'Zone.js avisa que pasó algo async; Angular recorre el árbol entero (estrategia default).',
      },
      {
        t: 'Detección con signals',
        code: 'count.set(5);',
        c: 'Cuando cambia un signal, Angular re-chequea SOLO los componentes que lo consumen, no todo el árbol.',
      },
      {
        t: 'La detección, en vivo',
        c: 'El instrumento real del Lab: mirá cómo la detección de cambios recorre (o no) el árbol.',
        lab: 'manual',
      },
    ],
  },
  {
    name: 'Signals',
    code: 'signal()',
    accent: 'source',
    dotted: false,
    p: 'Un valor que avisa cuando cambia. La única fuente: todo lo demás sale de acá.',
    demo: 'signal',
    subs: [
      {
        t: 'Variables (repaso pre-signals)',
        code: 'let count = 0;',
        c: 'En JS guardás un valor en una variable: var / const / let.',
      },
      {
        t: '¿Qué es un signal?',
        code: 'count = signal(0);',
        c: 'Un envoltorio alrededor de un valor que avisa a sus consumidores cuando ese valor cambia.',
      },
      {
        t: 'Tipos de signal',
        code: 'signal(0)   // writable\ncomputed()  // read-only',
        c: 'Hay escribibles (WritableSignal) y de solo lectura (Signal y computed).',
      },
      {
        t: 'Leer: el getter ()',
        code: 'count()   // → 0',
        c: 'Un signal se LEE llamándolo como función: count(). Igual en el TypeScript y en el template.',
      },
      {
        t: 'Writable: set()',
        code: 'count.set(5);',
        c: 'signal.set() reemplaza el valor de un writable signal por uno nuevo.',
        demo: 'set',
      },
      {
        t: 'update()',
        code: 'count.update(n => n + 1);',
        c: 'signal.update() calcula el nuevo valor a partir del anterior.',
        demo: 'update',
      },
      {
        t: 'Read-only: asReadonly()',
        code: 'ro = count.asReadonly();',
        c: 'asReadonly() expone un signal que se lee pero no se escribe desde afuera.',
      },
      {
        t: 'signal() en el instrumento',
        c: 'El instrumento real del Lab: tocá la fuente y mirá el flujo de un signal en vivo.',
        lab: 'signal',
      },
    ],
  },
  { name: 'Computed', code: 'computed()', accent: 'derived', dotted: true, p: 'Se deriva solo desde otros signals. No lo seteás: se recalcula cuando cambia su fuente.', demo: 'computed' },
  { name: 'Effects', code: 'effect()', accent: 'effect', dotted: false, p: 'Corre una acción cada vez que cambia lo que lee. El lado de los efectos.', demo: 'effect' },
  { name: 'Igualdad', code: 'equality', accent: 'source', dotted: false, p: 'Cuándo un signal NO avisa a sus consumidores.', demo: '' },
  { name: 'Linked', code: 'linkedSignal()', accent: 'derived', dotted: true, p: 'Estado escribible que nace de una fuente y se resetea con ella.', demo: '' },
  { name: 'Resource', code: 'resource()', accent: 'derived', dotted: true, p: 'Datos async como signals: value, status, error, isLoading.', demo: '' },
  { name: 'Inputs & Outputs', code: 'input · model', accent: 'source', dotted: false, p: 'El API de un componente, en signals.', demo: '' },
  { name: 'Queries', code: 'viewChild', accent: 'ink', dotted: true, p: 'Ver el DOM y convivir con RxJS, todo como signals.', demo: '' },
  { name: 'After render', code: 'afterRenderEffect()', accent: 'effect', dotted: false, p: 'Medir y leer el DOM justo después de dibujar.', demo: '' },
  { name: 'Debounce', code: 'debounce', accent: 'effect', dotted: true, p: 'Un valor que espera antes de propagarse.', demo: '' },
  { name: 'Zoneless', code: 'zoneless', accent: 'capstone', dotted: false, p: 'Signals + OnPush dejan tirar Zone.js.', demo: '' },
];

const CX = 410;
const CY = 290;
const ORX = 34;
const ORY = 11;
const NUC = 13;
const SPIN = 55;
const RX = 440;
const RY = 208;
const OMEGA = (2 * Math.PI) / SPIN;
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

function smoothstep(t: number): number {
  const x = Math.max(0, Math.min(1, t));
  return x * x * (3 - 2 * x);
}

function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

/** Monta un instrumento real del Lab dentro de `host` y devuelve su disposer. */
export type MountLab = (host: HTMLElement, kind: LabKind) => () => void;

export function initMolecule(root: HTMLElement, mountLab: MountLab, enc: string | null = null): () => void {
  const C: Concept[] = RAW.map((r) => ({ ...r, x: 0, y: 0, subIdx: 0, entered: false, stop: 0 }));
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
  const labDisposers: (() => void)[] = [];
  const rafIds = new Set<number>();
  const raf = (fn: FrameRequestCallback): void => {
    const id = requestAnimationFrame((ts) => {
      rafIds.delete(id);
      fn(ts);
    });
    rafIds.add(id);
  };

  // Layout de scroll (ver scrollLayout): cada concepto arranca en off[i] y ocupa len[i].
  const { off, len, total: TOTAL } = scrollLayout(C.map((c) => (c.subs ? c.subs.length : null)));

  const pos = (i: number): { x: number; y: number } => {
    if (i === 0) return { x: CX, y: CY };
    const ang = (i - 1) * 0.68 - Math.PI / 2;
    const r = 64 + (i - 1) * 21;
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
  const wideK = (c: number): number => Math.max(0.58, Math.min(1.2, 250 / (outerRadius(c) + 62)));
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
    const ln = el('line', { class: 'bond', x1: C[i - 1].x, y1: C[i - 1].y, x2: C[i].x, y2: C[i].y });
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
    const tilts = [20 + i * 24, -55 + i * 15, 84];
    const durs = [2.4, 3.4, 4.3];
    const nO = cc.accent === 'source' ? 1 : i % 2 ? 3 : 2;
    for (let o = 0; o < nO; o++) {
      const og = el('g', { transform: `rotate(${tilts[o]})` });
      og.appendChild(el('ellipse', { class: 'ring', cx: 0, cy: 0, rx: ORX, ry: ORY, stroke: accent }));
      const e = el('circle', { class: 'electron', r: 4, fill: accent, style: 'color:' + accent });
      e.appendChild(
        el('animateMotion', {
          dur: durs[o] + 's',
          repeatCount: 'indefinite',
          path: opath(),
          begin: -o * 1.05 + 's',
        }),
      );
      og.appendChild(e);
      orb.appendChild(og);
    }
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

  // Órbita de sub-niveles (electrones que orbitan la card; el actual se acopla por fuera).
  const suborbit = el('svg', { class: 'suborbit', viewBox: '0 0 900 600' });
  const subRing = el('ellipse', { class: 'sub-ring', cx: 450, cy: 300, rx: RX, ry: RY });
  const tether = el('path', { class: 'tether', d: '' });
  const tetherNode = el('circle', { class: 'tether-node', r: 5 });
  const subEG = el('g', {});
  suborbit.appendChild(subRing);
  suborbit.appendChild(tether);
  suborbit.appendChild(tetherNode);
  suborbit.appendChild(subEG);

  let orbitFor = -1;
  let subDots: SubDot[] = [];

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
    const subs = cc.subs as Sub[];
    const s = subs[cc.subIdx];
    const card = cc.card!;
    card.querySelector('.st')!.textContent = s.t;
    card.querySelector('.sc')!.textContent = s.c ?? '';
    card.querySelector('.scode')!.textContent = s.code ?? '';
    card.querySelector('.subnum')!.textContent = String(cc.subIdx + 1);
    // El sub-nivel de Lab muestra el instrumento real (oculta el texto) vía `.subbody--lab`.
    card.querySelector('.subbody')!.classList.toggle('subbody--lab', !!s.lab);
    fuse(cc);
    replay(card.querySelector('.subbody'), 'warp');
    const sdemo = card.querySelector<HTMLElement>('.sdemo')!;
    sdemo.innerHTML = '';
    if (s.demo === 'set' || s.demo === 'update') {
      if (s.value === undefined) s.value = 0;
      const box = document.createElement('div');
      box.className = 'demo';
      const val = document.createElement('span');
      val.className = 'val';
      val.textContent = String(s.value);
      const btn = document.createElement('button');
      btn.textContent = s.demo === 'set' ? 'set(5)' : '+1';
      btn.addEventListener('click', () => {
        s.value = s.demo === 'set' ? 5 : (s.value ?? 0) + 1;
        val.textContent = String(s.value);
      });
      box.appendChild(val);
      box.appendChild(btn);
      sdemo.appendChild(box);
      stampTree(sdemo);
    }
  }

  function subScrollTo(cc: Concept, k: number): void {
    const ci = C.indexOf(cc);
    stage.scrollTo({ top: stopS(ci, k) * unit(), behavior: 'smooth' });
  }

  // Construye los electrones UNA vez por concepto; su posición la maneja orbitLoop.
  function paintOrbit(cc: Concept): void {
    const col = COL[cc.accent];
    const nsub = (cc.subs as Sub[]).length;
    subRing.setAttribute('stroke', col);
    subEG.textContent = '';
    subDots = [];
    for (let k = 0; k < nsub; k++) {
      const phi = -Math.PI / 2 + k * ((2 * Math.PI) / nsub);
      const x0 = 450 + RX * Math.cos(phi);
      const y0 = 300 + RY * Math.sin(phi);
      const g = el('g', { class: 'sub-e' });
      const dot = el('circle', { class: 'sub-dot', cx: x0.toFixed(1), cy: y0.toFixed(1), r: 12 });
      const num = el('text', { class: 'sub-n', x: x0.toFixed(1), y: (y0 + 4).toFixed(1) });
      num.textContent = String(k + 1);
      g.appendChild(dot);
      g.appendChild(num);
      const idx = k;
      g.addEventListener('click', () => subScrollTo(cc, idx));
      subEG.appendChild(g);
      subDots.push({ g, dot, num, phi, lx: x0, ly: y0, dockT: 0 });
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
      o.dot.setAttribute('r', String(state === 'current' ? 18 : state === 'visited' ? 13 : 12));
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

  // Loop VIVO: mueve los electrones sobre la elipse; el actual se acopla arriba de la card
  // y un haz corto lo conecta con el borde superior (siempre por fuera de la caja).
  function orbitLoop(ts: number): void {
    if (destroyed) return;
    const vis = orbitFor >= 0 && subDots.length > 0 && (+suborbit.style.opacity || 0) > 0.05;
    if (vis) {
      const cc = C[orbitFor];
      const t = (ts || 0) / 1000;
      const cur = cc.subIdx;
      const op = +suborbit.style.opacity || 0;
      let ccx = 450;
      let ccy = 300;
      let hh = 190;
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
        hh = (br.y - tl.y) / 2;
      }
      const dockX = ccx;
      const dockY = ccy - hh - 48;
      for (let k = 0; k < subDots.length; k++) {
        const o = subDots[k];
        const a = o.phi + OMEGA * t;
        const ox = 450 + RX * Math.cos(a);
        const oy = 300 + RY * Math.sin(a);
        const target = k === cur ? 1 : 0;
        o.dockT += (target - o.dockT) * 0.12;
        const e = o.dockT * o.dockT * (3 - 2 * o.dockT);
        o.lx = ox + (dockX - ox) * e;
        o.ly = oy + (dockY - oy) * e;
        o.dot.setAttribute('cx', o.lx.toFixed(1));
        o.dot.setAttribute('cy', o.ly.toFixed(1));
        o.num.setAttribute('x', o.lx.toFixed(1));
        o.num.setAttribute('y', (o.ly + 4).toFixed(1));
      }
      const oc = subDots[cur];
      if (oc && oc.dockT > 0.5) {
        const edgeY = ccy - hh;
        tether.setAttribute('d', `M ${oc.lx.toFixed(1)} ${oc.ly.toFixed(1)} L ${dockX.toFixed(1)} ${edgeY.toFixed(1)}`);
        tether.setAttribute('stroke', COL[cc.accent]);
        tetherNode.setAttribute('cx', dockX.toFixed(1));
        tetherNode.setAttribute('cy', edgeY.toFixed(1));
        tetherNode.setAttribute('fill', COL[cc.accent]);
        const cop = Math.min(1, (oc.dockT - 0.5) / 0.4) * op;
        tether.style.opacity = (0.9 * cop).toFixed(2);
        tetherNode.style.opacity = cop.toFixed(2);
      } else {
        tether.style.opacity = '0';
        tetherNode.style.opacity = '0';
      }
    } else {
      tether.style.opacity = '0';
      tetherNode.style.opacity = '0';
    }
    raf(orbitLoop);
  }

  // ---- Contenido de cada concepto ----
  C.forEach((cc, i) => {
    const card = document.createElement('div');
    const isLab = cc.demo === 'effect' || cc.demo === 'computed';
    const hasSubs = !!cc.subs;
    card.className =
      'card' +
      (cc.demo === 'signal' || isLab || hasSubs ? ' live' : '') +
      (isLab ? ' card--wide' : '') +
      (hasSubs ? ' card--sub' : '');
    card.style.setProperty('--glow', COL[cc.accent]);
    let demoHtml = '';
    if (cc.demo === 'signal') {
      demoHtml = '<div class="demo"><span class="val" id="sigv">3</span><button id="sigb" aria-label="sumar">+</button></div>';
    } else if (isLab) {
      // Slot para embeber el instrumento REAL del Lab (se monta abajo).
      const labName = cc.demo === 'computed' ? 'Celdas reactivas' : 'Osciloscopio';
      demoHtml = `<p class="lab-tag">Lab · ${labName}</p><div class="lab-slot"></div>`;
    }
    const cta = `<a class="enter-cta">Entrar al nivel ${i} →</a>`;
    if (hasSubs) {
      card.innerHTML =
        `<span class="subflash"></span><p class="card__k">Adentro · ${cc.name} · nivel ${i}</p>` +
        `<p class="subtop">sub-nivel <b class="subnum">1</b> / ${(cc.subs as Sub[]).length}</p>` +
        '<div class="subbody"><p class="st"></p><pre class="scode"></pre><p class="sc"></p><div class="sdemo"></div><div class="sublab"></div></div>' +
        cta;
    } else {
      card.innerHTML =
        `<p class="card__k">Adentro · ${cc.name}</p><p class="card__t">${cc.name}</p>` +
        `<p class="card__code">${cc.code}</p><p class="card__p">${cc.p}</p>${demoHtml}${cta}`;
    }
    contentEl.appendChild(card);
    cc.card = card;
    stamp(card);
    stampTree(card); // estampar ANTES de montar el Lab real (para no tocar sus internals)
    if (isLab) {
      const slot = card.querySelector<HTMLElement>('.lab-slot')!;
      labDisposers.push(mountLab(slot, cc.demo === 'computed' ? 'computed' : 'effect'));
    }
    if (hasSubs) {
      // El último sub-nivel de Introducción/Signals es el instrumento real del Lab.
      const labSub = (cc.subs as Sub[]).find((sb) => sb.lab);
      if (labSub) {
        const slot = card.querySelector<HTMLElement>('.sublab')!;
        labDisposers.push(mountLab(slot, labSub.lab!));
      }
      cc.subIdx = 0;
      renderSubCard(cc);
    }
  });
  contentEl.appendChild(suborbit);

  // Demo mínima del concepto Signals (contador): el resto del contenido real vive en cada nivel.
  const sigv = q<HTMLElement>('#sigv');
  const sigb = q<HTMLElement>('#sigb');
  if (sigb && sigv) sigb.addEventListener('click', () => (sigv.textContent = String(+sigv.textContent! + 1)));

  // ---- Onda reactiva al nacer un átomo ----
  function ripat(i: number): void {
    const r = el('circle', { class: 'ripple', cx: C[i].x, cy: C[i].y, r: NUC + 8, stroke: COL[C[i].accent] });
    ripG.appendChild(r);
    window.setTimeout(() => r.remove(), 810);
  }
  let lastBorn = 0;
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
  const scrubber = q<HTMLInputElement>('#scrubber')!;
  const railDot = q<HTMLElement>('#railDot');
  const cueEl = q<HTMLElement>('.scrollcue');
  const railTicksOl = q<HTMLElement>('#railTicks')!;
  for (let t = 0; t < N; t++) {
    const li = document.createElement('li');
    li.textContent = String(t);
    stamp(li);
    railTicksOl.appendChild(li);
  }
  const railTicks = Array.from(root.querySelectorAll<HTMLElement>('#railTicks li'));

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
    sceneG.setAttribute('transform', `translate(${(CX - K * fx).toFixed(1)},${(300 - K * fy).toFixed(1)}) scale(${K.toFixed(3)})`);
    sceneG.style.opacity = (1 - 0.9 * diveDepth).toFixed(2);

    const dc = C[c];
    if (dc.subs) {
      const M = dc.subs.length;
      const si = w < 2 ? 0 : Math.min(M - 1, 1 + Math.floor(w - 2));
      if (dc.subIdx !== si) {
        dc.subIdx = si;
        renderSubCard(dc);
        if (orbitFor === c) updateOrbitFill(dc);
      }
    }
    if (dc.subs && diveDepth > 0.35) {
      if (orbitFor !== c) {
        paintOrbit(dc);
        orbitFor = c;
      }
      suborbit.classList.add('on');
      suborbit.style.opacity = Math.min(1, (diveDepth - 0.35) / 0.4).toFixed(2);
    } else if (orbitFor !== -1) {
      suborbit.classList.remove('on');
      suborbit.style.opacity = '0';
      orbitFor = -1;
    }

    atomEls.forEach((g, i) => {
      const orb = g.querySelector<SVGGElement>('.orb')!;
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
      card.style.transform = `scale(${(0.9 + 0.1 * amt).toFixed(3)})`;
      const interactive = cc.demo === 'signal' || cc.demo === 'computed' || cc.demo === 'effect';
      card.style.pointerEvents = amt > 0.6 && interactive ? 'auto' : 'none';
    });

    if (w > 0.7 && lastBorn < c + 1) {
      propagate(c, c + 1);
      lastBorn = c + 1;
    }
    if (s < 0.05) lastBorn = 0;
    capS.textContent = (w > 1.3 ? 'Adentro · ' : 'Molécula · ') + C[c].name;
    scrubber.value = String(Math.round((s / TOTAL) * 60));
    if (railDot) railDot.style.top = ((s / TOTAL) * 100).toFixed(1) + '%';
    for (let ti = 0; ti < railTicks.length; ti++) railTicks[ti].classList.toggle('on', ti === c);
    if (cueEl) cueEl.style.opacity = s < 0.45 ? '1' : '0';
  }

  // ---- Scroll 100% NATIVO + snap ----
  // El navegador maneja el scroll (suave y familiar). Anclas invisibles hacen que:
  //  - en los sub-niveles NO se pueda saltear (scroll-snap-stop: always → uno por gesto);
  //  - en cada concepto de la molécula se asiente sin trabar el scroll (snap suave).
  const unit = (): number => stage.clientHeight;
  const stopS = (c: number, k: number): number => off[c] + (k === 0 ? 1.95 : 2 + (k - 1) + 0.5);

  const snaps = document.createElement('div');
  snaps.className = 'snaps';
  snaps.setAttribute('aria-hidden', 'true');
  stamp(snaps);
  for (let c = 0; c < N; c++) {
    const positions: { s: number; stop: boolean }[] = C[c].subs
      ? (C[c].subs as Sub[]).map((_, k) => ({ s: stopS(c, k), stop: true }))
      : [{ s: off[c] + 1.85, stop: false }];
    for (const p of positions) {
      const a = document.createElement('div');
      a.className = 'snap' + (p.stop ? ' snap--stop' : '');
      a.style.top = ((p.s / (TOTAL + 0.2)) * 100).toFixed(3) + '%';
      stamp(a);
      snaps.appendChild(a);
    }
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
  const onScrub = (): void => {
    stage.scrollTop = (+scrubber.value / 60) * TOTAL * unit();
    render(stage.scrollTop / unit());
  };
  const onPrev = (): void => stage.scrollBy({ top: -unit() * 0.55, behavior: 'smooth' });
  const onNext = (): void => stage.scrollBy({ top: unit() * 0.55, behavior: 'smooth' });

  stage.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', onResize);
  scrubber.addEventListener('input', onScrub);
  q<HTMLElement>('#prev')?.addEventListener('click', onPrev);
  q<HTMLElement>('#next')?.addEventListener('click', onNext);

  const bootTimer = window.setTimeout(() => {
    track.style.height = (TOTAL + 0.2) * unit() + 'px';
    render(0);
  }, 30);

  raf(orbitLoop);

  return () => {
    destroyed = true;
    window.clearTimeout(bootTimer);
    rafIds.forEach((id) => cancelAnimationFrame(id));
    stage.removeEventListener('scroll', onScroll);
    window.removeEventListener('resize', onResize);
    scrubber.removeEventListener('input', onScrub);
    labDisposers.forEach((d) => d());
  };
}
