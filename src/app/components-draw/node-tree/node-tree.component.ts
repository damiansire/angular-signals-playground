
import {
  Component,
  computed,
  input,
  Signal,
  signal,
  WritableSignal,
} from '@angular/core';
import type { EChartsOption } from 'echarts';
import { NgxEchartsDirective, provideEchartsCore } from 'ngx-echarts';
import { Link, NodeTree } from '../components-draw.inferface';

@Component({
    selector: 'app-node-tree',
    imports: [NgxEchartsDirective],
    providers: [provideEchartsCore({ echarts: () => import('echarts') })],
    templateUrl: './node-tree.component.html',
    styleUrl: './node-tree.component.css'
})
export class NodeTreeComponent {
  readonly nodes = input<WritableSignal<NodeTree[]> | Signal<NodeTree[]>>(
    signal<NodeTree[]>([])
  );
  readonly links = input<WritableSignal<Link[]>>(signal<Link[]>([]));
  chartOption = computed<EChartsOption>(() => ({
    tooltip: {},
    animationDurationUpdate: 1500,
    animationEasingUpdate: 'quinticInOut',
    series: [
      {
        type: 'graph',
        symbolSize: 60,
        roam: true,
        label: {
          show: true,
        },
        edgeSymbol: ['rect', 'arrow'],
        edgeSymbolSize: [4, 10],
        edgeLabel: {
          fontSize: 20,
        },
        data: this.nodes()(),
        itemStyle: {
          color: (params) => {
            const node = params.data as NodeTree;
            return node.color || '#5784C1';
          },
        },
        links: this.links()(),
        lineStyle: {
          opacity: 0.9,
          width: 2,
          curveness: 0,
        },
      },
    ],
  }));
}
