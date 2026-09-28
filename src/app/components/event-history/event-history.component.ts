import { Component, input, computed, ChangeDetectionStrategy } from '@angular/core';
import { HistoryElement } from '../component.interface';

@Component({
  selector: 'app-event-history',
  imports: [],
  templateUrl: './event-history.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  styleUrl: './event-history.component.css',
})
export class EventHistoryComponent {
  readonly title = input('text');
  readonly stateName = input('Count');
  readonly history = input<HistoryElement[]>([]);

  // history() es la referencia del array que vive en el signal del padre. Array.prototype.reverse
  // muta in-place y devuelve this: llamarlo desde el template (como se hacia antes) reordenaba el
  // array del padre en cada change detection, no solo la vista. Derivamos una copia invertida.
  readonly reversedHistory = computed(() => [...this.history()].reverse());

  beforeNumber(value: string | number): number {
    return Number(value) - 1;
  }
}
