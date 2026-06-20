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
  selector: 'app-custom-equal',
  templateUrl: './custom-equal.component.html',
  styleUrl: './custom-equal.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ColumnAndCodeLayoutComponent],
})
export class CustomEqualComponent {
  // equal custom: dos usuarios son "iguales" si tienen el mismo name.
  readonly user = signal(
    { name: 'Ada' },
    { equal: (a, b) => a.name === b.name }
  );

  private readonly runs = signal(0);
  readonly notifications = computed(() => Math.max(0, this.runs() - 1));

  constructor() {
    effect(() => {
      this.user();
      this.runs.update((n) => n + 1);
    });
  }

  // Objeto nuevo, MISMO name -> equal() === true -> NO notifica (a diferencia del default).
  setSameName() {
    this.user.set({ name: this.user().name });
  }

  setOtherName() {
    this.user.set({ name: this.user().name === 'Ada' ? 'Grace' : 'Ada' });
  }

  readonly lines = computed<CodeLine[]>(() => [
    { line: 'user = signal(', active: false },
    { line: "  { name: 'Ada' },", active: false },
    { line: '  { equal: (a, b) => a.name === b.name }', active: true },
    { line: ');', active: false },
    { line: '', active: false },
    { line: "user.set({ name: 'Ada' }); // mismo name -> NO notifica", active: true },
  ]);
}
