// How much our model overlaps the official one at every degree: silhouette and sunk visor,
// intersection over union on 200 px class masks. Arms and legs are not scored.
// usage: node scripts/angie-3d/evaluar.mjs
import { pathToFileURL } from 'node:url';
import { LADO, MODELO_TS, cargarMascaras } from './comun.mjs';

const { geometria, MODELO } = await import(pathToFileURL(MODELO_TS).href);
const OFICIAL = cargarMascaras();

function pintar(m, pts, c) {
  const ys = pts.map(([, y]) => y);
  const [y0, y1] = [
    Math.max(0, Math.floor(Math.min(...ys))),
    Math.min(LADO - 1, Math.ceil(Math.max(...ys))),
  ];
  for (let py = y0; py <= y1; py++) {
    const sy = py + 0.5;
    const xs = [];
    pts.forEach(([ax, ay], i) => {
      const [bx, by] = pts[(i + 1) % pts.length];
      if (ay <= sy !== by <= sy) xs.push(ax + ((sy - ay) / (by - ay)) * (bx - ax));
    });
    xs.sort((a, b) => a - b);
    for (let k = 0; k + 1 < xs.length; k += 2) {
      const [x0, x1] = [
        Math.max(0, Math.ceil(xs[k] - 0.5)),
        Math.min(LADO - 1, Math.floor(xs[k + 1] - 0.5)),
      ];
      for (let px = x0; px <= x1; px++) m[py * LADO + px] = c;
    }
  }
}

/** Our model's mask at a degree: 1 the gem, 2 the visor's opening. */
export function mascara(grado, modelo = MODELO) {
  const m = new Uint8Array(LADO * LADO);
  const camara = { yaw: grado, escala: LADO / 2 / 92, cx: LADO / 2, cy: LADO / 2 };
  const { caras, hueco } = geometria(camara, modelo);
  for (const c of caras) pintar(m, c.pts, 1);
  for (const h of hueco) pintar(m, h, 2);
  return m;
}

export function comparar(grado, modelo = MODELO) {
  const ofi = OFICIAL.subarray(grado * LADO * LADO, (grado + 1) * LADO * LADO);
  const nos = mascara(grado, modelo);
  let [si, su, hi, hu] = [0, 0, 0, 0];
  for (let k = 0; k < LADO * LADO; k++) {
    if (ofi[k] === 3) continue;
    if (ofi[k] && nos[k]) si++;
    if (ofi[k] || nos[k]) su++;
    if (ofi[k] === 2 && nos[k] === 2) hi++;
    if (ofi[k] === 2 || nos[k] === 2) hu++;
  }
  return { grado, silueta: si / su, visor: hu ? hi / hu : 1, hueco: hu };
}

export function todo(modelo = MODELO, paso = 1) {
  const r = [];
  for (let g = 0; g < 360; g += paso) r.push(comparar(g, modelo));
  return r;
}

/** The visor's mean counts only the degrees where some visor shows (over 200 px). */
export function medias(r) {
  const conVisor = r.filter((x) => x.hueco > 200);
  return {
    silueta: r.reduce((s, x) => s + x.silueta, 0) / r.length,
    visor: conVisor.reduce((s, x) => s + x.visor, 0) / conVisor.length,
  };
}

if (import.meta.filename === process.argv[1]) {
  const r = todo();
  const { silueta, visor } = medias(r);
  console.log('silueta media', silueta.toFixed(3), 'visor medio', visor.toFixed(3));
  const peores = (k, f = () => true) =>
    r
      .filter(f)
      .sort((a, b) => a[k] - b[k])
      .slice(0, 8)
      .map((x) => `${x.grado}:${x[k].toFixed(2)}`)
      .join(' ');
  console.log('peores silueta', peores('silueta'));
  console.log(
    'peores visor',
    peores('visor', (x) => x.hueco > 200),
  );
}
