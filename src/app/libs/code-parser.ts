import { Link, NodeTree } from './tree-model';

interface TagType {
  element: string;
  isClosingTag: boolean;
}

// Nombre de atributo: el atributo HTML normal y cada forma de binding de Angular, como
// alternativas EXPLÍCITAS. Antes era una tira de opcionales (`[@*#]?\(?\[?[\w.-]+\)?\]?\)?`) que
// no distinguía la posición de los corchetes: aceptaba combinaciones que no existen (`([x])`) y
// rechazaba `[(ngModel)]`, que sí existe. El test que decía cubrir el two-way binding no lo
// notaba porque comparaba contra la cadena entera, y `spliteInTags` devuelve exactamente eso
// cuando NO reconoce la etiqueta: pasaba en verde de las dos maneras.
//   [(ngModel)]   [prop] / [class.active]   (click)   *ngIf / #ref / @defer   attr-normal
const ATTR_NAME = String.raw`(?:\[\([\w.-]+\)\]|\[[\w.-]+\]|\([\w.-]+\)|[@*#][\w.-]+|[\w.-]+)`;
// Valor opcional: comillas dobles, simples o sin comillas (hasta espacio o '>').
const ATTR_VALUE = String.raw`(?:\s*=\s*(?:"[^"]*"|'[^']*'|[^'">\s]+))?`;
// Una etiqueta de apertura/cierre/auto-cerrada con cero o más atributos.
const TAG = String.raw`<\/?[a-zA-Z][\w-]*(?:\s+${ATTR_NAME}${ATTR_VALUE})*\s*\/?>`;

/**
 * Una MISMA gramática decide qué es una etiqueta acá y en `spliteInTags`. Antes eran dos: el
 * tokenizador aceptaba la sintaxis de Angular (`[prop]`, `[(ngModel)]`, `*ngIf`, `#ref`) y este
 * predicado no, con una regex propia que solo admitía `[\w-]`. La consecuencia no era que se
 * ignorara la etiqueta y ya: `walkTags` descartaba la APERTURA `<div [hidden]="h">` pero su cierre
 * `</div>` sí pasaba el filtro y llegaba al pop, así que desapilaba al ancestro equivocado y el
 * hermano siguiente quedaba colgando de la raíz. Un playground de Angular tiene que poder parsear
 * una plantilla de Angular.
 */
const TAG_COMPLETO = new RegExp(`^${TAG}$`, 'i');

export function isTag(str: string): boolean {
  return TAG_COMPLETO.test(str.trim());
}

export function spliteInTags(htmlString: string): string[] {
  // Separa la cadena en etiquetas y texto, consumiendo el espacio en blanco
  // adyacente a cada etiqueta. El grupo de captura conserva las etiquetas en el
  // resultado del split; el texto entre etiquetas queda como tokens propios.
  const regex = new RegExp(String.raw`\s*(${TAG})\s*`, 'g');
  return htmlString.split(regex).filter(Boolean);
}

export class HtmlHelper {
  static getTagFromId(id: string) {
    return id.split('-')[0];
  }

  static getElementType(content: string): TagType {
    content = content.trim();
    // El grupo de captura admite guiones ([\w-]) igual que isTag, para nombrar
    // bien los custom elements / componentes Angular (<app-badge>, <my-element>).
    const openingTagMatch = content.match(/<([a-z][\w-]*)[^>]*>/i);
    const closingTagMatch = content.match(/<\/([a-z][\w-]*)[^>]*>/i);
    if (openingTagMatch) {
      return { element: openingTagMatch[1].toLowerCase(), isClosingTag: false };
    } else if (closingTagMatch) {
      return { element: closingTagMatch[1].toLowerCase(), isClosingTag: true };
    } else {
      return { element: 'text', isClosingTag: false };
    }
  }
}

/**
 * Elementos void del HTML: no admiten etiqueta de cierre, así que abren y cierran en el mismo
 * token. El parser los trataba como aperturas normales y nada los desapilaba, así que todo lo que
 * venía después quedaba un nivel más abajo y colgando del tag equivocado. En la pantalla cuyo tema
 * es justamente ver el árbol del DOM, un `<br>` bastaba para dibujar un árbol falso.
 */
const VOID_ELEMENTS = new Set([
  'area',
  'base',
  'br',
  'col',
  'embed',
  'hr',
  'img',
  'input',
  'link',
  'meta',
  'source',
  'track',
  'wbr',
]);

/** Abre y cierra en el mismo token: void (`<br>`) o auto-cerrado explícito (`<my-x />`). */
function closesItself(element: string, token: string): boolean {
  return VOID_ELEMENTS.has(element) || token.trim().endsWith('/>');
}

/** Un tag ya ubicado en el árbol. `parentId` es null solo en la raíz. */
export interface WalkedTag {
  id: string;
  element: string;
  isClosing: boolean;
  /** Abre un nodo del árbol: toda etiqueta de apertura, incluidas las void y las auto-cerradas. */
  opensNode: boolean;
  /** Profundidad, 1 en la raíz. Solo significa algo si `opensNode`. */
  level: number;
  parentId: string | null;
}

