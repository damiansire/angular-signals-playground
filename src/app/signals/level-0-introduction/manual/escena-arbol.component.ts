import { ChangeDetectionStrategy, Component, computed, effect, input } from '@angular/core';
import { gsap } from 'gsap';
import { EscenaDelManual, chispas, pintarPantalla } from './escena-del-manual';
import { PALETA, el } from './nave-del-manual';

interface Pieza {
  readonly tag: string;
  readonly x: number;
  readonly y: number;
  readonly ancho: number;
  readonly alto: number;
  readonly color: string;
  /** Renglones de texto: un `<p>` se dibuja como líneas, no como caja. */
  readonly renglones?: readonly number[];
}

/**
 * Cada nodo del HTML de la demo es una pieza de la pantalla de la nave, en el mismo orden de
 * documento: `<main>` es el marco, `<section>` y `<article>` los paneles, y los títulos y párrafos
 * van adentro de su panel. Que una pieza viva adentro de otra ES el árbol.
 */
const PIEZAS: readonly Pieza[] = [
  { tag: 'main', x: 221, y: 33, ancho: 160, alto: 164, color: '#2c2352' },
  { tag: 'section', x: 228, y: 58, ancho: 70, alto: 132, color: '#3e3170' },
  { tag: 'h2', x: 235, y: 68, ancho: 50, alto: 12, color: PALETA.luz },
  { tag: 'p', x: 235, y: 90, ancho: 52, alto: 46, color: '#cbc0f0', renglones: [52, 44, 48, 34] },
  { tag: 'article', x: 304, y: 58, ancho: 70, alto: 132, color: '#3e3170' },
  { tag: 'h3', x: 311, y: 68, ancho: 42, alto: 10, color: PALETA.acento },
  { tag: 'p', x: 311, y: 88, ancho: 50, alto: 34, color: '#cbc0f0', renglones: [50, 40, 46] },
];

/**
 * Lámina de la ley 1: la pantalla de la nave se arma con los nodos que se revelan en la demo.
 * Mientras no hay ninguno, la pantalla muestra dónde va cada pieza y la nave mira el código.
 */
