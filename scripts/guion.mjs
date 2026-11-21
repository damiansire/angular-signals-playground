// The text skeleton of the integrated view (`/`), in the order it is played: the hill, the prologue
// (with its three sheets), every stage of the journey (cinematic, then its pages) and the ending.
// Who says what, whether each line has a recorded voice, what each page asks the player to do and
// how its knob challenge breaks and heals. It is the first half of the `guion-paso-a-paso` skill;
// the choreography (what moves, enters and sounds on each tap) is read from the code on top of it.
//
//   node scripts/guion.mjs                                  the whole journey, to stdout
//   node scripts/guion.mjs --desde prologo --hasta 4        a stretch
//   node scripts/guion.mjs --salida docs/guiones/x.md       to a file
//
// Stretch keys, in play order: colina, prologo, 1 … 11, revelacion, final.

import { build } from 'esbuild';
import { mkdirSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const raiz = join(dirname(fileURLToPath(import.meta.url)), '..');
const TMP = join(tmpdir(), 'guion-signals');

/** The scripts live in TypeScript: bundle each one with Angular's esbuild, components left out. */
async function modulo(ruta) {
  mkdirSync(TMP, { recursive: true });
  const salida = join(TMP, `${ruta.replace(/[\\/.]/g, '_')}.mjs`);
  await build({
    entryPoints: [join(raiz, ruta)],
    bundle: true,
    format: 'esm',
    platform: 'neutral',
    outfile: salida,
    logLevel: 'error',
    plugins: [
      {
        // Pages load their component lazily; the skeleton only needs the import path, as text.
        name: 'sin-componentes',
        setup(b) {
          b.onResolve({ filter: /\.component$/ }, (a) => ({ path: a.path, external: true }));
        },
      },
    ],
  });
  return import(`${pathToFileURL(salida).href}?t=${Date.now()}`);
}

/** Where the prologue stops for a sheet (`paradas` in `prologo-escena.ts`). */
const PARADAS = {
  'anom-rxjs': 'minijuego',
  'anom-manual': 'manual',
  'leccion-arbol': 'arbol',
};

const QUIEN = {
  cap: 'Capitán',
  naveA: 'Nave A',
  naveB: 'Nave B',
  nave4: 'Exploradora',
  todos: 'Todos',
  voz: 'La voz',
  mascota: 'Angie',
};

/** The page card is Angie's hint, closed until the player taps the mascot. */
const PISTA = { concept: 'concepto', action: 'qué hacer', observe: 'qué observar' };

export const TRAMOS = [
  'colina',
  'prologo',
  ...Array.from({ length: 11 }, (_, i) => String(i + 1)),
  'revelacion',
  'final',
];

const una = (txt) => String(txt).replace(/\n/g, ' / ');

/** Explanatory prose of a page template: the same attributes `prose-budget.mjs` counts. */
function tarjetaDe(componente) {
  const html = readFileSync(componente.replace(/\.component$/, '.component.html'), 'utf8');
  const tarjeta = {};
  for (const m of html.matchAll(/(?<![[\w-])(concept|action|observe)\s*=\s*"([^"]*)"/g)) {
    tarjeta[m[1]] ??= m[2].replace(/\s+/g, ' ').trim();
  }
  return tarjeta;
}

/** The closing knob challenge of a page, by the constant its component assigns. */
function sistemaDe(componente, sistemas) {
  const ts = readFileSync(componente.replace(/\.component$/, '.component.ts'), 'utf8');
  const nombre = ts.match(/closingSystem\s*=\s*([A-Z_]+)/)?.[1];
  return nombre ? { nombre, sistema: sistemas[nombre] } : null;
}

export async function armarGuion({ desde = TRAMOS[0], hasta = TRAMOS.at(-1) } = {}) {
  const a = TRAMOS.indexOf(String(desde));
  const b = TRAMOS.indexOf(String(hasta));
  if (a < 0 || b < 0 || b < a) {
    throw new Error(`unknown stretch. Keys, in order: ${TRAMOS.join(', ')}`);
  }
  const elegidos = new Set(TRAMOS.slice(a, b + 1));

  const [prologo, cine, viaje, etapas, voces, colina, sol, operadores, manual, arbol, rutas, mc] =
    await Promise.all(
      [
        'src/app/integrada-vista/prologo-guion.ts',
        'src/app/integrada-vista/cinematicas/cinematicas-datos.ts',
        'src/app/integrada-vista/guion-del-viaje.ts',
        'src/app/integrada-vista/viaje.ts',
        'src/app/integrada-vista/voces-grabadas.ts',
        'src/app/integrada-vista/pensamientos-de-la-colina.ts',
        'src/app/integrada-vista/intercambio-del-sol.ts',
        'src/app/integrada-vista/operadores-del-prologo.ts',
        'src/app/integrada-vista/manual-de-a-bordo.ts',
        'src/app/integrada-vista/arbol-de-signal-space.ts',
        'src/app/signals/signals-routes-tree.ts',
        'src/app/libs/manipulable-challenge.ts',
      ].map(modulo),
    );
  const sistemas = {};
  const nivelDe = {};
  for (const ruta of rutas.signalsRoutesTree) {
    const carpeta = ruta.subLevels?.[0]?.loadComponent
      ?.toString()
      .match(/import\(["']\.\/(level-[^/]+)\//)?.[1];
    if (!carpeta) continue;
    nivelDe[ruta.path] = carpeta;
  }
  // Every `*-systems.ts` of the levels, bundled once, so a page finds its challenge by name.
  for (const carpeta of Object.values(nivelDe)) {
    for (const f of readdirSync(join(raiz, 'src/app/signals', carpeta))) {
      if (f.endsWith('-systems.ts')) {
        Object.assign(sistemas, await modulo(`src/app/signals/${carpeta}/${f}`));
      }
    }
  }
  Object.assign(sistemas, operadores);

  const L = [];
  const w = (s = '') => L.push(s);
  const sinVoz = [];
  const voz = (id) => {
    if (voces.VOCES_GRABADAS[id]) return '';
    sinVoz.push(id);
    return ' 🔇';
  };
  const linea = (l, extra = '') =>
    `- \`${l.id}\` **${QUIEN[l.quien] ?? l.quien}:** ${una(l.txt).replace(/`/g, '')}${voz(l.id)}${extra}`;
  const tabla = [];

  const desafio = (sistema) => {
    if (!sistema) return;
    const inicio = mc.startOf(sistema);
    const camino = mc.solutionFor(sistema) ?? [];
    let estado = inicio;
    for (const paso of camino) {
      estado =
        paso === sistema.action ? mc.act(sistema, estado) : mc.turn(sistema, estado, paso.slice(6));
    }
    const codigo = (k) =>
      sistema
        .code(k)
        .map((c) => `    ${c.knob ? '▸ ' : '  '}${c.text}`)
        .join('\n');
    w(
      `- **Desafío** · botón «${sistema.action}» · lecturas: ${sistema.gauges.map((g) => g.label).join(', ')}`,
    );
    w('  - Arranca roto:');
    w('');
    w('    ```ts');
    w(codigo(inicio.knobs));
    w('    ```');
    w('');
    w(
      `  - Se arregla con: ${camino.length ? camino.join(' → ') : '*(no tiene solución en 8 gestos)*'}`,
    );
    if (camino.length) {
      w('');
      w('    ```ts');
      w(codigo(estado.knobs));
      w('    ```');
      w(
        `    Lecturas sanas: ${mc
          .readings(sistema, estado)
          .map((r) => `${r.label} ${r.value}`)
          .join(', ')}`,
      );
    }
  };

  w('# Guion de textos: vista integrada');
  w('');
  w(
    `Sacado de los datos con \`node scripts/guion.mjs\` (tramo ${TRAMOS[a]} → ${TRAMOS[b]}). 🔇 = la línea no tiene voz grabada en \`voces-grabadas.ts\`. ▸ = el renglón que cambia la perilla. ⏸ = la historia se frena y se abre una hoja.`,
  );
  w('');

  if (elegidos.has('colina')) {
    w('## La colina');
    w('');
    const [presiente, decide] = colina.PENSAMIENTOS_DE_LA_COLINA;
    w(linea(presiente, ' *(piensa)*'));
    // The hill reuses the prologue recordings of the same two lines (`VOZ_DE_LA_COLINA`).
    w(
      linea(
        { id: 'dentro-caotico', quien: 'cap', txt: sol.LO_QUE_DICE_EL_SOL },
        ' *(el sol, por radio)*',
      ),
    );
    w(linea({ id: 'voz-supongo', quien: 'mascota', txt: sol.LO_QUE_RESPONDE_ANGIE }));
    w(linea(decide, ' *(piensa)*'));
    w('');
    tabla.push(['La colina', 'Nada todavía: presentación de Angie', 'Tocar para pasar cada globo']);
  }

  if (elegidos.has('prologo')) {
    w('## El prólogo');
    w('');
    tabla.push(['Prólogo (líneas)', 'La historia: vuelven a casa, la anomalía, Angie', 'Mirar']);
    for (const l of prologo.GUION) {
      const parada = PARADAS[l.id];
      w(linea(l, parada ? ` ⏸ **se abre: ${parada}**` : ''));
      if (parada === 'minijuego') {
        w('');
        w('### ⏸ El minijuego de operadores');
        w('');
        for (const h of operadores.HUECOS_DEL_PROLOGO) {
          w(`#### ${h.nombre}: ${h.titulo} (\`${h.operador}\`)`);
          w('');
          for (const n of h.nombres) w(`- \`${n.codigo}\`: ${n.es}`);
          w(`- Encargo: ${h.encargo.replace(/`/g, '')} · Meta: ${h.meta}`);
          w(`- Ayuda de ${h.ayuda.nombre} al fallar:`);
          for (const [op, txt] of Object.entries(h.pistas))
            w(`  - con \`${op}\`: ${txt.replace(/`/g, '')}`);
          desafio(h.sistema);
          w('');
          tabla.push([
            `Minijuego · ${h.titulo}`,
            `Qué hace \`${h.operador}\` (frente a los otros dos)`,
            'Elegir el operador del hueco y accionar',
          ]);
        }
      }
      if (parada === 'manual' || parada === 'arbol') {
        const paginas =
          parada === 'manual' ? manual.PAGINAS_DEL_MANUAL : [arbol.ARBOL_DE_SIGNAL_SPACE];
        w('');
        w(`### ⏸ ${parada === 'manual' ? 'El manual de a bordo' : 'El árbol de Signal Space'}`);
        w('');
        for (const [i, p] of paginas.entries()) {
          const ruta = p.cargar.toString().match(/import\(["']([^"']+)["']\)/)?.[1];
          const componente = ruta && resolve(join(raiz, 'src/app/integrada-vista'), ruta);
          w(`#### ${parada === 'manual' ? `Página ${i + 1}` : '0/6'} · ${p.ley}`);
          w('');
          w(`- En la nave: «${p.enLaNave}»`);
          const tarjeta = componente ? tarjetaDe(componente) : {};
          for (const [k, v] of Object.entries(tarjeta)) w(`- Pista de Angie (${PISTA[k]}): ${v}`);
          const s = componente && sistemaDe(componente, sistemas);
          if (s) desafio(s.sistema);
          else w('- Desafío: dentro de la demo (no es de perilla)');
          w('');
          tabla.push([
            `${parada === 'manual' ? `Manual ${i + 1}` : '0/6'} · ${p.id}`,
            p.ley,
            tarjeta.action ?? (s ? `«${s.sistema.action}» con la perilla` : 'la demo'),
          ]);
        }
      }
    }
    w('');
  }

  const cinematica = (c) => {
    w(`### Cinemática ${c.capitulo}: «${c.titulo}»`);
    w('');
    w(`Ley: *${c.ley}* · Apertura: ${c.apertura.join(', ')}`);
    w('');
    for (const l of c.lineas) {
      const extra = `${l.beat ? ` · beat \`${l.beat}\`` : ''}${l.si ? ` · solo si ${l.si}` : ''}`;
      w(linea(l, extra));
    }
    w('');
  };

  const etapaPorCapitulo = new Map(etapas.ETAPAS_DEL_VIAJE.map((e) => [e.capitulo, e]));
  for (const ruta of rutas.signalsRoutesTree) {
    if (!elegidos.has(ruta.path)) continue;
    const cap = Number(ruta.path);
    const etapa = etapaPorCapitulo.get(cap);
    w(`## ${cap} · ${etapa?.nombre ?? '?'} (arco ${etapa?.arco ?? '?'})`);
    w('');
    const c = cine.cinematicaDe(cap);
    if (c) cinematica(c);
    else w('*(sin cinemática)*\n');
    for (const sub of ruta.subLevels ?? []) {
      const id = `${cap}/${sub.path}`;
      const rel = sub.loadComponent?.toString().match(/import\(["']\.\/([^"']+)["']\)/)?.[1];
      const componente = rel && join(raiz, 'src/app/signals', rel);
      const g = viaje.guionDe(id);
      w(`### ${id} · ${sub.title}`);
      w('');
      if (g) {
        w(linea({ ...g.llegada, id: viaje.idDeLineaDelViaje(id, 'llegada') }, ' *(al llegar)*'));
      } else w('- *(la página no tiene línea de llegada)*');
      const tarjeta = componente ? tarjetaDe(componente) : {};
      for (const [k, v] of Object.entries(tarjeta)) w(`- Pista de Angie (${PISTA[k]}): ${v}`);
      const s = componente && sistemaDe(componente, sistemas);
      if (s) desafio(s.sistema);
      else w('- *(sin desafío de perilla)*');
      if (g) {
        w(
          linea({ ...g.resuelta, id: viaje.idDeLineaDelViaje(id, 'resuelta') }, ' *(al resolver)*'),
        );
      }
      w('');
      tabla.push([
        id,
        sub.title,
        [tarjeta.action, s && `«${s.sistema.action}» con la perilla`].filter(Boolean).join(' · ') ||
          '—',
      ]);
    }
  }

  for (const [clave, cap] of [
    ['revelacion', 13],
    ['final', 12],
  ]) {
    if (!elegidos.has(clave)) continue;
    w(`## ${clave === 'final' ? 'El final' : 'La revelación'}`);
    w('');
    cinematica(cine.cinematicaDe(cap));
    tabla.push([clave === 'final' ? 'Final' : 'Revelación', cine.cinematicaDe(cap).ley, 'Mirar']);
  }

  w('## Qué aprendes en cada paso');
  w('');
  w('| Paso | Qué es nuevo | Qué te toca hacer |');
  w('| --- | --- | --- |');
  for (const fila of tabla)
    w(`| ${fila.map((x) => String(x).replace(/\|/g, '\\|')).join(' | ')} |`);
  w('');
  w('## Líneas sin voz grabada');
  w('');
  w(sinVoz.length ? sinVoz.map((id) => `\`${id}\``).join(', ') : 'Ninguna.');
  w('');
  return L.join('\n');
}

const arg = (k) => {
  const i = process.argv.indexOf(`--${k}`);
  return i > 0 ? process.argv[i + 1] : undefined;
};

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const md = await armarGuion({ desde: arg('desde'), hasta: arg('hasta') });
  const salida = arg('salida');
  if (salida) {
    mkdirSync(dirname(resolve(salida)), { recursive: true });
    writeFileSync(resolve(salida), md);
    console.log(`written ${salida}`);
  } else console.log(md);
}
