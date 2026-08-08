/**
 * Gate del presupuesto de prosa: cuántas palabras EXPLICATIVAS muestra cada sub-nivel.
 *
 * La gente parsea forma, posición y movimiento; las palabras al final. Un concepto explicado en un
 * párrafo no está explicado. El techo es 8 palabras por pantalla; lo que hoy es párrafo tiene que
 * pasar a ser la demo.
 *
 * Funciona como RATCHET, no como flag: hoy la mayoría de las pantallas está por encima del techo,
 * así que fallar de una le rompería el build a cualquiera. Cada pantalla arrastra su conteo actual
 * en la línea base, y el gate falla si alguna EMPEORA o si una pantalla nueva nace por encima del
 * techo. La línea base solo puede bajar (`--update` se niega a subirla).
 *
 *   node scripts/prose-budget.mjs               reporta y falla si algo empeoró
 *   node scripts/prose-budget.mjs --update      baja la línea base a lo medido hoy
 *   node scripts/prose-budget.mjs --rebaseline  reescribe la línea base, incluso hacia arriba
 *
 * `--rebaseline` existe solo para cuando CAMBIA LA DEFINICIÓN de la métrica (se empieza a contar
 * algo que antes no se contaba). El ratchet compara la misma medida a lo largo del tiempo: si la
 * medida cambia, la línea base vieja deja de ser comparable y hay que refundarla una vez, a mano y
 * con intención. Para el uso normal está `--update`, que solo puede bajar.
 */

import { readdirSync, readFileSync, statSync, writeFileSync } from 'node:fs';
import { dirname, join, relative, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
const REPO = join(HERE, '..');
const SUB_LEVELS = join(REPO, 'src', 'app', 'signals');
const BASELINE = join(HERE, 'prose-budget.baseline.json');

/** Techo por pantalla. Las etiquetas de control y las lecturas del sistema no son prosa. */
export const CEILING = 8;

/**
 * Atributos por los que se pasa la explicación a la tarjeta didáctica (`app-concept-card`, vía los
 * layouts). Es prosa que el usuario LEE en pantalla aunque en el template viva dentro de una
 * etiqueta, así que entra al presupuesto: sin esto el gate borraba justamente lo que quería medir.
 * `title` queda afuera a propósito: es el nombre de la pantalla, sustantivo para navegar.
 */
const PROSE_ATTRS = /(?<![[\w-])(concept|action|observe)\s*=\s*"([^"]*)"/g;

/**
 * Prosa visible de un template: se sacan los bloques de código (que son el material, no la
 * explicación), el markup, y las interpolaciones (son datos que cambian, no texto que se lee).
 * Los atributos de PROSE_ATTRS se rescatan ANTES de borrar el markup, porque son texto que se lee.
 */
