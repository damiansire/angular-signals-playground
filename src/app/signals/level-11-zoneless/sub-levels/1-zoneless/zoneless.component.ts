import {
  Component,
  ChangeDetectionStrategy,
  computed,
  signal,
} from '@angular/core';
import { CodeLine } from '../../../../components-atom/component-atom.interface';
import { ColumnAndCodeLayoutComponent } from '../../../../layouts/column-and-code-layout/column-and-code-layout.component';

@Component({
  selector: 'app-zoneless',
  templateUrl: './zoneless.component.html',
  styleUrl: './zoneless.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ColumnAndCodeLayoutComponent],
})
export class ZonelessComponent {
  readonly count = signal(0);
  readonly double = computed(() => this.count() * 2);

  increment() {
    this.count.update((value) => value + 1);
  }

  readonly lines = computed<CodeLine[]>(() => [
    { line: 'bootstrapApplication(App, {', active: false },
    { line: '  providers: [', active: false },
    { line: '    provideZonelessChangeDetection(),', active: true },
    { line: '  ],', active: false },
    { line: '});', active: false },
    { line: '', active: false },
    { line: '// sin zone.js en los polyfills', active: false },
  ]);
}
