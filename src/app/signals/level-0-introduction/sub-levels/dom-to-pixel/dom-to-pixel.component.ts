import { Component, ChangeDetectionStrategy, signal, computed } from '@angular/core';
import {
  MutationKind,
  RenderStage,
  RenderCost,
  stagesTriggered,
  renderCost,
} from '../../../../libs/render-pipeline';

interface MutationDemo {
  kind: MutationKind;
  label: string;
  code: string;
}

interface Station {
  id: 'DOM' | RenderStage;
  x: number;
}

/** Camino que el "flujo" recorre según el costo: cuánto de la línea salta. */
const FLOW_PATHS: Record<RenderCost, string> = {
  // recta completa: no salta nada.
  caro: 'M60,150 L940,150',
  // hop chico sobre `layout` (style -> paint).
  medio: 'M60,150 L280,150 C 385,55 595,55 700,150 L940,150',
  // arco grande sobre toda la zona cara (DOM -> composite).
  barato: 'M60,150 C 350,20 650,20 940,150',
};

const COST_COLOR: Record<RenderCost, string> = {
  barato: '#15905a',
  medio: '#b5730f',
  caro: '#d92626',
};

@Component({
  selector: 'app-dom-to-pixel',
  templateUrl: './dom-to-pixel.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  styleUrl: './dom-to-pixel.component.css',
})
export class DomToPixelComponent {
  protected readonly stations: readonly Station[] = [
    { id: 'DOM', x: 60 },
    { id: 'style', x: 280 },
    { id: 'layout', x: 490 },
    { id: 'paint', x: 700 },
    { id: 'composite', x: 940 },
  ];
  protected readonly demos: readonly MutationDemo[] = [
    {
      kind: 'transform',
      label: 'Mover con transform',
      code: "el.style.transform = 'translateX(20px)'",
    },
    { kind: 'color', label: 'Cambiar color', code: "el.style.color = 'crimson'" },
    { kind: 'textContent', label: 'Cambiar el texto', code: "el.textContent = '1'" },
    { kind: 'geometry', label: 'Cambiar el ancho', code: "el.style.width = '200px'" },
  ];

  // Arranca en "cambiar el texto": el caso caro, la línea completa como baseline.
  protected readonly selected = signal<MutationDemo>(this.demos[2]);
  protected readonly triggered = computed(
    () => new Set<RenderStage>(stagesTriggered(this.selected().kind)),
  );
  protected readonly cost = computed<RenderCost>(() => renderCost(this.selected().kind));
  protected readonly flowPath = computed(() => FLOW_PATHS[this.cost()]);
  protected readonly pulsePath = computed(() => `path("${this.flowPath()}")`);
  protected readonly costColor = computed(() => COST_COLOR[this.cost()]);

  protected pick(demo: MutationDemo): void {
    this.selected.set(demo);
  }

  protected stageOn(id: Station['id']): boolean {
    return id !== 'DOM' && this.triggered().has(id);
  }
}
