import { Component, ChangeDetectionStrategy } from '@angular/core';

@Component({
    selector: 'app-count-increment',
    imports: [],
    templateUrl: './count-increment.component.html',
    changeDetection: ChangeDetectionStrategy.Eager,
    styleUrl: './count-increment.component.css'
})
export class CountIncrementComponent {
  count = 0;
  increment() {
    this.count++;
  }
}
