/**
 * Dominio de la ley 1: el navegador arma el árbol leyendo los tags, no la sangría. El código de la
 * demo trae `<article></article>` cerrado enseguida, con el título y el párrafo sangrados como si
 * fueran suyos: la sangría dice que son hijos de `<article>`, los tags dicen que son de `<main>`.
 * Funciones puras, sin DOM.
 */

/** Cada elemento del código, en orden de documento. */
export const NODOS = ['main', 'section', 'h2', 'p1', 'article', 'h3', 'p2'] as const;
export type NodoId = (typeof NODOS)[number];

/** El tag de cada elemento: los dos párrafos son `<p>`. */
export const TAG: Readonly<Record<NodoId, string>> = {
  main: 'main',
  section: 'section',
  h2: 'h2',
  p1: 'p',
  article: 'article',
  h3: 'h3',
  p2: 'p',
};

export type Pieza =
  | { readonly tipo: 'abre'; readonly id: NodoId }
  | { readonly tipo: 'texto'; readonly texto: string }
  | { readonly tipo: 'cierra'; readonly id: NodoId };

export interface Renglon {
  /** Niveles de sangría: lo que el código aparenta. */
  readonly sangria: number;
  readonly piezas: readonly Pieza[];
}

const abre = (id: NodoId): Pieza => ({ tipo: 'abre', id });
const cierra = (id: NodoId): Pieza => ({ tipo: 'cierra', id });
const hoja = (sangria: number, id: NodoId, texto: string): Renglon => ({
  sangria,
  piezas: [abre(id), { tipo: 'texto', texto }, cierra(id)],
});

const ANTES: readonly Renglon[] = [
  { sangria: 0, piezas: [abre('main')] },
  { sangria: 1, piezas: [abre('section')] },
  hoja(2, 'h2', 'Intro'),
  hoja(2, 'p1', 'Un ejemplo'),
  { sangria: 1, piezas: [cierra('section')] },
];
const HIJOS_DE_ARTICLE: readonly Renglon[] = [hoja(2, 'h3', 'Título'), hoja(2, 'p2', 'Texto')];
const FIN: Renglon = { sangria: 0, piezas: [cierra('main')] };

/**
 * El código de la consola. Con el bug, `</article>` va pegado a su apertura; arreglado, después del
 * párrafo. Los renglones del título y el párrafo son los mismos en las dos: solo se mueve el cierre.
 */
export function codigoDelArbol(arreglado: boolean): readonly Renglon[] {
  return arreglado
    ? [
        ...ANTES,
        { sangria: 1, piezas: [abre('article')] },
        ...HIJOS_DE_ARTICLE,
        { sangria: 1, piezas: [cierra('article')] },
        FIN,
      ]
    : [
        ...ANTES,
        { sangria: 1, piezas: [abre('article'), cierra('article')] },
        ...HIJOS_DE_ARTICLE,
        FIN,
      ];
}

export type Padres = Readonly<Partial<Record<NodoId, NodoId | null>>>;

/** El padre de cada elemento como lo lee el navegador: con una pila de tags abiertos. */
export function padres(renglones: readonly Renglon[]): Padres {
  const abiertos: NodoId[] = [];
  const padre: Partial<Record<NodoId, NodoId | null>> = {};
  for (const pieza of renglones.flatMap((r) => r.piezas)) {
    if (pieza.tipo === 'abre') {
      padre[pieza.id] = abiertos.at(-1) ?? null;
      abiertos.push(pieza.id);
    } else if (pieza.tipo === 'cierra') {
      abiertos.pop();
    }
  }
  return padre;
}

/** El padre de cada elemento como lo aparenta la sangría: el renglón menos sangrado de arriba. */
export function padresPorSangria(renglones: readonly Renglon[]): Padres {
  const arriba: { sangria: number; id: NodoId }[] = [];
  const padre: Partial<Record<NodoId, NodoId | null>> = {};
  for (const r of renglones) {
    const primera = r.piezas[0];
    if (primera?.tipo !== 'abre') continue;
    while ((arriba.at(-1)?.sangria ?? -1) >= r.sangria) arriba.pop();
    padre[primera.id] = arriba.at(-1)?.id ?? null;
    arriba.push({ sangria: r.sangria, id: primera.id });
  }
  return padre;
}

/** Los elementos que la sangría pone en un panel y los tags dejan afuera. */
export function fueraDelPanel(renglones: readonly Renglon[]): NodoId[] {
  const leidos = padres(renglones);
  const aparentes = padresPorSangria(renglones);
  return NODOS.filter((id) => leidos[id] !== aparentes[id]);
}

/** Cada cierre cierra al último que quedó abierto, y al final no queda ninguno abierto. */
export function balanceados(renglones: readonly Renglon[]): boolean {
  const abiertos: NodoId[] = [];
  for (const pieza of renglones.flatMap((r) => r.piezas)) {
    if (pieza.tipo === 'abre') abiertos.push(pieza.id);
    else if (pieza.tipo === 'cierra' && abiertos.pop() !== pieza.id) return false;
  }
  return abiertos.length === 0;
}
