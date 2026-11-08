/**
 * Resaltado de los renglones cortos de los desafíos: TypeScript, una etiqueta de HTML o una
 * propiedad de CSS sueltas. No es un parser: alcanza con separar lo que el ojo busca primero
 * (qué se llama, qué es palabra del lenguaje, qué es un flujo `$`, qué es dato literal) del resto.
 * Concatenar los tokens devuelve el renglón exacto, así que el texto que se ve no cambia.
 */

export type TipoDeToken =
  | 'comentario'
  | 'cadena'
  | 'numero'
  | 'clave'
  | 'etiqueta'
  | 'llamada'
  | 'flujo'
  | 'nombre'
  | 'operador'
  | 'puntuacion'
  | 'espacio';

export interface Token {
  readonly texto: string;
  readonly tipo: TipoDeToken;
}

const CLAVES = new Set([
  'async',
  'await',
  'break',
  'case',
  'class',
  'const',
  'else',
  'export',
  'extends',
  'false',
  'for',
  'from',
  'function',
  'if',
  'import',
  'let',
  'new',
  'null',
  'of',
  'readonly',
  'return',
  'this',
  'true',
  'typeof',
  'undefined',
  'var',
  'void',
  'while',
]);

/**
 * El orden importa: el comentario antes que el operador `/`, la etiqueta antes que el `<`, el
 * número antes que el nombre. Cada alternativa es un grupo con nombre para saber cuál matcheó.
 */
const TOKEN = new RegExp(
  [
    String.raw`(?<comentario>\/\/.*$)`,
    String.raw`(?<cadena>'(?:[^'\\]|\\.)*'?|"(?:[^"\\]|\\.)*"?|\`(?:[^\`\\]|\\.)*\`?)`,
    // Pegado a un nombre es un genérico (`signal<number>`), no una etiqueta.
    String.raw`(?<etiqueta>(?<![\w$])<\/?[a-zA-Z][\w-]*)`,
    String.raw`(?<numero>\b\d[\d_]*(?:\.\d+)?(?:[a-z%]+)?\b)`,
    String.raw`(?<nombre>[A-Za-z_$][\w$]*)`,
    String.raw`(?<espacio>\s+)`,
    String.raw`(?<operador>=>|===|!==|==|!=|<=|>=|&&|\|\||\?\?|\+\+|--|\.\.\.|[-+*/%=<>!?&|])`,
    String.raw`(?<puntuacion>.)`,
  ].join('|'),
  'gy',
);

/**
 * Lo que sigue al nombre, ignorando espacios: decide si es una llamada. Con genérico también
 * (`signal<number>(0)`, `input<string>()`), que en signals es la forma más común.
 */
function abreLlamada(renglon: string, desde: number): boolean {
  return /^\s*(?:<[\w\s,.|[\]<>]*>)?\s*\(/.test(renglon.slice(desde));
}

export function tokensDeCodigo(renglon: string): Token[] {
  const tokens: Token[] = [];
  TOKEN.lastIndex = 0;
  let m: RegExpExecArray | null;
  while ((m = TOKEN.exec(renglon)) !== null) {
    const grupos = m.groups as Record<string, string | undefined>;
    const tipo = Object.keys(grupos).find((k) => grupos[k] !== undefined) as TipoDeToken;
    const texto = m[0];
    tokens.push({
      texto,
      tipo: tipo === 'nombre' ? tipoDeNombre(texto, renglon, TOKEN.lastIndex) : tipo,
    });
  }
  return tokens;
}

function tipoDeNombre(nombre: string, renglon: string, fin: number): TipoDeToken {
  if (CLAVES.has(nombre)) return 'clave';
  // Por convención de RxJS un flujo termina en `$`: es lo que en estos desafíos corre en el tiempo.
  if (nombre.endsWith('$')) return 'flujo';
  if (abreLlamada(renglon, fin)) return 'llamada';
  return 'nombre';
}
