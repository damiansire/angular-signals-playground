import { Component, ChangeDetectionStrategy, signal, computed } from '@angular/core';
import { CD_NODES, CD_EDGES, recheckedByZone } from '../../../../libs/cd-tree';

@Component({
  selector: 'app-old-change-detection',
  templateUrl: './old-change-detection.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  styleUrl: './old-change-detection.component.css',
})
export class OldChangeDetectionComponent {
  protected readonly nodes = CD_NODES;
  protected readonly total = CD_NODES.length;
  protected readonly patchedApis = ['setTimeout', 'addEventListener', 'fetch', 'Promise'];

  protected readonly swept = signal(false);
  protected readonly lastTrigger = signal<string | null>(null);
  protected readonly rechecked = computed(() => (this.swept() ? recheckedByZone() : 0));

  /** Aristas ya resueltas a coordenadas para el `<path>`. */
  protected readonly edgePaths = CD_EDGES.map((edge) => {
    const from = CD_NODES.find((n) => n.id === edge.from)!;
    const to = CD_NODES.find((n) => n.id === edge.to)!;
    return `M${from.x},${from.y} L${to.x},${to.y}`;
  });

  protected trigger(api: string): void {
    this.lastTrigger.set(api);
    this.swept.set(true);
  }

  protected reset(): void {
    this.swept.set(false);
    this.lastTrigger.set(null);
  }
}
