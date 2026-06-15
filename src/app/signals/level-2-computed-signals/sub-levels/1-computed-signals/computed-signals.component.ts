
import {
  Component,
  Signal,
  WritableSignal,
  computed,
  signal,
  ChangeDetectionStrategy
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CodeLine } from '../../../../components-atom/component-atom.interface';
import { ColumnAndCodeLayoutComponent } from '../../../../layouts/column-and-code-layout/column-and-code-layout.component';

@Component({
    selector: 'app-computed-signals',
    templateUrl: './computed-signals.component.html',
    styleUrl: './computed-signals.component.css',
    changeDetection: ChangeDetectionStrategy.Eager,
    imports: [
    FormsModule,
    ColumnAndCodeLayoutComponent
]
})
export class ComputedSignalsComponent {
  firstName: WritableSignal<string> = signal('Damian');
  surname: WritableSignal<string> = signal('Sire');
  fullName: Signal<string> = computed(() => {
    return `${this.firstName()} ${this.surname()}`;
  });

  setFirstName(eventTarget: any) {
    const value = eventTarget?.value || '';
    this.firstName.set(value);
  }

  setLastName(eventTarget: any) {
    const value = eventTarget?.value || '';
    this.surname.set(value);
  }

  lines = computed<CodeLine[]>(() => [
    {
      line: 'firstName: WritableSignal<string> = signal("Damian");',
      active: false,
    },
    {
      line: 'surname: WritableSignal<string> = signal("Sire");',
      active: false,
    },
    { line: 'fullName: Signal<string> = computed(() => {', active: true },
    {
      line: '  return `${this.firstName()} ${this.surname()}`;',
      active: true,
    },
    { line: '});', active: true },
  ]);
}
