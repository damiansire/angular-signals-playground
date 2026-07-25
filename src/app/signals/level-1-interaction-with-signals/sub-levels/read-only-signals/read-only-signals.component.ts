import { Component, ChangeDetectionStrategy, computed, signal } from '@angular/core';
import { CodeLine } from '../../../../components-atom/component-atom.interface';
import { ColumnAndCodeLayoutComponent } from '../../../../layouts/column-and-code-layout/column-and-code-layout.component';
import { ManipulableSystemComponent } from '../../../../components-atom/manipulable-system/manipulable-system.component';
import { READONLY_SIGNAL_SYSTEM } from '../../signals-systems';

@Component({
  selector: 'app-read-only-signals',
  templateUrl: './read-only-signals.component.html',
  styleUrl: './read-only-signals.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ManipulableSystemComponent, ColumnAndCodeLayoutComponent],
})
export class ReadOnlySignalsComponent {
  readonly closingSystem = READONLY_SIGNAL_SYSTEM;
  // Solo el componente puede escribir este signal (es privado).
  private readonly _count = signal(0);

  // Lo que se expone afuera es de SOLO LECTURA: se puede leer pero no .set()/.update().
  readonly count = this._count.asReadonly();

  increment() {
    this._count.update((value) => value + 1);
  }

  reset() {
    this._count.set(0);
  }

  readonly lines = computed<CodeLine[]>(() => [
    { line: 'private _count = signal(0);', active: false },
    { line: '', active: false },
    { line: '// asReadonly(): solo lectura hacia afuera', active: true },
    { line: 'count = this._count.asReadonly();', active: true },
    { line: '', active: false },
    { line: 'this._count.set(5);   // ✅ adentro', active: false },
    { line: 'this.count.set(5);    // ❌ error de compilación', active: false },
  ]);
}
