import type { LineaGuion } from '../../integrada-vista/prologo-guion';

/*
 * El Estudio guarda reemplazando SOLO el literal de GUION dentro del texto actual de
 * prologo-guion.ts. Regenerar el archivo entero desde una plantilla pisaba las funciones que
 * evolucionaron después de copiarla (anclajesDe ya difería) y borraba los comentarios de diseño.
 * Los comentarios de ADENTRO del literal (el porqué de cada acto y de cada línea) tampoco se
 * pierden: viajan atados al id de la línea que los sigue.
 *
 * Lo importan el cliente y scripts/sync-server.mjs, que lo carga con el type stripping de Node:
 * por eso usa solo sintaxis que se borra sin compilar (`import type`, nada de enums).
 */

export const MARCADOR_GUION = 'export const GUION: readonly LineaGuion[] = [';

/** Los elementos van indentados, así que el primer `];` a columna cero es el que cierra GUION. */
const CIERRE = '\n];';

/** El printWidth de prettier (package.json): un guardado sin cambios no tiene que dejar diff. */
const ANCHO = 100;

/** Prettier con singleQuote elige la comilla que menos escapes pide; empata a favor de la simple. */
function literal(valor: unknown, campo: string): string {
  if (typeof valor !== 'string') throw new Error(`guion: "${campo}" tiene que ser texto`);
  const simples = valor.split("'").length - 1;
  const dobles = valor.split('"').length - 1;
  const comilla = simples > dobles ? '"' : "'";
  const cuerpo = JSON.stringify(valor).slice(1, -1).replace(/\\"/g, '"');
  return comilla + cuerpo.replaceAll(comilla, `\\${comilla}`) + comilla;
}

function numero(valor: unknown, campo: string): number {
  const n = Number(valor);
  if (!Number.isFinite(n)) throw new Error(`guion: "${campo}" tiene que ser un número`);
  return n;
}

function lineaTS(linea: LineaGuion, i: number): string {
  const props = [`id: ${literal(linea.id, `${i}.id`)}`];
  if (linea.hueco) props.push(`hueco: ${numero(linea.hueco, `${i}.hueco`)}`);
  if (linea.pisa) props.push(`pisa: ${numero(linea.pisa, `${i}.pisa`)}`);
  if (linea.junto) props.push('junto: true');
  if (linea.dur) props.push(`dur: ${numero(linea.dur, `${i}.dur`)}`);
  props.push(`quien: ${literal(linea.quien, `${i}.quien`)}`);
  props.push(`txt: ${literal(linea.txt, `${i}.txt`)}`);

  // Con un corte de renglón a mano o más de tres campos el guion se escribe expandido, y prettier
  // respeta un objeto expandido aunque entre en el ancho: colapsarlo acá sería ensuciar el diff.
  const enUnRenglon = `  { ${props.join(', ')} },`;
  if (!linea.txt.includes('\n') && props.length <= 3 && enUnRenglon.length <= ANCHO) {
    return enUnRenglon;
  }
  return ['  {', ...props.map((p) => `    ${p},`), '  },'].join('\n');
}

/**
 * Lo que el autor escribió entre las líneas del guion: comentarios y renglones en blanco, cada
 * bloque atado al id de la línea que lo sigue. Un comentario de ADENTRO de una línea expandida
 * se sube arriba de ella: el texto se conserva, el lugar exacto no.
 */
interface Notas {
  readonly antesDe: ReadonlyMap<string, readonly string[]>;
  readonly alCierre: readonly string[];
}

const SIN_NOTAS: Notas = { antesDe: new Map(), alCierre: [] };

const ID = /\bid:\s*(['"])(.*?)\1/;

const esComentario = (renglon: string): boolean => /^(\/\/|\/\*|\*)/.test(renglon);

/** Lee las notas del cuerpo del literal, y el orden de los ids para mudar las de líneas borradas. */
function leerNotas(cuerpo: string): Notas & { readonly orden: readonly string[] } {
  const antesDe = new Map<string, string[]>();
  const orden: string[] = [];
  let pendientes: string[] = [];
  let abierta: { id: string | null } | null = null;
  const cerrar = (id: string | null): void => {
    if (id === null) return;
    orden.push(id);
    if (pendientes.length) antesDe.set(id, pendientes);
    pendientes = [];
  };
  for (const renglon of cuerpo.split('\n')) {
    const t = renglon.trim();
    if (esComentario(t)) {
      pendientes.push(t);
    } else if (t === '') {
      if (!abierta) pendientes.push('');
    } else if (abierta) {
      abierta.id ??= ID.exec(t)?.[2] ?? null;
      if (t === '},' || t === '}') {
        cerrar(abierta.id);
        abierta = null;
      }
    } else if (t.startsWith('{')) {
      const id = ID.exec(t)?.[2] ?? null;
      if (t.endsWith('},') || t.endsWith('}')) cerrar(id);
      else abierta = { id };
    }
  }
  return { antesDe, orden, alCierre: pendientes };
}

/** Las notas de una línea que ya no está pasan a la siguiente que sobrevive: un "ACTO" no se pierde. */
function mudarNotas(leidas: ReturnType<typeof leerNotas>, guion: readonly LineaGuion[]): Notas {
  const vivas = new Set(guion.map((l) => l.id));
  const antesDe = new Map<string, readonly string[]>();
  let arrastre: string[] = [];
  for (const id of leidas.orden) {
    const propias = leidas.antesDe.get(id) ?? [];
    if (!vivas.has(id)) {
      arrastre.push(...propias);
      continue;
    }
    const todas = [...arrastre, ...propias];
    if (todas.length) antesDe.set(id, todas);
    arrastre = [];
  }
  return { antesDe, alCierre: [...arrastre, ...leidas.alCierre] };
}

/** Una nota como la deja prettier: sin blancos seguidos, ni al abrir el arreglo ni antes de `];`. */
function renglonesDeNota(nota: readonly string[], primera: boolean, alCierre: boolean): string[] {
  const renglones = nota
    .filter((r, i) => r !== '' || nota[i - 1] !== '')
    .map((r) => (r === '' ? '' : `  ${r}`));
  while (primera && renglones[0] === '') renglones.shift();
  while (alCierre && renglones.at(-1) === '') renglones.pop();
  return renglones;
}

/** El literal completo de GUION, desde el marcador hasta su `];`. */
export function serializarGuion(guion: readonly LineaGuion[], notas: Notas = SIN_NOTAS): string {
  if (!Array.isArray(guion) || guion.length === 0) {
    throw new Error('guion: tiene que ser una lista con al menos una línea');
  }
  const pendientes = new Map(notas.antesDe);
  const cuerpo: string[] = [];
  guion.forEach((linea, i) => {
    const nota = pendientes.get(linea.id);
    pendientes.delete(linea.id);
    if (nota) cuerpo.push(...renglonesDeNota(nota, cuerpo.length === 0, false));
    cuerpo.push(lineaTS(linea, i));
  });
  cuerpo.push(...renglonesDeNota(notas.alCierre, false, true));
  return [MARCADOR_GUION, ...cuerpo, '];'].join('\n');
}

/**
 * Devuelve `textoActual` con el literal de GUION reemplazado y todo lo demás intacto byte a byte.
 * Tira antes de producir nada si el archivo no tiene la forma esperada: quien llama no escribe.
 */
export function empalmarGuion(textoActual: string, guion: readonly LineaGuion[]): string {
  const apariciones = textoActual.split(MARCADOR_GUION).length - 1;
  if (apariciones !== 1) {
    throw new Error(
      `prologo-guion.ts: "${MARCADOR_GUION}" aparece ${apariciones} veces y tiene que aparecer una`,
    );
  }
  const inicio = textoActual.indexOf(MARCADOR_GUION);
  const cierre = textoActual.indexOf(CIERRE, inicio);
  if (!textoActual.startsWith('\n', inicio + MARCADOR_GUION.length) || cierre === -1) {
    throw new Error('prologo-guion.ts: GUION no cierra con "];" en un renglón propio');
  }
  const cuerpo = textoActual.slice(inicio + MARCADOR_GUION.length + 1, cierre);
  const nuevo = serializarGuion(guion, mudarNotas(leerNotas(cuerpo), guion));
  return textoActual.slice(0, inicio) + nuevo + textoActual.slice(cierre + CIERRE.length);
}
