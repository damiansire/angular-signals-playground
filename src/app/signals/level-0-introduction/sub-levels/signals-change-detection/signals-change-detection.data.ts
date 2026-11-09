import { CD_NODES, SIGNAL_DEPENDENTS } from '../../../../libs/cd-tree';

/**
 * Dominio de la ley 6: cómo se declara el valor decide quién se entera de que cambió. Un signal
 * sabe quién lo lee y avisa solo a esos; una variable común no lo sabe, y para no perderse nada
 * alguien barre el árbol entero, como en casa. Funciones puras, sin DOM.
 */
export interface Declaracion {
  /** El renglón que declara el valor: el hueco del código. */
  readonly renglon: string;
  /** La escritura sigue a la declaración: un number no tiene `.update`. */
  readonly escritura: string;
  readonly esSignal: boolean;
}

/** La primera es la rota: la variable común. */
export const DECLARACIONES: readonly Declaracion[] = [
  { renglon: 'let total = 0;', escritura: 'total++;', esSignal: false },
  {
    renglon: 'const total = signal(0);',
    escritura: 'total.update((t) => t + 1);',
    esSignal: true,
  },
];

/** El valor y los nodos que revisó la última corrida. */
export interface EstadoDelArbol {
  readonly total: number;
  readonly revisados: readonly string[];
}

export const ARBOL_INICIAL: EstadoDelArbol = { total: 0, revisados: [] };

const TODOS = CD_NODES.map((n) => n.id);

/** Una corrida de la escritura: el valor sube siempre; quién se revisa depende de la declaración. */
export function correr(estado: EstadoDelArbol, declaracion: Declaracion): EstadoDelArbol {
  return {
    total: estado.total + 1,
    revisados: declaracion.esSignal ? SIGNAL_DEPENDENTS : TODOS,
  };
}

/** Se revisó el árbol entero: nadie sabía quién lee el valor. */
export function barrioTodo(estado: EstadoDelArbol): boolean {
  return estado.revisados.length === TODOS.length;
}

/** La declaración que sigue en la rueda del hueco. */
export function siguienteDeclaracion(declaracion: Declaracion): Declaracion {
  return DECLARACIONES[(DECLARACIONES.indexOf(declaracion) + 1) % DECLARACIONES.length];
}
