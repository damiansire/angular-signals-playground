import { Component, viewChild, computed, signal, ChangeDetectionStrategy } from '@angular/core';
import { form, FormField, required } from '@angular/forms/signals';
import { CodeLine } from '../../../../components-atom/component-atom.interface';
import { ColumnAndCodeLayoutComponent } from '../../../../layouts/column-and-code-layout/column-and-code-layout.component';
import { ManipulableSystemComponent } from '../../../../components-atom/manipulable-system/manipulable-system.component';
import { CircuitoComponent } from '../../../../components-draw/circuito/circuito.component';
import { EnlaceCircuito, NodoCircuito } from '../../../../components-draw/circuito/circuito.modelo';
import { SET_SIGNAL_SYSTEM } from '../../signals-systems';

@Component({
  selector: 'app-writable-signals',
  templateUrl: './writable-signals.component.html',
  styleUrl: './writable-signals.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ManipulableSystemComponent, ColumnAndCodeLayoutComponent, CircuitoComponent, FormField],
})
export class WritableSignalsComponent {
  readonly closingSystem = SET_SIGNAL_SYSTEM;
  readonly count = signal(0);
  // A cleared number input writes null, so the draft cannot be a plain number.
  readonly draft = signal<number | null>(null);
  readonly draftField = form(this.draft, (value) => {
    required(value);
  });
  /** Se escribió algo que no es un número. Antes el valor inválido se descartaba en silencio. */
  readonly rejected = signal(false);

  private readonly circuito = viewChild<CircuitoComponent>('circuito');

  readonly enlaces: EnlaceCircuito[] = [{ de: 'count', a: 'vista' }];
  readonly nodos = computed<NodoCircuito[]>(() => [
    { id: 'count', nombre: 'count', valor: String(this.count()), tono: 'fuente', col: 1, fila: 1 },
    {
      id: 'vista',
      nombre: 'count()',
      valor: String(this.count()),
      tono: 'consumidor',
      col: 2,
      fila: 1,
    },
  ]);

  readonly lines = computed<CodeLine[]>(() => [
    { line: 'count = signal(0);', active: true },
    { line: 'setValue() {', active: false },
    { line: '    this.count.set(inputValue);', active: true },
    { line: '}', active: false },
  ]);
  setValue() {
    const inputValue = this.draft();
    // invalid() also covers text the browser cannot parse ("1e"), which never reaches the draft.
    if (inputValue === null || this.draftField().invalid()) {
      this.rejected.set(true);
      return;
    }
    this.rejected.set(false);
    // `set` reemplaza: el valor anterior no se suma ni se guarda, sale despedido.
    if (inputValue !== this.count()) this.circuito()?.despedirValor('count', String(this.count()));
    this.count.set(inputValue);
  }

  clearRejected() {
    if (this.rejected()) this.rejected.set(false);
  }
}
