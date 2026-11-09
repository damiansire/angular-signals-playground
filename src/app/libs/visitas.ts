/**
 * Conteo de visitas del sitio publicado con GoatCounter, por su píxel `/count` y sin cargar
 * `count.js`: la página comparte origen con las demás project pages de damiansire.github.io (ver
 * `deploy.yml`), así que un script de terceros acá podría leer el localStorage de todas. GoatCounter
 * no guarda cookies ni nada en el navegador, por eso no hace falta un banner de consentimiento.
 */
export const HOST_PUBLICADO = 'damiansire.github.io';
export const CONTADOR = 'https://angular-signals-playground.goatcounter.com/count';

export interface Visita {
  host: string;
  /** URL del router: sin el base-href y quizás con query (la vista integrada guarda ahí el capítulo). */
  url: string;
  /** Solo en la primera vista de la sesión: después el referente sería el propio sitio. */
  referente: string;
  /** `navigator.webdriver`: las capturas por CDP y los tests no son visitas. */
  automatizado: boolean;
}

/** La ruta que se cuenta: sin query ni fragmento, para que cada capítulo no sea una página aparte. */
export function rutaContable(url: string): string {
  return url.split(/[?#]/)[0] || '/';
}

/** El píxel a pedir para esta visita, o `null` si no se cuenta (dev server, preview, bots). */
export function urlDeConteo(visita: Visita): string | null {
  if (visita.host !== HOST_PUBLICADO || visita.automatizado) return null;
  const params = new URLSearchParams({ p: rutaContable(visita.url) });
  if (visita.referente) params.set('r', visita.referente);
  return `${CONTADOR}?${params}`;
}
