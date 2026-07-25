import { Component, input, output, ChangeDetectionStrategy } from '@angular/core';

@Component({
  selector: 'app-variable-box-draw',
  imports: [],
  templateUrl: './variable-box-draw.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  styleUrl: './variable-box-draw.component.css',
})
export class VariableBoxDrawComponent {
  readonly variableName = input('');
  /** La caja está elegida. Sin esto todas se ven igual y no se sabe qué tipo está activo. */
  readonly selected = input(false);
  /**
   * La caja participa de una elección (grupo de opciones donde una queda activa). En los usos donde
   * el click transforma la caja en otra cosa (ver "¿qué es un signal?"), no hay estado presionado
   * que anunciar y `aria-pressed` sobraría.
   */
  readonly selectable = input(false);
  readonly clicked = output<{ name: string; value: string }>();

  _onClick() {
    this.clicked.emit({ name: this.variableName(), value: '' });
  }
}
