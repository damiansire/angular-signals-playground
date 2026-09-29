import { Component, ChangeDetectionStrategy, signal, computed } from '@angular/core';
import {
  SPOTS,
  SpotId,
  deriveOutputs,
  renderedUnderHandler,
  staleSpots,
} from './manual-sync-pain.data';
import { ManipulableSystemComponent } from '../../../../components-atom/manipulable-system/manipulable-system.component';
import { MANUAL_SYNC_SYSTEM } from '../../introduction-systems';

@Component({
  selector: 'app-manual-sync-pain',
  templateUrl: './manual-sync-pain.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ManipulableSystemComponent],
  styleUrl: './manual-sync-pain.component.css',
})
export class ManualSyncPainComponent {
  readonly closingSystem = MANUAL_SYNC_SYSTEM;
  protected readonly spots = SPOTS;
  protected readonly count = signal(0);
  protected readonly handlerComplete = signal(false);

  // El handler como texto (las llaves van dentro de interpolación, así no chocan con el
  // control-flow del template). `added` son las dos líneas que el handler incompleto olvida.
  // La sangría va con espacios duros (U+00A0): con espacios comunes, al envolver en angosto el
  // renglón se cortaba justo después de ellos y quedaba uno vacío arriba del código.
  protected readonly handlerBase = `function increment() {\n\u00a0\u00a0count++\n\u00a0\u00a0querySelector('#count').textContent = count`;
  protected readonly handlerAdded = `\n\u00a0\u00a0querySelector('#mult2').textContent = count % 2 ? 'No' : 'Sí'\n\u00a0\u00a0querySelector('#mult3').textContent = count % 3 ? 'No' : 'Sí'`;
  protected readonly handlerClose = `\n}`;

  private readonly synced = computed<ReadonlySet<SpotId>>(() =>
    this.handlerComplete()
      ? new Set<SpotId>(['value', 'mult2', 'mult3'])
      : new Set<SpotId>(['value']),
  );

  protected readonly rendered = computed(() => renderedUnderHandler(this.count(), this.synced()));
  protected readonly truth = computed(() => deriveOutputs(this.count()));
  protected readonly stale = computed(() => new Set(staleSpots(this.count(), this.synced())));
  protected readonly syncLines = computed(() => this.synced().size);

  protected increment(): void {
    this.count.update((n) => n + 1);
  }

  protected setComplete(complete: boolean): void {
    this.handlerComplete.set(complete);
  }

  protected isStale(id: SpotId): boolean {
    return this.stale().has(id);
  }
}
