import { CD_NODES } from '../../../../libs/cd-tree';

/**
 * Dominio de la ley 5: Zone.js solo se entera de lo que parchea, y cuando se entera revisa el árbol
 * entero. El código corre siempre (el valor cambia), pero la pantalla solo se pone al día si la API
 * con que corrió está parcheada. Funciones puras, sin DOM.
 */
export interface ApiAsync {
  readonly nombre: string;
  /** El renglón real con que arranca la llamada. */
  readonly renglon: string;
  readonly parcheada: boolean;
}

/** La primera es la rota: la que Zone.js no parchea. Las demás, las que sí. */
export const APIS: readonly ApiAsync[] = [
  { nombre: 'requestIdleCallback', renglon: 'requestIdleCallback(() => {', parcheada: false },
  { nombre: 'setTimeout', renglon: 'setTimeout(() => {', parcheada: true },
  { nombre: 'addEventListener', renglon: "addEventListener('click', () => {", parcheada: true },
  { nombre: 'fetch', renglon: 'fetch(url).then(() => {', parcheada: true },
  { nombre: 'Promise', renglon: 'Promise.resolve().then(() => {', parcheada: true },
];

/** El valor de verdad y lo que la pantalla muestra; `revisados`, lo que barrió la última corrida. */
export interface EstadoDeLaZona {
  readonly total: number;
  readonly enPantalla: number;
  readonly revisados: number;
}

export const ZONA_INICIAL: EstadoDeLaZona = { total: 0, enPantalla: 0, revisados: 0 };

/**
 * Una corrida de `this.total++` adentro de la llamada: el valor sube siempre; la pantalla, solo si
 * Zone.js se enteró, y entonces revisó todos los nodos del árbol.
 */
export function correr(estado: EstadoDeLaZona, api: ApiAsync): EstadoDeLaZona {
  const total = estado.total + 1;
  return api.parcheada
    ? { total, enPantalla: total, revisados: CD_NODES.length }
    : { total, enPantalla: estado.enPantalla, revisados: 0 };
}

/** La pantalla muestra un valor que ya no es. */
export function quedoVieja(estado: EstadoDeLaZona): boolean {
  return estado.enPantalla !== estado.total;
}

/** La API que sigue en la rueda del hueco. */
export function siguienteApi(api: ApiAsync): ApiAsync {
  return APIS[(APIS.indexOf(api) + 1) % APIS.length];
}
