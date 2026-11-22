// Fits the visor's panel to the official one and shows its frame. From the official front depth
// map (highest z per 1x1 cell, arms and legs out) it prints:
// 1. the least squares fit z = z0 + inclinacion*(y-36) + d*(y-36)^2 - curva*x^2 + cuartica*x^4,
//    away from the rim and the face features (that is VISOR.z0, inclinacion, curva, cuartica);
// 2. how deep the official front sits under our hull, cell by cell: where it is deeper than its
//    surroundings is the frame (the brim on top, the sloped band on the sides and the bottom).
// usage: node scripts/angie-3d/ajustar-visor.mjs
import { pathToFileURL } from 'node:url';
import { MODELO_TS, cargarOficial, esExtremidad } from './comun.mjs';

const { MODELO } = await import(pathToFileURL(MODELO_TS).href);
const { V, T } = cargarOficial();
const [ANCHO, X0, Y0, ALTO] = [140, -70, 20, 100];
const z = new Float32Array(ANCHO * ALTO).fill(-Infinity);
for (let t = 0; t < T.length; t += 3) {
  const p = [0, 1, 2].map((k) => [V[T[t + k] * 3], V[T[t + k] * 3 + 1], V[T[t + k] * 3 + 2]]);
  if (esExtremidad(...[0, 1, 2].map((q) => (p[0][q] + p[1][q] + p[2][q]) / 3))) continue;
  for (const [x, y, w] of p) {
    const [i, j] = [Math.round(x - X0), Math.round(y - Y0)];
    if (i >= 0 && i < ANCHO && j >= 0 && j < ALTO && w > z[j * ANCHO + i]) z[j * ANCHO + i] = w;
  }
}
const en = (x, y) => z[Math.round(y - Y0) * ANCHO + Math.round(x - X0)];

// the eyes, the brows and the mouth stand out of the panel: they are not its surface
const rasgo = (x, y) =>
  (Math.abs(Math.abs(x) - 16) < 7 && y > 54 && y < 86) || (Math.abs(x) < 9 && y > 45 && y < 60);
const filas = [];
for (let y = 40; y <= 76; y++)
  for (let x = -40; x <= 40; x++)
    if (isFinite(en(x, y)) && !rasgo(x, y))
      filas.push([[1, y - 36, (y - 36) ** 2, -x * x, x ** 4], en(x, y)]);
const K = filas[0][0].length;
const A = Array.from({ length: K }, () => new Array(K).fill(0));
const B = new Array(K).fill(0);
for (const [r, v] of filas)
  for (let i = 0; i < K; i++) {
    B[i] += r[i] * v;
    for (let j = 0; j < K; j++) A[i][j] += r[i] * r[j];
  }
for (let i = 0; i < K; i++)
  for (let k = i + 1; k < K; k++) {
    const q = A[k][i] / A[i][i];
    for (let j = i; j < K; j++) A[k][j] -= q * A[i][j];
    B[k] -= q * B[i];
  }
const s = new Array(K);
for (let i = K - 1; i >= 0; i--) {
  s[i] = B[i];
  for (let j = i + 1; j < K; j++) s[i] -= A[i][j] * s[j];
  s[i] /= A[i][i];
}
const error = filas.reduce((e, [r, v]) => e + (r.reduce((a, x, i) => a + x * s[i], 0) - v) ** 2, 0);
const [z0, inclinacion, y2, curva, cuartica] = s;
console.log({ z0, inclinacion, y2, curva, cuartica, rms: Math.sqrt(error / filas.length) });

console.log('\nprofundidad bajo nuestro casco (x a la derecha, y hacia abajo)');
console.log('x:    ' + Array.from({ length: 20 }, (_, i) => String(i * 3).padStart(3)).join(''));
for (let y = 30; y <= 100; y += 3) {
  const fila = [];
  for (let x = 0; x <= 57; x += 3) {
    const v = en(x, y);
    fila.push(isFinite(v) ? String(Math.round(MODELO.sobreCasco(x, y)[0] - v)) : '.');
  }
  console.log(`y${String(y).padStart(3)}: ` + fila.map((v) => v.padStart(3)).join(''));
}
