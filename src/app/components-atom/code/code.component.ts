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
import { isTag, spliteInTags, HtmlIdGeneratorService, HtmlHelper } from '../../libs/code-parser';
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
   * Las líneas en blanco de un snippet son separadores visuales, no código: no deben quedar
   * como `role="button"` sin nombre accesible (violación de "ARIA commands must have an
   * accessible name" detectada por axe-core). Solo las líneas con texto son focusables.
   */
  isInteractive(item: CodeLine): boolean {
    return typeof item.line === 'string' && item.line.trim().length > 0;
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

    return parsedCode;
  }

  onLineClick(clickedItem: CodeLine) {
    const isSelect = !clickedItem.selected;
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

  onElementClick(codeLine: CodeLine, clickedItem: CodeLineElement) {
    const isSelect = !clickedItem.selected;
    if (HtmlHelper.isSpaceElement(clickedItem.id)) {
      return;
    }
    const updatedCodeLines = this.codeLines().map((item) => {
      if (item.id !== codeLine.id) {
        return item;
      }
      if (item.elements) {
        const elementsInLine = item.elements.map((lineElement) =>
          lineElement.id === clickedItem.id
            ? { ...clickedItem, selected: !clickedItem.selected }
            : lineElement,
        );

        return { ...item, elements: elementsInLine };
      }
      return item;
    });

    this.codeLines.set(updatedCodeLines);

    //TODO: When remove deprecated element, remove || ""
    const codeClick$: CodeClick = {
      target: 'Element',
      action: isSelect ? 'Select' : 'Deselect',
      id: clickedItem.id || '',
    };
    this.codeClick.emit(codeClick$);
  }
}
