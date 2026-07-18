import {
  Component,
  Signal,
  WritableSignal,
  computed,
  signal,
  ChangeDetectionStrategy,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CodeLine } from '../../../../components-atom/component-atom.interface';
import { ColumnAndCodeLayoutComponent } from '../../../../layouts/column-and-code-layout/column-and-code-layout.component';

/** Lee el value de un target de evento con un type guard real (no un `as` a ciegas): si el target
 *  no es un `<input>`, devuelve ''. Mismo criterio que el resto del repo en boundaries no confiables. */
function inputValue(eventTarget: EventTarget | null): string {
  return eventTarget instanceof HTMLInputElement ? eventTarget.value : '';
}

@Component({
  selector: 'app-computed-signals',
  templateUrl: './computed-signals.component.html',
  styleUrl: './computed-signals.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [FormsModule, ColumnAndCodeLayoutComponent],
})
export class ComputedSignalsComponent {
  firstName: WritableSignal<string> = signal('Damian');
  surname: WritableSignal<string> = signal('Sire');
  fullName: Signal<string> = computed(() => {
    return `${this.firstName()} ${this.surname()}`;
  });

  setFirstName(eventTarget: EventTarget | null) {
    this.firstName.set(inputValue(eventTarget));
  }

  setLastName(eventTarget: EventTarget | null) {
    this.surname.set(inputValue(eventTarget));
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
