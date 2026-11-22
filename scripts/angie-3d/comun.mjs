// What every Angie 3D script shares: where the work files go, the official mesh and our model.
import fs from 'node:fs';
import path from 'node:path';
import zlib from 'node:zlib';

const raiz = path.resolve(import.meta.dirname, '../..');
/** Work files (the parsed mesh, the masks, the thumbnails): big, regenerable, out of git. */
export const DIR = process.env.ANGIE_3D_DIR ?? path.join(raiz, 'tmp', 'angie-3d');
export const MALLA = path.join(DIR, 'oficial');
export const MODELO_TS = path.join(raiz, 'src', 'app', 'libs', 'angie-3d.ts');
fs.mkdirSync(DIR, { recursive: true });

export const norm = (n) => {
  const l = Math.hypot(...n);
  return n.map((x) => x / l);
};

// The official mesh is one piece: body, visor, arms and legs. These two side planes (and the
// floor at y 16) tell the arms and legs apart from the gem.
const lados = [
  { n: [0.96, -0.275, -0.06], d: 39.5 },
  { n: [0.8, -0.24, 0.551], d: 37 },
];
export const esExtremidad = (x, y, z) => {
  if (y < 16) return true;
  const ax = Math.abs(x);
  return lados.some((s) => {
    const l = Math.hypot(...s.n);
    return (s.n[0] * ax + s.n[1] * y + s.n[2] * z) / l > s.d / l + 1.2;
  });
};

/** The parsed official mesh, and the support function of its gem (arms and legs left out). */
export function cargarOficial() {
  if (!fs.existsSync(MALLA + '.v.bin'))
    throw new Error(`Falta la malla: node scripts/angie-3d/leer-obj.mjs <ruta al .obj>`);
  // Node's small Buffers share a pool: the typed view must start at the Buffer's own offset
  const leer = (f, C) =>
    ((b) => new C(b.buffer, b.byteOffset, b.byteLength / 4))(fs.readFileSync(MALLA + f));
  const V = leer('.v.bin', Float32Array);
  const T = leer('.t.bin', Uint32Array);
  const pts = [];
  for (let t = 0; t < T.length; t += 3) {
    const [a, b, c] = [T[t] * 3, T[t + 1] * 3, T[t + 2] * 3];
    const p = [0, 1, 2].map((q) => (V[a + q] + V[b + q] + V[c + q]) / 3);
    if (!esExtremidad(...p)) pts.push(p);
  }
  // the extreme points over 6000 directions are enough of a hull to measure support planes
  const casco = new Set();
  for (let s = 0; s < 6000; s++) {
    const zz = 1 - (2 * (s + 0.5)) / 6000;
    const r = Math.sqrt(1 - zz * zz);
    const n = [r * Math.cos(s * 2.399963), zz, r * Math.sin(s * 2.399963)];
    let m = -Infinity;
    let mi = 0;
    pts.forEach((p, i) => {
      const v = n[0] * p[0] + n[1] * p[1] + n[2] * p[2];
      if (v > m) [m, mi] = [v, i];
    });
    casco.add(pts[mi]);
  }
  const H = [...casco];
  // called once per triangle (700 000 times): a plain loop, no arrays
  const soporte = (n) => {
    let m = -Infinity;
    for (const p of H) m = Math.max(m, n[0] * p[0] + n[1] * p[1] + n[2] * p[2]);
    return m;
  };
  return { V, T, soporte };
}

/** Class masks of the official model at every degree (see oficial-360.mjs). */
export const MASCARAS = path.join(DIR, 'mascaras.bin.gz');
export const LADO = 200;
export const cargarMascaras = () => {
  if (!fs.existsSync(MASCARAS))
    throw new Error('Faltan las máscaras: node scripts/angie-3d/oficial-360.mjs');
  return zlib.gunzipSync(fs.readFileSync(MASCARAS));
};

/** Minimal RGB (or gray) PNG writer. */
export function png(w, h, pixeles, canales = 3) {
  const crcT = new Uint32Array(256).map((_, n) => {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    return c >>> 0;
  });
  const crc = (b) => {
    let c = 0xffffffff;
    for (const x of b) c = crcT[(c ^ x) & 0xff] ^ (c >>> 8);
    return (c ^ 0xffffffff) >>> 0;
  };
  const trozo = (tipo, datos) => {
    const largo = Buffer.alloc(4);
    largo.writeUInt32BE(datos.length);
    const td = Buffer.concat([Buffer.from(tipo), datos]);
    const c = Buffer.alloc(4);
    c.writeUInt32BE(crc(td));
    return Buffer.concat([largo, td, c]);
  };
  const fila = w * canales;
  const crudo = Buffer.alloc((fila + 1) * h);
  for (let y = 0; y < h; y++) pixeles.copy(crudo, y * (fila + 1) + 1, y * fila, (y + 1) * fila);
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(w, 0);
  ihdr.writeUInt32BE(h, 4);
  ihdr[8] = 8;
  ihdr[9] = canales === 3 ? 2 : 0;
  return Buffer.concat([
    Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]),
    trozo('IHDR', ihdr),
    trozo('IDAT', zlib.deflateSync(crudo, { level: 9 })),
    trozo('IEND', Buffer.alloc(0)),
  ]);
}

