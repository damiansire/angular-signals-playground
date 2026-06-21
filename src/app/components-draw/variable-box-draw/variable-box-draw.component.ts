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
  readonly clicked = output<{ name: string; value: string }>();

  _onClick() {
    this.clicked.emit({ name: this.variableName(), value: '' });
  }
}
