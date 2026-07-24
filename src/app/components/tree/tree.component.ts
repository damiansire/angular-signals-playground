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
  /** Espeja el árbol horizontalmente (crece hacia el lado opuesto). Se usa cuando el código está a
   *  la IZQUIERDA del árbol (html-to-tree con el código al centro): así el árbol crece HACIA el código
   *  y los conectores quedan cortos, en vez de cruzar la escena. Otros demos no lo activan. */
  readonly mirror = input(false);
  readonly nodes = computed(() => {
    const hiddenNodes = this.nodesToShow();
    const visible = hiddenNodes
      ? this.nodesData().filter((node) => hiddenNodes.includes(node.id))
      : this.nodesData();
    if (!this.mirror()) return visible;
    // Espejo horizontal alrededor del centro del árbol COMPLETO (no del subconjunto visible), para
    // que la posición de cada nodo no salte según cuántos estén revelados.
    const xs = this.nodesData().map((n) => n.x);
    const axis = Math.min(...xs) + Math.max(...xs);
    return visible.map((n) => ({ ...n, x: axis - n.x }));
  });
  readonly links = computed(() => generateLinks(this.htmlCode()));
  /** Todavía no se reveló ningún nodo. El área del árbol es el ESCENARIO donde va a crecer, pero
   *  vacía no se lee como zona interactiva y el primerizo pasa de largo sin tocar nada: el hint la
   *  nombra hasta que aparece el primer nodo. */
  readonly isEmpty = computed(() => this.nodes().length === 0);

  private readonly nodeTree = viewChild(NodeTreeComponent);

  /** Posición en pantalla (viewport) del borde derecho del nodo `id`, o `null` si no está
   * pintado. */
  getScreenEdgePosition(
    id: string,
    side: 'left' | 'right' = 'right',
  ): { x: number; y: number } | null {
    return this.nodeTree()?.getScreenEdgePosition(id, side) ?? null;
  }
}
