// Las voces de Gemini de la app: genera public/voces/<grupo>/*.mp3 (prólogo, cinemáticas, hojas
// del viaje y pensamientos de la colina) y el índice que lee la app
// (src/app/integrada-vista/voces-grabadas.ts). Cómo se usa y por qué así: docs/voces.md.
//
//   node scripts/voces.mjs              dice qué falta y cuántos pedidos gastaría (no gasta nada)
//   node scripts/voces.mjs --go         genera lo que falta y reescribe el índice
//   node scripts/voces.mjs --muestras   las líneas de "muestras" con cada acento, en pruebas/voces/
//   node scripts/voces.mjs --indice     solo reescribe el índice con los mp3 que ya están
//
// Necesita las claves de "claves" en voces.json (si no están en el entorno, las lee de las variables
// de usuario de Windows) y FFMPEG con la ruta de un ffmpeg. Las claves nunca se imprimen ni se
// escriben. Cada clave es de un proyecto con su propio cupo: cuando una se queda sin cupo, siguen las
// demás.

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
const VOCES = join(raiz, 'public/voces');
const INDICE = join(raiz, 'src/app/integrada-vista/voces-grabadas.ts');
const TMP = join(tmpdir(), 'voces-signals');
/** El cupo por minuto del modelo es de 10 pedidos: 7 s entre uno y otro deja margen. */
const ENTRE_PEDIDOS_MS = 7000;

mkdirSync(TMP, { recursive: true });

/** Los guiones viven en TypeScript: se compilan con el esbuild de Angular para no copiarlos a mano. */
async function modulo(ruta, nombre) {
  const { build } = await import('esbuild');
  const salida = join(TMP, `${nombre}.mjs`);
  await build({
    entryPoints: [join(raiz, ruta)],
    bundle: true,
    format: 'esm',
    platform: 'neutral',
    outfile: salida,
    logLevel: 'error',
    // Los guiones leen el índice que este script escribe: para sacar los textos alcanza con uno
    // vacío, y así anda también la primera vez, cuando el índice todavía no existe.
    plugins: [
      {
        name: 'indice-vacio',
        setup(b) {
          b.onResolve({ filter: /voces-grabadas$/ }, (a) => ({ path: a.path, namespace: 'vacio' }));
          b.onLoad({ filter: /.*/, namespace: 'vacio' }, () => ({
            contents: 'export const VOCES_GRABADAS = {};',
            loader: 'js',
          }));
        },
      },
    ],
  });
  return import(`${pathToFileURL(salida).href}?t=${Date.now()}`);
}

