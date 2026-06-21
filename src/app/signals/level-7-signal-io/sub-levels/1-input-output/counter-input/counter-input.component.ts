import { Component, ChangeDetectionStrategy, input, output, signal } from '@angular/core';

@Component({
  selector: 'app-counter-input',
  templateUrl: './counter-input.component.html',
  styleUrl: './counter-input.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CounterInputComponent {
  // input() basado en signals reemplaza a @Input().
  readonly label = input('Contador');
  readonly step = input(1);

  // output() reemplaza a @Output() + EventEmitter.
  readonly countChange = output<number>();

  readonly count = signal(0);

  increment() {
    this.count.update((value) => value + this.step());
    this.countChange.emit(this.count());
  }
}
