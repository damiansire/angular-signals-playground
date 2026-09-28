import type { LineaGuion } from '../../integrada-vista/prologo-guion';

/*
 * El Estudio guarda reemplazando SOLO el literal de GUION dentro del texto actual de
 * prologo-guion.ts. Regenerar el archivo entero desde una plantilla pisaba las funciones que
 * evolucionaron después de copiarla (anclajesDe ya difería) y borraba los comentarios de diseño.
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

/** El literal completo de GUION, desde el marcador hasta su `];`. */
export function serializarGuion(guion: readonly LineaGuion[]): string {
  if (!Array.isArray(guion) || guion.length === 0) {
    throw new Error('guion: tiene que ser una lista con al menos una línea');
  }
  return [MARCADOR_GUION, ...guion.map(lineaTS), '];'].join('\n');
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
  const nuevo = serializarGuion(guion);
  return textoActual.slice(0, inicio) + nuevo + textoActual.slice(cierre + CIERRE.length);
}
