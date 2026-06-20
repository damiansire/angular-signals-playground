import { Component, ChangeDetectionStrategy, model } from '@angular/core';

@Component({
  selector: 'app-rating',
  templateUrl: './rating.component.html',
  styleUrl: './rating.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RatingComponent {
  // model() = input + output que habilita el binding two-way [(value)].
  readonly value = model(0);
  readonly max = 5;
  readonly stars = [1, 2, 3, 4, 5];

  setValue(stars: number) {
    this.value.set(stars);
  }
}
