import {
  Component,
  computed,
  input,
  linkedSignal,
  output,
  ChangeDetectionStrategy,
} from '@angular/core';
import { outputFromObservable, toObservable } from '@angular/core/rxjs-interop';
import { CodeLine, CodeLineElement } from '../component-atom.interface';
import {
  isTag,
  spliteInTags,
  HtmlIdGeneratorService,
  isNodeId,
  duenosDeTokens,
} from '../../libs/code-parser';
import { conCortes } from '../../libs/cortes-de-codigo';
import { TailwindTextSize } from '../../interfaces/tailwind-css.interface';
import { CodeClick } from './code.interface';

@Component({
  selector: 'app-code',
  imports: [],
  templateUrl: './code.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  styleUrl: './code.component.css',
})
export class CodeComponent {
  readonly textSize = input<TailwindTextSize>('text-2xl');
  readonly selectBy = input<'Line' | 'Element'>('Element');
  htmlCode = input<string>('');
  // Modo estático: snippet pre-armado (líneas de código a mostrar tal cual, no interactivas,
  // resaltadas con `active`). Si se pasan `lines`, el átomo las muestra en vez de parsear
  // `htmlCode`; así reemplaza al viejo `code-legacy` sumándole la ventana estilo editor.
  readonly lines = input<CodeLine[]>([]);
  readonly codeClick = output<CodeClick>();

  // El átomo tiene dos modos excluyentes: estático (snippet pre-armado vía `lines`) o
  // interactivo (parseo de `htmlCode` con tags clickeables). `lines` no vacío ⇒ estático.
  readonly isStatic = computed<boolean>(() => this.lines().length > 0);

  // Resultado del parseo derivado del input (estado estrictamente derivado).
  private readonly parsedLines = computed<CodeLine[]>(() => this.parseCode(this.htmlCode()));
  // Las lineas visibles parten del parseo pero deben poder mutar con los clicks,
  // por eso es un linkedSignal (no un effect que propaga estado).
  codeLines = linkedSignal<CodeLine[]>(() => this.parsedLines());
  /** Los nodos marcados en modo `Element`. Se marca el ELEMENTO, no el token: `<h2> Introduction
   *  </h2>` es un nodo con su texto adentro, y marcar solo la apertura lo leía como tres cosas. */
  readonly marcados = linkedSignal<ReadonlySet<string>>(() => {
    this.parsedLines();
    return new Set();
  });
  // htmlParsed se deriva del parseo en vez de emitirse dentro de un effect.
  readonly htmlParsed = outputFromObservable(toObservable(this.parsedLines));
  characterIndentSize = 12;

  lineClasses(item: CodeLine): string {
    const state = item.selected
      ? 'bg-green-700 text-white'
      : 'bg-gray-800 text-gray-300 hover:bg-green-800 hover:text-white';
    return `${this.textSize()} ${state}`;
  }

  // --- Modo estático (equivalente al antiguo code-legacy) ---

  staticLineClasses(item: CodeLine): string {
    const state = item.active ? 'bg-green-700 text-white' : 'bg-gray-800 text-gray-300';
    return `${this.textSize()} ${state}`;
  }

  /**
   * Cuántos espacios abren el renglón. Quien lo muestra angosto sangra la continuación de un renglón
   * largo desde ahí (variable `--sangria`); con una sangría fija, la segunda mitad de un renglón
   * sangrado arrancaba a la izquierda de su principio y se leía como un cierre.
   */
  sangria(item: CodeLine): number {
    if (typeof item.line !== 'string') return 0;
    return item.line.length - item.line.trimStart().length;
  }

  /**
   * El renglón con su sangría en espacios duros. Con espacios comunes, al envolver angosto el
   * navegador cortaba justo después de la sangría y dejaba un renglón vacío arriba del código.
   */
  renglon(item: CodeLine): string {
    if (typeof item.line !== 'string') return String(item.line ?? '');
    const n = this.sangria(item);
    return '\u00a0'.repeat(n) + item.line.slice(n);
  }

  /**
   * El rengl\u00f3n listo para `[innerHTML]`: escapado y con puntos de corte despu\u00e9s de `.`, `(` y `=`,
   * as\u00ed angosto se parte donde se lee bien y no a mitad de un identificador. Un rengl\u00f3n vac\u00edo
   * lleva un espacio para conservar su alto (vac\u00edo, el div colapsaba a cero).
   */
  renglonHtml(item: CodeLine): string {
    const texto = this.renglon(item);
    return texto === '' ? ' ' : conCortes(texto);
  }

  /**
   * Las líneas en blanco de un snippet son separadores visuales, no código: no deben quedar
   * como `role="button"` sin nombre accesible (violación de "ARIA commands must have an
   * accessible name" detectada por axe-core). Solo las líneas con texto son focusables.
   */
  isInteractive(item: CodeLine): boolean {
    return typeof item.line === 'string' && item.line.trim().length > 0;
  }

