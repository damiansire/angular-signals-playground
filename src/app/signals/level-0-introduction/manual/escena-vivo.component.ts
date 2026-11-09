import { ChangeDetectionStrategy, Component, computed, effect, input } from '@angular/core';
import { gsap } from 'gsap';
import { CIELO_DEL_ESCENARIO, EscenaDelManual, chispas, pintarPantalla } from './escena-del-manual';
import { PALETA, el } from './nave-del-manual';

/** Lo que la lámina necesita de cada nodo de la demo. */
export interface NodoVivo {
  readonly id: string;
  readonly selector: string;
  readonly text: string;
}

/** Una corrida de la consola: adónde fue cada línea. `n` sube con cada una, aunque se repita. */
export interface CorridaVivo {
  readonly n: number;
  readonly envios: readonly { readonly selector: string; readonly destino: string | null }[];
}

interface Widget {
  readonly x: number;
  readonly y: number;
  readonly ancho: number;
  readonly alto: number;
  /** Dónde va el valor, y de qué tamaño. */
  readonly tx: number;
  readonly ty: number;
  readonly letra: number;
}

/** Cada nodo de la demo es un instrumento de la pantalla de la nave, rotulado con su selector. */
const WIDGETS: Record<string, Widget> = {
  title: { x: 224, y: 36, ancho: 154, alto: 46, tx: 301, ty: 72, letra: 16 },
  count: { x: 224, y: 90, ancho: 72, alto: 106, tx: 260, ty: 166, letra: 42 },
  status: { x: 304, y: 90, ancho: 74, alto: 106, tx: 341, ty: 184, letra: 13 },
};
const LAMPARA = { x: 341, y: 136 };
const NARIZ = { x: 182, y: 148 };
const MONO = "'JetBrains Mono', Consolas, monospace";
/**
 * Lo que no encontró nada cae debajo de la pantalla y queda ahí, a la vista. Del lado derecho: en
 * angosto, debajo del medio de la pantalla pisaba el rótulo de la ventanilla.
 */
const CAIDO = { x: 350, y: 224 };
const NULO = '#ff8ac9';
/** Entre una línea y la siguiente: corren en orden, y así se ve cada una. */
const ENTRE_LINEAS = 0.32;
/** Lo que ocupa una ficha con este texto, en letra de 12. */
const anchoDeFicha = (texto: string): number => texto.length * 7.3 + 14;

/**
 * Lámina de la ley 2, que es el escenario de su página: la pantalla de la nave muestra los tres
 * nodos, rotulados con su selector. Cada línea que corre sale de la nariz como una ficha con su
 * selector y viaja al nodo que lleva ese rótulo; al llegar le cambia el valor. La que no encuentra
 * nodo busca por la pantalla, se vuelve `null` y cae debajo, y la nave se preocupa.
 */
