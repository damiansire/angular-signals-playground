import { Component, input, output, ChangeDetectionStrategy } from '@angular/core';

@Component({
    selector: 'app-input',
    imports: [],
    templateUrl: './input.component.html',
    changeDetection: ChangeDetectionStrategy.OnPush,
    styleUrl: './input.component.css'
})
export class InputComponent {
  readonly text = input('');
  readonly placeholder = input('');
  readonly valueChange = output<string>();

  sendData(event: Event) {
    const inputValue = (event.target as HTMLInputElement).value;
    this.valueChange.emit(inputValue);
  }
}
