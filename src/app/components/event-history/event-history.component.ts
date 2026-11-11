import { Component, input, computed, ChangeDetectionStrategy } from '@angular/core';
import { HistoryElement } from '../component.interface';

const MAXIMO_A_LA_VISTA = 4;

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
  /**
   * Las últimas corridas: con todas, la lista crecía con cada click y sacaba el desafío de la hoja.
   * Cada una con su número de corrida, que no cambia: el historial solo crece al final, así que la
   * corrida nueva es la única fila nueva y la única que entra con su salto.
   */
  readonly recientes = computed(() => {
    const total = this.history().length;
    return this.reversedHistory()
      .slice(0, MAXIMO_A_LA_VISTA)
      .map((item, i) => ({ item, corrida: total - i }));
  });

  beforeNumber(value: string | number): number {
    return Number(value) - 1;
  }
}
