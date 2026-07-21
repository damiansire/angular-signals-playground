import { Component, ChangeDetectionStrategy, signal } from '@angular/core';
import {
  CD_NODES,
  CD_EDGES,
  SIGNAL_DEPENDENTS,
  recheckedBySignals,
  recheckedByZone,
} from '../../../../libs/cd-tree';

@Component({
  selector: 'app-signals-change-detection',
  templateUrl: './signals-change-detection.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  styleUrl: './signals-change-detection.component.css',
})
export class SignalsChangeDetectionComponent {
  protected readonly nodes = CD_NODES;
  private readonly dependents = new Set(SIGNAL_DEPENDENTS);
  protected readonly recheckedSignals = recheckedBySignals();
  protected readonly recheckedZone = recheckedByZone();

  protected readonly changed = signal(false);

  protected readonly edgePaths = CD_EDGES.map((edge) => {
    const from = CD_NODES.find((n) => n.id === edge.from)!;
    const to = CD_NODES.find((n) => n.id === edge.to)!;
    return `M${from.x},${from.y} L${to.x},${to.y}`;
  });

  protected changeSignal(): void {
    this.changed.set(true);
  }

  protected reset(): void {
    this.changed.set(false);
  }

  /** Un nodo se re-chequea SOLO si lee el signal que cambió. */
  protected isDependent(id: string): boolean {
    return this.dependents.has(id);
  }
}
