import { Component, ChangeDetectionStrategy, signal, computed } from '@angular/core';
import { ConceptCardComponent } from '../../../../components-atom/concept-card/concept-card.component';
import {
  MutationKind,
  RenderStage,
  RENDER_STAGES,
  stagesTriggered,
  renderCost,
} from '../../../../libs/render-pipeline';

interface MutationDemo {
  kind: MutationKind;
  label: string;
  code: string;
}

@Component({
  selector: 'app-dom-to-pixel',
  imports: [ConceptCardComponent],
  templateUrl: './dom-to-pixel.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  styleUrl: './dom-to-pixel.component.css',
})
export class DomToPixelComponent {
  protected readonly stages: readonly RenderStage[] = RENDER_STAGES;
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

  // Arranca en "cambiar el texto": el caso caro, que dispara la cadena entera.
  protected readonly selected = signal<MutationDemo>(this.demos[2]);
  protected readonly triggered = computed(
    () => new Set<RenderStage>(stagesTriggered(this.selected().kind)),
  );
  protected readonly cost = computed(() => renderCost(this.selected().kind));

  protected pick(demo: MutationDemo): void {
    this.selected.set(demo);
  }
}
