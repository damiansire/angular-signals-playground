import { DestroyRef, Directive, ElementRef, afterNextRender, inject } from '@angular/core';
import { gsap } from 'gsap';
import { NaveDelManual, PALETA, azar, el, sinMovimiento } from './nave-del-manual';

/** El lienzo de todas las láminas: el mismo `viewBox`, así la nave mide lo mismo en las cinco. */
export const ANCHO = 400;
export const ALTO = 260;

/**
 * El cielo de la lámina cuando es el escenario de la página integrada: la misma nave y la misma
 * pantalla en el medio, con cielo de sobra alrededor. La escena lo llena con `xMidYMid slice`, así
 * que la ventanilla puede tener cualquier proporción entre 4:3 y 3.5:1 sin recortar lo que
 * importa: hasta 228 de alto alrededor del centro. El centro es el de lo que la lámina dibuja, no
 * el de la lámina: centrada en la lámina, una ventanilla apaisada le cortaba el borde de arriba a la
 * pantalla.
 */
export function cieloCentradoEn(y: number): string {
  return `-200 ${y - 170} 800 340`;
}

/** El de la mayoría: la nave, su pantalla y lo que descansa debajo (y 18 a 240). */
export const CIELO_DEL_ESCENARIO = cieloCentradoEn(129);

/** Dónde vive la pantalla de la nave en cada lámina: a la derecha, proyectada desde la nariz. */
export const PANTALLA = { x: 214, y: 26, ancho: 174, alto: 178 } as const;

/**
 * La base de las cinco láminas: la noche de la ventanilla, la nave del capitán y su pantalla, con
 * el ciclo de vida de GSAP atado al componente. Cada lámina dibuja lo suyo en `armar` y reacciona a
 * la demo con `reaccion`, que corre dentro del mismo contexto: al desmontar la página se revierte
 * todo, también los bucles.
 */
@Directive()
export abstract class EscenaDelManual {
  protected readonly host: HTMLElement = inject(ElementRef).nativeElement;
  protected readonly quieta = sinMovimiento();
  protected nave: NaveDelManual | null = null;
  private ctx: gsap.Context | null = null;

  constructor() {
    afterNextRender(() => {
      const svg = this.host.querySelector('svg');
      if (!svg) return;
      this.ctx = gsap.context(() => {
        pintarCielo(svg, this.semilla);
        const lugar = svg.querySelector<SVGGElement>('[data-nave]');
        if (lugar) this.nave = new NaveDelManual(lugar);
        this.armar(svg);
      }, this.host);
    });
    inject(DestroyRef).onDestroy(() => {
      this.nave?.apagar();
      this.ctx?.revert();
    });
  }

  /** Para que cada lámina tenga su propio cielo, igual cada vez. */
  protected abstract readonly semilla: number;

  /** Lo propio de la lámina, ya con la nave armada. Corre una vez, con el SVG en pantalla. */
  protected abstract armar(svg: SVGSVGElement): void;

  /** Una reacción a la demo. Antes de que la lámina esté armada no hay nada que mover. */
  protected reaccion(fn: () => void): void {
    this.ctx?.add(fn);
  }

  protected get lista(): boolean {
    return this.ctx !== null;
  }
}

/**
 * La noche detrás de la nave, de atrás hacia adelante: el degradé del cielo, un resplandor de la
 * anomalía, estrellas con semilla, un planeta lejos y la viñeta. Va primero en el SVG, debajo de
 * todo lo que la lámina dibuja.
 */
