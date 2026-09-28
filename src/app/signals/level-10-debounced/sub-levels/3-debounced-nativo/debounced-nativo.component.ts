import {
  ChangeDetectionStrategy,
  Component,
  computed,
  debounced,
  linkedSignal,
  signal,
} from '@angular/core';
import { CodeLine } from '../../../../components-atom/component-atom.interface';
import { ColumnAndCodeLayoutComponent } from '../../../../layouts/column-and-code-layout/column-and-code-layout.component';
import { ManipulableSystemComponent } from '../../../../components-atom/manipulable-system/manipulable-system.component';
import { DEBOUNCED_NATIVE_SYSTEM } from '../../debounce-systems';

/**
 * Cuántas búsquedas dispararía un `resource` cuyos params leen `source`: una por cada valor
 * distinto que llega a ver. Es un linkedSignal y no un effect que escribe porque es estado con
 * memoria derivado de otro signal; y cuenta lo que se LEE, igual que un resource, así que dos
 * cambios que nadie llegó a mirar valen por uno.
 */
function searchesWhenReading<T>(source: () => T) {
  return linkedSignal<T, number>({
    source,
    computation: (_, previous) => (previous ? previous.value + 1 : 0),
  });
}

@Component({
  selector: 'app-debounced-nativo',
  templateUrl: './debounced-nativo.component.html',
  styleUrl: './debounced-nativo.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ManipulableSystemComponent, ColumnAndCodeLayoutComponent],
})
export class DebouncedNativoComponent {
  readonly closingSystem = DEBOUNCED_NATIVE_SYSTEM;
  readonly waitMs = 400;
  readonly query = signal('');

  // Es un Resource, no un signal: mientras espera queda en 'loading' y `.value()` sostiene el
  // último valor estable en vez de caer a undefined.
  readonly debouncedQuery = debounced(this.query, this.waitMs);

  readonly rawSearches = searchesWhenReading(this.query);
  readonly debouncedSearches = searchesWhenReading(() => this.debouncedQuery.value());

  setQuery(value: string) {
    this.query.set(value);
  }

  readonly lines = computed<CodeLine[]>(() => [
    { line: '// @experimental 22.0', active: false },
    { line: 'import { debounced } from "@angular/core";', active: true },
    { line: '', active: false },
    { line: 'query = signal("");', active: false },
    { line: 'debouncedQuery = debounced(this.query, 400);', active: true },
    { line: '', active: false },
    { line: 'debouncedQuery.value();  // el último estable', active: false },
    { line: 'debouncedQuery.status(); // "loading" al esperar', active: false },
  ]);
}