  /**
   * Mismo criterio que `isInteractive`, para el modo interactivo. Sólo es focusable lo que al
   * activarse HACE algo: en modo `Line` manda la línea y los tokens son adorno; en modo `Element`
   * manda el token, pero únicamente si ese token produce un nodo del árbol.
   * Antes línea y tokens eran ambos `role="button"` con `tabindex`, así que un snippet de 11 líneas
   * dejaba 31 paradas de tabulación anidadas y la línea era un blanco muerto que no hacía nada.
   * Y el filtro que quedaba (`isSpaceElement`) no filtraba nada, porque el tokenizador nunca emite
   * tokens vacíos: los cierres y el texto quedaban focusables sin tener nodo que revelar.
   */
  isElementInteractive(element: CodeLineElement): boolean {
    return this.selectBy() === 'Element' && isNodeId(element.id ?? '');
  }

  /** Tocar cualquier parte del elemento lo marca: su texto y su cierre también son blanco. */
  isElementClickable(element: CodeLineElement): boolean {
    return this.selectBy() === 'Element' && Boolean(element.dueno);
  }

  estaMarcado(element: CodeLineElement): boolean {
    return Boolean(element.dueno) && this.marcados().has(element.dueno!);
  }

  /** Los tokens marcados seguidos de un mismo elemento se leen como UNA marca: sin esquinas
   *  redondeadas donde se tocan. */
  pegadoAlAnterior(item: CodeLine, i: number): boolean {
    return this.mismoMarcado(item.elements?.[i], item.elements?.[i - 1]);
  }

  pegadoAlSiguiente(item: CodeLine, i: number): boolean {
    return this.mismoMarcado(item.elements?.[i], item.elements?.[i + 1]);
  }

  private mismoMarcado(a?: CodeLineElement, b?: CodeLineElement): boolean {
    return !!a && !!b && a.dueno === b.dueno && this.estaMarcado(a);
  }

  parseCode(code: string): CodeLine[] {
    const htmlIdGenerator = new HtmlIdGeneratorService();
    const parsedCode = [];
    const lines = code.split('\n');

    for (const line of lines) {
      // Calculate indentation
      const indent = line.search(/\S/); // Find the index of the first non-whitespace character

      const elementInLine = spliteInTags(line.trim()); // Trim leading/trailing whitespace
      const codeLineElements: CodeLineElement[] = elementInLine.map((text) => {
        return {
          text,
          reservedWord: isTag(text),
          id: htmlIdGenerator.generateId(text),
          selected: false,
        };
      });
      const newElement: CodeLine = {
        elements: codeLineElements,
        selected: false,
        id: codeLineElements.map((x) => x.id).join('$'),
        indent: indent, // Add the indentation to the CodeLine object
      };
      parsedCode.push(newElement);
    }

    const tokens = parsedCode.flatMap((line) => line.elements ?? []);
    duenosDeTokens(tokens.map((token) => token.text)).forEach((dueno, i) => {
      tokens[i].dueno = dueno;
    });
    return parsedCode;
  }

  onLineClick(clickedItem: CodeLine) {
    // El estado se lee del signal, no del objeto del template: con clicks rápidos la vista todavía
    // no se rehízo, el objeto sigue sin seleccionar y cada click volvía a emitir 'Select'.
    const actual = this.codeLines().find((item) => item.id === clickedItem.id) ?? clickedItem;
    const isSelect = !actual.selected;
    const updatedCodeLines = this.codeLines().map((item) =>
      item.id === clickedItem.id ? { ...item, selected: isSelect } : item,
    );

    this.codeLines.set(updatedCodeLines);

    //TODO: When remove deprecated element, remove || ""
    const codeClick$: CodeClick = {
      target: 'Line',
      action: isSelect ? 'Select' : 'Deselect',
      id: clickedItem.id || '',
    };
    this.codeClick.emit(codeClick$);
  }

  onElementClick(_codeLine: CodeLine, clickedItem: CodeLineElement) {
    const dueno = clickedItem.dueno;
    // Un token sin nodo no tiene nada que revelar en el árbol.
    if (!dueno || !isNodeId(dueno)) {
      return;
    }
    // El estado se lee del signal, no del objeto del template: con clicks rápidos la vista todavía
    // no se rehízo y cada click volvía a emitir 'Select'.
    const isSelect = !this.marcados().has(dueno);
    this.marcados.update((actuales) => {
      const siguientes = new Set(actuales);
      if (isSelect) siguientes.add(dueno);
      else siguientes.delete(dueno);
      return siguientes;
    });

    const codeClick$: CodeClick = {
      target: 'Element',
      action: isSelect ? 'Select' : 'Deselect',
      id: dueno,
    };
    this.codeClick.emit(codeClick$);
  }
}
