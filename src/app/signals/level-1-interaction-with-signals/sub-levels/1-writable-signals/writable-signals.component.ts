import {
  Component,
  ElementRef,
  ViewChild,
  computed,
  signal,
  ChangeDetectionStrategy,
} from '@angular/core';
import { CodeLine } from '../../../../components-atom/component-atom.interface';
import { ColumnAndCodeLayoutComponent } from '../../../../layouts/column-and-code-layout/column-and-code-layout.component';

@Component({
  selector: 'app-writable-signals',
  templateUrl: './writable-signals.component.html',
  styleUrl: './writable-signals.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ColumnAndCodeLayoutComponent],
})
export class WritableSignalsComponent {
  count = signal(0);
  @ViewChild('signalSetInput') myInput!: ElementRef<HTMLInputElement>;
  update() {
    this.count.update((value) => value + 1);
  }

  lines = computed<CodeLine[]>(() => [
    { line: 'count = signal(0);', active: true },
    { line: 'setValue() {', active: false },
    { line: '    this.count.set(inputValue);', active: true },
    { line: '}', active: false },
  ]);
  setValue() {
    const inputValue = parseInt(this.myInput.nativeElement.value, 10);
    if (!isNaN(inputValue)) {
      this.count.set(inputValue);
    }
  }
}
