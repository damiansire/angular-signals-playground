import { Component, computed, signal, ChangeDetectionStrategy } from '@angular/core';
import { CodeLine } from '../../../../components-atom/component-atom.interface';
import { CodeComponent } from '../../../../components-atom/code/code.component';
import { CodeClick } from '../../../../components-atom/code/code.interface';
import { TreeComponent } from '../../../../components/tree/tree.component';
import { TwoColumnLayoutComponent } from '../../../../layouts/two-column-layout/two-column-layout.component';

@Component({
    selector: 'app-html-to-tree',
    imports: [
        CodeComponent,
        TreeComponent,
        TwoColumnLayoutComponent,
    ],
    templateUrl: './html-to-tree.component.html',
    changeDetection: ChangeDetectionStrategy.Eager,
    styleUrl: './html-to-tree.component.css'
})
export class HtmlToTreeComponent {
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
    this.nodesToShow.update((currentNodes) =>
      currentNodes.filter((node) => node !== id)
    );
  }
  onParsedCodeHandler(lines: CodeLine[]) {}
}
