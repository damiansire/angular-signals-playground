import { Component, computed, effect, input, signal, ChangeDetectionStrategy } from '@angular/core';
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
  nodesData = signal<NodeTree[]>([]);
  nodes = computed(() => {
    const hiddenNodes = this.nodesToShow();
    if (hiddenNodes) {
      return this.nodesData().filter((node) => hiddenNodes.includes(node.id));
    }
    return this.nodesData();
  });
  links = signal<Link[]>([]);
  constructor() {
    effect(() => {
      const links = generateLinks(this.htmlCode());
      this.links.set(links);

      const nodes = generateNodes(this.htmlCode());
      this.nodesData.set(nodes);
    });
  }
}
