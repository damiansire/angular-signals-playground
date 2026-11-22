/**
 * Angie's own low-poly 3D model, and its projection to SVG from any angle.
 *
 * The official model is a 100 MB mesh; this one is a convex gem of named facets with a sunk,
 * framed visor and the face laid onto it, fitted to the official one at every degree
 * (`scripts/angie-3d/`). Units are the official model's: y up, +z is where she looks, the gem
 * spans y 16..164.
 */

export type Vec3 = [number, number, number];
type Vec2 = [number, number];

/**
 * The gem's facets: [name, azimuth from the front toward the viewer's right, elevation, distance
 * from the origin]. Every facet off the center line is mirrored (D/I suffix); the vertices come
 * from the planes, never by hand. Fitted by `scripts/angie-3d/optimizar.mjs`.
 */
export const FACETAS: readonly (readonly [string, number, number, number])[] = [
  ['lado', 94.5, -16, 39.56],
  ['frenteLado', 57, -14, 37.06],
  ['espalda', 156.75, -7.75, 44.45],
  ['arribaLado', 94.5, 57.5, 137.67],
  ['arribaEspalda', 158.5, 45.75, 122.48],
  ['abajoLado', 88.25, -47.75, 1.16],
  ['abajoEspalda', 160.25, -56.5, -8.8],
  ['frenteArriba', 34.5, 45, 116.21],
  ['ceja', 28.5, 32, 98.27],
  ['visor', 29.5, -10.75, 35.99],
  ['menton', 41.75, -24.5, 23.58],
  ['abajoFrente', 53.75, -69.25, -7.49],
  ['abajo', 0, -88.75, -15.92],
];

export interface Visor {
  /** The opening in the hull, fitted to the official one at every 6 degrees. */
  anchoAbajo: number;
  anchoArriba: number;
  yAbajo: number;
  curvaAbajo: number;
  yArriba: number;
  picoArriba: number;
  /** The panel: a vertical bulge that leans back toward the bottom, flatter toward the sides. */
  z0: number;
  inclinacion: number;
  curva: number;
  cuartica: number;
  xRecto: number;
  /** The frame: a brim on top (the panel's top edge rises toward the sides) and a sloped band. */
  techo: number;
  techoPico: number;
  holgura: number;
  margenLado: number;
  margenAbajo: number;
}

export const VISOR: Visor = {
  anchoAbajo: 38.75,
  anchoArriba: 53.5,
  yAbajo: 36.25,
  curvaAbajo: 4.5,
  yArriba: 91,
  picoArriba: 5.5,
  // fitted to the official depth map with rms 1.1 (`scripts/angie-3d/ajustar-visor.mjs`)
  z0: 47.5,
  inclinacion: 0.197,
  curva: 0.0237,
  cuartica: 5.72e-6,
  xRecto: 40,
  techo: 78,
  techoPico: 12,
  holgura: 0.8,
  margenLado: 7,
  margenAbajo: 4,
};

export interface Cara {
  ojos: { x: number; y: number; rx: number; ry: number }[];
  cejas: { x: number; y: number; w: number; h: number; rot: number }[];
  boca: { x: number; y: number; w: number; h: number };
}

/** Face features in front coordinates (x, y), laid onto the visor's panel. */
export const CARA: Cara = {
  ojos: [
    { x: -16, y: 64, rx: 4.6, ry: 7.6 },
    { x: 16, y: 64, rx: 4.6, ry: 7.6 },
  ],
  cejas: [
    { x: -17, y: 78.5, w: 7, h: 2.6, rot: 8 },
    { x: 17, y: 78.5, w: 7, h: 2.6, rot: -8 },
  ],
  boca: { x: 0, y: 53, w: 6.5, h: 4 },
};

export interface CaraDeGema {
  nombre: string;
  n: Vec3;
  d: number;
  /** Vertex indices, in order around the face. */
  v: number[];
}

export interface Gema {
  verts: Vec3[];
  caras: CaraDeGema[];
}

