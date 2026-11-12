// Las voces de Gemini del prólogo: genera public/voces/prologo/*.mp3 y el índice que lee la app
// (src/app/integrada-vista/voces-del-prologo.ts). Cómo se usa y por qué así: docs/voces.md.
//
//   node scripts/voces.mjs              dice qué falta y cuántos pedidos gastaría (no gasta nada)
//   node scripts/voces.mjs --go         genera lo que falta y reescribe el índice
//   node scripts/voces.mjs --muestras   las líneas de "muestras" con cada acento, en pruebas/voces/
//   node scripts/voces.mjs --indice     solo reescribe el índice con los mp3 que ya están
//
// Necesita GEMINI_API_KEY_2 (si no está en el entorno, la lee de las variables de usuario de
// Windows) y FFMPEG con la ruta de un ffmpeg. La clave nunca se imprime ni se escribe.

import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { existsSync, mkdirSync, readdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const raiz = join(dirname(fileURLToPath(import.meta.url)), '..');
const config = JSON.parse(readFileSync(join(raiz, 'scripts/voces.json'), 'utf8'));
const args = process.argv.slice(2);
const FFMPEG = process.env.FFMPEG ?? 'ffmpeg';
const CARPETA = join(raiz, 'public/voces/prologo');
const INDICE = join(raiz, 'src/app/integrada-vista/voces-del-prologo.ts');
const TMP = join(tmpdir(), 'voces-signals');
/** El cupo por minuto del modelo es de 10 pedidos: 7 s entre uno y otro deja margen. */
const ENTRE_PEDIDOS_MS = 7000;

mkdirSync(TMP, { recursive: true });

/** El guion vive en TypeScript: se compila con el esbuild de Angular para no copiarlo a mano. */
async function guionDelPrologo() {
  const { build } = await import('esbuild');
  const salida = join(TMP, 'prologo-guion.mjs');
  await build({
    entryPoints: [join(raiz, 'src/app/integrada-vista/prologo-guion.ts')],
    bundle: true,
    format: 'esm',
    platform: 'neutral',
    outfile: salida,
    logLevel: 'error',
    // El guion lee el índice que este script escribe: para sacar los textos alcanza con uno vacío,
    // y así anda también la primera vez, cuando el índice todavía no existe.
    plugins: [
      {
        name: 'indice-vacio',
        setup(b) {
          b.onResolve({ filter: /voces-del-prologo$/ }, (a) => ({
            path: a.path,
            namespace: 'vacio',
          }));
          b.onLoad({ filter: /.*/, namespace: 'vacio' }, () => ({
            contents: 'export const VOCES_DEL_PROLOGO = {};',
            loader: 'js',
          }));
        },
      },
    ],
  });
  const m = await import(`${pathToFileURL(salida).href}?t=${Date.now()}`);
  return { guion: m.GUION, visible: m.textoVisible };
}

function clave() {
  if (process.env.GEMINI_API_KEY_2) return process.env.GEMINI_API_KEY_2;
  const k = execFileSync('powershell', [
    '-NoProfile',
    '-Command',
    "[Environment]::GetEnvironmentVariable('GEMINI_API_KEY_2','User')",
  ])
    .toString()
    .trim();
  if (!k) throw new Error('falta GEMINI_API_KEY_2');
  return k;
}

/** Qué se le pide a Gemini para una línea con un acento. `null` si ese hablante no tiene voz. */
function pedidoDe(linea, visible, acento) {
  const personaje = config.hablantes[linea.quien];
  if (!personaje) return null;
  const a = config.acentos[acento];
  const texto = config.pronunciar[linea.id] ?? visible(linea).replace(/\n/g, ' ');
  const estilo = `${config.personajes[personaje]}; ${a.estilo}`;
  const voz = a.voces[personaje];
  const hash = createHash('sha1')
    .update([config.modelo, voz, estilo, texto].join('|'))
    .digest('hex')
    .slice(0, 8);
  return { id: linea.id, texto, estilo, voz, archivo: `${linea.id}.${hash}.mp3` };
}

async function tts(pedido, wav, k) {
  const body = JSON.stringify({
    model: config.modelo,
    input: [
      {
        type: 'user_input',
        content: [
          {
            type: 'text',
            text: pedido.texto,
            annotations: [{ type: 'speech_metadata', style: pedido.estilo }],
          },
        ],
      },
    ],
    response_format: { type: 'audio' },
    generation_config: { speech_config: [{ voice: pedido.voz }] },
  });
  for (let intento = 0; ; intento++) {
    const r = await fetch('https://generativelanguage.googleapis.com/v1beta/interactions', {
      method: 'POST',
      headers: { 'x-goog-api-key': k, 'Content-Type': 'application/json' },
      body,
    });
    if (r.status === 503 && intento === 0) {
      console.log('  503: reintento en 30 s');
      await esperar(30_000);
      continue;
    }
    if (r.status === 429) {
      const e = new Error(`429, se acabó el cupo: ${(await r.text()).slice(0, 300)}`);
      e.parar = true;
      throw e;
    }
    if (!r.ok) throw new Error(`HTTP ${r.status}: ${(await r.text()).slice(0, 300)}`);
    const j = await r.json();
    const audio = j.steps
      .filter((s) => s.type === 'model_output')
      .flatMap((s) => s.content)
      .filter((c) => c.type === 'audio')
      .pop();
    if (!audio) throw new Error('la respuesta no trae audio');
    writeFileSync(wav, Buffer.from(audio.data, 'base64'));
    return;
  }
}

const esperar = (ms) => new Promise((f) => setTimeout(f, ms));

/** Saca el silencio de las puntas: el reloj del prólogo mide la voz, no el aire de alrededor. */
const RECORTE =
  'silenceremove=start_periods=1:start_threshold=-45dB:start_silence=0.04,' +
  'areverse,silenceremove=start_periods=1:start_threshold=-45dB:start_silence=0.12,areverse';

function aMp3(wav, mp3) {
  execFileSync(FFMPEG, [
    '-y',
    '-loglevel',
    'error',
    '-i',
    wav,
    '-af',
    RECORTE,
    '-ac',
    '1',
    '-ar',
    '24000',
    '-b:a',
    '48k',
    mp3,
  ]);
}

/** Lo que dura un mp3, en ms: se decodifica a PCM de 16 bits y se cuentan los bytes. */
function duracionMs(mp3) {
  const pcm = execFileSync(
    FFMPEG,
    ['-loglevel', 'error', '-i', mp3, '-f', 's16le', '-ac', '1', '-ar', '24000', '-'],
    {
      maxBuffer: 64 * 1024 * 1024,
    },
  );
  return Math.round((pcm.length / 2 / 24000) * 1000);
}

function escribirIndice(pedidos) {
  const filas = pedidos
    .filter((p) => existsSync(join(CARPETA, p.archivo)))
    .map(
      (p) =>
        `  '${p.id}': { archivo: 'voces/prologo/${p.archivo}', ms: ${duracionMs(join(CARPETA, p.archivo))} },`,
    );
  const ts = `/**
 * Generado por \`scripts/voces.mjs\` (docs/voces.md): no se edita a mano.
 *
 * La voz de Gemini de cada línea del prólogo, por id, con lo que dura. La duración es del archivo,
 * no del navegador: así el reloj del prólogo es el mismo con sonido o sin él.
 */
export interface VozGrabada {
  /** Relativo al \`<base href>\`, para que ande igual en local y en GitHub Pages. */
  readonly archivo: string;
  readonly ms: number;
}

export const VOCES_DEL_PROLOGO: Readonly<Record<string, VozGrabada>> = {
${filas.join('\n')}
};
`;
  writeFileSync(INDICE, ts);
  execFileSync(
    process.execPath,
    [join(raiz, 'node_modules/prettier/bin/prettier.cjs'), '--write', INDICE],
    {
      stdio: 'ignore',
    },
  );
  console.log(`índice: ${filas.length} voces en ${INDICE.slice(raiz.length + 1)}`);
}

const { guion, visible } = await guionDelPrologo();

if (args.includes('--muestras')) {
  const k = clave();
  const dir = join(raiz, 'pruebas/voces');
  mkdirSync(dir, { recursive: true });
  const lineas = config.muestras.map((id) => guion.find((l) => l.id === id));
  let primero = true;
  for (const acento of Object.keys(config.acentos)) {
    const partes = [];
    for (const linea of lineas) {
      const p = pedidoDe(linea, visible, acento);
      const mp3 = join(dir, `${acento}-${linea.id}.mp3`);
      if (!existsSync(mp3)) {
        if (!primero) await esperar(ENTRE_PEDIDOS_MS);
        primero = false;
        const wav = join(TMP, `${acento}-${linea.id}.wav`);
        await tts(p, wav, k);
        aMp3(wav, mp3);
        console.log('muestra', acento, linea.quien, '·', p.texto);
      }
      partes.push(mp3);
    }
    // Las cinco seguidas, con un respiro entre frase y frase, para comparar de una sola escucha.
    const lista = join(TMP, `${acento}.txt`);
    const silencio = join(TMP, 'silencio.mp3');
    execFileSync(FFMPEG, [
      '-y',
      '-loglevel',
      'error',
      '-f',
      'lavfi',
      '-i',
      'anullsrc=r=24000:cl=mono',
      '-t',
      '0.7',
      '-b:a',
      '48k',
      silencio,
    ]);
    writeFileSync(
      lista,
      partes
        .flatMap((f) => [
          `file '${f.replace(/\\/g, '/')}'`,
          `file '${silencio.replace(/\\/g, '/')}'`,
        ])
        .join('\n'),
    );
    execFileSync(FFMPEG, [
      '-y',
      '-loglevel',
      'error',
      '-f',
      'concat',
      '-safe',
      '0',
      '-i',
      lista,
      '-ac',
      '1',
      '-ar',
      '24000',
      '-b:a',
      '48k',
      join(dir, `${acento}.mp3`),
    ]);
    console.log('junto:', `pruebas/voces/${acento}.mp3`);
  }
  process.exit(0);
}

const pedidos = guion.map((l) => pedidoDe(l, visible, config.acento)).filter(Boolean);
const sinVoz = guion.filter((l) => !config.hablantes[l.quien]).map((l) => l.id);
const faltan = pedidos.filter((p) => !existsSync(join(CARPETA, p.archivo)));
mkdirSync(CARPETA, { recursive: true });

console.log(`acento: ${config.acento} · ${pedidos.length} líneas con voz, faltan ${faltan.length}`);
if (sinVoz.length) console.log(`sin voz (siguen con blips): ${sinVoz.join(', ')}`);

if (args.includes('--go')) {
  const k = clave();
  let hechas = 0;
  for (const p of faltan) {
    if (hechas) await esperar(ENTRE_PEDIDOS_MS);
    const wav = join(TMP, `${p.id}.wav`);
    try {
      await tts(p, wav, k);
      aMp3(wav, join(CARPETA, p.archivo));
      hechas++;
      console.log(`${hechas}/${faltan.length}`, p.id, '·', p.texto);
    } catch (e) {
      console.log('error en', p.id, '·', e.message);
      if (e.parar) break;
    }
  }
  console.log(`generadas: ${hechas}`);
}

if (args.includes('--go') || args.includes('--indice')) {
  escribirIndice(pedidos);
  const vigentes = new Set(pedidos.map((p) => p.archivo));
  for (const f of readdirSync(CARPETA)) {
    if (vigentes.has(f)) continue;
    // Un archivo de una versión vieja del texto o la voz: se borra para que no se publique de más.
    rmSync(join(CARPETA, f));
    console.log('borrado (ya no se usa):', f);
  }
} else if (faltan.length) {
  console.log(`--go gastaría ${faltan.length} pedidos (el cupo es de 100 cada 24 h corridas).`);
}
