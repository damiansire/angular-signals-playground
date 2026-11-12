import {
  Component,
  Signal,
  WritableSignal,
  computed,
  signal,
  viewChild,
  ChangeDetectionStrategy,
} from '@angular/core';
import { CodeLine } from '../../../../components-atom/component-atom.interface';
import { ColumnAndCodeLayoutComponent } from '../../../../layouts/column-and-code-layout/column-and-code-layout.component';
import { ManipulableSystemComponent } from '../../../../components-atom/manipulable-system/manipulable-system.component';
import { CircuitoComponent } from '../../../../components-draw/circuito/circuito.component';
import { EnlaceCircuito, NodoCircuito } from '../../../../components-draw/circuito/circuito.modelo';
import { COMPUTED_BASIC_SYSTEM } from '../../computed-systems';

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
  imports: [ManipulableSystemComponent, ColumnAndCodeLayoutComponent, CircuitoComponent],
})
export class ComputedSignalsComponent {
  readonly closingSystem = COMPUTED_BASIC_SYSTEM;
  readonly firstName: WritableSignal<string> = signal('Damian');
  readonly surname: WritableSignal<string> = signal('Sire');
  readonly fullName: Signal<string> = computed(() => {
    return `${this.firstName()} ${this.surname()}`;
  });

  private readonly circuito = viewChild<CircuitoComponent>('circuito');

  readonly enlaces: EnlaceCircuito[] = [
    { de: 'firstName', a: 'fullName' },
    { de: 'surname', a: 'fullName' },
  ];
  readonly nodos = computed<NodoCircuito[]>(() => [
    {
      id: 'firstName',
      nombre: 'firstName',
      valor: this.firstName(),
      tono: 'fuente',
      col: 1,
      fila: 1,
    },
    { id: 'surname', nombre: 'surname', valor: this.surname(), tono: 'fuente', col: 1, fila: 2 },
    {
      id: 'fullName',
      nombre: 'fullName',
      valor: this.fullName(),
      tono: 'derivado',
      col: 2,
      fila: 1,
      alto: 2,
      cerrado: true,
      accion: 'Intentar escribir fullName a mano',
    },
  ]);

  /** Un computed no tiene `set`: la única forma de cambiarlo es cambiar de lo que depende. */
  escribirDerivado() {
    this.circuito()?.rebotar('fullName', 'es derivado');
  }

  setFirstName(eventTarget: EventTarget | null) {
    this.firstName.set(inputValue(eventTarget));
  }

  setLastName(eventTarget: EventTarget | null) {
    this.surname.set(inputValue(eventTarget));
  }

  readonly lines = computed<CodeLine[]>(() => [
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
