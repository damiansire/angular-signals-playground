import { ChangeDetectionStrategy, Component, effect, input } from '@angular/core';
import { gsap } from 'gsap';
import { CD_EDGES, CD_NODES, SIGNAL_DEPENDENTS } from '../../../libs/cd-tree';
import { EscenaDelManual, chispas, pintarPantalla } from './escena-del-manual';
import { PALETA, el } from './nave-del-manual';

/** Un cambio de valor; `n` sube con cada uno, aunque el modo se repita. */
export interface Aviso {
  readonly n: number;
  /** El valor es un signal: avisa a quien lo lee. Si no, se barre el árbol entero, como en casa. */
  readonly signal: boolean;
}

const NARIZ = { x: 182, y: 148 };
/** La caja del valor, abajo y entre la nave y su pantalla: de ahí salen los hilos de lectura. */
const CAJA = { x: 150, y: 218 };
const aPantalla = (x: number, y: number): { x: number; y: number } => ({
  x: 232 + (x - 50) * 0.56,
  y: 62 + (y - 40) * 0.72,
});
const APAGADO = '#3e3170';
const ENTERADO = '#7fdcae';

/**
 * Lámina de la ley 6, la primera de Signal Space: ya no hay cerca de Zone.js. El valor es una caja
 * ámbar con un hilo hasta cada nodo que lo lee. Al cambiar, el aviso viaja solo por esos hilos y
 * se encienden los dos `<p>`; el resto del árbol ni se mueve. Si el valor no es un signal, vuelve
 * la costumbre de casa: alguien barre el árbol entero, y la nave lo nota.
 */
