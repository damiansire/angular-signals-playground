import { Component, input, output, ChangeDetectionStrategy } from '@angular/core';
import { CodeLine } from '../component-atom.interface';
import { TailwindTextSize } from '../../interfaces/tailwind-css.interface';

@Component({
  selector: 'app-code-legacy',
  imports: [],
  templateUrl: './code-legacy.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  styleUrl: './code-legacy.component.css',
})
export class CodeLegacyComponent {
  readonly textSize = input<TailwindTextSize>('text-2xl');
  readonly lines = input<CodeLine[]>([]);
  readonly lineClick = output<string>();

  lineClasses(item: CodeLine): string {
    const state = item.active
      ? 'bg-green-700 text-white'
      : this.isInteractive(item)
        ? 'bg-gray-800 text-gray-300 hover:bg-green-800 hover:text-white'
        : 'bg-gray-800 text-gray-300';
    return `${this.textSize()} ${state}`;
  }

  /**
   * Las líneas en blanco son separadores visuales, no código clickeable: no
   * deben quedar como `role="button"` sin nombre accesible (violación de
   * "ARIA commands must have an accessible name" detectada por axe-core).
   */
  isInteractive(item: CodeLine): boolean {
    return typeof item.line === 'string' && item.line.trim().length > 0;
  }

  onLineClick(line: CodeLine) {
    this.lineClick.emit(line.id || ''); // Emit the line's ID
  }
}
