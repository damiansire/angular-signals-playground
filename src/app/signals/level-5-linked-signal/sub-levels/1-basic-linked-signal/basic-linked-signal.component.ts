import { Component, ChangeDetectionStrategy, computed, linkedSignal, signal } from '@angular/core';
import { CodeLine } from '../../../../components-atom/component-atom.interface';
import { ColumnAndCodeLayoutComponent } from '../../../../layouts/column-and-code-layout/column-and-code-layout.component';

@Component({
  selector: 'app-basic-linked-signal',
  templateUrl: './basic-linked-signal.component.html',
  styleUrl: './basic-linked-signal.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ColumnAndCodeLayoutComponent],
})
export class BasicLinkedSignalComponent {
  // La fuente: cambiar esta lista hace que la selección se reinicie.
  readonly shippingOptions = signal<string[]>(['Ground', 'Air', 'Sea']);

  // linkedSignal: editable como un signal, pero se recalcula cuando cambia la fuente.
  readonly selectedOption = linkedSignal(() => this.shippingOptions()[0]);

  select(option: string) {
    this.selectedOption.set(option);
  }

  useDomestic() {
    this.shippingOptions.set(['Ground', 'Air']);
  }

  useInternational() {
    this.shippingOptions.set(['Air', 'Sea', 'Express']);
  }

  readonly lines = computed<CodeLine[]>(() => [
    { line: "shippingOptions = signal(['Ground', 'Air', 'Sea']);", active: false },
    { line: '', active: false },
    { line: 'selectedOption = linkedSignal(', active: true },
    { line: '  () => this.shippingOptions()[0]', active: true },
    { line: ');', active: true },
    { line: '', active: false },
    { line: '// Sigue siendo editable como un signal:', active: false },
    { line: "selectedOption.set('Air');", active: false },
  ]);
}