/**
 * ÚNICO recorrido de tags del módulo. Los nodos, las aristas y los ids salen todos de acá.
 *
 * Antes había tres criterios de apilado escritos por separado: `generateNodes` verificaba el tope
 * antes de desapilar, `generateLinks` desapilaba sin mirar, y ninguno contemplaba los elementos
 * void. Resultado: los nodos y las aristas del MISMO gráfico podían salir de dos árboles
 * distintos. Con un solo recorrido eso no se puede volver a desincronizar.
 */
export function walkTags(htmlCode: string): WalkedTag[] {
  const walked: WalkedTag[] = [];
  const openStack: { element: string; id: string }[] = [];
  const ids = new HtmlIdGeneratorService();

  for (const token of spliteInTags(htmlCode)) {
    if (!isTag(token)) continue;

    const { element, isClosingTag } = HtmlHelper.getElementType(token);
    const id = ids.generateId(token);

    if (isClosingTag) {
      // Solo desapila si el cierre corresponde al tope: un cierre huérfano no puede llevarse
      // por delante a un ancestro sano.
      if (openStack.at(-1)?.element === element) openStack.pop();
      walked.push({ id, element, isClosing: true, opensNode: false, level: 0, parentId: null });
      continue;
    }

    walked.push({
      id,
      element,
      isClosing: false,
      opensNode: true,
      level: openStack.length + 1,
      parentId: openStack.at(-1)?.id ?? null,
    });

    if (!closesItself(element, token)) openStack.push({ element, id });
  }

  return walked;
}

/**
 * Si un id corresponde a algo que produce nodo en el árbol. Lo consume el bloque de código para
 * decidir qué token es interactivo: antes TODOS lo eran (cierres y texto incluidos), así que sobre
 * el HTML real de la lección había ~20 paradas focusables contra 7 nodos, y más de la mitad eran
 * "hice click y no pasó nada" en la pantalla que enseña la correspondencia código a árbol.
 */
export function isNodeId(id: string): boolean {
  return Boolean(id) && !/-closed-\d+$/.test(id) && !/^text-\d+$/.test(id);
}

export class HtmlIdGeneratorService {
  private tagCounters: Record<string, number> = {};

  generateId(line: string): string {
    const elementInfo = HtmlHelper.getElementType(line); // Devuelve un objeto

    const tagName = elementInfo.element; // Extrae el nombre del elemento

    const counterKey = elementInfo.isClosingTag ? `${tagName}-closed` : tagName;

    if (!this.tagCounters[counterKey]) {
      this.tagCounters[counterKey] = 1;
    } else {
      this.tagCounters[counterKey]++;
    }

    return `${tagName}-${elementInfo.isClosingTag ? 'closed-' : ''}${this.tagCounters[counterKey]}`;
  }
}

export function generateLinks(htmlCode: string): Link[] {
  return walkTags(htmlCode)
    .filter((tag) => tag.opensNode && tag.parentId !== null)
    .map((tag) => ({ source: tag.parentId as string, target: tag.id }));
}

/**
 * Un nodo por fila, en el orden en que el parser lee el HTML, y la profundidad como columna: el
 * árbol del inspector del navegador. Así cada tag del código y su nodo quedan en el mismo orden
 * vertical y los conectores entre los dos no se cruzan nunca. El árbol de arriba hacia abajo que
 * había antes repartía cada nivel por separado: con HTML ramificado los hermanos quedaban lejos de
 * su padre y los conectores al código se enredaban.
 */
export function generateNodes(htmlCode: string): NodeTree[] {
  return walkTags(htmlCode)
    .filter((tag) => tag.opensNode)
    .map((tag, fila) => ({
      name: tag.id,
      x: tag.level - 1,
      y: fila,
      id: tag.id,
      level: tag.level,
    }));
}

/**
 * De qué nodo es cada token, en el orden en que llegan: la apertura es de su propio nodo, el texto
 * es del elemento que lo contiene y el cierre, del elemento que cierra. `<h2> Introduction </h2>`
 * es UN nodo con su texto adentro, así que tocarlo marca los tres tokens y no solo la apertura.
 * `null` para lo que no pertenece a ningún elemento (texto suelto, cierres huérfanos).
 *
 * Recibe los tokens ya cortados porque quien los muestra los corta por renglón, y los ids de texto
 * dependen de ese corte; los ids de tags salen del mismo generador que usa `walkTags`.
 */
export function duenosDeTokens(tokens: string[]): (string | null)[] {
  const ids = new HtmlIdGeneratorService();
  const abiertos: { element: string; id: string }[] = [];

  return tokens.map((token) => {
    const id = ids.generateId(token);
    if (!isTag(token)) return abiertos.at(-1)?.id ?? null;

    const { element, isClosingTag } = HtmlHelper.getElementType(token);
    if (isClosingTag) {
      return abiertos.at(-1)?.element === element ? (abiertos.pop()?.id ?? null) : null;
    }
    if (!closesItself(element, token)) abiertos.push({ element, id });
    return id;
  });
}
