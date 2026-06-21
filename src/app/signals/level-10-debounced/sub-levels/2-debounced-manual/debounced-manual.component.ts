import { Component, ChangeDetectionStrategy, computed, effect, signal } from '@angular/core';
import { CodeLine } from '../../../../components-atom/component-atom.interface';
import { ColumnAndCodeLayoutComponent } from '../../../../layouts/column-and-code-layout/column-and-code-layout.component';

@Component({
  selector: 'app-debounced-manual',
  templateUrl: './debounced-manual.component.html',
  styleUrl: './debounced-manual.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ColumnAndCodeLayoutComponent],
})
export class DebouncedManualComponent {
  readonly query = signal('');
  readonly debounced = signal('');

  constructor() {
    effect((onCleanup) => {
      const value = this.query();
      const id = setTimeout(() => this.debounced.set(value), 400);
      // Cada tecla cancela el timer anterior antes de arrancar el nuevo.
      onCleanup(() => clearTimeout(id));
    });
  }

  setQuery(value: string) {
    this.query.set(value);
  }

  readonly lines = computed<CodeLine[]>(() => [
    { line: 'effect((onCleanup) => {', active: true },
    { line: '  const value = this.query();', active: true },
    { line: '  const id = setTimeout(() => {', active: true },
    { line: '    this.debounced.set(value);', active: true },
    { line: '  }, 400);', active: true },
    { line: '  onCleanup(() => clearTimeout(id));', active: true },
    { line: '});', active: false },
  ]);
}