function pintarCielo(svg: SVGSVGElement, semilla: number): void {
  const id = `cielo-${semilla}`;
  // El cielo cubre todo el `viewBox`, que en el escenario es más grande que la lámina.
  const vb = svg.viewBox.baseVal;
  const caja = vb?.width
    ? { x: vb.x, y: vb.y, ancho: vb.width, alto: vb.height }
    : { x: 0, y: 0, ancho: ANCHO, alto: ALTO };
  const cuantas = Math.round((46 * caja.ancho * caja.alto) / (ANCHO * ALTO));
  const defs = el(svg, 'defs');
  const fondo = el(defs, 'linearGradient', { id: `${id}-f`, x1: 0, y1: 0, x2: 0.3, y2: 1 });
  el(fondo, 'stop', { offset: 0, 'stop-color': '#130d2b' });
  el(fondo, 'stop', { offset: 0.6, 'stop-color': '#21173f' });
  el(fondo, 'stop', { offset: 1, 'stop-color': '#352052' });
  const brillo = el(defs, 'radialGradient', { id: `${id}-b` });
  el(brillo, 'stop', { offset: 0, 'stop-color': '#8a5ad0', 'stop-opacity': 0.45 });
  el(brillo, 'stop', { offset: 1, 'stop-color': '#8a5ad0', 'stop-opacity': 0 });
  const planeta = el(defs, 'radialGradient', { id: `${id}-p`, cx: 0.35, cy: 0.3 });
  el(planeta, 'stop', { offset: 0, 'stop-color': '#ffe7bd' });
  el(planeta, 'stop', { offset: 0.5, 'stop-color': '#f0a05e' });
  el(planeta, 'stop', { offset: 1, 'stop-color': '#7c3a52' });
  const vineta = el(defs, 'radialGradient', { id: `${id}-v`, r: 0.75 });
  el(vineta, 'stop', { offset: 0.6, 'stop-color': '#0b0618', 'stop-opacity': 0 });
  el(vineta, 'stop', { offset: 1, 'stop-color': '#0b0618', 'stop-opacity': 0.6 });

  const cielo = el(svg, 'g', { 'aria-hidden': 'true' });
  svg.insertBefore(cielo, svg.firstChild);
  svg.insertBefore(defs, cielo);
  el(cielo, 'rect', {
    x: caja.x,
    y: caja.y,
    width: caja.ancho,
    height: caja.alto,
    fill: `url(#${id}-f)`,
  });
  el(cielo, 'ellipse', { cx: 70, cy: 70, rx: 170, ry: 120, fill: `url(#${id}-b)` });
  const estrellas = el(cielo, 'g');
  const titilan: SVGCircleElement[] = [];
  for (let i = 0; i < cuantas; i++) {
    const r = 0.5 + azar(semilla * 31 + i * 3.1) * 1.2;
    const e = el(estrellas, 'circle', {
      cx: (caja.x + azar(semilla + i * 7.7) * caja.ancho).toFixed(1),
      cy: (caja.y + azar(semilla * 3 + i * 1.3) * caja.alto).toFixed(1),
      r: r.toFixed(2),
      fill: i % 7 === 0 ? PALETA.luz : '#efe6ff',
      opacity: (0.35 + azar(i * 5.5 + semilla) * 0.55).toFixed(2),
    });
    if (i % 6 === 0) titilan.push(e);
  }
  // El planeta lejos, arriba: abajo se metía detrás de la nave y le borraba la silueta.
  el(cielo, 'circle', { cx: 40, cy: 38, r: 22, fill: `url(#${id}-p)`, opacity: 0.85 });
  el(cielo, 'ellipse', {
    cx: 40,
    cy: 38,
    rx: 36,
    ry: 6,
    fill: 'none',
    stroke: '#ffd9a6',
    'stroke-opacity': 0.4,
    'stroke-width': 2,
    transform: 'rotate(-14 40 38)',
  });
  el(svg, 'rect', {
    x: caja.x,
    y: caja.y,
    width: caja.ancho,
    height: caja.alto,
    fill: `url(#${id}-v)`,
    'pointer-events': 'none',
  });

  if (!sinMovimiento()) {
    titilan.forEach((e, i) =>
      gsap.to(e, {
        opacity: 0.15,
        duration: 0.9 + azar(i) * 1.2,
        ease: 'sine.inOut',
        yoyo: true,
        repeat: -1,
        delay: azar(i * 9) * 2,
      }),
    );
  }
}

/** La pantalla que proyecta la nave: marco, vidrio y el haz que la une con la nariz. */
export function pintarPantalla(svg: SVGSVGElement, desde: { x: number; y: number }): SVGGElement {
  const { x, y, ancho, alto } = PANTALLA;
  const haz = el(svg, 'path', {
    d: `M${desde.x} ${desde.y}L${x} ${y + 30}L${x} ${y + alto - 30}Z`,
    fill: PALETA.luz,
    opacity: 0.1,
  });
  svg.insertBefore(haz, svg.querySelector('[data-nave]'));
  const marco = el(svg, 'g');
  svg.insertBefore(marco, svg.querySelector('[data-nave]'));
  el(marco, 'rect', {
    x: x - 4,
    y: y - 4,
    width: ancho + 8,
    height: alto + 8,
    rx: 16,
    fill: '#3a2c5c',
    stroke: PALETA.tinta,
    'stroke-width': 2.5,
  });
  el(marco, 'rect', { x, y, width: ancho, height: alto, rx: 12, fill: '#1c1434' });
  el(marco, 'path', {
    d: `M${x + 12} ${y + 8}H${x + ancho - 40}`,
    stroke: '#fff',
    'stroke-opacity': 0.12,
    'stroke-width': 3,
    'stroke-linecap': 'round',
  });
  return el(marco, 'g');
}

/** Estrellitas que saltan desde un punto: el festejo de un desafío sano. */
export function chispas(padre: SVGGElement | SVGSVGElement, x: number, y: number, n = 9): void {
  if (sinMovimiento()) return;
  for (let i = 0; i < n; i++) {
    const a = (i / n) * Math.PI * 2 + azar(i + x) * 0.6;
    const d = 26 + azar(i * 3 + y) * 22;
    const c = el(padre, 'path', {
      d: 'M0 -5L1.4 -1.4 5 0 1.4 1.4 0 5-1.4 1.4-5 0-1.4 -1.4Z',
      fill: i % 2 ? PALETA.luz : '#ffffff',
      transform: `translate(${x} ${y})`,
      'pointer-events': 'none',
    });
    gsap.fromTo(
      c,
      { x, y, scale: 0.3, rotation: 0, transformOrigin: '50% 50%' },
      {
        x: x + Math.cos(a) * d,
        y: y + Math.sin(a) * d,
        scale: 1,
        rotation: 90,
        duration: 0.5,
        ease: 'power2.out',
        onComplete: () =>
          void gsap.to(c, { opacity: 0, duration: 0.25, onComplete: () => c.remove() }),
      },
    );
  }
}
