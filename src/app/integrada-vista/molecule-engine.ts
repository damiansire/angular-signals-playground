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

/** Monta el componente real de un sub-nivel (concepto ci, sub si) y devuelve su disposer. */
export type MountSub = (host: HTMLElement, conceptIdx: number, subIdx: number) => () => void;

interface RawConcept {
  name: string;
  code: string;
  accent: AccentKey;
  dotted: boolean;
}

interface Concept extends RawConcept {
  x: number;
  y: number;
  subN: number; // cantidad de sub-niveles reales
  subs: unknown[]; // longitud = subN (para la órbita / conteo)
  card?: HTMLDivElement;
  subIdx: number;
  subDispose?: () => void; // disposer del componente montado del sub actual
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

/** Los 12 conceptos (metadata del atomo). Los sub-niveles reales se embeben en cada dive. */
const RAW: RawConcept[] = [
  { name: 'Introducción', code: 'detección de cambios', accent: 'ink', dotted: false },
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
  // scrolleado directo a ese sub-nivel en vez de arriba con el overlay. Se clampea al rango real.
  initial: { concept: number; sub: number } | null = null,
): () => void {
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
    // Cada anillo TEJE el núcleo: media elipse detrás (backG) y media delante (frontG) → 3D real.
    const arc = (sweep: number): string => `M ${-ORX} 0 A ${ORX} ${ORY} 0 0 ${sweep} ${ORX} 0`;
    const backG = el('g', {});
    const frontG = el('g', {});
    for (let o = 0; o < nO; o++) {
      const backOg = el('g', { transform: `rotate(${tilts[o]})` });
      backOg.appendChild(el('path', { class: 'ring', d: arc(0), stroke: accent }));
      backG.appendChild(backOg);
      const frontOg = el('g', { transform: `rotate(${tilts[o]})` });
      frontOg.appendChild(el('path', { class: 'ring', d: arc(1), stroke: accent }));
      const e = el('circle', { class: 'electron', r: 4, fill: accent, style: 'color:' + accent });
      e.appendChild(
        el('animateMotion', {
          dur: durs[o] + 's',
          repeatCount: 'indefinite',
          path: opath(),
          begin: -o * 1.05 + 's',
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
    const card = cc.card!;
    card.querySelector('.subnum')!.textContent = String(cc.subIdx + 1);
    // Montar el componente REAL del sub-nivel actual, desmontando el del sub anterior.
    const host = card.querySelector<HTMLElement>('.subhost')!;
    cc.subDispose?.();
    host.textContent = '';
    cc.subDispose = mountSub(host, C.indexOf(cc), cc.subIdx);
    // Re-estampar: cada mount trae su propio árbol nuevo (Angular no le pone el atributo
    // de encapsulación de integrada-vista), así que sin esto el CSS de armonización de
    // .subhost (h1/botones) nunca matchea nada.
    stampTree(host);
    fuse(cc);
    replay(card.querySelector('.subbody'), 'warp');
  }

  function subScrollTo(cc: Concept, k: number): void {
    const ci = C.indexOf(cc);
    stage.scrollTo({ top: stopS(ci, k) * unit(), behavior: 'smooth' });
  }

  // Construye los electrones UNA vez por concepto; su posición la maneja orbitLoop.
  function paintOrbit(cc: Concept): void {
    const col = COL[cc.accent];
    const nsub = cc.subN;
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
      let hw = 380;
      let hh = 190;
      let topbarY = -1e9;
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
        if (topbarEl) {
          p.x = 0;
          p.y = topbarEl.getBoundingClientRect().bottom;
          topbarY = p.matrixTransform(m).y;
        }
      }
      const dockX = ccx;
      // Un electrón "en órbita" (no acoplado) nunca puede caer ADENTRO del rectángulo real
      // de la card: una elipse pura no despeja un rectángulo en todos sus ángulos (los
      // vértices sí, los ~120° intermedios no). Si cae adentro del rect con margen, se
      // empuja hacia afuera a lo largo del mismo rayo desde el centro. También se clampea
      // contra el topbar fijo, que la elipse puede cruzar en la parte alta del ciclo.
      const MARGIN = 34;
      // El punto de acople (arriba de la card) también tiene que respetar el topbar: si la
      // card es casi tan alta como el viewport, "arriba de la card - 48" cae detrás del
      // topbar y el indicador del sub-nivel actual queda invisible. El mismo clamp que
      // protege a los electrones en órbita libre tiene que aplicar acá también.
      const dockY = Math.max(ccy - hh - 48, topbarY + MARGIN);
      for (let k = 0; k < subDots.length; k++) {
        const o = subDots[k];
        const a = o.phi + OMEGA * t;
        let ox = 450 + RX * Math.cos(a);
        let oy = 300 + RY * Math.sin(a);
        const dx = ox - ccx;
        const dy = oy - ccy;
        const bw = hw + MARGIN;
        const bh = hh + MARGIN;
        if (Math.abs(dx) < bw && Math.abs(dy) < bh) {
          const scale = Math.max(bw / Math.max(1, Math.abs(dx)), bh / Math.max(1, Math.abs(dy)));
          ox = ccx + dx * scale;
          oy = ccy + dy * scale;
        }
        oy = Math.max(oy, topbarY + MARGIN);
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
        // Igual que dockY: el borde superior real de la card puede arrancar detrás del
        // topbar (la card empieza unos px por encima de su línea), así que este extremo
        // del haz también necesita el clamp, no solo el punto acoplado del otro lado.
        const edgeY = Math.max(ccy - hh, topbarY + MARGIN);
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
    card.className = 'card live card--sub';
    card.style.setProperty('--glow', COL[cc.accent]);
    card.innerHTML =
      `<span class="subflash"></span><p class="card__k">Adentro · ${cc.name} · nivel ${i}</p>` +
      `<p class="subtop">sub-nivel <b class="subnum">1</b> / ${cc.subN}</p>` +
      '<div class="subbody"><div class="subhost"></div></div>';
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
    const r = el('circle', { class: 'ripple', cx: C[i].x, cy: C[i].y, r: NUC + 8, stroke: COL[C[i].accent] });
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
  const scrubber = q<HTMLInputElement>('#scrubber')!;
  const railDot = q<HTMLElement>('#railDot');
  const introEl = q<HTMLElement>('.intro');
  const topbarEl = q<HTMLElement>('.topbar');
  const railEl = q<HTMLElement>('.rail');
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
    // La cámara ya centró y agrandó el átomo detrás de la card (K llega a FK=2.7): dejarlo
    // brillar de fondo, en vez de apagarlo casi del todo, es lo que hace que la card se lea
    // "parada sobre el átomo" en vez de "algo nuevo que tapó la escena".
    sceneG.style.opacity = (1 - 0.62 * diveDepth).toFixed(2);

    // El aura del concepto crece desde el átomo (chica) hasta el fondo del card (grande),
    // tomando el color del concepto: el card queda "nacido" del átomo, no suelto. El velo
    // es una atmósfera suave (no un scrim de modal): apenas entona el entorno para que el
    // color resalte parejo en todos los conceptos, sin apagar la escena.
    diveAura.style.setProperty('--glow', COL[C[c].accent]);
    diveAura.style.opacity = (0.72 * diveDepth).toFixed(3);
    diveAura.style.transform = `scale(${(0.32 + 0.68 * diveDepth).toFixed(3)})`;
    diveVeil.style.opacity = (0.32 * diveDepth).toFixed(3);
    // El topbar y el riel acompañan la misma atmósfera al bucear (en vez de quedar fijos y
    // brillantes mientras todo se apaga alrededor, que es la gramática visual de un modal
    // sobre un app-shell). Siguen legibles/clickeables, solo bajan de intensidad.
    if (topbarEl) topbarEl.style.opacity = (1 - 0.4 * diveDepth).toFixed(3);
    if (railEl) railEl.style.opacity = (1 - 0.35 * diveDepth).toFixed(3);

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
    if (dc.subN > 0 && diveDepth > 0.35) {
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
    scrubber.value = String(Math.round((s / TOTAL) * 60));
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
    const positions: { s: number; stop: boolean }[] =
      C[c].subN > 0
        ? Array.from({ length: C[c].subN }, (_, k) => ({ s: stopS(c, k), stop: true }))
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

  // Posición de apertura: normalmente 0 (arriba, con el overlay). Con deep-link (?nivel&sub-nivel)
  // arranca scrolleado directo a ese sub-nivel, clampeado al rango real de conceptos/sub-niveles.
  const bootScroll = (): number => {
    if (!initial) return 0;
    const c = Math.max(0, Math.min(N - 1, Math.round(initial.concept)));
    if (C[c].subN <= 0) return off[c];
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
    rafIds.forEach((id) => cancelAnimationFrame(id));
    stage.removeEventListener('scroll', onScroll);
    window.removeEventListener('resize', onResize);
    window.removeEventListener('load', openAt);
    scrubber.removeEventListener('input', onScrub);
    C.forEach((cc) => cc.subDispose?.());
  };
}
