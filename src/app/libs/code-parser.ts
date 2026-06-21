import { Link, NodeTree } from '../components-draw/components-draw.inferface';

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

  static isSpaceElement(id: string) {
    return /^space-\d+$/.test(id);
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
    } else if (content === '') {
      return { element: 'space', isClosingTag: false };
    } else {
      return { element: 'text', isClosingTag: false };
    }
  }
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
  const links: Link[] = [];
  const tagStack: string[] = [];
  const htmlIdGenerator = new HtmlIdGeneratorService();

  const tags = spliteInTags(htmlCode);

  for (const tag of tags) {
    if (!isTag(tag)) {
      continue; // Ignorar elementos que no son etiquetas
    }

    const tagId = htmlIdGenerator.generateId(tag);
    const isClosingTag = HtmlHelper.getElementType(tag).isClosingTag;
    const isSpaceElement = HtmlHelper.isSpaceElement(tagId);

    if (!isClosingTag && !isSpaceElement) {
      // Etiqueta de apertura (y no es espacio)
      tagStack.push(tagId);

      if (tagStack.length > 1) {
        // Si no es la etiqueta raíz
        const parentTagId = tagStack[tagStack.length - 2];
        links.push({ source: parentTagId, target: tagId });
      }
    } else if (isClosingTag && !isSpaceElement) {
      // Etiqueta de cierre (y no es espacio)
      tagStack.pop();
    }
  }

  return links;
}

export function generateNodes(htmlCode: string): NodeTree[] {
  const nodes: NodeTree[] = [];
  const tagStack: TagType[] = [];
  const htmlIdGenerator = new HtmlIdGeneratorService();

  const tags = spliteInTags(htmlCode);

  const y = 100;
  const yOffset = 100;
  const elementForLevel: number[] = [];

  for (const tag of tags) {
    if (!isTag(tag)) {
      //Falta contemplar el caso de texto
      continue; // Ignorar elementos que no son etiquetas
    }
    const currentTagType: TagType = HtmlHelper.getElementType(tag);
    const tagId = htmlIdGenerator.generateId(tag);
    //Si es un tag de abierto, lo agrego a la pila
    if (currentTagType.isClosingTag === false) {
      tagStack.push(currentTagType);
      const node = {
        name: tagId,
        x: 0,
        y: y + tagStack.length * yOffset,
        id: tagId,
        level: tagStack.length,
      };
      nodes.push(node);
    } else {
      //Si es un tag de cerrado, verifico en la pila y el ultimo y lo saco
      if (tagStack.at(-1)?.element === currentTagType.element) {
        tagStack.pop();
      }
    }
  }

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
