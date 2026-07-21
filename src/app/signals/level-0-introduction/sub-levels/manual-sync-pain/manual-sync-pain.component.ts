import { Component, ChangeDetectionStrategy, signal, computed } from '@angular/core';
import {
  SPOTS,
  SpotId,
  deriveOutputs,
  renderedUnderHandler,
  staleSpots,
} from './manual-sync-pain.data';

@Component({
  selector: 'app-manual-sync-pain',
  templateUrl: './manual-sync-pain.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  styleUrl: './manual-sync-pain.component.css',
})
export class ManualSyncPainComponent {
  protected readonly spots = SPOTS;
  protected readonly count = signal(0);
  protected readonly handlerComplete = signal(false);

  // El handler como texto (las llaves van dentro de interpolación, así no chocan con el
  // control-flow del template). `added` son las dos líneas que el handler incompleto olvida.
  protected readonly handlerBase = `function increment() {\n  count++\n  querySelector('#count').textContent = count`;
  protected readonly handlerAdded = `\n  querySelector('#mult2').textContent = count % 2 ? 'No' : 'Sí'\n  querySelector('#mult3').textContent = count % 3 ? 'No' : 'Sí'`;
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
