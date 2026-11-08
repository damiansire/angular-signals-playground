import { ChangeDetectionStrategy, Component, computed, effect, input } from '@angular/core';
import { gsap } from 'gsap';
import { EscenaDelManual, chispas, pintarPantalla } from './escena-del-manual';
import { PALETA, el } from './nave-del-manual';

/** Lo que la lámina necesita de cada nodo de la demo. */
export interface NodoVivo {
  readonly id: string;
  readonly selector: string;
  readonly text: string;
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

/** Cada nodo de la demo es un instrumento de la pantalla de la nave. */
const WIDGETS: Record<string, Widget> = {
  title: { x: 224, y: 38, ancho: 154, alto: 34, tx: 301, ty: 62, letra: 16 },
  count: { x: 224, y: 82, ancho: 72, alto: 112, tx: 260, ty: 152, letra: 44 },
  status: { x: 304, y: 82, ancho: 74, alto: 112, tx: 341, ty: 176, letra: 13 },
};
const NARIZ = { x: 182, y: 148 };

/**
 * Lámina de la ley 2: cada línea que corre en la demo sale de la nave como un paquete, viaja por el
 * haz hasta el instrumento que nombra su selector y lo cambia al llegar. Reiniciar el DOM vuelve
 * todo a como estaba, de un golpe.
 */
@Component({
  selector: 'app-escena-vivo',
  template: `<svg class="esc" viewBox="0 0 400 260" role="img" [attr.aria-label]="descripcion()">
    <g data-nave transform="translate(112 150) scale(1.05)"></g>
  </svg>`,
  styleUrl: './escena.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EscenaVivoComponent extends EscenaDelManual {
  readonly nodos = input<readonly NodoVivo[]>([]);
  /** Sube con cada línea que corre, aunque toque el mismo nodo con el mismo valor. */
  readonly corrida = input(0);
  readonly tocado = input<string | null>(null);
  readonly sano = input(false);

  protected readonly semilla = 23;
  protected readonly descripcion = computed(
    () =>
      'Pantalla de la nave: ' +
      this.nodos()
        .map((n) => `${n.selector} ${n.text}`)
        .join(', '),
  );

  private textos = new Map<string, SVGTextElement>();
  private cajas = new Map<string, SVGGElement>();
  private lampara: SVGCircleElement | null = null;
  private capa: SVGGElement | null = null;
  private corridaVista = 0;

  constructor() {
    super();
    effect(() => {
      const nodos = this.nodos();
      const corrida = this.corrida();
      const tocado = this.tocado();
      if (!this.lista) return;
      this.reaccion(() => {
        if (corrida !== this.corridaVista && tocado) this.enviar(nodos, tocado);
        else this.reiniciar(nodos);
        this.corridaVista = corrida;
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
      cx: 341,
      cy: 124,
      r: 16,
      fill: '#4a4166',
      stroke: PALETA.tinta,
      'stroke-width': 2,
    });
    el(pantalla, 'path', {
      d: 'M333 117c3 -4 9 -5 13 -2',
      fill: 'none',
      stroke: '#fff',
      'stroke-opacity': 0.55,
      'stroke-width': 2.4,
      'stroke-linecap': 'round',
    });
    this.capa = el(svg, 'g', { 'pointer-events': 'none' });
    this.corridaVista = this.corrida();
    this.reiniciar(this.nodos(), true);
  }

  private pintar(id: string, texto: string): void {
    const t = this.textos.get(id);
    if (t) t.textContent = texto;
    if (id === 'status' && this.lampara) {
      const prendida = texto === 'activo';
      gsap.to(this.lampara, {
        attr: { fill: prendida ? '#5fd39a' : '#4a4166' },
        duration: this.quieta ? 0 : 0.2,
      });
    }
  }

  /** Una línea corrió: el paquete viaja por el haz y cambia el instrumento al llegar. */
  private enviar(nodos: readonly NodoVivo[], tocado: string): void {
    const destino = WIDGETS[tocado];
    const nodo = nodos.find((n) => n.id === tocado);
    const caja = this.cajas.get(tocado);
    if (!destino || !nodo || !caja || !this.capa) return;
    const nave = this.nave;
    nave?.mirar(destino.x + destino.ancho / 2, destino.y + destino.alto / 2);
    nave?.animo('atenta');
    if (this.quieta) {
      this.pintar(tocado, nodo.text);
      return;
    }
    nave?.empujar(40, 2.5);
    const fin = { x: destino.x + destino.ancho / 2, y: destino.y + destino.alto / 2 };
    const ctrl = { x: (NARIZ.x + fin.x) / 2, y: Math.min(NARIZ.y, fin.y) - 50 };
    const paquete = el(this.capa, 'g');
    el(paquete, 'circle', { r: 10, fill: PALETA.luz, opacity: 0.3 });
    el(paquete, 'circle', { r: 5, fill: '#fff8e2', stroke: PALETA.acento, 'stroke-width': 1.5 });
    const viaje = { t: 0 };
    const ubicar = (): void => {
      const t = viaje.t;
      const x = (1 - t) ** 2 * NARIZ.x + 2 * (1 - t) * t * ctrl.x + t ** 2 * fin.x;
      const y = (1 - t) ** 2 * NARIZ.y + 2 * (1 - t) * t * ctrl.y + t ** 2 * fin.y;
      paquete.setAttribute('transform', `translate(${x.toFixed(1)} ${y.toFixed(1)})`);
    };
    ubicar();
    gsap
      .timeline()
      .to(viaje, { t: 1, duration: 0.42, ease: 'power2.in', onUpdate: ubicar })
      .add(() => {
        paquete.remove();
        this.pintar(tocado, nodo.text);
        this.ping(fin.x, fin.y);
        nave?.animo('contenta');
      })
      .fromTo(caja, { scale: 0.86 }, { scale: 1, duration: 0.32, ease: 'back.out(2.6)' })
      .add(() => nave?.animo('tranquila'), '+=0.6');
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

  /** Reiniciar: todos los instrumentos vuelven a su valor, girando sobre su eje como una placa. */
  private reiniciar(nodos: readonly NodoVivo[], primeraVez = false): void {
    for (const n of nodos) {
      const t = this.textos.get(n.id);
      if (!t || t.textContent === n.text) continue;
      const caja = this.cajas.get(n.id);
      if (primeraVez || this.quieta || !caja) {
        this.pintar(n.id, n.text);
        continue;
      }
      gsap
        .timeline()
        .to(caja, { scaleY: 0, duration: 0.12, ease: 'power2.in' })
        .add(() => this.pintar(n.id, n.text))
        .to(caja, { scaleY: 1, duration: 0.2, ease: 'back.out(2)' });
    }
    if (!primeraVez) this.nave?.mirar(300, 120);
  }

  private festejar(): void {
    this.nave?.animo('contenta');
    this.nave?.saltito(18);
    const svg = this.host.querySelector('svg');
    if (svg) chispas(svg, 140, 118);
  }
}
