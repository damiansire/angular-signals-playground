import {
  Component,
  ChangeDetectionStrategy,
  computed,
  signal,
} from '@angular/core';
import { CodeLine } from '../../../../components-atom/component-atom.interface';
import { ColumnAndCodeLayoutComponent } from '../../../../layouts/column-and-code-layout/column-and-code-layout.component';
import { RatingComponent } from './rating/rating.component';

@Component({
  selector: 'app-model-two-way',
  templateUrl: './model-two-way.component.html',
  styleUrl: './model-two-way.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ColumnAndCodeLayoutComponent, RatingComponent],
})
export class ModelTwoWayComponent {
  // El padre tiene un signal y lo enlaza two-way con [(value)].
  readonly rating = signal(3);

  reset() {
    this.rating.set(0);
  }

  readonly lines = computed<CodeLine[]>(() => [
    { line: '// En el hijo:', active: false },
    { line: 'value = model(0);', active: true },
    { line: '', active: false },
    { line: '// En el padre:', active: false },
    { line: 'rating = signal(3);', active: false },
    { line: '<app-rating [(value)]="rating" />', active: true },
    { line: '', active: false },
    { line: '// Cambia el hijo -> cambia el padre, y viceversa.', active: false },
  ]);
}
