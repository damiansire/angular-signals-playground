import {
  Component,
  ChangeDetectionStrategy,
  ElementRef,
  afterRenderEffect,
  computed,
  signal,
  viewChild,
} from '@angular/core';
import { form, FormField } from '@angular/forms/signals';
import { CodeLine } from '../../../../components-atom/component-atom.interface';
import { ColumnAndCodeLayoutComponent } from '../../../../layouts/column-and-code-layout/column-and-code-layout.component';
import { ManipulableSystemComponent } from '../../../../components-atom/manipulable-system/manipulable-system.component';
import { AFTER_RENDER_SYSTEM } from '../../after-render-systems';

@Component({
  selector: 'app-after-render-effect',
  templateUrl: './after-render-effect.component.html',
  styleUrl: './after-render-effect.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ManipulableSystemComponent, ColumnAndCodeLayoutComponent, FormField],
})
export class AfterRenderEffectComponent {
  readonly closingSystem = AFTER_RENDER_SYSTEM;
  readonly text = signal('Escribí algo y miro su ancho');
  readonly textField = form(this.text);
  private readonly measured = viewChild<ElementRef<HTMLElement>>('measured');

  // Ancho REAL del texto ya renderizado: solo el DOM lo sabe, y un effect lo leería un render tarde.
  readonly widthPx = signal(0);

  constructor() {
    afterRenderEffect(() => {
      this.text(); // se re-mide cuando cambia el texto
      const element = this.measured()?.nativeElement;
      if (element) {
        this.widthPx.set(Math.round(element.getBoundingClientRect().width));
      }
    });
  }

  readonly lines = computed<CodeLine[]>(() => [
    { line: 'text = signal("...");', active: false },
    { line: 'measured = viewChild("measured");', active: false },
    { line: '', active: false },
    { line: 'afterRenderEffect(() => {', active: true },
    { line: '  // corre DESPUÉS del render', active: true },
    { line: '  const el = this.measured().nativeElement;', active: true },
    { line: '  this.widthPx.set(el.getBoundingClientRect().width);', active: true },
    { line: '});', active: true },
  ]);
}