const visible = (txt) => txt.replace(/`/g, '').replace(/\n/g, ' ');

/** Las líneas de cada grupo, todas con `id`, `quien` y `txt`. El id es único en toda la app. */
async function lineasPorGrupo() {
  const prologo = await modulo('src/app/integrada-vista/prologo-guion.ts', 'prologo');
  const cine = await modulo('src/app/integrada-vista/cinematicas/cinematicas-datos.ts', 'cine');
  const viaje = await modulo('src/app/integrada-vista/guion-del-viaje.ts', 'viaje');
  const colina = await modulo('src/app/integrada-vista/pensamientos-de-la-colina.ts', 'colina');
  return {
    prologo: prologo.GUION,
    cine: cine.CINEMATICAS.flatMap((c) => c.lineas),
    viaje: Object.entries(viaje.GUION_DEL_VIAJE).flatMap(([pagina, momentos]) =>
      Object.entries(momentos).map(([momento, l]) => ({
        ...l,
        id: viaje.idDeLineaDelViaje(pagina, momento),
      })),
    ),
    colina: colina.PENSAMIENTOS_DE_LA_COLINA,
  };
}

function leerClave(nombre) {
  if (process.env[nombre]) return process.env[nombre];
  return execFileSync('powershell', [
    '-NoProfile',
    '-Command',
    `[Environment]::GetEnvironmentVariable('${nombre}','User')`,
  ])
    .toString()
    .trim();
}

function claves() {
  const lista = config.claves
    .map((nombre) => ({ nombre, k: leerClave(nombre) }))
    .filter((c) => c.k);
  if (!lista.length) throw new Error(`falta alguna de estas claves: ${config.claves.join(', ')}`);
  return lista;
}

/** Qué se le pide a Gemini para una línea con un acento. `null` si ese hablante no tiene voz. */
function pedidoDe(linea, grupo, acento) {
  const personaje = config.hablantes[linea.quien];
  if (!personaje) return null;
  const a = config.acentos[acento];
  const texto = config.pronunciar[linea.id] ?? visible(linea.txt);
  const extra = config.grupos[grupo].estilo;
  const estilo = `${config.personajes[personaje]}; ${a.estilo}${extra ? `; ${extra}` : ''}`;
  const voz = a.voces[personaje];
  const hash = createHash('sha1')
    .update([config.modelo, voz, estilo, texto].join('|'))
    .digest('hex')
    .slice(0, 8);
  return { id: linea.id, grupo, texto, estilo, voz, archivo: `${linea.id}.${hash}.mp3` };
}

const rutaDe = (p) => join(VOCES, p.grupo, p.archivo);

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
    .filter((p) => existsSync(rutaDe(p)))
    .map(
      (p) =>
        `  '${p.id}': { archivo: 'voces/${p.grupo}/${p.archivo}', ms: ${duracionMs(rutaDe(p))} },`,
    );
  const ts = `/**
 * Generado por \`scripts/voces.mjs\` (docs/voces.md): no se edita a mano.
 *
 * La voz de Gemini de cada línea (del prólogo, de las cinemáticas y de las hojas del viaje), por id,
 * con lo que dura. La duración es del archivo, no del navegador: así cada reloj es el mismo con
 * sonido o sin él.
 */
export interface VozGrabada {
  /** Relativo al \`<base href>\`, para que ande igual en local y en GitHub Pages. */
  readonly archivo: string;
  readonly ms: number;
}

export const VOCES_GRABADAS: Readonly<Record<string, VozGrabada>> = {
${filas.join('\n')}
};
`;
  writeFileSync(INDICE, ts);
  execFileSync(
    process.execPath,
    [join(raiz, 'node_modules/prettier/bin/prettier.cjs'), '--write', INDICE],
    { stdio: 'ignore' },
  );
  console.log(`índice: ${filas.length} voces en ${INDICE.slice(raiz.length + 1)}`);
}

/** Un trabajador por clave, todos sobre la misma cola: cada proyecto gasta su cupo a su ritmo. */
async function generar(faltan) {
  const cola = [...faltan];
  let hechas = 0;
  const trabajar = async ({ nombre, k }) => {
    let primero = true;
    while (cola.length) {
      const p = cola.shift();
      if (!primero) await esperar(ENTRE_PEDIDOS_MS);
      primero = false;
      const wav = join(TMP, `${p.id}.wav`);
      try {
        await tts(p, wav, k);
        mkdirSync(join(VOCES, p.grupo), { recursive: true });
        aMp3(wav, rutaDe(p));
        hechas++;
        console.log(`${hechas}/${faltan.length}`, nombre, p.id, '·', p.texto);
      } catch (e) {
        console.log('error en', p.id, `(${nombre})`, '·', e.message);
        if (e.parar) {
          cola.unshift(p);
          console.log(`${nombre} sin cupo: siguen las demás claves`);
          return;
        }
      }
    }
  };
  await Promise.all(claves().map(trabajar));
  console.log(`generadas: ${hechas}${cola.length ? ` · quedan ${cola.length} para otro día` : ''}`);
}

const grupos = await lineasPorGrupo();

if (args.includes('--muestras')) {
  const { k } = claves()[0];
  const dir = join(raiz, 'pruebas/voces');
  mkdirSync(dir, { recursive: true });
  const lineas = config.muestras.map((id) => grupos.prologo.find((l) => l.id === id));
  let primero = true;
  for (const acento of Object.keys(config.acentos)) {
    const partes = [];
    for (const linea of lineas) {
      const p = pedidoDe(linea, 'prologo', acento);
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

const todas = Object.keys(config.grupos).flatMap((g) => grupos[g].map((l) => ({ l, g })));
const pedidos = todas.map(({ l, g }) => pedidoDe(l, g, config.acento)).filter(Boolean);
const sinVoz = todas.filter(({ l }) => !config.hablantes[l.quien]).map(({ l }) => l.id);
const faltan = pedidos.filter((p) => !existsSync(rutaDe(p)));

for (const g of Object.keys(config.grupos)) {
  const del = pedidos.filter((p) => p.grupo === g);
  const sin = faltan.filter((p) => p.grupo === g).length;
  console.log(`${g}: ${del.length} líneas con voz, faltan ${sin}`);
}
console.log(`acento: ${config.acento}`);
if (sinVoz.length) console.log(`sin voz (siguen con blips): ${sinVoz.join(', ')}`);

if (args.includes('--go')) await generar(faltan);

if (args.includes('--go') || args.includes('--indice')) {
  escribirIndice(pedidos);
  const vigentes = new Set(pedidos.map((p) => rutaDe(p)));
  for (const g of Object.keys(config.grupos)) {
    const dir = join(VOCES, g);
    if (!existsSync(dir)) continue;
    for (const f of readdirSync(dir)) {
      if (vigentes.has(join(dir, f))) continue;
      // Un archivo de una versión vieja del texto o la voz: se borra para que no se publique de más.
      rmSync(join(dir, f));
      console.log('borrado (ya no se usa):', `${g}/${f}`);
    }
  }
} else if (faltan.length) {
  console.log(
    `--go gastaría ${faltan.length} pedidos, repartidos entre ${config.claves.length} claves ` +
      '(cada proyecto tiene 100 cada 24 h corridas).',
  );
}
