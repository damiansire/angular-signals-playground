import { Component, computed, signal, ChangeDetectionStrategy } from '@angular/core';
import { NodeTree, Link } from '../../../../components-draw/components-draw.inferface';
import { NodeTreeComponent } from '../../../../components-draw/node-tree/node-tree.component';
import { ConceptCardComponent } from '../../../../components-atom/concept-card/concept-card.component';

@Component({
  selector: 'app-old-change-detection',
  imports: [NodeTreeComponent, ConceptCardComponent],
  templateUrl: './old-change-detection.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  styleUrl: './old-change-detection.component.css',
})
export class OldChangeDetectionComponent {
  step = signal(0);

  incrementStep() {
    if (this.step() < 5) {
      this.step.update((currentStep) => currentStep + 2);
    }
  }

  decrementStep() {
    if (this.step() > 0) {
      this.step.update((currentStep) => currentStep - 2);
    }
  }

  baseElement = [
    {
      name: 'main',
      x: 550,
      y: 100,
      color: this.step() > 0 ? '#90EE90' : '',
    },
    {
      name: 'article',
      x: 700,
      y: 300,
      color: this.step() > 1 ? '#90EE90' : '',
    },
    {
      name: 'section',
      x: 400,
      y: 300,
      color: this.step() > 1 ? '#90EE90' : '',
    },
    {
      name: 'h2',
      x: 300,
      y: 500,
      color: this.step() > 2 ? '#90EE90' : '',
    },
    {
      name: 'p',
      x: 500,
      y: 500,
      color: this.step() > 2 ? '#90EE90' : '',
    },
    {
      name: 'h3',
      x: 600,
      y: 500,
      color: this.step() > 2 ? '#90EE90' : '',
    },
    {
      name: 'p2',
      x: 800,
      y: 500,
      color: this.step() > 2 ? '#90EE90' : '',
    },
  ] as NodeTree[];

  // Un nodo esta REVISADO cuando el barrido ya llego a su profundidad (y/100). El verde claro
  // original dejaba la etiqueta blanca casi ilegible y el pendiente caia al gris default de
  // echarts (lavado sobre el crema): verde mas hondo para que el label blanco contraste, y
  // pendiente en el tono ink del nivel (visible y en clave con el concepto).
  private static readonly SWEPT = '#2fa06d';
  private static readonly PENDING = '#9a9081';
  data = computed<NodeTree[]>(() =>
    this.baseElement.map((node) => ({
      ...node,
      color:
        this.step() >= node.y / 100
          ? OldChangeDetectionComponent.SWEPT
          : OldChangeDetectionComponent.PENDING,
    })),
  );

  links = signal<Link[]>([
    {
      source: 'main',
      target: 'article',
    },
    {
      source: 'main',
      target: 'section',
    },
    {
      source: 'section',
      target: 'h2',
    },
    {
      source: 'section',
      target: 'p',
    },
    {
      source: 'article',
      target: 'h3',
    },
    {
      source: 'article',
      target: 'p2',
    },
  ]);
}
