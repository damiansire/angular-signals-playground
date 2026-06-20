import {
  Component,
  ChangeDetectionStrategy,
  computed,
  effect,
  signal,
} from '@angular/core';
import { CodeLine } from '../../../../components-atom/component-atom.interface';
import { ColumnAndCodeLayoutComponent } from '../../../../layouts/column-and-code-layout/column-and-code-layout.component';

@Component({
  selector: 'app-on-cleanup',
  templateUrl: './on-cleanup.component.html',
  styleUrl: './on-cleanup.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ColumnAndCodeLayoutComponent],
})
export class OnCleanupComponent {
  readonly running = signal(false);
  readonly ticks = signal(0);
  readonly cleanups = signal(0);

  constructor() {
    effect((onCleanup) => {
      if (this.running()) {
        const id = setInterval(() => this.ticks.update((t) => t + 1), 1000);
        // onCleanup corre antes de re-ejecutar el effect o al destruir el componente.
        onCleanup(() => {
          clearInterval(id);
          this.cleanups.update((c) => c + 1);
        });
      }
    });
  }

  toggle() {
    this.running.update((value) => !value);
  }

  readonly lines = computed<CodeLine[]>(() => [
    { line: 'effect((onCleanup) => {', active: true },
    { line: '  if (this.running()) {', active: this.running() },
    { line: '    const id = setInterval(() => {', active: this.running() },
    { line: '      this.ticks.update((t) => t + 1);', active: this.running() },
    { line: '    }, 1000);', active: this.running() },
    { line: '    onCleanup(() => clearInterval(id));', active: true },
    { line: '  }', active: false },
    { line: '});', active: false },
  ]);
}
