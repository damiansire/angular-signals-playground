import {
  Component,
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
import { TwoColumnLayoutComponent } from '../../../../layouts/two-column-layout/two-column-layout.component';
import { ConceptCardComponent } from '../../../../components-atom/concept-card/concept-card.component';
import { getLevelColor } from '../../../../components-draw/node-level-color';

interface ConnectorLine {
  id: string;
  path: string;
  color: string;
}

// Cuánto dura la persecución cuadro a cuadro tras un cambio: cubre la animación de
// entrada/salida del nodo en el árbol (ver animationDurationUpdate en NodeTreeComponent).
const FOLLOW_WINDOW_MS = 700;

@Component({
  selector: 'app-html-to-tree',
  imports: [CodeComponent, TreeComponent, TwoColumnLayoutComponent, ConceptCardComponent],
  templateUrl: './html-to-tree.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  styleUrl: './html-to-tree.component.css',
})
export class HtmlToTreeComponent {
  private readonly hostElement: HTMLElement = inject(ElementRef).nativeElement;
  private readonly treeRef = viewChild(TreeComponent);
  private readonly overlay = viewChild<ElementRef<SVGSVGElement>>('overlay');
  htmlCode = ` <main> 
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
  //nodesToShow = signal<string[]>([]);
  //for development only:
  /*  'main-1',
  'article-1',
  'section-1',
  'h2-1',
  'p-1',
  'h3-1',
  'p-2',*/
  nodesToShow = signal<string[]>([]);
  connectors = signal<ConnectorLine[]>([]);

  constructor() {
    // Recálculo inmediato (no espera al próximo frame) más una ventana breve de
    // seguimiento cuadro a cuadro: el árbol anima al agregar/sacar un nodo (echarts),
    // así que la flecha no puede calcularse una sola vez tras el render. La ventana se
    // autolimita (no queda un rAF corriendo para siempre) — el roam del usuario se cubre
    // aparte, vía el evento `viewChanged` del árbol.
    effect((onCleanup) => {
      if (this.nodesToShow().length === 0) {
        this.connectors.set([]);
        return;
      }
      this.followTick();

      const deadline = performance.now() + FOLLOW_WINDOW_MS;
      let rafId = requestAnimationFrame(function loop(this: HtmlToTreeComponent) {
        this.followTick();
        if (performance.now() < deadline) {
          rafId = requestAnimationFrame(loop.bind(this));
        }
      }.bind(this));
      onCleanup(() => cancelAnimationFrame(rafId));
    });
  }

  codeClickHandler(event: CodeClick) {
    if (event.action == 'Select') {
      this.addNode(event.id);
    } else if (event.action == 'Deselect') {
      this.removeNode(event.id);
    }
  }
  addNode(id: string) {
    this.nodesToShow.update((currentNodes) => [...currentNodes, id]);
  }
  removeNode(id: string) {
    this.nodesToShow.update((currentNodes) => currentNodes.filter((node) => node !== id));
  }
  onParsedCodeHandler() {
    // no-op: el árbol se actualiza vía codeClickHandler; este handler queda como punto de extensión
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
      const treePos = tree.getScreenEdgePosition(id);
      const codeEl = this.hostElement.querySelector<HTMLElement>(`[data-el-id="${CSS.escape(id)}"]`);
      const node = nodesByid.get(id);
      if (!treePos || !codeEl || !node) {
        return;
      }
      const codeRect = codeEl.getBoundingClientRect();
      const x1 = treePos.x - hostRect.left;
      const y1 = treePos.y - hostRect.top;
      const x2 = codeRect.left - hostRect.left;
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
