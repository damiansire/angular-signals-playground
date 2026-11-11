import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  ElementRef,
  afterNextRender,
  effect,
  inject,
  input,
  untracked,
  viewChild,
} from '@angular/core';
import { gsap } from 'gsap';
import { sinMovimiento } from '../../libs/muelle';
import { chispas } from '../../libs/rastros';
import { PALETAS, el, gradientesDeNaves } from './nave-del-prologo';
import { dibujarObjeto, type ObjetoDelMundo } from './objetos-del-mundo';
import { Tripulante } from './tripulante';

/** Quién habla en el viaje: las tres naves que entraron en la anomalía. */
export type QuienDelViaje = 'cap' | 'naveA' | 'naveB';
export const NAVE_DEL_VIAJE: Record<QuienDelViaje, number> = { cap: 0, naveA: 1, naveB: 2 };

/**
 * Dónde va cada cosa, en el `viewBox`. Ancho: la formación a la izquierda y el objeto de la etapa a
 * la derecha, como en las cinemáticas. Angosto (un celular): todo más cerca y más grande, porque a
 * 340 px de ancho una nave del ancho le quedaba de 30 px.
 */
const DISPOSICIONES = {
  ancho: {
    caja: { w: 1600, h: 190 },
    naves: [
      { x: 440, y: 98, s: 0.86 },
      { x: 270, y: 54, s: 0.68 },
      { x: 262, y: 146, s: 0.68 },
    ],
    objeto: { x: 1250, y: 100, s: 0.74 },
    lejos: { x0: 640, x1: 1100 },
  },
  angosto: {
    caja: { w: 800, h: 260 },
    naves: [
      { x: 330, y: 130, s: 1.1 },
      { x: 150, y: 70, s: 0.9 },
      { x: 140, y: 196, s: 0.9 },
    ],
    objeto: { x: 650, y: 130, s: 0.95 },
    lejos: { x0: 470, x1: 520 },
  },
} as const;
type Disposicion = (typeof DISPOSICIONES)[keyof typeof DISPOSICIONES];

const azar = (k: number): number => {
  const x = Math.sin(k * 127.1 + 311.7) * 43758.5453;
  return x - Math.floor(x);
};

let instancias = 0;

/**
 * El cielo de una etapa del viaje: la tripulación del prólogo en formación, el objeto de mundo de
 * la etapa y moléculas lejanas, en tinta sobre el papel de las cinemáticas. No es decoración: las
 * naves miran lo que se toca en la pantalla, se enteran de cada cambio, festejan lo resuelto y se
 * van volando a la página siguiente. Tocarlas las sacude, como en el prólogo.
 */
