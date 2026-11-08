import { ChangeDetectionStrategy, Component, effect, input } from '@angular/core';
import { gsap } from 'gsap';
import { CD_EDGES, CD_NODES } from '../../../libs/cd-tree';
import { EscenaDelManual, chispas, pintarPantalla } from './escena-del-manual';
import { PALETA, el } from './nave-del-manual';

/** Una llamada de la demo o del desafío; `n` sube con cada una, aunque se repita la misma API. */
export interface Llamada {
  readonly n: number;
  readonly api: string;
  /** Zone.js la parchea: se entera y revisa todo el árbol. */
  readonly parcheada: boolean;
}

const NARIZ = { x: 182, y: 148 };
const ANOMALIA = { x: 34, y: 232 };
/** El árbol de la demo, en la pantalla de la nave. */
const aPantalla = (x: number, y: number): { x: number; y: number } => ({
  x: 232 + (x - 50) * 0.56,
  y: 62 + (y - 40) * 0.72,
});
const REVISADO = '#7fdcae';

/**
 * Lámina de la ley 5: Zone.js es la cerca punteada alrededor de la nave. Cuando pasa algo que
 * parchea, entra la llamada y un barrido revisa el árbol entero de la pantalla, de arriba abajo.
 * Lo que no parchea pasa por afuera de la cerca y nadie revisa nada: la nave mira la anomalía, que
 * titila afuera, sin que la cerca la vea.
 */
