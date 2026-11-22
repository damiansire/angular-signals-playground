// A page to turn both models degree by degree: the official thumbnail, ours drawn live by
// angie-3d.ts, the two overlaid, and how much they overlap at every degree.
// usage: node scripts/angie-3d/pagina-360.mjs [salida.html]   (tmp/angie-3d/angie-360.html)
import fs from 'node:fs';
import { stripTypeScriptTypes } from 'node:module';
import path from 'node:path';
import { DIR, MODELO_TS } from './comun.mjs';
import { medias, todo } from './evaluar.mjs';

const salida = process.argv[2] ?? path.join(DIR, 'angie-360.html');
const r = todo();
const { silueta, visor } = medias(r);
const pct = (x) => Math.round(x * 100) + '%';
const imgs = r.map(({ grado }) =>
  fs.readFileSync(path.join(DIR, 'oficial-360', `${grado}.png`)).toString('base64'),
);
const datos = r.map((x) => [+x.silueta.toFixed(3), x.hueco > 200 ? +x.visor.toFixed(3) : null]);
// the page runs the same model the app does, with its types stripped
const modelo = stripTypeScriptTypes(fs.readFileSync(MODELO_TS, 'utf8')).replace(/^export /gm, '');

const html = `<!doctype html><html lang="es"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Angie en 360</title>
<style>
:root{--fondo:#f6f1f5;--superficie:#fcfcfb;--texto:#2a1726;--suave:#6f5a6b;--borde:#e4d6e1;--grilla:#ebe3e9;--s1:#2a78d6;--s2:#eb6834}
@media (prefers-color-scheme:dark){:root:not([data-theme=light]){--fondo:#1b1119;--superficie:#1a1a19;--texto:#f3e8f1;--suave:#c3b2bf;--borde:#3a2838;--grilla:#2e242c;--s1:#3987e5;--s2:#d95926}}
:root[data-theme=dark]{--fondo:#1b1119;--superficie:#1a1a19;--texto:#f3e8f1;--suave:#c3b2bf;--borde:#3a2838;--grilla:#2e242c;--s1:#3987e5;--s2:#d95926}
*{box-sizing:border-box}body{margin:0;background:var(--fondo);color:var(--texto);font:15px/1.45 system-ui,sans-serif;padding:24px;max-width:1100px}
h1{font-size:22px;margin:0 0 4px}p{margin:0 0 8px;max-width:72ch;color:var(--suave)}
.controles{display:flex;gap:10px;align-items:center;flex-wrap:wrap;margin:16px 0}
.controles input[type=range]{flex:1;min-width:200px}button{font:inherit;border:1px solid var(--borde);background:var(--superficie);color:var(--texto);border-radius:8px;padding:6px 12px;cursor:pointer}
#grado{font:600 28px/1 system-ui;min-width:3.2em;font-variant-numeric:tabular-nums}
.vistas{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:12px}
@media (max-width:640px){body{padding:16px}.vistas{grid-template-columns:1fr}}
figure{margin:0;background:#fff;border:1px solid var(--borde);border-radius:10px;padding:8px}
.lienzo{position:relative;width:100%;aspect-ratio:1}.lienzo img,.lienzo svg{position:absolute;inset:0;width:100%;height:100%}
figcaption{font-size:13px;color:#6f5a6b;text-align:center;margin-top:4px}
#encima svg{opacity:.55}
.grafico{background:var(--superficie);border:1px solid var(--borde);border-radius:10px;padding:12px;margin-top:16px;position:relative}
.leyenda{display:flex;gap:16px;font-size:13px;color:var(--suave);margin-bottom:6px}.leyenda span{display:inline-flex;align-items:center;gap:6px}
.leyenda i{display:inline-block;width:18px;border-top:2px solid}
#tip{position:absolute;pointer-events:none;background:var(--superficie);border:1px solid var(--borde);border-radius:6px;padding:4px 8px;font-size:12px;display:none;white-space:nowrap}
</style></head><body>
<h1>Angie en 360°</h1>
<p>El oficial y el nuestro desde cada grado. Lo que tapan los brazos y las piernas del oficial no se mide. Con las flechas del teclado se avanza de a un grado; «Encima» muestra el nuestro transparente sobre el oficial.</p>
<p>Coincidencia media: silueta <b>${pct(silueta)}</b>, hueco del visor <b>${pct(visor)}</b>.</p>
<div class="controles"><span id="grado">0°</span>
<button type="button" id="menos" aria-label="Un grado menos">◀</button>
<input id="giro" type="range" min="0" max="359" value="0" aria-label="Grado">
<button type="button" id="mas" aria-label="Un grado más">▶</button>
<button type="button" id="play">Girar</button></div>
<div class="vistas">
<figure><div class="lienzo"><img id="oficial" alt="Modelo oficial"></div><figcaption>Oficial</figcaption></figure>
<figure><div class="lienzo" id="nuestro"></div><figcaption>Nuestro</figcaption></figure>
<figure><div class="lienzo" id="encima"><img id="oficial2" alt=""></div><figcaption>Encima</figcaption></figure>
</div>
<div class="grafico"><div class="leyenda"><span><i style="border-color:var(--s1)"></i>Silueta</span><span><i style="border-color:var(--s2)"></i>Hueco del visor</span></div>
<svg id="curva" viewBox="0 0 720 220" width="100%" role="img" aria-label="Coincidencia por grado"></svg><div id="tip"></div></div>
<script type="module">
${modelo}
const IMGS = ${JSON.stringify(imgs)};
const DATOS = ${JSON.stringify(datos)};
const giro = document.getElementById('giro');
const W = 720, H = 220, L = 40, R = 10, T = 10, B = 28;
const X = (d) => L + (d / 359) * (W - L - R), Y = (v) => T + (1 - v) * (H - T - B);
const linea = (k) => { let s = '', pen = false; DATOS.forEach((r, d) => { const v = r[k]; if (v == null) { pen = false; return; } s += (pen ? 'L' : 'M') + X(d).toFixed(1) + ' ' + Y(v).toFixed(1); pen = true; }); return s; };
const curva = document.getElementById('curva');
let g = '';
for (const v of [0, .25, .5, .75, 1]) g += '<line x1="' + L + '" x2="' + (W - R) + '" y1="' + Y(v) + '" y2="' + Y(v) + '" stroke="var(--grilla)"/><text x="' + (L - 6) + '" y="' + (Y(v) + 4) + '" text-anchor="end" font-size="11" fill="var(--suave)">' + v * 100 + '%</text>';
for (const d of [0, 90, 180, 270, 359]) g += '<text x="' + X(d) + '" y="' + (H - 8) + '" text-anchor="middle" font-size="11" fill="var(--suave)">' + d + '°</text>';
g += '<path d="' + linea(0) + '" fill="none" stroke="var(--s1)" stroke-width="2"/><path d="' + linea(1) + '" fill="none" stroke="var(--s2)" stroke-width="2"/>';
g += '<line id="cruz" y1="' + T + '" y2="' + (H - B) + '" stroke="var(--texto)" opacity=".5"/><rect x="' + L + '" y="0" width="' + (W - L - R) + '" height="' + H + '" fill="transparent" id="zona" style="cursor:pointer"/>';
curva.innerHTML = g;
const tip = document.getElementById('tip');
const pct = (x) => x == null ? '–' : Math.round(x * 100) + '%';
const gradoDe = (e) => { const r = curva.getBoundingClientRect(); return Math.max(0, Math.min(359, Math.round(((e.clientX - r.left) / r.width * W - L) / (W - L - R) * 359))); };
const zona = document.getElementById('zona');
zona.addEventListener('pointermove', (e) => { const d = gradoDe(e), r = DATOS[d]; tip.style.display = 'block'; tip.textContent = d + '°  silueta ' + pct(r[0]) + '  visor ' + pct(r[1]); const b = curva.getBoundingClientRect(), p = curva.parentElement.getBoundingClientRect(); tip.style.left = Math.min(e.clientX - p.left + 12, p.width - 200) + 'px'; tip.style.top = (b.top - p.top + 8) + 'px'; });
zona.addEventListener('pointerleave', () => { tip.style.display = 'none'; });
zona.addEventListener('click', (e) => mostrar(gradoDe(e)));
function mostrar(d) {
  d = ((d % 360) + 360) % 360;
  giro.value = d;
  document.getElementById('grado').textContent = d + '°';
  const src = 'data:image/png;base64,' + IMGS[d];
  document.getElementById('oficial').src = src;
  document.getElementById('oficial2').src = src;
  const svg = (id) => '<svg viewBox="0 0 200 200">' + proyectar({ yaw: d, escala: 100 / 92, cx: 100, cy: 100 }, id) + '</svg>';
  document.getElementById('nuestro').innerHTML = svg('n');
  const enc = document.getElementById('encima');
  enc.querySelector('svg')?.remove();
  enc.insertAdjacentHTML('beforeend', svg('e'));
  const c = document.getElementById('cruz'); c.setAttribute('x1', X(d)); c.setAttribute('x2', X(d));
}
giro.addEventListener('input', () => mostrar(+giro.value));
document.getElementById('menos').onclick = () => mostrar(+giro.value - 1);
document.getElementById('mas').onclick = () => mostrar(+giro.value + 1);
document.addEventListener('keydown', (e) => { if (e.key === 'ArrowRight') mostrar(+giro.value + 1); if (e.key === 'ArrowLeft') mostrar(+giro.value - 1); });
let timer = null;
document.getElementById('play').onclick = (e) => {
  if (timer) { clearInterval(timer); timer = null; e.target.textContent = 'Girar'; return; }
  e.target.textContent = 'Parar';
  timer = setInterval(() => mostrar(+giro.value + 1), 40);
};
mostrar(0);
</script></body></html>`;
fs.writeFileSync(salida, html);
console.log('ok', salida, (html.length / 1024 / 1024).toFixed(2) + ' MB', {
  silueta: pct(silueta),
  visor: pct(visor),
});
