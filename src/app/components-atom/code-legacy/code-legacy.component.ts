import {
  Component,
  input,
  output,
  Input,
  Signal,
  signal,
  ChangeDetectionStrategy
} from '@angular/core';
import { CodeLine } from '../component-atom.interface';
import { TailwindTextSize } from '../../interfaces/tailwind-css.interface';

@Component({
    selector: 'app-code-legacy',
    imports: [],
    templateUrl: './code-legacy.component.html',
    changeDetection: ChangeDetectionStrategy.OnPush,
    styleUrl: './code-legacy.component.css'
})
export class CodeLegacyComponent {
  readonly textSize = input<TailwindTextSize>('text-2xl');
  @Input() lines: Signal<CodeLine[]> = signal([]);
  readonly lineClick = output<string>();

  lineClasses(item: CodeLine): string {
    const state = item.active
      ? 'bg-green-700 text-white'
      : 'bg-gray-800 text-gray-300 hover:bg-green-800 hover:text-white';
    return `${this.textSize()} ${state}`;
  }

  onLineClick(line: CodeLine) {
    this.lineClick.emit(line.id || ''); // Emit the line's ID
  }
}
