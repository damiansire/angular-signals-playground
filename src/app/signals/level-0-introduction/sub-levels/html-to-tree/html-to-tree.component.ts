import { Component, ChangeDetectionStrategy, signal, computed } from '@angular/core';
import {
  NODOS,
  TAG,
  type NodoId,
  codigoDelArbol,
  disponerArbol,
  estadoDelRenglon,
  fueraDelPanel,
} from './html-to-tree.data';
import { PaginaDelManualComponent } from '../../manual/pagina-del-manual.component';
import { EscenaArbolComponent } from '../../manual/escena-arbol.component';
import { siguienteSinTocar } from '../../manual/guia.logica';

/** Una pieza del renglón como la dibuja la consola; el cierre de `<article>` es el hueco. */
interface PiezaVista {
  readonly tipo: 'abre' | 'texto' | 'cierra' | 'hueco';
  readonly texto: string;
  readonly id?: NodoId;
}

/** El árbol en unidades de su `viewBox`: un lugar por hoja y un piso por nivel. */
const HOJA = 66;
const PISO = 58;
const NODO = { ancho: 62, alto: 24 };
/**
 * El ancho del árbol es el de su versión más ancha, la del bug: al mover el cierre los nodos se mudan
 * adentro del mismo lienzo, en vez de cambiar de escala todos juntos.
 */
const HOJAS = Math.max(
  disponerArbol(codigoDelArbol(false)).hojas,
  disponerArbol(codigoDelArbol(true)).hojas,
);

/**
 * El color de cada nodo es el de su pieza en la pantalla de la nave (`escena-arbol`): así se ve que
 * el árbol y lo que se dibuja son lo mismo. Sobre los claros, el texto va oscuro.
 */
const COLOR: Readonly<Record<NodoId, { fondo: string; letra: string; oscuro?: true }>> = {
  main: { fondo: '#2c2352', letra: '#f2ecff', oscuro: true },
  section: { fondo: '#3e3170', letra: '#f2ecff', oscuro: true },
  article: { fondo: '#3e3170', letra: '#f2ecff', oscuro: true },
  h2: { fondo: '#ffd27a', letra: '#2b1b33' },
  p1: { fondo: '#cbc0f0', letra: '#2b1b33' },
  h3: { fondo: '#eb9b3c', letra: '#2b1b33' },
  p2: { fondo: '#cbc0f0', letra: '#2b1b33' },
};

/**
 * El dibujo de la portada: el árbol de la demo ya armado, con los colores de sus piezas, que crece
 * desde la raíz. Es lo que la página enseña, antes de tocar nada.
 */