const norm = (n: readonly number[]): Vec3 => {
  const l = Math.hypot(...n);
  return [n[0] / l, n[1] / l, n[2] / l];
};
const dot = (a: readonly number[], b: readonly number[]) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
const cruz = (a: readonly number[], b: readonly number[]): Vec3 => [
  a[1] * b[2] - a[2] * b[1],
  a[2] * b[0] - a[0] * b[2],
  a[0] * b[1] - a[1] * b[0],
];
const rad = Math.PI / 180;
const dir = (az: number, el: number): Vec3 => [
  Math.cos(el * rad) * Math.sin(az * rad),
  Math.sin(el * rad),
  Math.cos(el * rad) * Math.cos(az * rad),
];

/** Half-space intersection: every triple of planes that meets inside all the others is a vertex. */
export function construirGema(facetas = FACETAS): Gema {
  const planos: { nombre: string; n: Vec3; d: number }[] = [];
  for (const [nombre, az, el, d] of facetas) {
    const n = dir(az, el);
    if (az === 0 || az === 180) planos.push({ nombre, n, d });
    else
      planos.push(
        { nombre: nombre + 'D', n, d },
        { nombre: nombre + 'I', n: [-n[0], n[1], n[2]], d },
      );
  }
  const verts: Vec3[] = [];
  const de: Set<number>[] = [];
  for (let i = 0; i < planos.length; i++)
    for (let j = i + 1; j < planos.length; j++)
      for (let k = j + 1; k < planos.length; k++) {
        const [a, b, c] = [planos[i].n, planos[j].n, planos[k].n];
        const bxc = cruz(b, c);
        const det = dot(a, bxc);
        if (Math.abs(det) < 1e-9) continue;
        const cxa = cruz(c, a);
        const axb = cruz(a, b);
        const p = [0, 1, 2].map(
          (q) => (planos[i].d * bxc[q] + planos[j].d * cxa[q] + planos[k].d * axb[q]) / det,
        ) as Vec3;
        if (planos.some((pl) => dot(pl.n, p) > pl.d + 1e-4)) continue;
        // three planes meeting at one corner of a facet give the same point more than once
        let v = verts.findIndex((w) => Math.hypot(w[0] - p[0], w[1] - p[1], w[2] - p[2]) < 0.3);
        if (v < 0) {
          v = verts.length;
          verts.push(p);
          de.push(new Set());
        }
        de[v].add(i).add(j).add(k);
      }
  const caras: CaraDeGema[] = [];
  planos.forEach((pl, pi) => {
    const idx = verts.map((_, i) => i).filter((i) => de[i].has(pi));
    if (idx.length < 3) return;
    const cen = [0, 1, 2].map((q) => idx.reduce((s, i) => s + verts[i][q], 0) / idx.length);
    const e1 = norm(cruz(Math.abs(pl.n[1]) < 0.9 ? [0, 1, 0] : [1, 0, 0], pl.n));
    const e2 = cruz(pl.n, e1);
    const ang = (i: number) => {
      const r = verts[i].map((x, q) => x - cen[q]);
      return Math.atan2(dot(r, e2), dot(r, e1));
    };
    idx.sort((i, j) => ang(i) - ang(j));
    caras.push({ nombre: pl.nombre, n: pl.n, d: pl.d, v: idx });
  });
  return { verts, caras };
}

export interface Modelo {
  gema: Gema;
  visor: Visor;
  cara: Cara;
  /** The opening's outline in front (x, y): u in [-1, 1] across, v in [0, 1] up. */
  visorXY: (u: number, v: number) => Vec2;
  /** The panel's outline, inset from the opening: same parameters. */
  panelXY: (u: number, v: number) => Vec2;
  /** The opening's outline as (u, v), counterclockwise seen from the front. */
  borde: Vec2[];
  /** The hull's height at a front point, and the index of the facet it lies on. */
  sobreCasco: (x: number, y: number) => [number, number];
  /** The facets the opening is cut into. */
  portadoras: number[];
  enVisor: (p: Vec2) => Vec3;
  normalVisor: (p: Vec2) => Vec3;
}

