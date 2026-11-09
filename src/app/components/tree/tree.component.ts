import { Component, computed, input, viewChild, ChangeDetectionStrategy } from '@angular/core';
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
  // Estado derivado del input: `computed`, no `effect`+`set`. El parseo del HTML es
  // una función pura, así que nodos y aristas son una proyección directa de `htmlCode()`.
  readonly nodesData = computed(() => generateNodes(this.htmlCode()));
  readonly nodes = computed(() => {
    const shown = this.nodesToShow();
    return shown ? this.nodesData().filter((node) => shown.includes(node.id)) : this.nodesData();
  });
  readonly links = computed(() => generateLinks(this.htmlCode()));
  /** Todavía no se reveló ningún nodo. El área del árbol es el ESCENARIO donde va a crecer, pero
   *  vacía no se lee como zona interactiva y el primerizo pasa de largo sin tocar nada: el hint la
   *  nombra hasta que aparece el primer nodo. */
  readonly isEmpty = computed(() => this.nodes().length === 0);

  private readonly nodeTree = viewChild(NodeTreeComponent);

  /** Posición en pantalla (viewport) del borde del nodo `id`, o `null` si no se muestra. */
  getScreenEdgePosition(
    id: string,
    side: 'left' | 'right' = 'right',
  ): { x: number; y: number } | null {
    return this.nodeTree()?.getScreenEdgePosition(id, side) ?? null;
  }
}