const PORTADA: readonly { id: NodoId; x: number; y: number; padre?: NodoId }[] = [
  { id: 'main', x: 150, y: 16 },
  { id: 'section', x: 82, y: 64, padre: 'main' },
  { id: 'article', x: 218, y: 64, padre: 'main' },
  { id: 'h2', x: 46, y: 112, padre: 'section' },
  { id: 'p1', x: 118, y: 112, padre: 'section' },
  { id: 'h3', x: 182, y: 112, padre: 'article' },
  { id: 'p2', x: 254, y: 112, padre: 'article' },
];
const LUGAR_EN_PORTADA = new Map(PORTADA.map((n) => [n.id, n]));

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
  /** Se tocó "Leer" en la portada: la nave festeja que se abre su pantalla. */
  protected readonly abierta = signal(false);
  protected readonly portada = PORTADA.map((n, i) => {
    const arriba = n.padre ? LUGAR_EN_PORTADA.get(n.padre) : undefined;
    const medio = arriba ? (arriba.y + n.y) / 2 : n.y;
    return {
      ...n,
      orden: i,
      tag: TAG[n.id],
      color: COLOR[n.id],
      rama: arriba
        ? `M ${arriba.x} ${arriba.y + 11} C ${arriba.x} ${medio}, ${n.x} ${medio}, ${n.x} ${n.y - 11}`
        : null,
    };
  });
  protected readonly arreglado = signal(false);
  /** Los tags tocados, en el orden en que se tocaron. */
  protected readonly reveladas = signal<readonly NodoId[]>([]);

  private readonly codigo = computed(() => codigoDelArbol(this.arreglado()));
  protected readonly fuera = computed(() => fueraDelPanel(this.codigo()));
  protected readonly renglones = computed(() =>
    this.codigo().map((r) => ({
      sangria: r.sangria,
      estado: estadoDelRenglon(r, this.reveladas(), this.fuera()),
      piezas: r.piezas.map((p): PiezaVista => {
        if (p.tipo === 'texto') return { tipo: 'texto', texto: p.texto };
        const tag = TAG[p.id];
        if (p.tipo === 'abre') return { tipo: 'abre', texto: `<${tag}>`, id: p.id };
        return { tipo: p.id === 'article' ? 'hueco' : 'cierra', texto: `</${tag}>`, id: p.id };
      }),
    })),
  );

  /**
   * El mismo HTML visto como árbol, al lado del código. Se ve lo tocado; de lo que falta tocar, solo
   * los ancestros de lo tocado, punteados, para que cada rama tenga de dónde colgar. La forma completa no
   * se adelanta: con el bug, que el título cuelgue de `<main>` se descubre al tocarlo.
   */
  protected readonly arbol = computed(() => {
    const { nodos, hojas } = disponerArbol(this.codigo());
    const vistos = new Set(this.reveladas());
    const fuera = new Set(this.fuera());
    const padreDe = new Map(nodos.map((n) => [n.id, n.padre]));
    const ancestros = new Set<NodoId>();
    for (const id of vistos) {
      for (let p = padreDe.get(id); p; p = padreDe.get(p)) ancestros.add(p);
    }
    // Sin nada tocado, la raíz espera punteada: un vidrio vacío parecía roto.
    if (vistos.size === 0) {
      for (const n of nodos) if (!n.padre) ancestros.add(n.id);
    }
    const corrimiento = ((HOJAS - hojas) * HOJA) / 2;
    const centro = (n: { x: number; nivel: number }) => ({
      x: corrimiento + n.x * HOJA + HOJA / 2,
      y: n.nivel * PISO + NODO.alto / 2 + 2,
    });
    const lugar = new Map(nodos.map((n) => [n.id, centro(n)]));
    return {
      ancho: HOJAS * HOJA,
      alto: 2 * PISO + NODO.alto + 4,
      nodo: NODO,
      nodos: nodos.map((n) => {
        const { x, y } = centro(n);
        const arriba = n.padre ? lugar.get(n.padre) : undefined;
        const medio = arriba ? (arriba.y + y) / 2 : y;
        return {
          id: n.id,
          tag: TAG[n.id],
          x,
          y,
          color: COLOR[n.id],
          oscuro: COLOR[n.id].oscuro ?? false,
          visto: vistos.has(n.id),
          fantasma: !vistos.has(n.id) && ancestros.has(n.id),
          afuera: vistos.has(n.id) && fuera.has(n.id),
          // Una rama curva del borde de abajo del padre al de arriba del hijo.
          rama: arriba
            ? `path("M ${arriba.x} ${arriba.y + NODO.alto / 2} C ${arriba.x} ${medio}, ${x} ${medio}, ${x} ${y - NODO.alto / 2}")`
            : null,
        };
      }),
    };
  });
  protected readonly descripcionDelArbol = computed(() => {
    const vistos = new Set(this.reveladas());
    const { nodos } = disponerArbol(this.codigo());
    const ramas = nodos
      .filter((n) => vistos.has(n.id) && n.padre)
      .map((n) => `${TAG[n.id]} dentro de ${TAG[n.padre as NodoId]}`);
    return ramas.length ? `Árbol de nodos: ${ramas.join(', ')}` : 'Árbol de nodos vacío';
  });

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
