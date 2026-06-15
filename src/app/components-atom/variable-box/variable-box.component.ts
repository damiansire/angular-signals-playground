import { Component, EventEmitter, Input, Output, ChangeDetectionStrategy } from '@angular/core';

@Component({
    selector: 'app-variable-box',
    imports: [],
    templateUrl: './variable-box.component.html',
    changeDetection: ChangeDetectionStrategy.Eager,
    styleUrl: './variable-box.component.css'
})
export class VariableBoxComponent {
  @Input() variableName: string = '';
  @Input() variableValue: string = '';

  @Output() clickEvent = new EventEmitter<void>();

  onClick() {
    this.clickEvent.emit();
  }
}
