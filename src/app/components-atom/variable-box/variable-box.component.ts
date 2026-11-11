import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  effect,
  input,
  output,
  untracked,
  viewChild,
} from '@angular/core';
import { sinMovimiento } from '../../libs/muelle';

@Component({
  selector: 'app-variable-box',
  imports: [],
  templateUrl: './variable-box.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  styleUrl: './variable-box.component.css',
})
export class VariableBoxComponent {
  readonly variableName = input('');
  readonly variableValue = input('');

  readonly clickEvent = output<void>();

  private readonly valor = viewChild.required<ElementRef<HTMLElement>>('valor');

  constructor() {
    // El valor salta cuando cambia: es la caja que avisa. Al montar no, que nada cambió todavía.
    let primero = true;
    effect(() => {
      this.variableValue();
      if (primero) {
        primero = false;
        return;
      }
      untracked(() => {
        if (sinMovimiento()) return;
        this.valor().nativeElement.animate(
          [
            { transform: 'translateY(6px) scale(0.7)', opacity: 0.3 },
            { transform: 'none', opacity: 1 },
          ],
          { duration: 320, easing: 'cubic-bezier(0.34, 1.8, 0.64, 1)' },
        );
      });
    });
  }

  onClick() {
    this.clickEvent.emit();
  }
}