@Component({
  selector: 'app-escena-signal',
  template: `<svg
    class="esc"
    viewBox="0 0 400 260"
    role="img"
    [attr.aria-label]="
      enterados()
        ? 'Solo los dos nodos que leen el valor se enteraron'
        : 'El árbol de la pantalla y los hilos de quien lee el valor'
    "
  >
    <g data-nave transform="translate(112 150) scale(1.05)"></g>
  </svg>`,
  styleUrl: './escena.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EscenaSignalComponent extends EscenaDelManual {
  readonly aviso = input<Aviso | null>(null);
  readonly enterados = input(false);
  readonly sano = input(false);

  protected readonly semilla = 61;
  private nodos = new Map<string, { circulo: SVGCircleElement; depth: number }>();
  private hilos: SVGPathElement[] = [];
  private caja: SVGGElement | null = null;
  private valor: SVGTextElement | null = null;
  private capa: SVGGElement | null = null;
  private visto = 0;

  constructor() {
    super();
    effect(() => {
      const aviso = this.aviso();
      const enterados = this.enterados();
      if (!this.lista) return;
      this.reaccion(() => {
        if (aviso && aviso.n !== this.visto) {
          this.visto = aviso.n;
          if (aviso.signal) this.avisar(aviso.n);
          else this.barrerComoEnCasa();
        } else if (!enterados) {
          this.apagar();
        }
      });
    });
    effect(() => {
      if (this.sano() && this.lista) this.reaccion(() => this.festejar());
    });
  }

  protected armar(svg: SVGSVGElement): void {
    const pantalla = pintarPantalla(svg, NARIZ);
    const ramas = el(pantalla, 'g', { stroke: '#6c5ca8', 'stroke-width': 2 });
    for (const e of CD_EDGES) {
      const a = CD_NODES.find((n) => n.id === e.from)!;
      const b = CD_NODES.find((n) => n.id === e.to)!;
      const p = aPantalla(a.x, a.y);
      const q = aPantalla(b.x, b.y);
      el(ramas, 'path', { d: `M${p.x} ${p.y}L${q.x} ${q.y}` });
    }

    // Los hilos de lectura van debajo de los nodos: llegan a ellos, no los cruzan.
    const hilos = el(svg, 'g', { fill: 'none', 'pointer-events': 'none' });
    for (const id of SIGNAL_DEPENDENTS) {
      const n = CD_NODES.find((x) => x.id === id)!;
      const q = aPantalla(n.x, n.y);
      // Curva de abajo hacia el nodo, para que el hilo no tape las ramas del árbol.
      const d = `M${CAJA.x + 14} ${CAJA.y - 4}C${CAJA.x + 70} ${CAJA.y + 6} ${q.x - 30} ${q.y + 40} ${q.x} ${q.y + 8}`;
      this.hilos.push(
        el(hilos, 'path', {
          d,
          stroke: PALETA.luz,
          'stroke-width': 1.6,
          'stroke-dasharray': '3 5',
          opacity: 0.45,
        }),
      );
    }

    for (const n of CD_NODES) {
      const p = aPantalla(n.x, n.y);
      const circulo = el(pantalla, 'circle', {
        cx: p.x,
        cy: p.y,
        r: 9,
        fill: APAGADO,
        stroke: '#8f80cc',
        'stroke-width': 1.6,
      });
      this.nodos.set(n.id, { circulo, depth: n.depth });
    }
    // La pantalla se pintó antes que los hilos: se sube para que los nodos queden arriba.
    svg.appendChild(pantalla);

    // El `translate` va en un grupo de afuera: GSAP pisa el `transform` del grupo que anima.
    const lugar = el(svg, 'g', { transform: `translate(${CAJA.x} ${CAJA.y})` });
    el(lugar, 'ellipse', { cx: 0, cy: 18, rx: 20, ry: 4, fill: 'rgba(25,8,40,.55)' });
    this.caja = el(lugar, 'g');
    el(this.caja, 'rect', {
      x: -16,
      y: -16,
      width: 32,
      height: 30,
      rx: 7,
      fill: PALETA.acento,
      stroke: PALETA.tinta,
      'stroke-width': 2,
    });
    el(this.caja, 'rect', { x: -12, y: -12, width: 24, height: 7, rx: 3.5, fill: PALETA.luz });
    this.valor = el(this.caja, 'text', {
      y: 9,
      'text-anchor': 'middle',
      'font-family': "'JetBrains Mono', Consolas, monospace",
      'font-size': 13,
      'font-weight': 800,
      fill: PALETA.tinta,
    });
    this.valor.textContent = '0';

    this.capa = el(svg, 'g', { 'pointer-events': 'none' });
    this.visto = this.aviso()?.n ?? 0;
    if (this.enterados()) this.encenderLectores(0);
    if (!this.quieta) {
      for (const hilo of this.hilos) {
        gsap.to(hilo, { strokeDashoffset: -16, duration: 1.4, ease: 'none', repeat: -1 });
      }
    }
  }

  private encenderLectores(t: number): void {
    for (const id of SIGNAL_DEPENDENTS) {
      const nodo = this.nodos.get(id);
      if (!nodo) continue;
      gsap.fromTo(
        nodo.circulo,
        { attr: { fill: PALETA.luz, r: t ? 13 : 9 } },
        {
          attr: { fill: ENTERADO, r: 9 },
          duration: 0.45 * t,
          ease: 'back.out(2)',
          overwrite: 'auto',
        },
      );
    }
  }

  private apagar(): void {
    for (const { circulo } of this.nodos.values()) {
      gsap.to(circulo, {
        attr: { fill: APAGADO, r: 9 },
        duration: this.quieta ? 0 : 0.25,
        overwrite: 'auto',
      });
    }
    if (this.valor) this.valor.textContent = '0';
    this.nave?.animo('tranquila');
    this.nave?.mirar(300, 110);
  }

  /** El valor cambia: la caja salta, el aviso corre por los dos hilos y se encienden sus lectores. */
  private avisar(n: number): void {
    const nave = this.nave;
    if (this.valor) this.valor.textContent = String(n);
    nave?.animo('atenta');
    nave?.mirar(CAJA.x, CAJA.y);
    if (this.quieta || !this.caja || !this.capa) {
      this.encenderLectores(0);
      nave?.animo('contenta');
      return;
    }
    // Anticipación, golpe y rebote más chico: el valor se nota antes de que salga el aviso.
    gsap
      .timeline()
      .to(this.caja, {
        scaleY: 0.82,
        scaleX: 1.12,
        transformOrigin: '50% 100%',
        duration: 0.1,
        ease: 'power2.in',
      })
      .to(this.caja, { scaleY: 1.12, scaleX: 0.92, duration: 0.14, ease: 'power2.out' })
      .to(this.caja, { scaleY: 1, scaleX: 1, duration: 0.3, ease: 'back.out(2.5)' });

    const capa = this.capa;
    this.hilos.forEach((hilo, i) => {
      const largo = hilo.getTotalLength();
      const chispa = el(capa, 'circle', { r: 4.5, fill: PALETA.luz, opacity: 0 });
      const viaje = { p: 0 };
      gsap.to(viaje, {
        p: 1,
        delay: 0.18 + i * 0.08,
        duration: 0.55,
        ease: 'power1.in',
        onStart: () => chispa.setAttribute('opacity', '1'),
        onUpdate: () => {
          const punto = hilo.getPointAtLength(viaje.p * largo);
          chispa.setAttribute('cx', punto.x.toFixed(1));
          chispa.setAttribute('cy', punto.y.toFixed(1));
        },
        onComplete: () => {
          chispa.remove();
          const id = SIGNAL_DEPENDENTS[i];
          const nodo = id ? this.nodos.get(id) : undefined;
          if (!nodo) return;
          gsap.fromTo(
            nodo.circulo,
            { attr: { fill: PALETA.luz, r: 13 } },
            {
              attr: { fill: ENTERADO, r: 9 },
              duration: 0.45,
              ease: 'back.out(2)',
              overwrite: 'auto',
            },
          );
        },
      });
    });
    // La mirada sigue el aviso hasta la pantalla, y la nave se alivia: esta vez no hubo barrido.
    gsap.delayedCall(0.5, () => nave?.mirar(300, 170));
    gsap.delayedCall(0.95, () => {
      nave?.animo('contenta');
      nave?.saltito(8);
    });
  }

  /** El valor no es un signal: nadie sabe quién lo lee, así que se revisa todo, como en casa. */
  private barrerComoEnCasa(): void {
    const nave = this.nave;
    nave?.animo('preocupada');
    for (const { circulo, depth } of this.nodos.values()) {
      gsap.fromTo(
        circulo,
        { attr: { fill: '#ff8ac9' } },
        {
          attr: { fill: APAGADO },
          duration: this.quieta ? 0 : 0.5,
          delay: this.quieta ? 0 : 0.1 + depth * 0.16,
          ease: 'power1.out',
          overwrite: 'auto',
        },
      );
    }
    if (!this.quieta) nave?.trabarse(5);
  }

  private festejar(): void {
    this.nave?.animo('contenta');
    this.nave?.saltito(18);
    const svg = this.host.querySelector('svg');
    if (svg) chispas(svg, 140, 118);
  }
}
