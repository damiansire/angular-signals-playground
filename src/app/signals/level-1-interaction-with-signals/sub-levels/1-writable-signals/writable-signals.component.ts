import {
  Component,
  ElementRef,
  ViewChild,
  computed,
  signal,
  ChangeDetectionStrategy
} from '@angular/core';
import { CodeLine } from '../../../../components-atom/component-atom.interface';
import { ColumnAndCodeLayoutComponent } from '../../../../layouts/column-and-code-layout/column-and-code-layout.component';

@Component({
    selector: 'app-writable-signals',
    templateUrl: './writable-signals.component.html',
    styleUrl: './writable-signals.component.css',
    changeDetection: ChangeDetectionStrategy.Eager,
    imports: [ColumnAndCodeLayoutComponent]
})
export class WritableSignalsComponent {
  count = signal(0);
  @ViewChild('signalSetInput') myInput!: ElementRef<HTMLInputElement>;
  ngOnInit() {
    console.log('The count is: ' + this.count());
  }
  update() {
    this.count.update((value) => value + 1);
    console.log(this.count());
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
