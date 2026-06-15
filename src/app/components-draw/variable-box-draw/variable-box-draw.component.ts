import { Component, EventEmitter, Input, Output, ChangeDetectionStrategy } from '@angular/core';

@Component({
    selector: 'app-variable-box-draw',
    imports: [],
    templateUrl: './variable-box-draw.component.html',
    changeDetection: ChangeDetectionStrategy.Eager,
    styleUrl: './variable-box-draw.component.css'
})
export class VariableBoxDrawComponent {
  @Input() variableName: string = '';
  @Output() onClick = new EventEmitter<{ name: string; value: string }>();

  _onClick() {
    this.onClick.emit({ name: this.variableName, value: '' });
  }
}
