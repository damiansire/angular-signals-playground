import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  computed,
  inject,
  input,
  output,
} from '@angular/core';
import type { EChartsOption } from 'echarts';
import type { ECharts } from 'echarts/core';
import { NgxEchartsDirective, provideEchartsCore } from 'ngx-echarts';
import { Link, NodeTree } from '../../libs/tree-model';
import { getLevelColor } from '../node-level-color';

// Tamaño fijo (en px de pantalla) del símbolo roundRect de cada nodo — echarts no lo escala
// con el roam. Se necesita para poder anclar un conector visualmente al BORDE del nodo, no
// a su centro (que es lo único que da convertToPixel).
const NODE_SYMBOL_WIDTH = 78;

@Component({
  selector: 'app-node-tree',
  imports: [NgxEchartsDirective],
  providers: [provideEchartsCore({ echarts: () => import('echarts') })],
  templateUrl: './node-tree.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  styleUrl: './node-tree.component.css',
})
export class NodeTreeComponent {
  // Dimensiones de arranque explícitas: echarts v6 LANZA si hace el primer setOption sobre un
  // contenedor de 0px, y en la molécula el card puede montarse en 0px (mid-animación). El ancho
  // fijo evita eso; después `onChartInit` lo corrige al ancho real del DOM (con dims explícitas,
  // no `resize()` a secas, que no destraba el ancho de arranque).
  protected readonly INIT_OPTS = { width: 800, height: 400 };

  readonly nodes = input<NodeTree[]>([]);
  readonly links = input<Link[]>([]);
  // Se dispara cada vez que el canvas termina de pintar (carga, animación o roam del
  // usuario): quien necesite leer posiciones en pantalla de los nodos sabe cuándo recalcular.
  readonly viewChanged = output<void>();

  private chart: ECharts | null = null;
  private resizeObserver: ResizeObserver | null = null;
  // echarts inicializa y re-pinta de forma asíncrona; sin esta guarda, un evento tardío
  // puede emitir después de que el componente ya fue destruido (NG0953).
  private destroyed = false;

  constructor() {
    inject(DestroyRef).onDestroy(() => {
      this.destroyed = true;
      this.resizeObserver?.disconnect();
      // ngx-echarts no dispone la instancia al destruirse: sin esto, el canvas y sus
      // listeners quedan vivos en el DOM más allá de la vida del componente.
      this.chart?.dispose();
    });
  }

  chartOption = computed<EChartsOption>(() => ({
    backgroundColor: 'transparent',
    tooltip: {},
    animationDurationUpdate: 600,
    animationEasingUpdate: 'cubicOut',
    series: [
      {
        type: 'graph',
        symbol: 'roundRect',
        symbolSize: [NODE_SYMBOL_WIDTH, 32],
        roam: true,
        label: {
          show: true,
          fontFamily: 'var(--font-mono, ui-monospace, monospace)',
          fontSize: 12,
          fontWeight: 600,
          color: '#fff',
        },
        edgeSymbol: ['none', 'none'],
        // Cada nodo lleva su itemStyle horneado (en vez de un color por callback) para poder
        // teñir el GLOW con su propio color: sobre el clima claro un aro de luz del color del
        // nodo lo hace leer "encendido" (energía de señal) en vez de una pastilla plana.
        data: this.nodes().map((node) => {
          const c = node.color || getLevelColor(node.level);
          return {
            ...node,
            itemStyle: {
              color: c,
              borderColor: 'rgba(255, 255, 255, 0.85)',
              borderWidth: 1,
              shadowColor: c,
              shadowBlur: 16,
              shadowOffsetY: 0,
            },
          };
        }),
        links: this.links(),
        // Las aristas heredan el color del nodo de ORIGEN ('source') y curvan suave con un halo
        // tenue: se leen como trazas de señal que fluyen entre nodos, no cables grises muertos.
        lineStyle: {
          color: 'source',
          opacity: 0.9,
          width: 2.5,
          curveness: 0.28,
          shadowColor: 'rgba(37, 99, 235, 0.18)',
          shadowBlur: 8,
        },
      },
    ],
  }));

  onChartInit(instance: ECharts) {
    this.chart = instance;
    // El canvas arranca con `INIT_OPTS` (width 800, para no romper en 0px). En el montaje imperativo
    // de la molécula el autoResize de ngx-echarts no dispara, dejando el canvas en 800 (desborda en
    // cards angostas). Observamos el contenedor y forzamos las dimensiones REALES del DOM: `resize()`
    // sin args no destraba el ancho de arranque, hay que pasarlas explícitas.
    const dom = instance.getDom();
    const applySize = (): void => {
      if (this.destroyed) return;
      const width = dom.clientWidth;
      if (width > 0) instance.resize({ width, height: dom.clientHeight || 400 });
    };
    this.resizeObserver = new ResizeObserver(applySize);
    this.resizeObserver.observe(dom);
    applySize();
    this.emitViewChanged();
  }

  emitViewChanged() {
    if (!this.destroyed) {
      this.viewChanged.emit();
    }
  }

  /** Posición en pantalla (viewport) del borde derecho del nodo `id`, o `null` si no está
   * pintado. Es el borde (no el centro) porque un conector debe verse SALIR del rectángulo,
   * no nacer de un punto perdido detrás suyo. */
  getScreenEdgePosition(
    id: string,
    side: 'left' | 'right' = 'right',
  ): { x: number; y: number } | null {
    const node = this.nodes().find((n) => n.id === id);
    if (!this.chart || !node) {
      return null;
    }
    const pixel = this.chart.convertToPixel({ seriesIndex: 0 }, [node.x, node.y]);
    if (!pixel) {
      return null;
    }
    const rect = this.chart.getDom().getBoundingClientRect();
    // Borde derecho o izquierdo del símbolo según de qué lado sale el conector (el código puede
    // estar a la derecha del árbol o a su izquierda): el conector debe SALIR del rectángulo hacia
    // el código, no cruzarlo por encima.
    const edgeX = pixel[0] + (side === 'left' ? -NODE_SYMBOL_WIDTH / 2 : NODE_SYMBOL_WIDTH / 2);
    return { x: rect.left + edgeX, y: rect.top + pixel[1] };
  }
}
