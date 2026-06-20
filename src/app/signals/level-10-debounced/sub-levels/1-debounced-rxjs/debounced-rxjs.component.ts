import {
  Component,
  ChangeDetectionStrategy,
  computed,
  signal,
} from '@angular/core';
import { toObservable, toSignal } from '@angular/core/rxjs-interop';
import { debounceTime } from 'rxjs';
import { CodeLine } from '../../../../components-atom/component-atom.interface';
import { ColumnAndCodeLayoutComponent } from '../../../../layouts/column-and-code-layout/column-and-code-layout.component';

@Component({
  selector: 'app-debounced-rxjs',
  templateUrl: './debounced-rxjs.component.html',
  styleUrl: './debounced-rxjs.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ColumnAndCodeLayoutComponent],
})
export class DebouncedRxjsComponent {
  readonly query = signal('');

  // El valor "debounced": se actualiza 400ms después de la última tecla.
  readonly debounced = toSignal(
    toObservable(this.query).pipe(debounceTime(400)),
    { initialValue: '' }
  );

  setQuery(value: string) {
    this.query.set(value);
  }

  readonly lines = computed<CodeLine[]>(() => [
    { line: 'query = signal("");', active: false },
    { line: '', active: false },
    { line: 'debounced = toSignal(', active: true },
    { line: '  toObservable(this.query).pipe(', active: true },
    { line: '    debounceTime(400)', active: true },
    { line: '  ),', active: true },
    { line: '  { initialValue: "" }', active: false },
    { line: ');', active: false },
  ]);
}
