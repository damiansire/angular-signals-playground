import {
  Component,
  computed,
  input,
  output,
  viewChild,
  ChangeDetectionStrategy,
} from '@angular/core';
import { NodeTreeComponent } from '../../components-draw/node-tree/node-tree.component';
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
  // Estado derivado del input: `computed`, no `effect`+`set`. El parseo del HTML es
  // una función pura, así que nodos y aristas son una proyección directa de `htmlCode()`.
  readonly nodesData = computed(() => generateNodes(this.htmlCode()));
  readonly nodes = computed(() => {
    const hiddenNodes = this.nodesToShow();
    if (hiddenNodes) {
      return this.nodesData().filter((node) => hiddenNodes.includes(node.id));
    }
    return this.nodesData();
  });
  readonly links = computed(() => generateLinks(this.htmlCode()));

  private readonly nodeTree = viewChild(NodeTreeComponent);

  /** Posición en pantalla (viewport) del borde derecho del nodo `id`, o `null` si no está
   * pintado. */
  getScreenEdgePosition(id: string): { x: number; y: number } | null {
    return this.nodeTree()?.getScreenEdgePosition(id) ?? null;
  }
}