export function construirModelo(facetas = FACETAS, visor = VISOR, cara = CARA): Modelo {
  const gema = construirGema(facetas);
  const frente = gema.caras.map((c, i) => [c, i] as const).filter(([c]) => c.n[2] > 0.05);
  const sobreCasco = (x: number, y: number): [number, number] => {
    let mejor: [number, number] = [Infinity, -1];
    for (const [c, i] of frente) {
      const z = (c.d - c.n[0] * x - c.n[1] * y) / c.n[2];
      if (z < mejor[0]) mejor = [z, i];
    }
    return mejor;
  };
  const visorXY = (u: number, v: number): Vec2 => {
    const x = u * (visor.anchoAbajo + (visor.anchoArriba - visor.anchoAbajo) * v);
    const yA = visor.yAbajo + visor.curvaAbajo * u * u;
    const yB = visor.yArriba + visor.picoArriba * Math.abs(u);
    return [x, yA + (yB - yA) * v];
  };
  const panelXY = (u: number, v: number): Vec2 => {
    const yA = visor.yAbajo + visor.curvaAbajo * u * u;
    const yR = visor.yArriba + visor.picoArriba * Math.abs(u);
    const y0 = yA + visor.margenAbajo;
    const y = y0 + (Math.min(yR, visor.techo + visor.techoPico * Math.abs(u)) - y0) * v;
    // the sides follow the opening's own sides, at the opening's width for that height
    const vr = (y - yA) / (yR - yA);
    return [
      u * (visor.anchoAbajo + (visor.anchoArriba - visor.anchoAbajo) * vr - visor.margenLado),
      y,
    ];
  };
  // past xRecto the quartic would curl back up, so the profile goes on straight
  const pendienteRecta = -2 * visor.curva * visor.xRecto + 4 * visor.cuartica * visor.xRecto ** 3;
  const perfil = (x: number) => {
    const a = Math.min(Math.abs(x), visor.xRecto);
    return (
      -visor.curva * a * a +
      visor.cuartica * a ** 4 +
      pendienteRecta * Math.max(0, Math.abs(x) - visor.xRecto)
    );
  };
  const zPanel = (x: number, y: number) =>
    Math.min(
      visor.z0 + visor.inclinacion * (y - visor.yAbajo) + perfil(x),
      sobreCasco(x, y)[0] - visor.holgura,
    );
  const borde: Vec2[] = [];
  const N = 16;
  for (let i = 0; i <= N; i++) borde.push([-1 + (2 * i) / N, 0]);
  for (let i = 1; i <= N; i++) borde.push([1, i / N]);
  for (let i = N - 1; i >= 0; i--) borde.push([-1 + (2 * i) / N, 1]);
  for (let i = N - 1; i >= 1; i--) borde.push([-1, i / N]);
  const portadoras = new Set<number>();
  for (let i = 0; i <= 40; i++)
    for (let j = 0; j <= 20; j++) portadoras.add(sobreCasco(...visorXY(-1 + i / 20, j / 20))[1]);
  return {
    gema,
    visor,
    cara,
    visorXY,
    panelXY,
    borde,
    sobreCasco,
    portadoras: [...portadoras],
    enVisor: ([x, y]) => [x, y, zPanel(x, y)],
    normalVisor: ([x, y]) => {
      const h = 0.5;
      return norm([
        -(zPanel(x + h, y) - zPanel(x - h, y)) / (2 * h),
        -(zPanel(x, y + h) - zPanel(x, y - h)) / (2 * h),
        1,
      ]);
    },
  };
}

export const MODELO = construirModelo();

