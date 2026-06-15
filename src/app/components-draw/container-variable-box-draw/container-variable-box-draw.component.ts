import { Component, Input, ChangeDetectionStrategy } from '@angular/core';
import { VariableBoxDrawComponent } from '../variable-box-draw/variable-box-draw.component';

@Component({
    selector: 'app-container-variable-box-draw',
    imports: [VariableBoxDrawComponent],
    templateUrl: './container-variable-box-draw.component.html',
    changeDetection: ChangeDetectionStrategy.Eager,
    styleUrl: './container-variable-box-draw.component.css'
})
export class ContainerVariableBoxDrawComponent {
  @Input() variableName: string = '';
}
