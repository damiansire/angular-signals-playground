import { Component, computed, signal, ChangeDetectionStrategy } from '@angular/core';
import { CodeLine } from '../../../../components-atom/component-atom.interface';
import { ColumnAndCodeLayoutComponent } from '../../../../layouts/column-and-code-layout/column-and-code-layout.component';
import { ManipulableSystemComponent } from '../../../../components-atom/manipulable-system/manipulable-system.component';
import { UPDATE_SIGNAL_SYSTEM } from '../../signals-systems';

@Component({
  selector: 'app-update-signal',
  templateUrl: './update-signal.component.html',
  styleUrl: './update-signal.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ManipulableSystemComponent, ColumnAndCodeLayoutComponent],
})
export class UpdateSignalComponent {
  readonly closingSystem = UPDATE_SIGNAL_SYSTEM;
  count = signal(0);
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
