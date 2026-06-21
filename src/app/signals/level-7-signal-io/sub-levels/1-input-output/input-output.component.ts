import { Component, ChangeDetectionStrategy, computed, signal } from '@angular/core';
import { CodeLine } from '../../../../components-atom/component-atom.interface';
import { ColumnAndCodeLayoutComponent } from '../../../../layouts/column-and-code-layout/column-and-code-layout.component';
import { CounterInputComponent } from './counter-input/counter-input.component';

@Component({
  selector: 'app-input-output',
  templateUrl: './input-output.component.html',
  styleUrl: './input-output.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ColumnAndCodeLayoutComponent, CounterInputComponent],
})
export class InputOutputComponent {
  readonly step = signal(1);
  readonly lastEmitted = signal<number | null>(null);

  changeStep() {
    this.step.update((value) => (value >= 5 ? 1 : value + 2));
  }

  onCountChange(value: number) {
    this.lastEmitted.set(value);
  }

  readonly lines = computed<CodeLine[]>(() => [
    { line: '// En el hijo:', active: false },
    { line: 'label = input("Contador");', active: false },
    { line: 'step = input(1);', active: true },
    { line: 'countChange = output<number>();', active: true },
    { line: '', active: false },
    { line: '// En el padre (template):', active: false },
    { line: '<app-counter-input', active: false },
    { line: '  [step]="step()"', active: true },
    { line: '  (countChange)="onCountChange($event)" />', active: true },
  ]);
}
