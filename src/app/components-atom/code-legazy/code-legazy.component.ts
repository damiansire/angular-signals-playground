import { CommonModule } from '@angular/common';
import {
  Component,
  computed,
  EventEmitter,
  Input,
  Output,
  Signal,
  signal,
  ChangeDetectionStrategy
} from '@angular/core';
import { CodeLine } from '../component-atom.interface';
import { spliteInTags } from '../../libs/code-parser';
import { TailwindTextSize } from '../../interfaces/tailwind-css.interface';

@Component({
    selector: 'app-code-legazy',
    imports: [CommonModule],
    templateUrl: './code-legazy.component.html',
    changeDetection: ChangeDetectionStrategy.Eager,
    styleUrl: './code-legazy.component.css'
})
export class CodeLegazyComponent {
  @Input() textSize: TailwindTextSize = 'text-2xl';
  @Input() lines: Signal<CodeLine[]> = signal([]);
  @Output() lineClick = new EventEmitter<string>();

  /*
  linesWithColor = computed(() => {
    const linesWithColor = [];
    for (const codeLine of this.lines()) {
      const data = spliteInTags(codeLine);
    }
  });
  */
  onLineClick(line: CodeLine) {
    this.lineClick.emit(line.id); // Emit the line's ID
  }

  /*
const regex = /(<\/?\w+>)/g; // Expresión regular para encontrar etiquetas
const result = htmlString.split(regex).filter(Boolean);
*/
}