/** Sutherland-Hodgman: a polygon cut by a convex one (2D, either winding). */
function recortar(sujeto: Vec2[], convexo: Vec2[]): Vec2[] {
  const area = convexo.reduce((s, p, i) => {
    const q = convexo[(i + 1) % convexo.length];
    return s + p[0] * q[1] - q[0] * p[1];
  }, 0);
  const signo = Math.sign(area) || 1;
  let salida = sujeto;
  for (let i = 0; i < convexo.length && salida.length; i++) {
    const a = convexo[i];
    const b = convexo[(i + 1) % convexo.length];
    const lado = (p: Vec2) => (b[0] - a[0]) * (p[1] - a[1]) - (b[1] - a[1]) * (p[0] - a[0]);
    const entrada = salida;
    salida = [];
    entrada.forEach((p, k) => {
      const q = entrada[(k + 1) % entrada.length];
      const dp = lado(p);
      const dq = lado(q);
      const corte = (): Vec2 => {
        const t = dp / (dp - dq);
        return [p[0] + (q[0] - p[0]) * t, p[1] + (q[1] - p[1]) * t];
      };
      if (signo * dp >= 0) {
        salida.push(p);
        if (signo * dq < 0) salida.push(corte());
      } else if (signo * dq >= 0) salida.push(corte());
    });
  }
  return salida;
}

export interface OpcionesDeCamara {
  /** Degrees she turns toward the viewer's right. */
  yaw?: number;
  /** Degrees the camera looks from above. */
  pitch?: number;
  /** Screen units per model unit. */
  escala?: number;
  cx?: number;
  cy?: number;
  /** The model height that lands on cy. */
  centroY?: number;
}

export interface Camara {
  /** A direction in camera space: z > 0 faces the viewer. */
  dir: (v: readonly number[]) => Vec3;
  pantalla: (p: readonly number[]) => Vec2;
}

/** Orthographic camera: yaw around y, then pitch. */
export function camara({
  yaw = 0,
  pitch = 0,
  escala = 1,
  cx = 0,
  cy = 0,
  centroY = 81,
}: OpcionesDeCamara = {}): Camara {
  const ca = Math.cos(yaw * rad);
  const sa = Math.sin(yaw * rad);
  const cp = Math.cos(pitch * rad);
  const sp = Math.sin(pitch * rad);
  const girar = ([x, y, z]: readonly number[]): Vec3 => {
    const x1 = x * ca + z * sa;
    const z1 = -x * sa + z * ca;
    return [x1, y * cp - z1 * sp, y * sp + z1 * cp];
  };
  return {
    dir: girar,
    pantalla: ([x, y, z]) => {
      const [rx, ry] = girar([x, y - centroY, z]);
      return [cx + rx * escala, cy - ry * escala];
    },
  };
}

export interface CaraVisible {
  nombre: string;
  /** The facet's normal in camera space. */
  nv: Vec3;
  pts: Vec2[];
}

/** What is in sight from a camera: the gem's facets and the pieces of the visor's opening. */
export function geometria(
  opts: OpcionesDeCamara = {},
  m: Modelo = MODELO,
): { cam: Camara; caras: CaraVisible[]; hueco: Vec2[][] } {
  const cam = camara(opts);
  const { gema } = m;
  const caras = gema.caras
    .map((c) => ({ c, nv: cam.dir(c.n) }))
    .filter(({ nv }) => nv[2] > 1e-3)
    .map(({ c, nv }) => ({
      nombre: c.nombre,
      nv,
      pts: c.v.map((i) => cam.pantalla(gema.verts[i])),
    }));
  // The opening is cut into several front facets. Each visible one shows only its own piece:
  // cut the opening with the facet's outline, lift it onto the facet, project it. Seen from
  // behind, those facets turn away and the opening goes with them.
  const bordeXY = m.borde.map(([u, v]) => m.visorXY(u, v));
  const hueco = m.portadoras
    .filter((i) => cam.dir(gema.caras[i].n)[2] > 1e-3)
    .map((i) => {
      const c = gema.caras[i];
      const caraXY = c.v.map((v): Vec2 => [gema.verts[v][0], gema.verts[v][1]]);
      return recortar(bordeXY, caraXY).map(([x, y]) =>
        cam.pantalla([x, y, (c.d - c.n[0] * x - c.n[1] * y) / c.n[2]]),
      );
    })
    .filter((t) => t.length >= 3);
  return { cam, caras, hueco };
}

