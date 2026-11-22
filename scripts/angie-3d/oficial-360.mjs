// The official model at every degree 0..359 (pitch 0): a class mask per pixel and a gray
// thumbnail. Classes: 0 nothing, 1 gem shell, 2 sunk visor (panel, frame, eyes), 3 arm or leg,
// which hides what is behind it and is not scored. Takes a minute or two.
// usage: node scripts/angie-3d/oficial-360.mjs
import fs from 'node:fs';
import path from 'node:path';
import zlib from 'node:zlib';
import {
  DIR,
  LADO,
  MASCARAS,
  cargarOficial,
  esExtremidad,
  norm,
  png,
  proyectarMalla,
  rasterizar,
  sombra,
} from './comun.mjs';

const { V, T, soporte } = cargarOficial();
const nt = T.length / 3;
const clase = new Uint8Array(nt);
for (let t = 0; t < nt; t++) {
  const [a, b, c] = [T[t * 3] * 3, T[t * 3 + 1] * 3, T[t * 3 + 2] * 3];
  const p = [0, 1, 2].map((q) => (V[a + q] + V[b + q] + V[c + q]) / 3);
  if (esExtremidad(...p)) {
    clase[t] = 3;
    continue;
  }
  const u = [0, 1, 2].map((q) => V[b + q] - V[a + q]);
  const w = [0, 1, 2].map((q) => V[c + q] - V[a + q]);
  const n = norm([u[1] * w[2] - u[2] * w[1], u[2] * w[0] - u[0] * w[2], u[0] * w[1] - u[1] * w[0]]);
  // sunk: more than 2 units under the support plane facing the same way, on the front
  const hundido = soporte(n) - (n[0] * p[0] + n[1] * p[1] + n[2] * p[2]);
  const enElFrente = p[2] > 0 && p[1] > 34 && p[1] < 104 && Math.abs(p[0]) < 56;
  clase[t] = enElFrente && hundido > 2 ? 2 : 1;
}
const miniaturas = path.join(DIR, 'oficial-360');
fs.mkdirSync(miniaturas, { recursive: true });
const mascaras = Buffer.alloc(360 * LADO * LADO);
for (let grado = 0; grado < 360; grado++) {
  const P = proyectarMalla(V, grado, 0, LADO);
  const m = mascaras.subarray(grado * LADO * LADO, (grado + 1) * LADO * LADO);
  const gris = Buffer.alloc(LADO * LADO, 255);
  rasterizar(P, T, LADO, (k, t) => {
    m[k] = clase[t];
    gris[k] = sombra(P, T, t);
  });
  fs.writeFileSync(path.join(miniaturas, `${grado}.png`), png(LADO, LADO, gris, 1));
}
fs.writeFileSync(MASCARAS, zlib.gzipSync(mascaras));
console.log('ok', MASCARAS);
