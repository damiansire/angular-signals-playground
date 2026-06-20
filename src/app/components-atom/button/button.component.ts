import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';

@Component({
    selector: 'app-button',
    imports: [],
    changeDetection: ChangeDetectionStrategy.OnPush,
    templateUrl: './button.component.html',
    styleUrl: './button.component.css'
})
export class ButtonComponent {
  clicked = output<string>();
  text = input<string>('Missing text');

  callClick() {
    this.clicked.emit('emitido');
  }
}
