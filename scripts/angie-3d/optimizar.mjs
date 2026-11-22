// Coordinate descent over the gem's facets (azimuth, elevation, distance) and the visor's
// opening, scored against the official masks every PASO degrees (6 by default). Prints the
// result to paste into FACETAS and VISOR; it does not edit angie-3d.ts.
// usage: [PASO=6] [ESCALAS=4,2,1,0.5] node scripts/angie-3d/optimizar.mjs
import { pathToFileURL } from 'node:url';
import { MODELO_TS } from './comun.mjs';
import { comparar } from './evaluar.mjs';

const { FACETAS, VISOR, CARA, construirModelo } = await import(pathToFileURL(MODELO_TS).href);
const PASO = +(process.env.PASO ?? 6);
const ABERTURA = ['anchoAbajo', 'anchoArriba', 'yAbajo', 'curvaAbajo', 'yArriba', 'picoArriba'];
const nCaras = construirModelo().gema.caras.length;

function puntaje(f, v) {
  const m = construirModelo(f, v, CARA);
  // a facet that vanishes or appears changes the gem's shape: not a valid step
  if (m.gema.caras.length !== nCaras) return { e: Infinity };
  let [sil, vis, nv] = [0, 0, 0];
  for (let g = 0; g < 360; g += PASO) {
    const r = comparar(g, m);
    sil += 1 - r.silueta;
    if (r.hueco > 200) [vis, nv] = [vis + 1 - r.visor, nv + 1];
  }
  const n = 360 / PASO;
  return { e: sil / n + 0.5 * (vis / nv), sil: 1 - sil / n, vis: 1 - vis / nv };
}

let f = FACETAS.map((x) => [...x]);
let v = { ...VISOR };
let mejor = puntaje(f, v);
console.log('inicio silueta', mejor.sil.toFixed(4), 'visor', mejor.vis.toFixed(4));
for (const escala of (process.env.ESCALAS ?? '4,2,1,0.5').split(',').map(Number)) {
  let mejoro = true;
  for (let vuelta = 0; mejoro && vuelta < 6; vuelta++) {
    mejoro = false;
    f.forEach((faceta, i) => {
      for (const k of [1, 2, 3]) {
        if (k === 1 && (faceta[1] === 0 || faceta[1] === 180)) continue;
        for (const s of [escala, -escala]) {
          const g = structuredClone(f);
          g[i][k] = +(g[i][k] + s).toFixed(2);
          const r = puntaje(g, v);
          if (r.e < mejor.e - 1e-6) [f, mejor, mejoro] = [g, r, true];
        }
      }
    });
    for (const p of ABERTURA)
      for (const s of [escala, -escala]) {
        const w = { ...v, [p]: +(v[p] + s).toFixed(2) };
        const r = puntaje(f, w);
        if (r.e < mejor.e - 1e-6) [v, mejor, mejoro] = [w, r, true];
      }
    console.log('escala', escala, 'silueta', mejor.sil.toFixed(4), 'visor', mejor.vis.toFixed(4));
  }
}
console.log(JSON.stringify(f));
console.log(JSON.stringify(Object.fromEntries(ABERTURA.map((p) => [p, v[p]]))));