export function countProse(html) {
  const fromAttrs = [...html.matchAll(PROSE_ATTRS)].map((m) => m[2]).join(' ');

  const text = `${fromAttrs} ${html}`
    // Las etiquetas de control son verbos que dicen qué hace el botón, no explicación: entran en
    // el punto de "sustantivos para navegar, verbos para actuar", no en el presupuesto de prosa.
    .replace(/<button[\s\S]*?<\/button>/g, ' ')
    .replace(/<app-code[\s\S]*?<\/app-code>/g, ' ')
    .replace(/<app-code\b[^>]*\/>/g, ' ')
    .replace(/<pre[\s\S]*?<\/pre>/g, ' ')
    .replace(/<code[\s\S]*?<\/code>/g, ' ')
    .replace(/<!--[\s\S]*?-->/g, ' ')
    .replace(/\{\{[\s\S]*?\}\}/g, ' ')
    .replace(/@(if|for|else|switch|case|default|empty)[^{]*\{/g, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&[a-z]+;/g, ' ')
    .replace(/[{}]/g, ' ');

  return text.split(/\s+/).filter((word) => /[a-záéíóúñü]/i.test(word)).length;
}

function templatesOf(dir, found = []) {
  for (const name of readdirSync(dir)) {
    const path = join(dir, name);
    if (statSync(path).isDirectory()) templatesOf(path, found);
    else if (name.endsWith('.component.html')) found.push(path);
  }
  return found;
}

/** Un conteo por sub-nivel, con la ruta relativa como identidad estable. */
export function scan(root = SUB_LEVELS) {
  return templatesOf(root)
    .filter((path) => path.includes(`${sep}sub-levels${sep}`))
    .map((path) => ({
      screen: relative(REPO, path).split(sep).join('/'),
      words: countProse(readFileSync(path, 'utf8')),
    }))
    .sort((a, b) => b.words - a.words);
}

function loadBaseline() {
  try {
    return JSON.parse(readFileSync(BASELINE, 'utf8'));
  } catch {
    return {};
  }
}

/**
 * Una pantalla falla si supera su propio techo: el presupuesto, o su línea base si todavía está
 * por encima. Sin línea base rige el presupuesto, así que una pantalla nueva nace cumpliendo.
 */
export function offenders(counts, baseline) {
  return counts
    .map((row) => ({ ...row, limit: Math.max(CEILING, baseline[row.screen] ?? CEILING) }))
    .filter((row) => row.words > row.limit);
}

/**
 * La línea base solo baja. Una pantalla SIN entrada previa no puede estrenar deuda: se le anota el
 * techo, no lo que mide hoy. Si no, renombrar el archivo blanquea la deuda (la pantalla entra como
 * "nueva" y se lleva su conteo actual de regalo), que es precisamente el bypass que el ratchet
 * tiene que impedir.
 */
export function nextBaseline(counts, baseline) {
  const next = {};
  for (const { screen, words } of counts) {
    const prev = baseline[screen];
    next[screen] = prev === undefined ? Math.min(words, CEILING) : Math.min(prev, words);
  }
  return next;
}

function main() {
  const counts = scan();
  const baseline = loadBaseline();

  if (process.argv.includes('--rebaseline')) {
    const next = Object.fromEntries(counts.map(({ screen, words }) => [screen, words]));
    writeFileSync(BASELINE, `${JSON.stringify(next, null, 2)}\n`, 'utf8');
    console.log(`Línea base REFUNDADA: ${Object.keys(next).length} pantallas.`);
    console.log('Usá esto solo si cambió la definición de la métrica, y dejá el porqué escrito.');
    return;
  }

  if (process.argv.includes('--update')) {
    const next = nextBaseline(counts, baseline);
    const estrenan = counts.filter(
      (row) => baseline[row.screen] === undefined && row.words > CEILING,
    );
    writeFileSync(BASELINE, `${JSON.stringify(next, null, 2)}\n`, 'utf8');
    console.log(`Línea base actualizada: ${Object.keys(next).length} pantallas.`);
    if (estrenan.length) {
      console.log('\nSin línea base previa y por encima del techo: se les anotó el techo, no su');
      console.log('conteo de hoy. Si es una pantalla renombrada, la deuda no se blanquea.');
      for (const row of estrenan)
        console.log(`  ${row.screen}: mide ${row.words}, anotado ${CEILING}`);
    }
    return;
  }

  const over = offenders(counts, baseline);
  const debt = counts.filter((row) => row.words > CEILING);

  console.log(`Presupuesto de prosa: ${CEILING} palabras por pantalla.`);
  console.log(`${counts.length} pantallas · ${counts.length - debt.length} ya cumplen.`);

  if (debt.length) {
    console.log(`\nPor encima del techo (deuda conocida, no falla):`);
    for (const row of debt) console.log(`  ${String(row.words).padStart(3)}  ${row.screen}`);
  }

  if (over.length) {
    console.error(`\nEMPEORARON respecto de la línea base:`);
    for (const row of over) {
      console.error(`  ${row.screen}: ${row.words} palabras, tope ${row.limit}`);
    }
    process.exit(1);
  }

  console.log('\nNinguna pantalla empeoró.');
}

// Solo corre si lo invocaron a él: importarlo desde el test no tiene que disparar el gate.
if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main();
}
