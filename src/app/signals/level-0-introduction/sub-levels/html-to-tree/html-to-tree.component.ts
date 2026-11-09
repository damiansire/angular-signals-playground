import {
  Component,
  computed,
  DestroyRef,
  ElementRef,
  effect,
  inject,
  signal,
  viewChild,
  ChangeDetectionStrategy,
} from '@angular/core';
import { CodeComponent } from '../../../../components-atom/code/code.component';
import { CodeClick } from '../../../../components-atom/code/code.interface';
import { TreeComponent } from '../../../../components/tree/tree.component';
import { getLevelColor } from '../../../../components-draw/node-level-color';
import { ManipulableSystemComponent } from '../../../../components-atom/manipulable-system/manipulable-system.component';
import { HTML_TREE_SYSTEM } from '../../introduction-systems';
import { PaginaDelManualComponent } from '../../manual/pagina-del-manual.component';
import { EscenaArbolComponent } from '../../manual/escena-arbol.component';
import { posicionesEnElDocumento } from '../../manual/escenas.logica';
import { siguienteSinTocar } from '../../manual/guia.logica';

interface ConnectorLine {
  id: string;
  path: string;
  color: string;
}

@Component({
  selector: 'app-html-to-tree',
  imports: [
    ManipulableSystemComponent,
    CodeComponent,
    TreeComponent,
    PaginaDelManualComponent,
    EscenaArbolComponent,
  ],
  templateUrl: './html-to-tree.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  styleUrl: './html-to-tree.component.css',
})
export class HtmlToTreeComponent {
  readonly closingSystem = HTML_TREE_SYSTEM;
  private readonly hostElement: HTMLElement = inject(ElementRef).nativeElement;
  private readonly treeRef = viewChild(TreeComponent);
  private readonly overlay = viewChild<ElementRef<SVGSVGElement>>('overlay');
  readonly htmlCode = ` <main> 
     <section> 
       <h2>  Introduction  </h2> 
       <p>  This is a simple example 
             of a DOM tree  </p> 
     </section> 
     <article> 
       <h3>  Article Title  </h3> 
       <p> Some interesting content </p> 
     </article> 
 </main> `;
  readonly nodesToShow = signal<string[]>([]);
  readonly connectors = signal<ConnectorLine[]>([]);
  /** Los nodos revelados en orden de documento: la lámina arma con ellos la pantalla de la nave. */
  protected readonly reveladas = computed(() =>
    posicionesEnElDocumento(
      (this.treeRef()?.nodesData() ?? []).map((node) => node.id),
      this.nodesToShow(),
    ),
  );
  protected readonly sano = signal(false);
  /** La mano señala el primer tag sin tocar, en el orden en que el parser lee el HTML. */
  protected readonly guia = computed(() => {
    const orden = (this.treeRef()?.nodesData() ?? []).map((node) => node.id);
    const siguiente = siguienteSinTocar(orden, this.nodesToShow());
    return siguiente === null ? null : `[data-el-id="${CSS.escape(siguiente)}"]`;
  });

  constructor() {
    // El conector se calcula una vez por toque: el árbol ya sabe dónde va a quedar cada nodo, así
    // que no hace falta perseguirlo cuadro a cuadro mientras entra. Solo se recalcula si la mesa
    // cambia de tamaño.
    effect(() => {
      this.nodesToShow();
      this.followTick();
    });
    const observer = new ResizeObserver(() => this.followTick());
    observer.observe(this.hostElement);
    inject(DestroyRef).onDestroy(() => observer.disconnect());
  }

  codeClickHandler(event: CodeClick) {
    if (event.action === 'Select') {
      this.addNode(event.id);
    } else if (event.action === 'Deselect') {
      this.removeNode(event.id);
    }
  }
  addNode(id: string) {
    this.nodesToShow.update((currentNodes) => [...currentNodes, id]);
  }
  removeNode(id: string) {
    this.nodesToShow.update((currentNodes) => currentNodes.filter((node) => node !== id));
  }

  protected followTick() {
    const svg = this.overlay()?.nativeElement;
    const tree = this.treeRef();
    if (!svg || !tree) {
      return;
    }
    const hostRect = svg.getBoundingClientRect();
    const nodesByid = new Map(tree.nodes().map((node) => [node.id, node]));
    const lines: ConnectorLine[] = [];

    this.nodesToShow().forEach((id) => {
      const treePos = tree.getScreenEdgePosition(id, 'left');
      const codeEl = this.hostElement.querySelector<HTMLElement>(
        `[data-el-id="${CSS.escape(id)}"]`,
      );
      const node = nodesByid.get(id);
      if (!treePos || !codeEl || !node) {
        return;
      }
      // Sale del final del elemento en el renglón de su apertura (`</h2>` en `<h2> Intro </h2>`),
      // no del tag: si no, la línea cruzaba el texto que el mismo toque acaba de marcar.
      const delElemento = codeEl.parentElement?.querySelectorAll<HTMLElement>(
        `[data-el-dueno="${CSS.escape(id)}"]`,
      );
      const finEl = delElemento?.[delElemento.length - 1] ?? codeEl;
      const codeRect = codeEl.getBoundingClientRect();
      const x1 = treePos.x - hostRect.left;
      const y1 = treePos.y - hostRect.top;
      const x2 = finEl.getBoundingClientRect().right - hostRect.left;
      const y2 = codeRect.top + codeRect.height / 2 - hostRect.top;
      const midX = (x1 + x2) / 2;

      lines.push({
        id,
        path: `M ${x1} ${y1} C ${midX} ${y1}, ${midX} ${y2}, ${x2} ${y2}`,
        color: node.color || getLevelColor(node.level),
      });
    });

    this.connectors.set(lines);
  }
}
