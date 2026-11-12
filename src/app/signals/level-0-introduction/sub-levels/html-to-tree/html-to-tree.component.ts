import {
  Component,
  ChangeDetectionStrategy,
  ElementRef,
  Injector,
  afterNextRender,
  signal,
  computed,
  inject,
} from '@angular/core';
import {
  ARREGLADO,
  LUGARES_DEL_CIERRE,
  NODOS,
  TAG,
  type CierreMovido,
  type HijosAdentro,
  type NodoId,
  arbolesAComparar,
  cambianDePadre,
  codigoDelArbol,
  disponerArbol,
  estadoDelRenglon,
  fueraDelPanel,
  lugarMasCercano,
  moverCierre,
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

/**
 * El árbol en unidades de su `viewBox`: un lugar por hoja y un piso por nivel. Bajo, porque van dos,
 * uno arriba del otro: el de antes y el de después de mover el cierre.
 */
const HOJA = 74;
const PISO = 42;
const NODO = { ancho: 64, alto: 22 };
/** Los dos árboles que se comparan, en el orden en que se leen. */
const ROTULOS = { antes: 'antes', despues: 'después' } as const;
/**
 * El ancho del árbol es el de su versión más ancha, la del bug: al mover el cierre los nodos se mudan
 * adentro del mismo lienzo, en vez de cambiar de escala todos juntos.
 */
const HOJAS = Math.max(...LUGARES_DEL_CIERRE.map((l) => disponerArbol(codigoDelArbol(l)).hojas));

/**
 * Cómo se mueve el cierre, para quien no lo descubre solo: tocarlo lo lleva a su lugar, y arrastrar
 * no se adivina. En una pantalla táctil no hay click que mantener ni flechas.
 */
const PISTA_DEL_ARRASTRE = {
  // En renglones: el globo tiene el ancho de la nave y la pista cortaba en "o / usá". Y cada renglón
  // en trozos que no se parten: con el globo angosto (a 1280 y a 1024 de ancho) el renglón entero no
  // entra, y recortado decía "arrastı". Si no entra, baja el trozo entero.
  puntero: [['Mantené el click', 'y arrastrá,'], ['o usá ↑ ↓.']],
  dedo: [['Mantené apretado', 'y arrastrá.']],
} as const;

/** Cuánto hay que mover el puntero para que tocar el cierre sea arrastrarlo. */
const UMBRAL_DE_ARRASTRE = 5;
/**
 * El renglón que marca cada lugar del cierre: pegado a `<article>`, o debajo del título o del
 * párrafo.
 */
const RENGLON_DEL_LUGAR: Readonly<Record<HijosAdentro, NodoId>> = {
  0: 'article',
  1: 'h3',
  2: 'p2',
};

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
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef).nativeElement;
  private readonly injector = inject(Injector);
  /** Dónde está `</article>` (cuántos de sus hijos quedan adentro) y dónde estaba antes. */
  private readonly movido = signal<CierreMovido>({ cierre: 0, antes: null });
  protected readonly cierre = computed(() => this.movido().cierre);
  protected readonly arreglado = computed(() => this.cierre() === ARREGLADO);
  /**
   * El cierre mientras se arrastra: cuánto se corrió del lugar donde estaba y adónde caería si se
   * suelta ahora. `null` cuando nadie lo arrastra.
   */
  protected readonly arrastre = signal<{ dy: number; destino: HijosAdentro } | null>(null);
  private agarre: { id: number; y: number } | null = null;
  /** Ya lo arrastró o lo movió con las flechas: la pista de cómo se mueve sobra. */
  private readonly yaLoMovio = signal(false);
  protected readonly textoDeLaPista =
    typeof matchMedia === 'function' && matchMedia('(pointer: coarse)').matches
      ? PISTA_DEL_ARRASTRE.dedo
      : PISTA_DEL_ARRASTRE.puntero;
  /** Soltar después de arrastrar también dispara un click: ese no cuenta como tocarlo. */
  private recienSoltado = false;
  /** Los tags tocados, en el orden en que se tocaron. */
  protected readonly reveladas = signal<readonly NodoId[]>([]);

  private readonly codigo = computed(() => codigoDelArbol(this.cierre()));
  protected readonly fuera = computed(() => fueraDelPanel(this.codigo()));
  protected readonly renglones = computed(() =>
    this.codigo().map((r) => ({
      sangria: r.sangria,
      abre: r.piezas[0]?.tipo === 'abre' ? r.piezas[0].id : null,
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
   * El mismo HTML visto como árbol, al lado del código: el de antes de mover el cierre arriba y el de
   * después abajo, con los nodos que cambian de padre marcados. Mientras el cierre no se movió hay
   * uno solo, el de ahora; arrastrándolo, el de abajo muestra adónde caería.
   */
  protected readonly comparacion = computed(() =>
    arbolesAComparar(this.movido(), this.arrastre()?.destino ?? null),
  );
  protected readonly arboles = computed(() => {
    const c = this.comparacion();
    const antes = c?.antes ?? this.cierre();
    const despues = c?.despues ?? this.cierre();
    const cambian = new Set(cambianDePadre(codigoDelArbol(antes), codigoDelArbol(despues)));
    return (['antes', 'despues'] as const).map((cual) => ({
      cual,
      rotulo: ROTULOS[cual],
      ...this.dibujarArbol(cual === 'antes' ? antes : despues, cambian),
    }));
  });

  /**
   * Un árbol del cierre en `lugar`. Se ve lo tocado; de lo que falta tocar, solo los ancestros de lo
   * tocado, punteados, para que cada rama tenga de dónde colgar. La forma completa no se adelanta:
   * con el bug, que el título cuelgue de `<main>` se descubre al tocarlo.
   */
  private dibujarArbol(lugar: HijosAdentro, cambian: ReadonlySet<NodoId>) {
    const codigo = codigoDelArbol(lugar);
    const { nodos, hojas } = disponerArbol(codigo);
    const vistos = new Set(this.reveladas());
    const fuera = new Set(fueraDelPanel(codigo));
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
    const lugarDe = new Map(nodos.map((n) => [n.id, centro(n)]));
    const ramas = nodos
      .filter((n) => vistos.has(n.id) && n.padre)
      .map((n) => `${TAG[n.id]} dentro de ${TAG[n.padre as NodoId]}`);
    const visibles = [...cambian].filter((id) => vistos.has(id)).map((id) => TAG[id]);
    return {
      ancho: HOJAS * HOJA,
      alto: 2 * PISO + NODO.alto + 4,
      nodo: NODO,
      descripcion:
        (ramas.length ? `Árbol de nodos: ${ramas.join(', ')}` : 'Árbol de nodos vacío') +
        (visibles.length ? `. Cambian de padre: ${visibles.join(', ')}` : ''),
      nodos: nodos.map((n) => {
        const { x, y } = centro(n);
        const arriba = n.padre ? lugarDe.get(n.padre) : undefined;
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
          cambia: vistos.has(n.id) && cambian.has(n.id),
          // Una rama curva del borde de abajo del padre al de arriba del hijo.
          rama: arriba
            ? `path("M ${arriba.x} ${arriba.y + NODO.alto / 2} C ${arriba.x} ${medio}, ${x} ${medio}, ${x} ${y - NODO.alto / 2}")`
            : null,
        };
      }),
    };
  }

  private readonly todas = computed(() => siguienteSinTocar(NODOS, this.reveladas()) === null);
  protected readonly sano = computed(() => this.arreglado() && this.todas());
  /** Con todo a la vista ya se ve qué quedó afuera: el paso de arreglar se prende. */
  protected readonly paso = computed<1 | 2>(() => (this.todas() || this.arreglado() ? 2 : 1));
  /** La pista va con el paso de mover el cierre, hasta que se lo mueve a mano. */
  protected readonly pista = computed(() => this.paso() === 2 && !this.sano() && !this.yaLoMovio());

  /**
   * La mano dice lo mismo que los pasos: el próximo tag sin tocar, en el orden en que el navegador
   * lee el HTML, y con todo a la vista y el cierre fuera de lugar, el hueco.
   */
  protected readonly guia = computed(() => {
    if (this.sano()) return null;
    // Arrastrando, la mano se aparta: señalaba el lugar vacío de donde salió el cierre. Un selector
    // sin caja la esconde sin sacar "Mostrame", que haría saltar el globo a mitad del arrastre.
    if (this.arrastre()) return '[data-guia="cierre-en-la-mano"]';
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

  /**
   * Tocar el cierre lo lleva después del párrafo; tocarlo otra vez lo devuelve. Es lo que hace la
   * mano de "Mostrame", y lo que hace el teclado con Enter.
   */
  protected moverCierre(): void {
    if (this.recienSoltado) {
      this.recienSoltado = false;
      return;
    }
    this.mover(this.cierre() === ARREGLADO ? 0 : ARREGLADO);
  }

  private mover(destino: HijosAdentro): void {
    this.movido.update((m) => moverCierre(m, destino));
  }

  /** Con las flechas, el cierre baja o sube de a un renglón, como si se lo arrastrara. */
  protected teclaDelCierre(e: KeyboardEvent): void {
    const paso = e.key === 'ArrowDown' ? 1 : e.key === 'ArrowUp' ? -1 : 0;
    if (!paso) return;
    e.preventDefault();
    const l = this.cierre() + paso;
    if (l < 0 || l > ARREGLADO) return;
    this.yaLoMovio.set(true);
    this.mover(l as HijosAdentro);
    // El cierre cambia de renglón y su botón se vuelve a crear: sin devolverle el foco, la segunda
    // flecha ya no lo encontraba.
    afterNextRender(() => this.host.querySelector<HTMLElement>('[data-guia="cierre"]')?.focus(), {
      injector: this.injector,
    });
  }

  protected agarrarCierre(e: PointerEvent): void {
    if (e.button !== 0) return;
    this.recienSoltado = false;
    this.agarre = { id: e.pointerId, y: e.clientY };
    try {
      // Con la captura, el cierre sigue al dedo aunque salga del botón.
      (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    } catch {
      // El puntero ya no está activo: se arrastra igual, mientras siga sobre el botón.
    }
  }

  protected arrastrarCierre(e: PointerEvent): void {
    if (this.agarre?.id !== e.pointerId) return;
    const dy = e.clientY - this.agarre.y;
    if (!this.arrastre() && Math.abs(dy) < UMBRAL_DE_ARRASTRE) return;
    e.preventDefault();
    this.arrastre.set({ dy, destino: lugarMasCercano(e.clientY, this.alturasDeLosLugares()) });
  }

  protected soltarCierre(e: PointerEvent): void {
    if (this.agarre?.id !== e.pointerId) return;
    const arrastre = this.arrastre();
    this.agarre = null;
    this.arrastre.set(null);
    if (!arrastre) return;
    this.yaLoMovio.set(true);
    this.recienSoltado = true;
    this.mover(arrastre.destino);
  }

  protected cancelarArrastre(): void {
    this.agarre = null;
    this.arrastre.set(null);
  }

  /**
   * La altura de cada lugar del cierre en la pantalla: el medio del renglón de `<article>`, y el
   * borde de abajo del título y del párrafo, que es donde quedaría el cierre en su propio renglón.
   */
  private alturasDeLosLugares(): number[] {
    return LUGARES_DEL_CIERRE.map((l) => {
      const renglon = this.host.querySelector(`.htt-linea[data-abre="${RENGLON_DEL_LUGAR[l]}"]`);
      const caja = renglon?.getBoundingClientRect();
      if (!caja) return Infinity;
      return l === 0 ? caja.top + caja.height / 2 : caja.bottom;
    });
  }

  /** El renglón que se marca como destino mientras se arrastra, y cómo. */
  protected destinoEn(abre: NodoId | null): 'adentro' | 'debajo' | null {
    const a = this.arrastre();
    if (!a || abre !== RENGLON_DEL_LUGAR[a.destino]) return null;
    return a.destino === 0 ? 'adentro' : 'debajo';
  }
}
