import {
  Component,
  ChangeDetectionStrategy,
  computed,
  linkedSignal,
  signal,
} from '@angular/core';
import { CodeLine } from '../../../../components-atom/component-atom.interface';
import { ColumnAndCodeLayoutComponent } from '../../../../layouts/column-and-code-layout/column-and-code-layout.component';

@Component({
  selector: 'app-linked-signal-with-source',
  templateUrl: './linked-signal-with-source.component.html',
  styleUrl: './linked-signal-with-source.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ColumnAndCodeLayoutComponent],
})
export class LinkedSignalWithSourceComponent {
  readonly shippingOptions = signal<string[]>(['Ground', 'Air', 'Sea']);

  // source + computation: si la selección previa sigue disponible, se preserva;
  // si no, cae a la primera opción.
  readonly selectedOption = linkedSignal<string[], string>({
    source: this.shippingOptions,
    computation: (options, previous) =>
      previous && options.includes(previous.value) ? previous.value : options[0],
  });

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
    { line: 'selectedOption = linkedSignal({', active: true },
    { line: '  source: this.shippingOptions,', active: true },
    { line: '  computation: (options, previous) =>', active: true },
    { line: '    previous && options.includes(previous.value)', active: true },
    { line: '      ? previous.value // se preserva', active: true },
    { line: '      : options[0],   // o se reinicia', active: true },
    { line: '});', active: true },
  ]);
}
