import {
  Component,
  computed,
  effect,
  input,
  output,
  signal,
  viewChild,
  ChangeDetectionStrategy,
} from '@angular/core';
import { NodeTreeComponent } from '../../components-draw/node-tree/node-tree.component';
import { Link, NodeTree } from '../../components-draw/components-draw.inferface';
import { generateLinks, generateNodes } from '../../libs/code-parser';

@Component({
  selector: 'app-tree',
  imports: [NodeTreeComponent],
  templateUrl: './tree.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  styleUrl: './tree.component.css',
})
export class TreeComponent {
  htmlCode = input<string>('');
  nodesToShow = input<string[] | undefined>();
  // Se re-emite cada vez que el chart interno vuelve a pintar (carga/animación/roam),
  // para que quien dibuje conectores externos sepa cuándo recalcular posiciones.
  readonly viewChanged = output<void>();
  nodesData = signal<NodeTree[]>([]);
  nodes = computed(() => {
    const hiddenNodes = this.nodesToShow();
    if (hiddenNodes) {
      return this.nodesData().filter((node) => hiddenNodes.includes(node.id));
    }
    return this.nodesData();
  });
  links = signal<Link[]>([]);

  private readonly nodeTree = viewChild(NodeTreeComponent);

  constructor() {
    effect(() => {
      const links = generateLinks(this.htmlCode());
      this.links.set(links);

      const nodes = generateNodes(this.htmlCode());
      this.nodesData.set(nodes);
    });
  }

  /** Posición en pantalla (viewport) del borde derecho del nodo `id`, o `null` si no está
   * pintado. */
  getScreenEdgePosition(id: string): { x: number; y: number } | null {
    return this.nodeTree()?.getScreenEdgePosition(id) ?? null;
  }
}