@Component({
  selector: 'app-escena-arbol',
  template: `<svg
    class="esc"
    viewBox="0 0 400 260"
    role="img"
    [attr.aria-label]="'Pantalla de la nave: ' + armadas() + ' de ' + total + ' piezas'"
  >
    <g data-nave transform="translate(112 150) scale(1.05)"></g>
  </svg>`,
  styleUrl: './escena.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EscenaArbolComponent extends EscenaDelManual {
  /** Los nodos revelados, como posición en el orden del documento. */
  readonly reveladas = input<readonly number[]>([]);
  /** El desafío quedó sano: la nave festeja. */
  readonly sano = input(false);

  protected readonly semilla = 11;
  protected readonly total = PIEZAS.length;
  protected readonly armadas = computed(
    () => this.reveladas().filter((i) => i < this.total).length,
  );

  private piezas: SVGGElement[] = [];
  private etiquetas: SVGGElement | null = null;
  private vistas = new Set<number>();

  constructor() {
    super();
    effect(() => {
      const ahora = new Set(this.reveladas().filter((i) => i < this.total));
      if (this.lista) this.reaccion(() => this.mostrar(ahora));
    });
    effect(() => {
      if (this.sano() && this.lista) this.reaccion(() => this.festejar());
    });
  }

  protected armar(svg: SVGSVGElement): void {
    const pantalla = pintarPantalla(svg, { x: 182, y: 148 });
    // El lugar de cada pieza, punteado: la pantalla vacía se lee como algo por armar.
    const fantasma = el(pantalla, 'g', {
      fill: 'none',
      stroke: '#7d6cc4',
      'stroke-width': 1.3,
      'stroke-dasharray': '4 4',
      opacity: 0.8,
    });
    for (const p of PIEZAS) {
      el(fantasma, 'rect', {
        x: p.x,
        y: p.y,
        width: p.ancho,
        height: p.renglones ? 12 : p.alto,
        rx: 5,
      });
    }
    this.piezas = PIEZAS.map((p) => {
      const g = el(pantalla, 'g', { opacity: 0 });
      if (p.renglones) {
        p.renglones.forEach((ancho, k) =>
          el(g, 'rect', {
            x: p.x,
            y: p.y + k * 11,
            width: ancho,
            height: 5,
            rx: 2.5,
            fill: p.color,
          }),
        );
      } else {
        el(g, 'rect', {
          x: p.x,
          y: p.y,
          width: p.ancho,
          height: p.alto,
          rx: p.tag === 'main' ? 9 : 5,
          fill: p.color,
        });
        if (p.tag === 'main') {
          for (const [i, c] of ['#ff7a8a', '#ffd27a', '#7fdcae'].entries()) {
            el(g, 'circle', { cx: p.x + 10 + i * 9, cy: p.y + 10, r: 3, fill: c });
          }
        }
      }
      gsap.set(g, { svgOrigin: `${p.x + p.ancho / 2} ${p.y + Math.min(p.alto, 24) / 2}` });
      return g;
    });
    this.etiquetas = el(svg, 'g', { 'pointer-events': 'none' });
    this.mostrar(new Set(this.reveladas().filter((i) => i < this.total)), true);
  }

  private mostrar(ahora: ReadonlySet<number>, primeraVez = false): void {
    const nuevas = [...ahora].filter((i) => !this.vistas.has(i));
    const idas = [...this.vistas].filter((i) => !ahora.has(i));
    this.vistas = new Set(ahora);
    const t = this.quieta || primeraVez ? 0 : 1;

    for (const i of idas) {
      gsap.to(this.piezas[i], {
        opacity: 0,
        scale: 0.7,
        duration: 0.2 * t,
        ease: 'power2.in',
        overwrite: 'auto',
      });
    }
    for (const i of nuevas) {
      gsap.fromTo(
        this.piezas[i],
        { opacity: 0, scale: 0.55 },
        { opacity: 1, scale: 1, duration: 0.32 * t, ease: 'back.out(2.2)', overwrite: 'auto' },
      );
      if (t) this.rotular(i);
    }

    const nave = this.nave;
    if (!nave) return;
    const ultima = nuevas.at(-1);
    if (ultima !== undefined) {
      const p = PIEZAS[ultima];
      nave.mirar(p.x + p.ancho / 2, p.y + 6);
      nave.empujar(-30, 1.5);
    } else if (ahora.size === 0) {
      // Vacía, mira hacia el código: es de ahí que va a venir la primera pieza.
      nave.mirar(-60, 230);
    }
    nave.animo(
      ahora.size === PIEZAS.length ? 'contenta' : ahora.size === 0 ? 'atenta' : 'tranquila',
    );
    if (ahora.size === PIEZAS.length && nuevas.length > 0) nave.saltito();
  }

  /** El nombre del tag sube un momento sobre la pieza que acaba de llegar. */
  private rotular(i: number): void {
    if (!this.etiquetas) return;
    const p = PIEZAS[i];
    const g = el(this.etiquetas, 'g');
    const texto = `<${p.tag}>`;
    const ancho = texto.length * 6.6 + 10;
    const cx = Math.min(p.x + p.ancho / 2, 386 - ancho / 2);
    el(g, 'rect', {
      x: cx - ancho / 2,
      y: p.y - 9,
      width: ancho,
      height: 16,
      rx: 8,
      fill: PALETA.tinta,
      stroke: PALETA.luz,
      'stroke-width': 1,
    });
    const t = el(g, 'text', {
      x: cx,
      y: p.y + 3,
      'text-anchor': 'middle',
      'font-family': "'JetBrains Mono', Consolas, monospace",
      'font-size': 10.5,
      'font-weight': 700,
      fill: PALETA.luz,
    });
    t.textContent = texto;
    gsap
      .timeline({ onComplete: () => g.remove() })
      .fromTo(g, { opacity: 0, y: 6 }, { opacity: 1, y: 0, duration: 0.22, ease: 'back.out(2)' })
      .to(g, { opacity: 0, y: -8, duration: 0.3, ease: 'power1.in' }, '+=0.7');
  }

  private festejar(): void {
    this.nave?.animo('contenta');
    this.nave?.saltito(18);
    const svg = this.host.querySelector('svg');
    if (svg) chispas(svg, 140, 118);
  }
}
