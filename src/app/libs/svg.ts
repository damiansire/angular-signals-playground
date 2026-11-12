const NS = 'http://www.w3.org/2000/svg';

export type Atributos = Readonly<Record<string, string | number>>;

/** Crea un elemento SVG ya colgado de su padre: los dibujos imperativos se arman de a nodos. */
export function el<K extends keyof SVGElementTagNameMap>(
  padre: Element,
  tag: K,
  attrs: Atributos = {},
): SVGElementTagNameMap[K] {
  const n = document.createElementNS(NS, tag);
  for (const [k, v] of Object.entries(attrs)) n.setAttribute(k, String(v));
  padre.appendChild(n);
  return n;
}