const RAMPA_CUERPO = [
  '#5c0039',
  '#7d004c',
  '#9b005c',
  '#b8015f',
  '#d4026a',
  '#e90464',
  '#f0167f',
  '#f637a8',
];
const RAMPA_VISOR = ['#a98aa8', '#c3a6c2', '#d6c0d3', '#e2cfdf', '#efe3ec'];
const LUZ = norm([-0.5, 0.55, 0.75]);

const tono = (n: Vec3, rampa: string[], base = 0.18) => {
  const l = Math.max(0, Math.min(1, base + (1 - base) * dot(n, LUZ)));
  return rampa[Math.min(rampa.length - 1, Math.floor(l * rampa.length))];
};
const hex = (c: string) => [1, 3, 5].map((i) => parseInt(c.slice(i, i + 2), 16));
/** A color on the ramp at position l (0..length-1), blended between its two neighbours. */
const mezcla = (rampa: string[], l: number) => {
  const i = Math.max(0, Math.min(rampa.length - 2, Math.floor(l)));
  const t = Math.max(0, Math.min(1, l - i));
  const [a, b] = [hex(rampa[i]), hex(rampa[i + 1])];
  return (
    '#' +
    a
      .map((x, q) =>
        Math.round(x + (b[q] - x) * t)
          .toString(16)
          .padStart(2, '0'),
      )
      .join('')
  );
};
const tonoSuave = (n: Vec3, rampa: string[], base: number) =>
  mezcla(rampa, Math.max(0, Math.min(1, base + (1 - base) * dot(n, LUZ))) * (rampa.length - 1));
// The inside of the frame is the gem's own color a step darker, with more ambient light: the
// brim's underside, seen from below, must not read as a hole. Blended, not stepped: the walls
// are many narrow quads, and steps would stripe them.
const tonoPared = (nv: Vec3) =>
  mezcla(
    RAMPA_CUERPO,
    Math.max(0, Math.min(1, 0.4 + 0.6 * dot(nv, LUZ))) * (RAMPA_CUERPO.length - 1) - 1,
  );
const ruta = (pts: Vec2[]) =>
  'M' + pts.map(([x, y]) => `${x.toFixed(1)} ${y.toFixed(1)}`).join('L') + 'Z';
const camino = (relleno: string, d: string, borde = 0) =>
  borde
    ? `<path fill="${relleno}" stroke="${relleno}" stroke-width="${borde}" stroke-linejoin="round" d="${d}"/>`
    : `<path fill="${relleno}" d="${d}"/>`;

/**
 * The SVG markup (no `<svg>` wrapper) of the gem, its visor and face seen from (yaw, pitch).
 * `id` prefixes the clip and gradient ids: two projections on one page need different ones.
 */
