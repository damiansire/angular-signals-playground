import { Component, ChangeDetectionStrategy, signal, computed } from '@angular/core';
import { CD_NODES, CD_EDGES, recheckedByZone } from '../../../../libs/cd-tree';
import { ManipulableSystemComponent } from '../../../../components-atom/manipulable-system/manipulable-system.component';
import { PaginaDelManualComponent } from '../../manual/pagina-del-manual.component';
import { EscenaZonaComponent, type Llamada } from '../../manual/escena-zona.component';
import { ZONE_PATCH_SYSTEM } from '../../introduction-systems';

@Component({
  selector: 'app-old-change-detection',
  templateUrl: './old-change-detection.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ManipulableSystemComponent, PaginaDelManualComponent, EscenaZonaComponent],
  styleUrl: './old-change-detection.component.css',
})
export class OldChangeDetectionComponent {
  /** El desafío quedó sano: la lámina festeja. */
  protected readonly sano = signal(false);
  readonly closingSystem = ZONE_PATCH_SYSTEM;
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

  /** La última llamada, para la lámina: la de la demo o la del desafío. */
  protected readonly llamada = signal<Llamada | null>(null);

  protected trigger(api: string): void {
    this.lastTrigger.set(api);
    this.swept.set(true);
    this.llamar(api, true);
  }

  /** En el desafío, la API sana es la parcheada: con la otra, Zone.js no se entera. */
  protected alCorrerElDesafio(sano: boolean): void {
    this.sano.set(sano);
    this.llamar(sano ? 'setTimeout' : 'requestIdleCallback', sano);
  }

  private llamar(api: string, parcheada: boolean): void {
    this.llamada.update((antes) => ({ n: (antes?.n ?? 0) + 1, api, parcheada }));
  }

  protected reset(): void {
    this.swept.set(false);
    this.lastTrigger.set(null);
  }
}