/**
 * Orthographic projection of the official mesh, the same camera as `camara()` in angie-3d.ts:
 * yaw around y, then pitch; `lado` px wide for 184 model units, centered at y 81.
 */
export function proyectarMalla(V, yaw, pitch, lado) {
  const [ca, sa] = [Math.cos((yaw * Math.PI) / 180), Math.sin((yaw * Math.PI) / 180)];
  const [cp, sp] = [Math.cos((pitch * Math.PI) / 180), Math.sin((pitch * Math.PI) / 180)];
  const P = new Float32Array(V.length);
  for (let i = 0; i < V.length; i += 3) {
    const [x, y, z] = [V[i], V[i + 1] - 81, V[i + 2]];
    const x1 = x * ca + z * sa;
    const z1 = -x * sa + z * ca;
    P[i] = (x1 / 92) * (lado / 2) + lado / 2;
    P[i + 1] = lado / 2 - ((y * cp - z1 * sp) / 92) * (lado / 2);
    P[i + 2] = y * sp + z1 * cp;
  }
  return P;
}

/** Z-buffered triangle fill: calls pintar(pixel, triangle) for every pixel a triangle wins. */
export function rasterizar(P, T, lado, pintar, saltear = () => false) {
  const zb = new Float32Array(lado * lado).fill(-Infinity);
  for (let t = 0; t < T.length / 3; t++) {
    if (saltear(t)) continue;
    // 700 000 triangles per view: plain locals, no arrays
    const i0 = T[t * 3] * 3;
    const i1 = T[t * 3 + 1] * 3;
    const i2 = T[t * 3 + 2] * 3;
    const x0 = P[i0];
    const y0 = P[i0 + 1];
    const z0 = P[i0 + 2];
    const x1 = P[i1];
    const y1 = P[i1 + 1];
    const z1 = P[i1 + 2];
    const x2 = P[i2];
    const y2 = P[i2 + 1];
    const z2 = P[i2 + 2];
    const den = (y1 - y2) * (x0 - x2) + (x2 - x1) * (y0 - y2);
    if (!den) continue;
    const minX = Math.max(0, Math.floor(Math.min(x0, x1, x2)));
    const maxX = Math.min(lado - 1, Math.ceil(Math.max(x0, x1, x2)));
    const minY = Math.max(0, Math.floor(Math.min(y0, y1, y2)));
    const maxY = Math.min(lado - 1, Math.ceil(Math.max(y0, y1, y2)));
    for (let py = minY; py <= maxY; py++)
      for (let px = minX; px <= maxX; px++) {
        const sx = px + 0.5;
        const sy = py + 0.5;
        const w0 = ((y1 - y2) * (sx - x2) + (x2 - x1) * (sy - y2)) / den;
        const w1 = ((y2 - y0) * (sx - x2) + (x0 - x2) * (sy - y2)) / den;
        const w2 = 1 - w0 - w1;
        if (w0 < 0 || w1 < 0 || w2 < 0) continue;
        const z = w0 * z0 + w1 * z1 + w2 * z2;
        const k = py * lado + px;
        if (z <= zb[k]) continue;
        zb[k] = z;
        pintar(k, t);
      }
  }
}

/** Gray shade of a projected triangle, lit from the upper left. */
export function sombra(P, T, t) {
  const [i0, i1, i2] = [T[t * 3] * 3, T[t * 3 + 1] * 3, T[t * 3 + 2] * 3];
  const u = [P[i1] - P[i0], -(P[i1 + 1] - P[i0 + 1]), P[i1 + 2] - P[i0 + 2]];
  const v = [P[i2] - P[i0], -(P[i2 + 1] - P[i0 + 1]), P[i2 + 2] - P[i0 + 2]];
  const n = norm([u[1] * v[2] - u[2] * v[1], u[2] * v[0] - u[0] * v[2], u[0] * v[1] - u[1] * v[0]]);
  return 40 + 200 * Math.max(0, n[0] * -0.35 + n[1] * 0.45 + Math.abs(n[2]) * 0.82);
}