export function proyectar(opts: OpcionesDeCamara = {}, id = 'angie', m: Modelo = MODELO): string {
  const { cam, caras, hueco: trozos } = geometria(opts, m);
  // the stroke in the same color closes the hairline gaps antialiasing leaves between facets
  const out = caras.map((c) => {
    const col = tono(c.nv, RAMPA_CUERPO);
    return `<path data-cara="${c.nombre}" fill="${col}" stroke="${col}" stroke-width=".8" stroke-linejoin="round" d="${ruta(c.pts)}"/>`;
  });
  if (!trozos.length) return out.join('');
  const hueco = trozos.map(ruta).join('');
  out.push(`<clipPath id="${id}-abertura"><path d="${hueco}"/></clipPath>`);
  out.push(camino('#4a0030', hueco, 0.6));
  const g = [`<g clip-path="url(#${id}-abertura)">`];
  const sobrePanel = (p: Vec2) => cam.pantalla(m.enVisor(p));
  const colorPanel = (u: number) =>
    tonoSuave(cam.dir(m.normalVisor(m.panelXY(u, 0.5))), RAMPA_VISOR, 0.35);

  // Seen from the side the panel folds over itself, and one outline of a folded surface cancels
  // its own fill: then it goes in narrow strips, each drawn only while it faces the camera.
  const TIRAS = 24;
  const tiras: Vec2[] = [];
  for (let k = 0; k < TIRAS; k++) {
    const u0 = -1 + (2 * k) / TIRAS;
    const u1 = -1 + (2 * (k + 1)) / TIRAS;
    if (cam.dir(m.normalVisor(m.panelXY((u0 + u1) / 2, 0.5)))[2] > 0) tiras.push([u0, u1]);
  }
  // From the side the panel's bulge sits a little under the hull's ridge, and past its edge one
  // would see through the opening to the far side of the gem. That sliver takes the color of
  // the panel's edge, so the panel reads as reaching the silhouette.
  if (tiras.length && tiras.length < TIRAS) {
    const orilla = tiras[0][0] > -1 ? tiras[0][0] : tiras[tiras.length - 1][1];
    g.push(camino(colorPanel(orilla), hueco));
  }

  // The frame's inner walls, from the rim on the hull down to the panel's edge.
  const rim = m.borde.map(([u, v]): Vec3 => {
    const [x, y] = m.visorXY(u, v);
    return [x, y, m.sobreCasco(x, y)[0]];
  });
  const fondo = m.borde.map(([u, v]) => m.enVisor(m.panelXY(u, v)));
  const paredes = rim.map((a, i) => {
    const j = (i + 1) % rim.length;
    const b = rim[j];
    const t = [0, 1, 2].map((q) => b[q] - a[q]);
    const d = [0, 1, 2].map((q) => (fondo[i][q] + fondo[j][q]) / 2 - (a[q] + b[q]) / 2);
    // the outline runs counterclockwise seen from the front, so t x d points into the opening
    const n = norm(cruz(t, d));
    const [, cara] = m.sobreCasco((a[0] + b[0]) / 2, (a[1] + b[1]) / 2);
    return { nv: cam.dir(n), cara, d: ruta([a, b, fondo[j], fondo[i]].map(cam.pantalla)) };
  });
  // A wall turned away is a bevel shallower than the facet around it: seen from the side it is
  // the gem's own outer surface, so it takes that facet's color. Left out, it leaves a hole.
  for (const p of paredes)
    if (p.nv[2] <= 1e-3)
      g.push(camino(tono(cam.dir(m.gema.caras[p.cara].n), RAMPA_CUERPO), p.d, 1.2));
  // shaded with the normal averaged over its neighbours: the rim crosses facet edges, and one
  // normal per quad would stripe the wall
  paredes.forEach((p, i) => {
    if (p.nv[2] <= 1e-3) return;
    const L = paredes.length;
    const vecinas = [-2, -1, 0, 1, 2].map((k) => paredes[(i + k + L) % L].nv);
    const n = norm([0, 1, 2].map((q) => vecinas.reduce((s, v) => s + v[q], 0)));
    g.push(camino(tonoPared(n), p.d, 1.2));
  });

  const pintarPanel = (u0: number, u1: number, relleno: string) => {
    const pts: Vec2[] = [];
    const n = Math.max(1, Math.round((u1 - u0) * 12));
    for (let i = 0; i <= 8; i++) pts.push(m.panelXY(u0, i / 8));
    for (let i = 1; i <= n; i++) pts.push(m.panelXY(u0 + ((u1 - u0) * i) / n, 1));
    for (let i = 7; i >= 0; i--) pts.push(m.panelXY(u1, i / 8));
    for (let i = n - 1; i >= 1; i--) pts.push(m.panelXY(u0 + ((u1 - u0) * i) / n, 0));
    g.push(camino(relleno, ruta(pts.map(sobrePanel)), 1.2));
  };
  if (tiras.length === TIRAS) {
    // Facing the camera whole it does not fold: one piece leaves no seams, under one gradient.
    const [x1] = sobrePanel(m.panelXY(-1, 0.5));
    const [x2] = sobrePanel(m.panelXY(1, 0.5));
    const paradas = Array.from({ length: 9 }, (_, i) => {
      const u = -1 + i / 4;
      const off = Math.max(
        0,
        Math.min(1, (sobrePanel(m.panelXY(u, 0.5))[0] - x1) / (x2 - x1 || 1)),
      );
      return `<stop offset="${off.toFixed(3)}" stop-color="${colorPanel(u)}"/>`;
    });
    g.push(
      `<linearGradient id="${id}-panel" gradientUnits="userSpaceOnUse" x1="${x1.toFixed(1)}" y1="0" x2="${x2.toFixed(1)}" y2="0">${paradas.join('')}</linearGradient>`,
    );
    pintarPanel(-1, 1, `url(#${id}-panel)`);
  } else
    // Folded, one gradient no longer runs one way across the screen and clamps into a hard
    // stripe: each strip gets its own, from its left color to its right one.
    tiras.forEach(([u0, u1], k) => {
      const [xa] = sobrePanel(m.panelXY(u0, 0.5));
      const [xb] = sobrePanel(m.panelXY(u1, 0.5));
      const x2 = Math.abs(xb - xa) < 0.01 ? xa + 0.01 : xb;
      g.push(
        `<linearGradient id="${id}-tira${k}" gradientUnits="userSpaceOnUse" x1="${xa.toFixed(2)}" y1="0" x2="${x2.toFixed(2)}" y2="0"><stop offset="0" stop-color="${colorPanel(u0)}"/><stop offset="1" stop-color="${colorPanel(u1)}"/></linearGradient>`,
      );
      pintarPanel(u0, u1, `url(#${id}-tira${k})`);
    });

  const elipse = (cx0: number, cy0: number, rx: number, ry: number, rot = 0): Vec2[] =>
    Array.from({ length: 28 }, (_, i) => {
      const t = (i / 28) * 2 * Math.PI;
      const ex = rx * Math.cos(t);
      const ey = ry * Math.sin(t);
      const r = rot * rad;
      return [cx0 + ex * Math.cos(r) - ey * Math.sin(r), cy0 + ex * Math.sin(r) + ey * Math.cos(r)];
    });
  const visible = (p: Vec2) => cam.dir(m.normalVisor(p))[2] > 0.05;
  const sobreElPanel = (pts: Vec2[]) => ruta(pts.map(sobrePanel));
  for (const o of m.cara.ojos) {
    if (!visible([o.x, o.y])) continue;
    g.push(camino('#0f0f11', sobreElPanel(elipse(o.x, o.y, o.rx, o.ry))));
    g.push(camino('#fff', sobreElPanel(elipse(o.x + 1.2, o.y + 3.2, 1.4, 1.4))));
  }
  for (const c of m.cara.cejas)
    if (visible([c.x, c.y]))
      g.push(camino('#c8005d', sobreElPanel(elipse(c.x, c.y, c.w / 2, c.h / 2, c.rot))));
  const b = m.cara.boca;
  if (visible([b.x, b.y])) {
    const sonrisa: Vec2[] = [];
    for (let i = 0; i <= 12; i++)
      sonrisa.push([
        b.x - b.w / 2 + (b.w * i) / 12,
        b.y + 0.6 - 0.8 * Math.sin((Math.PI * i) / 12),
      ]);
    for (let i = 12; i >= 0; i--)
      sonrisa.push([
        b.x - b.w / 2 + (b.w * i) / 12,
        b.y + 0.6 - b.h * Math.sin((Math.PI * i) / 12),
      ]);
    g.push(camino('#940054', sobreElPanel(sonrisa)));
  }
  g.push('</g>');
  return out.concat(g).join('');
}
