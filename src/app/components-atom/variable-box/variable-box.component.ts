import { Component, input, output, ChangeDetectionStrategy } from '@angular/core';

@Component({
    selector: 'app-variable-box',
    imports: [],
    templateUrl: './variable-box.component.html',
    changeDetection: ChangeDetectionStrategy.OnPush,
    styleUrl: './variable-box.component.css'
})
export class VariableBoxComponent {
  readonly variableName = input('');
  readonly variableValue = input('');

  readonly clickEvent = output<void>();

  onClick() {
    this.clickEvent.emit();
  }
}
