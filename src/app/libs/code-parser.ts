import { Link, NodeTree } from './tree-model';

interface TagType {
  element: string;
  isClosingTag: boolean;
}

export function isTag(str: string): boolean {
  // Normalize the string by trimming and converting to lowercase
  str = str.trim().toLowerCase();

  // Check for valid start and end characters
  if (!str.startsWith('<') || (!str.endsWith('>') && !str.endsWith('/>'))) {
    return false;
  }

  // Enhanced Regex (Case-insensitive, Handles attributes, and spaces correctly, plus Angular events)
  const tagRegex =
    /^<\/?[a-z][\w-]*(\s+[\w-]*(?:(?:\(\w+\))?=\s*(?:".*?"|'.*?'|[^'">\s]+))?)*\s*\/?>$/;

  return tagRegex.test(str);
}

// Nombre de atributo: admite atributos HTML normales ([\w-]) y la sintaxis de
// binding de Angular sobre el mismo token, sin hardcodear casos:
//   (click)  [prop]  [(ngModel)]  *ngIf  #ref  @defer  attr-normal
const ATTR_NAME = String.raw`[@*#]?\(?\[?[\w.-]+\)?\]?\)?`;
// Valor opcional: comillas dobles, simples o sin comillas (hasta espacio o '>').
const ATTR_VALUE = String.raw`(?:\s*=\s*(?:"[^"]*"|'[^']*'|[^'">\s]+))?`;
// Una etiqueta de apertura/cierre/auto-cerrada con cero o más atributos.
const TAG = String.raw`<\/?[a-zA-Z][\w-]*(?:\s+${ATTR_NAME}${ATTR_VALUE})*\s*\/?>`;

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

export function generateNodes(htmlCode: string): NodeTree[] {
  const y = 100;
  const yOffset = 100;
  const elementForLevel: number[] = [];

  const nodes: NodeTree[] = walkTags(htmlCode)
    .filter((tag) => tag.opensNode)
    .map((tag) => ({
      name: tag.id,
      x: 0,
      y: y + tag.level * yOffset,
      id: tag.id,
      level: tag.level,
    }));

  for (const node of nodes) {
    elementForLevel[node.level] = (elementForLevel[node.level] ?? 0) + 1;
  }

  // Posicionamiento horizontal general: cada nivel se centra en x = 0 y sus
  // hermanos se reparten de forma simétrica con un espaciado fijo. Funciona
  // para cualquier cantidad de hermanos (1, 2, 3, 5, 6+), no solo 1/2/4.
  //
  // LIMITACIÓN (tradeoff conocido): el layout centra cada NIVEL globalmente,
  // sin agrupar por padre. Para HTML ramificado (p.ej. <div><a/><b/></div>
  // <section><c/></section>) un hijo puede no quedar justo debajo de su padre y
  // las aristas se cruzan. Un Reingold–Tilford completo sería sobre-ingeniería
  // para este demo; se documenta a propósito en vez de implicar que el caso
  // general está cubierto.
  const spacing = 200;
  const elementLevelIndex: number[] = [];
  for (const node of nodes) {
    elementLevelIndex[node.level] = (elementLevelIndex[node.level] ?? 0) + 1;

    const indexInLevel = elementLevelIndex[node.level] - 1; // 0-based
    const countInLevel = elementForLevel[node.level];
    node.x = (indexInLevel - (countInLevel - 1) / 2) * spacing;
  }

  return nodes;
}
