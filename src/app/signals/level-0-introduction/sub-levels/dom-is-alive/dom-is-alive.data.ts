/**
 * Dominio de la ley 2: el DOM está vivo. Cada línea busca un nodo con un selector y le cambia el
 * texto; si el selector no encuentra nada, `querySelector` devuelve `null` y la línea no toca nada.
 * Funciones puras, sin DOM real.
 */
export interface DomNodeState {
  readonly id: string;
  readonly selector: string;
  readonly text: string;
}

/** Una línea del código: con qué selector busca y qué texto le pone a lo que encuentre. */
export interface DomMutation {
  readonly id: string;
  readonly selector: string;
  readonly value: string;
}

export const INITIAL_DOM: readonly DomNodeState[] = [
  { id: 'title', selector: 'h1', text: 'Contador' },
  { id: 'count', selector: '#count', text: '0' },
  { id: 'status', selector: '#status', text: 'inactivo' },
];

/** El hueco rota por estos selectores del título; el primero es el roto y solo `h1` lo encuentra. */
export const SELECTORES_DEL_TITULO = ['#titulo', 'h1', '.titulo'] as const;
export type SelectorDelTitulo = (typeof SELECTORES_DEL_TITULO)[number];

/** Las tres líneas de la consola; la del título lleva el selector que esté en el hueco. */
export function lineas(selectorDelTitulo: string): DomMutation[] {
  return [
    { id: 'count', selector: '#count', value: '1' },
    { id: 'status', selector: '#status', value: 'activo' },
    { id: 'title', selector: selectorDelTitulo, value: 'Listo' },
  ];
}

/** El renglón de código de una línea, como se ve en la consola. */
export function codigoDe(mutation: DomMutation): string {
  return `querySelector('${mutation.selector}').textContent = '${mutation.value}'`;
}

/** Lo que devuelve `querySelector`: el nodo con ese selector, o `null`. */
export function encontrar(dom: readonly DomNodeState[], selector: string): DomNodeState | null {
  return dom.find((n) => n.selector === selector) ?? null;
}

/** Devuelve un DOM nuevo con el nodo que encuentra la línea cambiado; si no encuentra, el mismo. */
export function applyMutation(
  dom: readonly DomNodeState[],
  mutation: DomMutation,
): readonly DomNodeState[] {
  const nodo = encontrar(dom, mutation.selector);
  if (!nodo) return dom;
  return dom.map((n) => (n === nodo ? { ...n, text: mutation.value } : n));
}

/** Adónde fue a parar cada línea: el id del nodo que encontró, o `null`. */
export interface Envio {
  readonly selector: string;
  readonly destino: string | null;
}

export interface Corrida {
  readonly dom: readonly DomNodeState[];
  readonly envios: readonly Envio[];
}

/** Corre las líneas en orden sobre el DOM. */
export function correr(dom: readonly DomNodeState[], mutations: readonly DomMutation[]): Corrida {
  const envios: Envio[] = [];
  let actual = dom;
  for (const m of mutations) {
    envios.push({ selector: m.selector, destino: encontrar(actual, m.selector)?.id ?? null });
    actual = applyMutation(actual, m);
  }
  return { dom: actual, envios };
}

/** Alguna línea no encontró su nodo. */
export function algunaFallo(corrida: Corrida): boolean {
  return corrida.envios.some((e) => e.destino === null);
}

/** El selector que sigue en la rueda del hueco. */
export function siguienteSelector(selector: SelectorDelTitulo): SelectorDelTitulo {
  const i = SELECTORES_DEL_TITULO.indexOf(selector);
  return SELECTORES_DEL_TITULO[(i + 1) % SELECTORES_DEL_TITULO.length];
}
