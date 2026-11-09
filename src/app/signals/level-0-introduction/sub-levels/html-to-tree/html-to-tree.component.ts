import { Component, ChangeDetectionStrategy, signal, computed } from '@angular/core';
import { NODOS, TAG, type NodoId, codigoDelArbol, fueraDelPanel } from './html-to-tree.data';
import { PaginaDelManualComponent } from '../../manual/pagina-del-manual.component';
import { EscenaArbolComponent } from '../../manual/escena-arbol.component';
import { siguienteSinTocar } from '../../manual/guia.logica';

/** Una pieza del renglón como la dibuja la consola; el cierre de `<article>` es el hueco. */
interface PiezaVista {
  readonly tipo: 'abre' | 'texto' | 'cierra' | 'hueco';
  readonly texto: string;
  readonly id?: NodoId;
}

/**
 * La ley 1 en una sola pieza: la pantalla de la nave es el árbol, y la consola tiene el HTML con un
 * cierre fuera de lugar. Probar es tocar los tags: cada uno revela su pieza, y el título y el
 * párrafo, sangrados como si fueran de `<article>`, caen fuera de su panel porque `</article>` ya lo
 * cerró. Arreglar es mover ese cierre: el navegador lee los tags, no la sangría.
 */
@Component({
  selector: 'app-html-to-tree',
  templateUrl: './html-to-tree.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [PaginaDelManualComponent, EscenaArbolComponent],
  styleUrl: './html-to-tree.component.css',
})
export class HtmlToTreeComponent {
  protected readonly arreglado = signal(false);
  /** Los tags tocados, en el orden en que se tocaron. */
  protected readonly reveladas = signal<readonly NodoId[]>([]);

  private readonly codigo = computed(() => codigoDelArbol(this.arreglado()));
  protected readonly fuera = computed(() => fueraDelPanel(this.codigo()));
  protected readonly renglones = computed(() =>
    this.codigo().map((r) => ({
      sangria: r.sangria,
      piezas: r.piezas.map((p): PiezaVista => {
        if (p.tipo === 'texto') return { tipo: 'texto', texto: p.texto };
        const tag = TAG[p.id];
        if (p.tipo === 'abre') return { tipo: 'abre', texto: `<${tag}>`, id: p.id };
        return { tipo: p.id === 'article' ? 'hueco' : 'cierra', texto: `</${tag}>`, id: p.id };
      }),
    })),
  );

  private readonly todas = computed(() => siguienteSinTocar(NODOS, this.reveladas()) === null);
  protected readonly sano = computed(() => this.arreglado() && this.todas());
  /** Con todo a la vista ya se ve qué quedó afuera: el paso de arreglar se prende. */
  protected readonly paso = computed<1 | 2>(() => (this.todas() || this.arreglado() ? 2 : 1));

  /**
   * La mano dice lo mismo que los pasos: el próximo tag sin tocar, en el orden en que el navegador
   * lee el HTML, y con todo a la vista y el cierre fuera de lugar, el hueco.
   */
  protected readonly guia = computed(() => {
    if (this.sano()) return null;
    const siguiente = siguienteSinTocar(NODOS, this.reveladas());
    return siguiente === null ? '[data-guia="cierre"]' : `[data-guia="abre-${siguiente}"]`;
  });

  protected revelada(id: NodoId | undefined): boolean {
    return id !== undefined && this.reveladas().includes(id);
  }

  protected revelar(id: NodoId | undefined): void {
    if (id === undefined || this.revelada(id)) return;
    this.reveladas.update((antes) => [...antes, id]);
  }

  /** El hueco lleva `</article>` después del párrafo; tocarlo otra vez lo devuelve. */
  protected moverCierre(): void {
    this.arreglado.update((a) => !a);
  }
}