@Component({
  selector: 'app-escena-zona',
  template: `<svg
    class="esc"
    viewBox="0 0 400 260"
    role="img"
    [attr.aria-label]="
      barrido()
        ? 'Zone.js revisó todo el árbol de la pantalla'
        : 'El árbol de la pantalla, sin revisar'
    "
  >
    <g data-nave transform="translate(112 150) scale(1.05)"></g>
  </svg>`,
  styleUrl: './escena.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EscenaZonaComponent extends EscenaDelManual {
  readonly llamada = input<Llamada | null>(null);
  readonly barrido = input(false);
  readonly sano = input(false);

  protected readonly semilla = 53;
  private nodos = new Map<string, { circulo: SVGCircleElement; depth: number }>();
  private capa: SVGGElement | null = null;
  private anomalia: SVGGElement | null = null;
  private vista = 0;

  constructor() {
    super();
    effect(() => {
      const llamada = this.llamada();
      const barrido = this.barrido();
      if (!this.lista) return;
      this.reaccion(() => {
        if (llamada && llamada.n !== this.vista) {
          this.vista = llamada.n;
          if (llamada.parcheada) this.barrer(llamada.api);
          else this.pasarPorAfuera();
        } else if (!barrido) {
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
    for (const n of CD_NODES) {
      const p = aPantalla(n.x, n.y);
      const circulo = el(pantalla, 'circle', {
        cx: p.x,
        cy: p.y,
        r: 9,
        fill: '#3e3170',
        stroke: '#8f80cc',
        'stroke-width': 1.6,
      });
      this.nodos.set(n.id, { circulo, depth: n.depth });
    }

    // La cerca de Zone.js: rodea la nave y su pantalla, y nada más.
    const cerca = el(svg, 'g', { 'pointer-events': 'none' });
    el(cerca, 'rect', {
      x: 26,
      y: 12,
      width: 366,
      height: 206,
      rx: 22,
      fill: 'none',
      stroke: '#b59cff',
      'stroke-width': 2,
      'stroke-dasharray': '7 6',
    });
    // El rótulo va colgado de la cerca, como un cartel: adentro tapaba el planeta.
    el(cerca, 'rect', {
      x: 96,
      y: 4,
      width: 48,
      height: 17,
      rx: 8.5,
      fill: '#2a1d4a',
      stroke: '#b59cff',
      'stroke-width': 1.4,
    });
    const rotulo = el(cerca, 'text', {
      x: 120,
      y: 16.5,
      'text-anchor': 'middle',
      'font-family': "'JetBrains Mono', Consolas, monospace",
      'font-size': 11,
      'font-weight': 700,
      fill: '#cbb9ff',
    });
    rotulo.textContent = 'zone';

    // La anomalía, afuera de la cerca: lo que Zone.js no parchea no existe para ella.
    this.anomalia = el(svg, 'g', {
      transform: `translate(${ANOMALIA.x} ${ANOMALIA.y})`,
      'pointer-events': 'none',
    });
    el(this.anomalia, 'circle', { r: 13, fill: '#ff5fa8', opacity: 0.25 });
    el(this.anomalia, 'path', {
      d: 'M0 -8 2.2 -2.2 8 0 2.2 2.2 0 8-2.2 2.2-8 0-2.2 -2.2Z',
      fill: '#ff8ac9',
    });
    if (!this.quieta) {
      gsap.to(this.anomalia, {
        scale: 1.25,
        rotation: 45,
        svgOrigin: `${ANOMALIA.x} ${ANOMALIA.y}`,
        duration: 1.1,
        ease: 'sine.inOut',
        yoyo: true,
        repeat: -1,
      });
    }

    this.capa = el(svg, 'g', { 'pointer-events': 'none' });
    this.vista = this.llamada()?.n ?? 0;
    if (this.barrido()) this.encender(0);
  }

  private encender(t: number): void {
    for (const { circulo, depth } of this.nodos.values()) {
      gsap.fromTo(
        circulo,
        { attr: { fill: PALETA.luz, r: 9 } },
        {
          attr: { fill: REVISADO, r: 9 },
          duration: 0.4 * t,
          delay: (0.12 + depth * 0.16) * t,
          ease: 'power1.out',
          overwrite: 'auto',
        },
      );
      if (t) {
        gsap.fromTo(
          circulo,
          { attr: { r: 9 } },
          {
            attr: { r: 12 },
            duration: 0.12,
            delay: (0.12 + depth * 0.16) * t,
            yoyo: true,
            repeat: 1,
            ease: 'power2.out',
          },
        );
      }
    }
  }

  private apagar(): void {
    for (const { circulo } of this.nodos.values()) {
      gsap.to(circulo, {
        attr: { fill: '#3e3170' },
        duration: this.quieta ? 0 : 0.25,
        overwrite: 'auto',
      });
    }
    this.nave?.animo('tranquila');
    this.nave?.mirar(300, 110);
  }

  /** Una API parcheada: la llamada entra a la cerca y el barrido revisa el árbol entero. */
  private barrer(api: string): void {
    const nave = this.nave;
    nave?.animo('atenta');
    if (this.quieta || !this.capa) {
      this.encender(0);
      return;
    }
    nave?.empujar(30, 2);
    const chip = el(this.capa, 'g');
    const ancho = api.length * 6.4 + 14;
    el(chip, 'rect', {
      x: -ancho / 2,
      y: -9,
      width: ancho,
      height: 18,
      rx: 9,
      fill: PALETA.tinta,
      stroke: PALETA.luz,
      'stroke-width': 1.2,
    });
    const t = el(chip, 'text', {
      y: 4,
      'text-anchor': 'middle',
      'font-family': "'JetBrains Mono', Consolas, monospace",
      'font-size': 10.5,
      'font-weight': 700,
      fill: PALETA.luz,
    });
    t.textContent = api;
    const barra = el(this.capa, 'rect', {
      x: 222,
      y: 44,
      width: 156,
      height: 4,
      rx: 2,
      fill: PALETA.luz,
      opacity: 0,
    });
    gsap
      .timeline()
      .fromTo(
        chip,
        { x: 150, y: 0, opacity: 0 },
        { x: 150, y: 34, opacity: 1, duration: 0.25, ease: 'back.out(2)' },
      )
      .to(chip, { x: 300, y: 34, duration: 0.3, ease: 'power2.in' })
      .to(chip, { opacity: 0, duration: 0.15 })
      .add(() => {
        chip.remove();
        this.encender(1);
      })
      .fromTo(barra, { opacity: 0.9, y: 0 }, { y: 140, duration: 0.6, ease: 'none' }, '<')
      .to(barra, { opacity: 0, duration: 0.15, onComplete: () => barra.remove() })
      .add(() => nave?.animo('tranquila'));
    // La nave sigue el barrido con la mirada.
    const mirada = { p: 0 };
    gsap.to(mirada, {
      p: 1,
      duration: 0.7,
      delay: 0.7,
      onUpdate: () => nave?.mirar(300, 60 + mirada.p * 120),
    });
  }

  /** Algo que Zone.js no parchea: pasa por afuera, nadie revisa, y la nave se da cuenta. */
  private pasarPorAfuera(): void {
    const nave = this.nave;
    nave?.mirar(ANOMALIA.x, ANOMALIA.y);
    nave?.animo('preocupada');
    if (this.quieta || !this.capa || !this.anomalia) return;
    const punto = el(this.capa, 'circle', { r: 5, fill: '#ff8ac9', cx: 0, cy: 0 });
    gsap
      .timeline({ onComplete: () => punto.remove() })
      .fromTo(punto, { x: 396, y: 240, opacity: 0 }, { opacity: 1, duration: 0.1 })
      .to(punto, { x: ANOMALIA.x + 18, y: ANOMALIA.y, duration: 0.7, ease: 'power1.inOut' })
      .to(punto, {
        opacity: 0,
        scale: 2,
        svgOrigin: `${ANOMALIA.x + 18} ${ANOMALIA.y}`,
        duration: 0.2,
      });
    gsap.fromTo(
      this.anomalia,
      { opacity: 1 },
      { opacity: 0.4, duration: 0.12, yoyo: true, repeat: 5, delay: 0.7 },
    );
  }

  private festejar(): void {
    this.nave?.animo('contenta');
    this.nave?.saltito(18);
    const svg = this.host.querySelector('svg');
    if (svg) chispas(svg, 140, 118);
  }
}
