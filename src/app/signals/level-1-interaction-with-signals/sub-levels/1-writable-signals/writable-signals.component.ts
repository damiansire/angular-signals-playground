import {
  Component,
  ElementRef,
  viewChild,
  computed,
  signal,
  ChangeDetectionStrategy,
} from '@angular/core';
import { CodeLine } from '../../../../components-atom/component-atom.interface';
import { ColumnAndCodeLayoutComponent } from '../../../../layouts/column-and-code-layout/column-and-code-layout.component';
import { ManipulableSystemComponent } from '../../../../components-atom/manipulable-system/manipulable-system.component';
import { SET_SIGNAL_SYSTEM } from '../../signals-systems';

@Component({
  selector: 'app-writable-signals',
  templateUrl: './writable-signals.component.html',
  styleUrl: './writable-signals.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ManipulableSystemComponent, ColumnAndCodeLayoutComponent],
})
export class WritableSignalsComponent {
  readonly closingSystem = SET_SIGNAL_SYSTEM;
  count = signal(0);
  // viewChild() como signal: se resuelve tras inicializar la vista y es el estándar del repo
  // (en vez del decorador @ViewChild + ElementRef).
  readonly signalSetInput = viewChild.required<ElementRef<HTMLInputElement>>('signalSetInput');
  /** Se escribió algo que no es un número. Antes el valor inválido se descartaba en silencio. */
  readonly rejected = signal(false);

  lines = computed<CodeLine[]>(() => [
    { line: 'count = signal(0);', active: true },
    { line: 'setValue() {', active: false },
    { line: '    this.count.set(inputValue);', active: true },
    { line: '}', active: false },
  ]);
  setValue() {
    const raw = this.signalSetInput().nativeElement.value.trim();
    const inputValue = Number(raw);
    // `Number` en vez de `parseInt`: parseInt("12abc") daba 12 y el demo aceptaba basura a medias.
    if (raw === '' || !Number.isFinite(inputValue)) {
      this.rejected.set(true);
      return;
    }
    this.rejected.set(false);
    this.count.set(inputValue);
  }

  clearRejected() {
    if (this.rejected()) this.rejected.set(false);
  }
}
