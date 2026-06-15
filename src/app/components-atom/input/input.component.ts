import { Component, EventEmitter, Input, Output, ChangeDetectionStrategy } from '@angular/core';

@Component({
    selector: 'app-input',
    imports: [],
    templateUrl: './input.component.html',
    changeDetection: ChangeDetectionStrategy.Eager,
    styleUrl: './input.component.css'
})
export class InputComponent {
  @Input() text: string = '';
  @Input() placeholder: string = '';
  @Output() onChangeEvent = new EventEmitter<string>();

  sendData(event: any) {
    const inputValue = (event.target as HTMLInputElement).value;
    this.onChangeEvent.emit(inputValue);
  }
}
