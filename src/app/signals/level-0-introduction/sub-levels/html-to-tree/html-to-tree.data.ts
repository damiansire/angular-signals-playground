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
 * Dónde está `</article>`: cuántos de sus hijos (el título y el párrafo) quedan adentro. Con 0 va
 * pegado a su apertura, que es el bug; con 1 cierra después del título y el párrafo queda afuera;
 * con 2, después del párrafo: arreglado.
 */
export type HijosAdentro = 0 | 1 | 2;
export const LUGARES_DEL_CIERRE: readonly HijosAdentro[] = [0, 1, 2];
export const ARREGLADO: HijosAdentro = 2;

/**
 * El código de la consola, con `</article>` donde lo dejaron. Los renglones del título y el párrafo
 * son siempre los mismos: solo se mueve el cierre.
 */
export function codigoDelArbol(adentro: HijosAdentro): readonly Renglon[] {
  if (adentro === 0) {
    return [
      ...ANTES,
      { sangria: 1, piezas: [abre('article'), cierra('article')] },
      ...HIJOS_DE_ARTICLE,
      FIN,
    ];
  }
  return [
    ...ANTES,
    { sangria: 1, piezas: [abre('article')] },
    ...HIJOS_DE_ARTICLE.slice(0, adentro),
    { sangria: 1, piezas: [cierra('article')] },
    ...HIJOS_DE_ARTICLE.slice(adentro),
    FIN,
  ];
}

/**
 * Adónde va el cierre que se arrastra: al lugar más cercano a la altura del puntero. `alturas[i]`
 * es la del lugar `i`, en el mismo eje que `y`.
 */
export function lugarMasCercano(y: number, alturas: readonly number[]): HijosAdentro {
  let mejor = 0;
  alturas.forEach((h, i) => {
    if (Math.abs(h - y) < Math.abs(alturas[mejor] - y)) mejor = i;
  });
  return LUGARES_DEL_CIERRE[mejor] ?? 0;
}

/**
 * El cierre y su comparación: dónde está, y dónde estaba antes de la última vez que se movió
 * (`null` mientras nunca se movió).
 */
export interface CierreMovido {
  readonly cierre: HijosAdentro;
  readonly antes: HijosAdentro | null;
}

/**
 * Mover el cierre: lo de antes pasa a ser donde estaba. Soltarlo donde ya estaba no es una mudanza:
 * la comparación de la última queda como estaba.
 */
export function moverCierre(estado: CierreMovido, destino: HijosAdentro): CierreMovido {
  if (destino === estado.cierre) return estado;
  return { cierre: destino, antes: estado.cierre };
}

/**
 * Los dos árboles que se comparan. Mientras se arrastra, el de ahora contra adónde caería; quieto,
 * la última mudanza. Sin ninguna, no hay nada que comparar.
 */
export function arbolesAComparar(
  estado: CierreMovido,
  arrastrandoA: HijosAdentro | null,
): { readonly antes: HijosAdentro; readonly despues: HijosAdentro } | null {
  if (arrastrandoA !== null) return { antes: estado.cierre, despues: arrastrandoA };
  if (estado.antes === null) return null;
  return { antes: estado.antes, despues: estado.cierre };
}

/** Los elementos que tienen otro padre en un código que en el otro, en orden de documento. */
export function cambianDePadre(antes: readonly Renglon[], despues: readonly Renglon[]): NodoId[] {
  const a = padres(antes);
  const d = padres(despues);
  return NODOS.filter((id) => a[id] !== d[id]);
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

/**
 * Cómo se marca un renglón del código: `oculto` mientras falte tocar algún tag suyo, `visto` cuando
 * todo lo que abre o cierra ya está en la pantalla, y `afuera` si lo que abre quedó fuera de su
 * panel. Un cierre suelto (`</section>`) se marca con su elemento.
 */
export type EstadoDelRenglon = 'oculto' | 'visto' | 'afuera';

export function estadoDelRenglon(
  renglon: Renglon,
  reveladas: readonly NodoId[],
  fuera: readonly NodoId[],
): EstadoDelRenglon {
  const ids = renglon.piezas.flatMap((p) => (p.tipo === 'texto' ? [] : [p.id]));
  if (!ids.every((id) => reveladas.includes(id))) return 'oculto';
  return renglon.piezas.some((p) => p.tipo === 'abre' && fuera.includes(p.id)) ? 'afuera' : 'visto';
}

/** Un nodo del árbol como lo arma el navegador: `x` en anchos de hoja, `nivel` desde la raíz. */
export interface NodoDelArbol {
  readonly id: NodoId;
  readonly padre: NodoId | null;
  readonly nivel: number;
  readonly x: number;
}

/**
 * El árbol de los tags, de arriba hacia abajo: cada hoja ocupa un lugar en orden de documento y cada
 * padre va centrado sobre sus hijos. Con el bug, `<article>` es una hoja más y el título y el
 * párrafo cuelgan de `<main>`; arreglado, cuelgan de él.
 */
export function disponerArbol(renglones: readonly Renglon[]): {
  readonly nodos: readonly NodoDelArbol[];
  readonly hojas: number;
} {
  const padre = padres(renglones);
  const hijos = (id: NodoId | null) => NODOS.filter((n) => n in padre && padre[n] === id);
  const dispuestos = new Map<NodoId, NodoDelArbol>();
  let hojas = 0;
  const visitar = (id: NodoId, nivel: number): number => {
    const xs = hijos(id).map((h) => visitar(h, nivel + 1));
    const x = xs.length ? (xs[0] + xs[xs.length - 1]) / 2 : hojas++;
    dispuestos.set(id, { id, padre: padre[id] ?? null, nivel, x });
    return x;
  };
  for (const raiz of hijos(null)) visitar(raiz, 0);
  return { nodos: NODOS.flatMap((id) => dispuestos.get(id) ?? []), hojas };
}
