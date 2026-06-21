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
  selector: 'app-update-signal',
  templateUrl: './update-signal.component.html',
  styleUrl: './update-signal.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ColumnAndCodeLayoutComponent],
})
export class UpdateSignalComponent {
  count = signal(0);
  @ViewChild('signalSetInput') myInput!: ElementRef<HTMLInputElement>;
  update() {
    this.count.update((value) => value + 1);
    // eslint-disable-next-line no-console -- demo didactica: refleja el console.log mostrado en pantalla
    console.log(this.count());
  }

  lines = computed<CodeLine[]>(() => [
    { line: 'count = signal(0);', active: false },
    { line: 'update() {', active: false },
    { line: '  this.count.update((value) => value + 1);', active: true },
    { line: '  console.log(this.count());', active: false },
    { line: '}', active: false },
  ]);
}
