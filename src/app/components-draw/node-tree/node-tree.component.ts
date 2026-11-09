import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  computed,
  input,
  viewChild,
} from '@angular/core';
import { Link, NodeTree } from '../../libs/tree-model';
import { getLevelColor } from '../node-level-color';

// Medidas en unidades del viewBox. Una fila por tag (y) y una columna por nivel (x): la sangría es
// menor que el ancho del nodo, pero dos nodos nunca comparten fila, así que no se pisan.
const COLUMNA = 44;
const FILA = 46;
const ALTO = 30;
const MARGEN = 14;
// Ancho de un carácter de la etiqueta (mono, 12px) más el aire a los costados del texto.
const ANCHO_LETRA = 7.4;
const AIRE = 24;
// El tronco baja del padre un poco adentro de su borde izquierdo y dobla con este radio.
const TRONCO = 16;
const CODO = 8;

interface NodoDibujado {
  id: string;
  nombre: string;
  x: number;
  y: number;
  color: string;
}

interface Rama {
  id: string;
  d: string;
  color: string;
}

/**
 * El árbol en SVG, armado por Angular: el DOM ya es el dibujo. Antes lo pintaba ECharts en un
 * canvas, un chunk aparte que llegaba con `@defer (on idle)`; con la escena animando, el navegador
 * casi nunca quedaba ocioso y el árbol aparecía al final, todo junto. Y para anclar los conectores
 * había que preguntarle píxeles al canvas cuadro a cuadro.
 */
@Component({
  selector: 'app-node-tree',
  templateUrl: './node-tree.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  styleUrl: './node-tree.component.css',
})
export class NodeTreeComponent {
  /** El árbol COMPLETO: el lienzo se mide con todos, así un nodo nuevo no corre a los demás. */
  readonly nodes = input<NodeTree[]>([]);
  readonly links = input<Link[]>([]);
  /** Qué nodos se ven; sin valor, todos. */
  readonly nodesToShow = input<string[] | undefined>();

  private readonly lienzo = viewChild<ElementRef<SVGSVGElement>>('lienzo');

  protected readonly ALTO = ALTO;

  protected readonly ancho = computed(
    () => Math.max(0, ...this.nodes().map((n) => n.name.length)) * ANCHO_LETRA + AIRE,
  );

  private readonly todos = computed(() =>
    this.nodes().map<NodoDibujado>((n) => ({
      id: n.id,
      nombre: n.name,
      x: MARGEN + n.x * COLUMNA,
      y: MARGEN + n.y * FILA,
      color: n.color || getLevelColor(n.level),
    })),
  );

  protected readonly visibles = computed(() => {
    const mostrar = this.nodesToShow();
    if (!mostrar) return this.todos();
    const set = new Set(mostrar);
    return this.todos().filter((n) => set.has(n.id));
  });

  protected readonly ramas = computed<Rama[]>(() => {
    const porId = new Map(this.visibles().map((n) => [n.id, n]));
    return this.links().flatMap(({ source, target }) => {
      const padre = porId.get(source);
      const hijo = porId.get(target);
      if (!padre || !hijo) return [];
      const x = padre.x + TRONCO;
      const y = hijo.y + ALTO / 2;
      return [
        {
          id: `${source}>${target}`,
          d: `M ${x} ${padre.y + ALTO} V ${y - CODO} Q ${x} ${y} ${x + CODO} ${y} H ${hijo.x}`,
          color: padre.color,
        },
      ];
    });
  });

  protected readonly caja = computed(() => {
    const nodos = this.todos();
    if (nodos.length === 0) return { ancho: 0, alto: 0 };
    return {
      ancho: Math.max(...nodos.map((n) => n.x)) + this.ancho() + MARGEN,
      alto: Math.max(...nodos.map((n) => n.y)) + ALTO + MARGEN,
    };
  });

  protected readonly descripcion = computed(() =>
    this.visibles()
      .map((n) => n.nombre)
      .join(', '),
  );

  /** Posición en pantalla (viewport) del borde izquierdo o derecho del nodo `id`, a media altura.
   *  Sale de la cuenta del layout y no del nodo pintado: el nodo entra animado, el conector apunta
   *  a donde termina, y quien pregunta puede hacerlo antes de que el nodo se pinte. */
  getScreenEdgePosition(
    id: string,
    side: 'left' | 'right' = 'right',
  ): { x: number; y: number } | null {
    const nodo = this.todos().find((n) => n.id === id);
    const svg = this.lienzo()?.nativeElement;
    const { ancho } = this.caja();
    if (!nodo || !svg || ancho === 0) return null;
    const rect = svg.getBoundingClientRect();
    const escala = rect.width / ancho;
    const x = side === 'left' ? nodo.x : nodo.x + this.ancho();
    return { x: rect.left + x * escala, y: rect.top + (nodo.y + ALTO / 2) * escala };
  }
}