@Component({
  selector: 'app-tripulacion',
  template: `<svg #lienzo class="tr" aria-hidden="true" focusable="false"></svg>`,
  styles: `
    :host {
      position: relative;
      display: block;
      user-select: none;
      -webkit-user-select: none;
    }
    .tr {
      display: block;
      width: 100%;
      height: auto;
      overflow: visible;
      touch-action: manipulation;
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TripulacionComponent {
  readonly capitulo = input.required<number>();
  readonly acento = input('#eb9b3c');

  private readonly lienzo = viewChild.required<ElementRef<SVGSVGElement>>('lienzo');
  private readonly id = `tr${++instancias}`;
  private naves: Tripulante[] = [];
  private objeto: ObjetoDelMundo | null = null;
  private grupoObjeto: SVGGElement | null = null;
  private defs: SVGDefsElement | null = null;
  private disposicion: Disposicion = DISPOSICIONES.ancho;
  private observador: ResizeObserver | null = null;
  private toques = 0;
  private montado = false;

  constructor() {
    afterNextRender(() => {
      const svg = this.lienzo().nativeElement;
      this.observador = new ResizeObserver(() => {
        const angosto = svg.getBoundingClientRect().width < 640;
        const nueva = angosto ? DISPOSICIONES.angosto : DISPOSICIONES.ancho;
        if (nueva !== this.disposicion || !this.montado) {
          this.disposicion = nueva;
          this.dibujar();
        }
      });
      this.observador.observe(svg);
    });
    // Cambia la etapa sin desmontar la hoja: el objeto es otro, la tripulación es la misma.
    effect(() => {
      this.capitulo();
      this.acento();
      untracked(() => this.montado && this.dibujarObjeto());
    });
    inject(DestroyRef).onDestroy(() => {
      this.observador?.disconnect();
      this.apagar();
    });
  }

  private apagar(): void {
    for (const n of this.naves) n.apagar();
    this.naves = [];
    this.objeto?.apagar();
    this.objeto = null;
  }

  private dibujar(): void {
    this.apagar();
    const svg = this.lienzo().nativeElement;
    const d = this.disposicion;
    svg.replaceChildren();
    svg.setAttribute('viewBox', `0 0 ${d.caja.w} ${d.caja.h}`);
    this.defs = el(svg, 'defs');
    gradientesDeNaves(this.defs, this.id);

    // Lejos: moléculas punteadas, quietas, para que lo de adelante se lea.
    const lejos = el(svg, 'g');
    // Dos, una arriba y otra abajo y separadas: tres al azar se amontonaban en una sola mancha.
    for (let k = 0; k < 2; k++) {
      const x = d.lejos.x0 + ((k + 0.5) / 2) * (d.lejos.x1 - d.lejos.x0);
      const y = d.caja.h * (k === 0 ? 0.34 : 0.66);
      const pts = [0, 1, 2].map((j) => ({
        x: x + (j - 1) * (46 + azar(k * 5 + j) * 30),
        y: y + (azar(k * 7 + j) - 0.5) * 50,
      }));
      el(lejos, 'path', {
        d: `M${pts[0].x} ${pts[0].y}L${pts[1].x} ${pts[1].y}L${pts[2].x} ${pts[2].y}`,
        fill: 'none',
        stroke: '#c9bfa9',
        'stroke-width': 3,
        'stroke-dasharray': '2 10',
        'stroke-linecap': 'round',
      });
      for (const p of pts) {
        el(lejos, 'circle', {
          cx: p.x,
          cy: p.y,
          r: 8 + azar(p.x) * 6,
          fill: '#efe7d4',
          stroke: '#c9bfa9',
          'stroke-width': 3,
        });
      }
    }

    this.grupoObjeto = el(svg, 'g', {
      transform: `translate(${d.objeto.x} ${d.objeto.y}) scale(${d.objeto.s})`,
    });
    this.dibujarObjeto();

    // De atrás para adelante: las de los flancos primero, el capitán adelante.
    const naves: Tripulante[] = [];
    for (const i of [1, 2, 0]) {
      const p = d.naves[i];
      const g = el(svg, 'g', { transform: `translate(${p.x} ${p.y}) scale(${p.s})` });
      naves[i] = new Tripulante(g, i, this.defs, this.id);
    }
    this.naves = naves;
    this.montado = true;
  }

  private dibujarObjeto(): void {
    if (!this.grupoObjeto || !this.defs) return;
    this.objeto?.apagar();
    this.objeto = dibujarObjeto(
      this.capitulo(),
      this.grupoObjeto,
      this.defs,
      `${this.id}-obj`,
      this.acento(),
    );
  }

  /** Todas miran adonde va el puntero. */
  mirar(clienteX: number, clienteY: number): void {
    for (const n of this.naves) n.mirar(clienteX, clienteY);
  }

  /**
   * Se tocó algo de la pantalla: miran ahí, y una se entera con un respingo, por turnos. Así cada
   * toque tiene una consecuencia en el mundo, no solo en la demo.
   */
  seTocoAlgo(clienteX: number, clienteY: number): void {
    this.mirar(clienteX, clienteY);
    const n = this.naves[this.toques++ % this.naves.length];
    n?.respingo();
  }

  /** Lo resuelto: el objeto lo cuenta, las naves saltan una tras otra y saltan chispas. */
  festejar(): void {
    this.objeto?.reaccionar(1);
    this.naves.forEach((n, k) => {
      n.animoUnRato('contenta', 1.6);
      n.saltito(16, 0.12 * k);
    });
    if (sinMovimiento()) return;
    const caja = this.grupoObjeto?.getBoundingClientRect();
    const host = this.lienzo().nativeElement.parentElement;
    if (caja && host) {
      const base = host.getBoundingClientRect();
      chispas(
        host,
        caja.left + caja.width / 2 - base.left,
        caja.top + caja.height * 0.3 - base.top,
        this.acento(),
        10,
      );
    }
  }

  /** La que habla por radio titila la antena; las otras la miran. */
  hablar(quien: QuienDelViaje): void {
    const i = NAVE_DEL_VIAJE[quien];
    this.naves.forEach((n, k) => n.hablar(k === i));
  }

  /** Salen volando por la derecha, primero el capitán. */
  async irse(): Promise<void> {
    const ancho = this.disposicion.caja.w + 300;
    gsap.to(this.grupoObjeto, {
      opacity: 0,
      duration: sinMovimiento() ? 0 : 0.3,
      delay: sinMovimiento() ? 0 : 0.25,
    });
    await Promise.all(this.naves.map((n, k) => n.irse(ancho, [0, 0.08, 0.14][k])));
  }

  /** Llegan desde la izquierda a la página nueva, y el objeto vuelve a su lugar. */
  llegar(): void {
    const ancho = 700;
    this.naves.forEach((n, k) => n.llegar(ancho, [0.12, 0, 0.06][k]));
    gsap.fromTo(
      this.grupoObjeto,
      { opacity: 0 },
      { opacity: 1, duration: sinMovimiento() ? 0 : 0.4, delay: sinMovimiento() ? 0 : 0.3 },
    );
  }
}

/** La paleta de cada voz, para el retrato del diálogo. */
export const LUZ_DE: Record<QuienDelViaje, string> = {
  cap: PALETAS[0].luz,
  naveA: PALETAS[1].luz,
  naveB: PALETAS[2].luz,
};
