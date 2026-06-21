import { Component, input, ChangeDetectionStrategy } from '@angular/core';
import { VariableBoxDrawComponent } from '../variable-box-draw/variable-box-draw.component';

@Component({
  selector: 'app-container-variable-box-draw',
  imports: [VariableBoxDrawComponent],
  templateUrl: './container-variable-box-draw.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  styleUrl: './container-variable-box-draw.component.css',
})
export class ContainerVariableBoxDrawComponent {
  readonly variableName = input('');
}
