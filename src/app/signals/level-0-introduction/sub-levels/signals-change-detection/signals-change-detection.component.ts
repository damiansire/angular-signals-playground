import { Component, ChangeDetectionStrategy, computed, signal } from '@angular/core';
import {
  CD_NODES,
  CD_EDGES,
  SIGNAL_DEPENDENTS,
  recheckedBySignals,
  recheckedByZone,
} from '../../../../libs/cd-tree';
import { ManipulableSystemComponent } from '../../../../components-atom/manipulable-system/manipulable-system.component';
import type { Health, SystemState } from '../../../../libs/manipulable-challenge';
import { PaginaDelManualComponent } from '../../manual/pagina-del-manual.component';
import { EscenaSignalComponent, type Aviso } from '../../manual/escena-signal.component';
import { SIGNAL_NOTIFY_SYSTEM } from '../../introduction-systems';

/**
 * Cada nodo es una pastilla que crece con su rótulo: con un círculo fijo de 30px, 'section' y
 * 'article' (unos 50px a 12px monoespaciada) se salían del nodo. El ancho por carácter toma la
 * monoespaciada más ancha de la pila (Menlo, 7.2px) con margen, así ninguna fuente lo desborda.
 */
const NODE_HEIGHT = 30;
const CHAR_WIDTH = 7.4;
const LABEL_PADDING = 7;

function pillWidth(label: string): number {
  return Math.max(NODE_HEIGHT, label.length * CHAR_WIDTH + 2 * LABEL_PADDING);
}

@Component({
  selector: 'app-signals-change-detection',
  templateUrl: './signals-change-detection.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ManipulableSystemComponent, PaginaDelManualComponent, EscenaSignalComponent],
  styleUrl: './signals-change-detection.component.css',
})
export class SignalsChangeDetectionComponent {
  readonly closingSystem = SIGNAL_NOTIFY_SYSTEM;
  protected readonly nodeHeight = NODE_HEIGHT;
  protected readonly nodes = CD_NODES.map((node) => {
    const width = pillWidth(node.label);
    return { ...node, width, left: node.x - width / 2, top: node.y - NODE_HEIGHT / 2 };
  });
  private readonly dependents = new Set(SIGNAL_DEPENDENTS);
  protected readonly recheckedSignals = recheckedBySignals();
  protected readonly recheckedZone = recheckedByZone();

  protected readonly changed = signal(false);

  protected readonly edgePaths = CD_EDGES.map((edge) => {
    const from = CD_NODES.find((n) => n.id === edge.from)!;
    const to = CD_NODES.find((n) => n.id === edge.to)!;
    return `M${from.x},${from.y} L${to.x},${to.y}`;
  });

  /** El desafío quedó sano: la lámina festeja. */
  protected readonly sano = signal(false);
  /** El último cambio de valor, para la lámina: el de la demo o el del desafío. */
  protected readonly aviso = signal<Aviso | null>(null);

  private readonly cambioUnaVez = signal(false);
  /** Hasta el primer cambio: reiniciar no vuelve a traer la mano. */
  protected readonly guia = computed(() => (this.cambioUnaVez() ? null : '.scd-change'));

  protected changeSignal(): void {
    this.cambioUnaVez.set(true);
    this.changed.set(true);
    this.avisar(true);
  }

  /**
   * En el desafío, cada vez que se cambia el valor la lámina lo cuenta: con `signal` se enteran los
   * dos que leen, con un `let` alguien barre el árbol entero. Girar la perilla no cambia nada.
   */
  protected alCorrerElDesafio({ estado, salud }: { estado: SystemState; salud: Health }): void {
    this.sano.set(salud === 'healthy');
    if (estado.actions > 0) this.avisar(estado.values['revisados'] === 2);
  }

  private avisar(esSignal: boolean): void {
    this.aviso.update((antes) => ({ n: (antes?.n ?? 0) + 1, signal: esSignal }));
  }

  protected reset(): void {
    this.changed.set(false);
  }

  /** Un nodo se re-chequea SOLO si lee el signal que cambió. */
  protected isDependent(id: string): boolean {
    return this.dependents.has(id);
  }
}
