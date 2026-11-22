// Regenerates public/preview.jpeg, the capture that opens the README: page 7/1 of the journey
// ("El repetidor"), with the crew in the sky, the demo, its code and the challenge. It is captured
// instead of drawn so the README shows the game as it is.
//
//   node docs/preview/capturar.mjs [base-url] [output.jpeg]
//
// The default base is the dev server (`npm start`), so a change shows before it is published.
// Needs Edge or Chrome: EDGE=<path> if it is not in the usual Windows location.
import { spawn } from 'node:child_process';
import { mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const base = (process.argv[2] || 'http://localhost:4200/').replace(/\/?$/, '/');
const salida = process.argv[3] || 'public/preview.jpeg';
const navegador =
  process.env.EDGE ?? 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe';
const ANCHO = 1920;
const ALTO = 1055;
const puerto = 9334;
// A save that already went through the prologue: `?nivel=` only opens a page on the journey.
const partida = {
  v: 4,
  establecidos: [],
  cinematicas: [],
  prologo: true,
  punto: { lugar: 'viaje' },
  viaje: null,
};

const proceso = spawn(
  navegador,
  [
    '--headless=new',
    `--remote-debugging-port=${puerto}`,
    `--user-data-dir=${mkdtempSync(join(tmpdir(), 'preview-'))}`,
    '--hide-scrollbars',
    '--force-device-scale-factor=1',
    `--window-size=${ANCHO},${ALTO}`,
    '--mute-audio',
    'about:blank',
  ],
  { stdio: 'ignore' },
);
const dormir = (ms) => new Promise((r) => setTimeout(r, ms));

let ws;
for (let i = 0; i < 40 && !ws; i++) {
  await dormir(250);
  try {
    const pestañas = await (await fetch(`http://127.0.0.1:${puerto}/json`)).json();
    const pagina = pestañas.find((p) => p.type === 'page');
    if (pagina) ws = new WebSocket(pagina.webSocketDebuggerUrl);
  } catch {
    // The browser has not opened the port yet.
  }
}
if (!ws) {
  proceso.kill();
  throw new Error(`Could not open ${navegador} with remote debugging.`);
}
await new Promise((r) => ws.addEventListener('open', r, { once: true }));

let n = 0;
const esperando = new Map();
ws.addEventListener('message', (e) => {
  const m = JSON.parse(e.data);
  esperando.get(m.id)?.(m);
  esperando.delete(m.id);
});
const cdp = (method, params = {}) =>
  new Promise((r) => {
    esperando.set(++n, r);
    ws.send(JSON.stringify({ id: n, method, params }));
  });
const evaluar = async (expression) =>
  (await cdp('Runtime.evaluate', { expression, returnByValue: true })).result?.result?.value;

try {
  // The capture must not count as a visit.
  await cdp('Network.enable');
  await cdp('Network.setBlockedURLs', { urls: ['*goatcounter*', '*gc.zgo.at*'] });
  await cdp('Emulation.setDeviceMetricsOverride', {
    width: ANCHO,
    height: ALTO,
    deviceScaleFactor: 1,
    mobile: false,
  });
  // The save goes in from the same origin, before the game reads it.
  await cdp('Page.navigate', { url: base });
  await dormir(1500);
  await evaluar(
    `localStorage.clear(); localStorage.setItem('signals-cuaderno', ${JSON.stringify(JSON.stringify(partida))}); localStorage.setItem('signals-sonido', 'no'); 1`,
  );
  await cdp('Page.navigate', { url: `${base}?nivel=7&sub-nivel=1` });
  // The headphones notice only listens after 6 s, and a synthetic click does not close it.
  await dormir(6500);
  for (const type of ['mousePressed', 'mouseReleased']) {
    await cdp('Input.dispatchMouseEvent', {
      type,
      x: ANCHO / 2,
      y: ALTO - 80,
      button: 'left',
      clickCount: 1,
    });
  }
  await dormir(4500);
  const titulo = await evaluar(`document.body.innerText.includes('input() y output()')`);
  if (!titulo) throw new Error('Page 7/1 is not on screen: the capture would be wrong.');
  const { result } = await cdp('Page.captureScreenshot', { format: 'jpeg', quality: 90 });
  writeFileSync(salida, Buffer.from(result.data, 'base64'));
  console.log(`Done: ${salida}`);
} finally {
  ws.close();
  proceso.kill();
}