@Component({
  selector: 'app-escena-vivo',
  template: `<svg
    class="esc esc--escenario"
    [attr.viewBox]="cielo"
    preserveAspectRatio="xMidYMid slice"
    role="img"
    [attr.aria-label]="descripcion()"
  >
    <g data-nave transform="translate(112 150) scale(1.05)"></g>
  </svg>`,
  styleUrl: './escena.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EscenaVivoComponent extends EscenaDelManual {
  readonly nodos = input<readonly NodoVivo[]>([]);
  readonly corrida = input<CorridaVivo | null>(null);
  readonly sano = input(false);

  protected readonly semilla = 23;
  protected readonly cielo = CIELO_DEL_ESCENARIO;
  protected readonly descripcion = computed(() => {
    const nodos = this.nodos()
      .map((n) => `${n.selector} ${n.text}`)
      .join(', ');
    const perdidas = (this.corrida()?.envios ?? []).filter((e) => e.destino === null);
    const nulos = perdidas.map((e) => `; ${e.selector} no encontró nada (null)`).join('');
    return `Pantalla de la nave: ${nodos}${nulos}`;
  });

  private textos = new Map<string, SVGTextElement>();
  private cajas = new Map<string, SVGGElement>();
  private lampara: SVGCircleElement | null = null;
  private capa: SVGGElement | null = null;
  private vista = 0;
  private recorrido: gsap.core.Timeline | null = null;

  constructor() {
    super();
    effect(() => {
      const nodos = this.nodos();
      const corrida = this.corrida();
      if (!this.lista) return;
      this.reaccion(() => {
        if (corrida && corrida.n !== this.vista) {
          this.vista = corrida.n;
          this.correr(nodos, corrida);
        } else {
          for (const n of nodos) this.pintar(n.id, n.text);
        }
      });
    });
    effect(() => {
      if (this.sano() && this.lista) this.reaccion(() => this.festejar());
    });
  }

  protected armar(svg: SVGSVGElement): void {
    const pantalla = pintarPantalla(svg, NARIZ);
    for (const [id, w] of Object.entries(WIDGETS)) {
      const g = el(pantalla, 'g');
      el(g, 'rect', {
        x: w.x,
        y: w.y,
        width: w.ancho,
        height: w.alto,
        rx: 8,
        fill: '#2f2556',
        stroke: '#5b4a96',
        'stroke-width': 1.2,
      });
      // El rótulo es el selector con que el código lo busca: así se lee a quién va cada ficha.
      const rotulo = el(g, 'text', {
        x: w.x + 8,
        y: w.y + 15,
        'font-family': MONO,
        'font-size': 12,
        'font-weight': 700,
        fill: '#b9aee0',
      });
      rotulo.textContent = this.nodos().find((n) => n.id === id)?.selector ?? id;
      const t = el(g, 'text', {
        x: w.tx,
        y: w.ty,
        'text-anchor': 'middle',
        'font-family':
          id === 'count' ? 'Georgia, serif' : 'var(--font-display, system-ui, sans-serif)',
        'font-weight': id === 'count' ? 400 : 700,
        'font-size': w.letra,
        fill: id === 'title' ? PALETA.luz : '#f2ecff',
      });
      gsap.set(g, { svgOrigin: `${w.x + w.ancho / 2} ${w.y + w.alto / 2}` });
      this.textos.set(id, t);
      this.cajas.set(id, g);
    }
    // La lámpara del estado: apagada en gris, prendida en verde.
    this.lampara = el(pantalla, 'circle', {
      cx: LAMPARA.x,
      cy: LAMPARA.y,
      r: 15,
      fill: '#4a4166',
      stroke: PALETA.tinta,
      'stroke-width': 2,
    });
    el(pantalla, 'path', {
      d: `M${LAMPARA.x - 8} ${LAMPARA.y - 7}c3 -4 9 -5 13 -2`,
      fill: 'none',
      stroke: '#fff',
      'stroke-opacity': 0.55,
      'stroke-width': 2.4,
      'stroke-linecap': 'round',
    });
    this.capa = el(svg, 'g', { 'pointer-events': 'none' });
    for (const n of this.nodos()) this.pintar(n.id, n.text, true);
    // Una página que vuelve a montarse con una corrida ya hecha muestra cómo quedó, sin viajar.
    const corrida = this.corrida();
    this.vista = corrida?.n ?? 0;
    corrida?.envios.filter((e) => !e.destino).forEach((e) => this.caido(e.selector));
  }

  private pintar(id: string, texto: string, ya = false): void {
    const t = this.textos.get(id);
    if (t) t.textContent = texto;
    if (id === 'status' && this.lampara) {
      gsap.to(this.lampara, {
        attr: { fill: texto === 'activo' ? '#5fd39a' : '#4a4166' },
        duration: this.quieta || ya ? 0 : 0.2,
      });
    }
  }

  /** Las líneas corren en orden: cada una sale como una ficha con su selector. */
  private correr(nodos: readonly NodoVivo[], corrida: CorridaVivo): void {
    this.recorrido?.progress(1).kill();
    this.capa?.replaceChildren();
    const nave = this.nave;
    nave?.animo('atenta');
    const fallo = corrida.envios.some((e) => !e.destino);
    if (this.quieta || !this.capa) {
      for (const n of nodos) this.pintar(n.id, n.text);
      corrida.envios.filter((e) => !e.destino).forEach((e) => this.caido(e.selector));
      nave?.animo(fallo ? 'preocupada' : 'contenta');
      return;
    }
    const tl = gsap.timeline();
    corrida.envios.forEach((envio, i) => {
      const nodo = nodos.find((n) => n.id === envio.destino);
      tl.add(
        envio.destino && nodo
          ? this.llegar(envio.selector, envio.destino, nodo.text)
          : this.perderse(envio.selector),
        i * ENTRE_LINEAS,
      );
    });
    tl.add(() => {
      if (fallo) {
        nave?.mirar(CAIDO.x, CAIDO.y);
        nave?.animo('preocupada');
      } else {
        nave?.animo('contenta');
      }
    });
    if (!fallo) tl.add(() => nave?.animo('tranquila'), '+=0.8');
    this.recorrido = tl;
  }

  /** La ficha de una línea: el selector con que busca, en una pastilla. */
  private ficha(selector: string): { g: SVGGElement; caja: SVGRectElement; texto: SVGTextElement } {
    const g = el(this.capa!, 'g');
    const ancho = anchoDeFicha(selector);
    const caja = el(g, 'rect', {
      x: -ancho / 2,
      y: -10,
      width: ancho,
      height: 20,
      rx: 10,
      fill: PALETA.tinta,
      stroke: PALETA.luz,
      'stroke-width': 1.2,
    });
    const texto = el(g, 'text', {
      y: 4.3,
      'text-anchor': 'middle',
      'font-family': MONO,
      'font-size': 12,
      'font-weight': 700,
      fill: PALETA.luz,
    });
    texto.textContent = selector;
    gsap.set(g, { x: NARIZ.x, y: NARIZ.y, opacity: 0, scale: 0.6 });
    return { g, caja, texto };
  }

  /** De la nariz al nodo, por arriba del haz. */
  private viaje(g: SVGGElement, fin: { x: number; y: number }, duracion: number): gsap.core.Tween {
    const ctrl = { x: (NARIZ.x + fin.x) / 2, y: Math.min(NARIZ.y, fin.y) - 50 };
    const p = { t: 0 };
    return gsap.to(p, {
      t: 1,
      duration: duracion,
      ease: 'power2.in',
      onUpdate: () => {
        const t = p.t;
        gsap.set(g, {
          x: (1 - t) ** 2 * NARIZ.x + 2 * (1 - t) * t * ctrl.x + t ** 2 * fin.x,
          y: (1 - t) ** 2 * NARIZ.y + 2 * (1 - t) * t * ctrl.y + t ** 2 * fin.y,
        });
      },
    });
  }

  /** La línea encontró su nodo: la ficha llega al rótulo igual al suyo y le cambia el valor. */
  private llegar(selector: string, id: string, texto: string): gsap.core.Timeline {
    const destino = WIDGETS[id];
    const caja = this.cajas.get(id)!;
    const fin = { x: destino.x + destino.ancho / 2, y: destino.y + destino.alto / 2 };
    const { g } = this.ficha(selector);
    const nave = this.nave;
    return gsap
      .timeline()
      .add(() => {
        nave?.mirar(fin.x, fin.y);
        nave?.empujar(30, 2);
      })
      .to(g, { opacity: 1, scale: 1, duration: 0.12 })
      .add(this.viaje(g, fin, 0.45), '<')
      .to(g, { scale: 0.4, opacity: 0, duration: 0.12 })
      .add(() => {
        g.remove();
        this.pintar(id, texto);
        this.ping(fin.x, fin.y);
      })
      .fromTo(caja, { scale: 0.86 }, { scale: 1, duration: 0.32, ease: 'back.out(2.6)' });
  }

  /**
   * La línea no encontró nada: la ficha busca su rótulo por la pantalla, no está, se vuelve `null`
   * y cae debajo de la pantalla, donde queda hasta la próxima corrida.
   */
  private perderse(selector: string): gsap.core.Timeline {
    const { g, caja, texto } = this.ficha(selector);
    const centro = { x: 301, y: 30 };
    const nave = this.nave;
    return (
      gsap
        .timeline()
        .add(() => nave?.mirar(centro.x, centro.y))
        .to(g, { opacity: 1, scale: 1, duration: 0.12 })
        .add(this.viaje(g, centro, 0.45), '<')
        // Busca: pasa por arriba de los tres rótulos, de un lado al otro, y ninguno es el suyo.
        .to(g, { x: 240, duration: 0.22, ease: 'sine.inOut' })
        .to(g, { x: 362, duration: 0.34, ease: 'sine.inOut' })
        .to(g, { x: centro.x, duration: 0.2, ease: 'sine.inOut' })
        .add(() => {
          this.volverNull(caja, texto);
          nave?.animo('preocupada');
        })
        .fromTo(g, { scale: 1.3 }, { scale: 1, duration: 0.2, ease: 'back.out(3)' })
        .to(g, { x: CAIDO.x, y: CAIDO.y, duration: 0.5, ease: 'bounce.out' })
        .add(() => nave?.mirar(CAIDO.x, CAIDO.y), '<')
    );
  }

  /** Lo que no encontró nada, ya caído: así queda cuando no hay movimiento o al volver. */
  private caido(selector: string): void {
    if (!this.capa) return;
    const { g, caja, texto } = this.ficha(selector);
    this.volverNull(caja, texto);
    gsap.set(g, { x: CAIDO.x, y: CAIDO.y, opacity: 1, scale: 1 });
    this.nave?.animo('preocupada');
  }

  /** La ficha ya no lleva un selector: lleva lo que devolvió `querySelector`. */
  private volverNull(caja: SVGRectElement, texto: SVGTextElement): void {
    const ancho = anchoDeFicha('null');
    texto.textContent = 'null';
    texto.setAttribute('fill', NULO);
    caja.setAttribute('stroke', NULO);
    caja.setAttribute('x', String(-ancho / 2));
    caja.setAttribute('width', String(ancho));
  }

  private ping(x: number, y: number): void {
    if (!this.capa) return;
    const anillo = el(this.capa, 'circle', {
      cx: x,
      cy: y,
      r: 10,
      fill: 'none',
      stroke: PALETA.luz,
      'stroke-width': 3,
    });
    gsap.to(anillo, {
      attr: { r: 46 },
      opacity: 0,
      duration: 0.55,
      ease: 'power2.out',
      onComplete: () => anillo.remove(),
    });
  }

  private festejar(): void {
    const tarde = this.quieta ? 0 : (this.corrida()?.envios.length ?? 0) * ENTRE_LINEAS + 0.6;
    gsap.delayedCall(tarde, () => {
      this.nave?.animo('contenta');
      this.nave?.saltito(18);
      const svg = this.host.querySelector('svg');
      if (svg) chispas(svg, 140, 118);
    });
  }
}
