// Regenera public/tarjeta-social.jpg: la pantalla de la colina del sitio publicado, a 1200x630,
// con el título ya entero. Se captura en vez de dibujarse para que la tarjeta sea el juego tal cual.
//
//   node docs/tarjeta-social/capturar.mjs [url] [salida.png]
//
// Después, pasar el PNG a JPEG (calidad 90) en public/tarjeta-social.jpg.
// Necesita Edge o Chrome: EDGE=<ruta> si no está en la ruta de siempre de Windows.
import { spawn } from 'node:child_process';
import { mkdtempSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const url = process.argv[2] || 'https://damiansire.github.io/angular-signals-playground/';
const salida = process.argv[3] || 'tarjeta-social.png';
const navegador =
  process.env.EDGE ?? 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe';
const css = readFileSync(join(dirname(fileURLToPath(import.meta.url)), 'tarjeta.css'), 'utf8');
const puerto = 9333;

const proceso = spawn(
  navegador,
  [
    '--headless=new',
    `--remote-debugging-port=${puerto}`,
    `--user-data-dir=${mkdtempSync(join(tmpdir(), 'tarjeta-'))}`,
    '--hide-scrollbars',
    '--force-device-scale-factor=1',
    '--window-size=1200,630',
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
    // El navegador todavía no abrió el puerto.
  }
}
if (!ws) {
  proceso.kill();
  throw new Error(`No se pudo abrir ${navegador} con depuración remota.`);
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

try {
  // Que la captura no cuente como una visita.
  await cdp('Network.enable');
  await cdp('Network.setBlockedURLs', { urls: ['*goatcounter*', '*gc.zgo.at*'] });
  await cdp('Emulation.setDeviceMetricsOverride', {
    width: 1200,
    height: 630,
    deviceScaleFactor: 1,
    mobile: false,
  });
  await cdp('Page.navigate', { url });
  // El aviso de auriculares se pasa con un click real: uno sintético no lo cierra. Antes de los
  // 6 s el aviso todavía no escucha y el click se pierde.
  await dormir(6500);
  for (const type of ['mousePressed', 'mouseReleased']) {
    await cdp('Input.dispatchMouseEvent', { type, x: 600, y: 560, button: 'left', clickCount: 1 });
  }
  // El título entra de a una letra y la bajada termina de llegar recién pasados los 10 s.
  await dormir(13000);
  await cdp('Runtime.evaluate', {
    expression: `document.head.appendChild(Object.assign(document.createElement('style'), { textContent: ${JSON.stringify(css)} }))`,
  });
  await dormir(600);
  // Si el aviso no se cerró o la bajada no terminó de entrar, la captura sale mal: mejor cortar.
  const listo = await cdp('Runtime.evaluate', {
    expression: `[...document.querySelectorAll('.ini__palabra-bajada')].map((p) => getComputedStyle(p).opacity).join() || 'sin colina'`,
    returnByValue: true,
  });
  const opacidades = listo.result.result.value;
  if (!/^(1,)*1$/.test(opacidades)) throw new Error(`La colina no está lista: ${opacidades}`);
  const { result } = await cdp('Page.captureScreenshot', { format: 'png' });
  writeFileSync(salida, Buffer.from(result.data, 'base64'));
  console.log(`Listo: ${salida}`);
} finally {
  ws.close();
  proceso.kill();
}
