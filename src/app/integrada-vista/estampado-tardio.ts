/**
 * La armonización de los sub-niveles embebidos (`.card--dissolve .subhost …` en el CSS de la vista)
 * solo alcanza a los elementos que llevan el atributo de encapsulación de la vista, y ese atributo lo
 * estampa el motor al montar. Lo que el sub-nivel crea DESPUÉS (un `@if` que se abre con un click, una
 * fila nueva de una lista) llegaba sin él y quedaba con el gris crudo de Tailwind: el tercer "Valor:"
 * de 3/1, "Pionera…" en 6/1 a 6/3, a 3:1 de contraste. Este vigía estampa lo que llega tarde.
 */
export function vigilarEstampado(host: Element, enc: string): () => void {
  const estampar = (e: Element): void => {
    e.setAttribute(enc, '');
    e.querySelectorAll('*').forEach((hijo) => hijo.setAttribute(enc, ''));
  };
  const vigia = new MutationObserver((registros) => {
    for (const r of registros) for (const n of r.addedNodes) if (n instanceof Element) estampar(n);
  });
  vigia.observe(host, { childList: true, subtree: true });
  return () => vigia.disconnect();
}
