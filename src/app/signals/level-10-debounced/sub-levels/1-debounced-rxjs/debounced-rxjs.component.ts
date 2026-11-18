import { Component, ChangeDetectionStrategy, computed, signal } from '@angular/core';
import { toObservable, toSignal } from '@angular/core/rxjs-interop';
import { debounceTime } from 'rxjs';
import { form, FormField } from '@angular/forms/signals';
import { CodeLine } from '../../../../components-atom/component-atom.interface';
import { ColumnAndCodeLayoutComponent } from '../../../../layouts/column-and-code-layout/column-and-code-layout.component';
import { ManipulableSystemComponent } from '../../../../components-atom/manipulable-system/manipulable-system.component';
import { DEBOUNCE_RXJS_SYSTEM } from '../../debounce-systems';

@Component({
  selector: 'app-debounced-rxjs',
  templateUrl: './debounced-rxjs.component.html',
  styleUrl: './debounced-rxjs.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ManipulableSystemComponent, ColumnAndCodeLayoutComponent, FormField],
})
export class DebouncedRxjsComponent {
  readonly closingSystem = DEBOUNCE_RXJS_SYSTEM;
  readonly query = signal('');
  readonly queryField = form(this.query);

  // El valor "debounced": se actualiza 400ms después de la última tecla.
  readonly debounced = toSignal(toObservable(this.query).pipe(debounceTime(400)), {
    initialValue: '',
  });

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
