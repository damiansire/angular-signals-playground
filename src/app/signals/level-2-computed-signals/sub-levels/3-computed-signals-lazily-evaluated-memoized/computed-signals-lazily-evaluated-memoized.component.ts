import { Component, ChangeDetectionStrategy, signal } from '@angular/core';
import { ComputedTrackerComponent } from '../../../../components/computed-tracker/computed-tracker.component';
import { ClickInButton } from '../../../../components/component.interface';
import { BasicFormComponent } from '../../../../components/basic-form/basic-form.component';
import { ClickHistoryComponent } from '../../../../components/click-history/click-history.component';
import { ConceptCardComponent } from '../../../../components-atom/concept-card/concept-card.component';

@Component({
  selector: 'app-computed-signals-lazily-evaluated-memoized',
  templateUrl: './computed-signals-lazily-evaluated-memoized.component.html',
  styleUrl: './computed-signals-lazily-evaluated-memoized.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    ComputedTrackerComponent,
    BasicFormComponent,
    ClickHistoryComponent,
    ConceptCardComponent,
  ],
})
export class ComputedSignalsLazilyEvaluatedMemoizedComponent {
  // El estado que alimenta los paneles vive en signals y se actualiza con una NUEVA referencia
  // (no `push` sobre el mismo array): bajo OnPush + zoneless, mutar el array in situ no dispara
  // detección de cambios y los hijos (que reciben la lista por `input()`) nunca se refrescarían.
  // Es justo el patrón que esta lección enseña; el componente lo modela en su propio estado.
  readonly computedTracker = signal<ClickInButton[]>([]);
  readonly clickHistory = signal<ClickInButton[]>([]);

  addComputedSignal(data: ClickInButton) {
    this.computedTracker.update((prev) => [...prev, data]);
  }

  addClickToHistory(event: ClickInButton) {
    this.clickHistory.update((prev) => [...prev, event]);
  }
}
