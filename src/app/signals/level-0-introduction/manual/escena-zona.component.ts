import { ChangeDetectionStrategy, Component, computed, effect, input } from '@angular/core';
import { gsap } from 'gsap';
import { CD_EDGES, CD_NODES } from '../../../libs/cd-tree';
import { CIELO_DEL_ESCENARIO, EscenaDelManual } from './escena-del-manual';
import { el } from '../../../libs/svg';
import { PALETA } from './nave-del-manual';

/** Una llamada de la demo o del desafío; `n` sube con cada una, aunque se repita la misma API. */
export interface Llamada {
  readonly n: number;
  readonly api: string;
  /** Zone.js la parchea: se entera y revisa todo el árbol. */
  readonly parcheada: boolean;
}

/**
 * Lo que dibuja la pantalla: la cerca con el árbol y su lectura adentro, y a su izquierda, afuera,
 * la anomalía. Arriba entra la llamada; abajo pasa lo que la cerca no ve.
 */
export const PANTALLA_ZONA = '182 0 218 236';
/** La cerca de Zone.js: rodea la app de la pantalla (el árbol y su lectura), y nada más. */
const CERCA = { x: 212, y: 22, ancho: 182, alto: 190 } as const;
// Afuera de la cerca, a la izquierda: lo que Zone.js no parchea no existe para ella.
const ANOMALIA = { x: 194, y: 110 };
/** El árbol de la demo, en la pantalla de la nave; abajo le queda lugar a la lectura. */
const aPantalla = (x: number, y: number): { x: number; y: number } => ({
  x: 232 + (x - 50) * 0.56,
  y: 58 + (y - 40) * 0.6,
});
const REVISADO = '#7fdcae';
const LECTURA = { x: 222, y: 172, ancho: 158, alto: 28 } as const;
const TOTAL_DE_NODOS = CD_NODES.length;

/** Lo que dice la lectura de la pantalla. */
interface Lectura {
  readonly valor: number;
  readonly vieja: boolean;
  readonly revisados: number;
}

/**
 * Lámina de la ley 5, que es el escenario de su página: en la pantalla de la nave (`render`, al lado
 * del código), Zone.js es la cerca punteada alrededor de la app. Cuando pasa algo que parchea, entra la llamada, un barrido revisa el árbol entero de la
 * pantalla, de arriba abajo, y la lectura de abajo se pone al día. Lo que no parchea pasa por afuera
 * de la cerca y nadie revisa nada: la lectura queda vieja y la nave mira la anomalía, que titila
 * afuera, sin que la cerca la vea.
 */
@Component({
  selector: 'app-escena-zona',
  template: `<svg
      class="esc"
      [attr.viewBox]="cielo"
      preserveAspectRatio="xMidYMid slice"
      role="img"
      [attr.aria-label]="descripcion()"
    ></svg>
    <svg class="esc-nave" viewBox="-125 -62 214 116" aria-hidden="true">
      <g data-nave></g>
    </svg>`,
  styleUrl: './escena.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EscenaZonaComponent extends EscenaDelManual {
  readonly llamada = input<Llamada | null>(null);
  /** Lo que la pantalla muestra de `total`. */
  readonly enPantalla = input(0);
  /** La pantalla muestra un valor que ya no es. */
  readonly vieja = input(false);
  /** Cuántos nodos revisó la última llamada. */
  readonly revisados = input(0);
  readonly sano = input(false);

  protected readonly semilla = 53;
  protected readonly cielo = CIELO_DEL_ESCENARIO;
  protected readonly descripcion = computed(
    () =>
      `Pantalla de la nave: total ${this.enPantalla()}${this.vieja() ? ' (viejo)' : ''}, ` +
      `${this.revisados()} de ${TOTAL_DE_NODOS} nodos revisados`,
  );
  private nodos = new Map<string, { circulo: SVGCircleElement; depth: number }>();
  private capa: SVGGElement | null = null;
  private anomalia: SVGGElement | null = null;
  private lectura: {
    caja: SVGRectElement;
    valor: SVGTextElement;
    marca: SVGGElement;
    revisados: SVGTextElement;
  } | null = null;
  private vista = 0;

  constructor() {
    super();
    effect(() => {
      const llamada = this.llamada();
      const lectura: Lectura = {
        valor: this.enPantalla(),
        vieja: this.vieja(),
        revisados: this.revisados(),
      };
      if (!this.lista) return;
      this.reaccion(() => {
        if (llamada && llamada.n !== this.vista) {
          this.vista = llamada.n;
          if (llamada.parcheada) {
            this.barrer(llamada.api, () => this.leer(lectura));
          } else {
            this.apagar();
            this.pasarPorAfuera();
            this.leer(lectura);
          }
        } else {
          this.leer(lectura);
        }
      });
    });
    effect(() => {
      if (this.sano() && this.lista) this.reaccion(() => this.festejar());
    });
  }

  protected armar(render: SVGSVGElement): void {
    const pantalla = el(render, 'g');
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
    this.armarLectura(pantalla);

    const cerca = el(render, 'g', { 'pointer-events': 'none' });
    el(cerca, 'rect', {
      x: CERCA.x,
      y: CERCA.y,
      width: CERCA.ancho,
      height: CERCA.alto,
      rx: 18,
      fill: 'none',
      stroke: '#b59cff',
      'stroke-width': 2,
      'stroke-dasharray': '7 6',
    });
    // El rótulo va colgado de la cerca, como un cartel: adentro tapaba el árbol.
    el(cerca, 'rect', {
      x: CERCA.x + 14,
      y: CERCA.y - 8.5,
      width: 48,
      height: 17,
      rx: 8.5,
      fill: '#2a1d4a',
      stroke: '#b59cff',
      'stroke-width': 1.4,
    });
    const rotulo = el(cerca, 'text', {
      x: CERCA.x + 38,
      y: CERCA.y + 4,
      'text-anchor': 'middle',
      'font-family': "'JetBrains Mono', Consolas, monospace",
      'font-size': 11,
      'font-weight': 700,
      fill: '#cbb9ff',
    });
    rotulo.textContent = 'zone';

    // La anomalía, afuera de la cerca: lo que Zone.js no parchea no existe para ella.
    this.anomalia = el(render, 'g', {
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

    this.capa = el(render, 'g', { 'pointer-events': 'none' });
    this.vista = this.llamada()?.n ?? 0;
    if (this.revisados() > 0) this.encender(0);
    this.leer({ valor: this.enPantalla(), vieja: this.vieja(), revisados: this.revisados() });
  }

  /** La lectura de la pantalla, abajo del árbol: `total`, si quedó viejo, y cuántos se revisaron. */
  private armarLectura(pantalla: SVGGElement): void {
    const { x, y, ancho, alto } = LECTURA;
    const mono = "'JetBrains Mono', Consolas, monospace";
    const caja = el(pantalla, 'rect', {
      x,
      y,
      width: ancho,
      height: alto,
      rx: 8,
      fill: '#2f2556',
      stroke: '#5b4a96',
      'stroke-width': 1.4,
    });
    const rotulo = el(pantalla, 'text', {
      x: x + 10,
      y: y + 18,
      'font-family': mono,
      'font-size': 11.5,
      'font-weight': 700,
      fill: '#b9aee0',
    });
    rotulo.textContent = 'total';
    const valor = el(pantalla, 'text', {
      x: x + 82,
      y: y + 20,
      'text-anchor': 'end',
      'font-family': 'Georgia, serif',
      'font-size': 18,
      fill: '#f2ecff',
    });
    // La marca de viejo, como en el panel de la ley 4: un signo de alerta al lado del número.
    const marca = el(pantalla, 'g', { opacity: 0, transform: `translate(${x + 96} ${y + 14})` });
    el(marca, 'circle', { r: 8, fill: '#ff7676', stroke: PALETA.tinta, 'stroke-width': 1.4 });
    el(marca, 'path', {
      d: 'M0 -4v4.5',
      stroke: PALETA.tinta,
      'stroke-width': 2.2,
      'stroke-linecap': 'round',
    });
    el(marca, 'circle', { cy: 4, r: 1.3, fill: PALETA.tinta });
    const revisados = el(pantalla, 'text', {
      x: x + ancho - 10,
      y: y + 18,
      'text-anchor': 'end',
      'font-family': mono,
      'font-size': 11.5,
      'font-weight': 700,
      fill: '#b9aee0',
    });
    this.lectura = { caja, valor, marca, revisados };
  }

  private leer(l: Lectura): void {
    const lectura = this.lectura;
    if (!lectura) return;
    lectura.valor.textContent = String(l.valor);
    lectura.revisados.textContent = `${l.revisados}/${TOTAL_DE_NODOS}`;
    const t = this.quieta ? 0 : 0.2;
    gsap.to(lectura.caja, {
      attr: { stroke: l.vieja ? '#ff7676' : '#5b4a96', fill: l.vieja ? '#4a2440' : '#2f2556' },
      duration: t,
      overwrite: 'auto',
    });
    gsap.to(lectura.valor, {
      attr: { fill: l.vieja ? '#ffb3b3' : '#f2ecff' },
      duration: t,
      overwrite: 'auto',
    });
    gsap.to(lectura.revisados, {
      attr: { fill: l.revisados > 0 ? REVISADO : '#b9aee0' },
      duration: t,
      overwrite: 'auto',
    });
    gsap.killTweensOf(lectura.marca);
    if (l.vieja && !this.quieta) {
      gsap.fromTo(
        lectura.marca,
        { opacity: 1, scale: 0.4, transformOrigin: '50% 50%' },
        { scale: 1, duration: 0.3, ease: 'back.out(3)' },
      );
      gsap.to(lectura.marca, {
        opacity: 0.35,
        duration: 0.5,
        ease: 'sine.inOut',
        yoyo: true,
        repeat: -1,
        delay: 0.3,
      });
    } else {
      gsap.set(lectura.marca, { opacity: l.vieja ? 1 : 0, scale: 1 });
    }
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
    this.mirarLaPantalla(300, 110);
  }

  /**
   * Una API parcheada: la llamada entra a la cerca y el barrido revisa el árbol entero. La lectura
   * se pone al día cuando el barrido enciende el árbol (`alLeer`), no antes.
   */
  private barrer(api: string, alLeer: () => void): void {
    const nave = this.nave;
    nave?.animo('atenta');
    if (this.quieta || !this.capa) {
      this.encender(0);
      alLeer();
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
        { x: 300, y: -6, opacity: 0 },
        { x: 300, y: 10, opacity: 1, duration: 0.25, ease: 'back.out(2)' },
      )
      // Entra a la cerca por arriba, hasta la raíz del árbol.
      .to(chip, { y: 44, duration: 0.3, ease: 'power2.in' })
      .to(chip, { opacity: 0, duration: 0.15 })
      .add(() => {
        chip.remove();
        this.encender(1);
        alLeer();
      })
      .fromTo(barra, { opacity: 0.9, y: 0 }, { y: 112, duration: 0.6, ease: 'none' }, '<')
      .to(barra, { opacity: 0, duration: 0.15, onComplete: () => barra.remove() })
      .add(() => nave?.animo('tranquila'));
    // La nave sigue el barrido con la mirada.
    const mirada = { p: 0 };
    gsap.to(mirada, {
      p: 1,
      duration: 0.7,
      delay: 0.7,
      onUpdate: () => this.mirarLaPantalla(300, 60 + mirada.p * 100),
    });
  }

  /** Algo que Zone.js no parchea: pasa por afuera, nadie revisa, y la nave se da cuenta. */
  private pasarPorAfuera(): void {
    const nave = this.nave;
    this.mirarLaPantalla(ANOMALIA.x, ANOMALIA.y);
    nave?.animo('preocupada');
    if (this.quieta || !this.capa || !this.anomalia) return;
    const punto = el(this.capa, 'circle', { r: 5, fill: '#ff8ac9', cx: 0, cy: 0 });
    gsap
      .timeline({ onComplete: () => punto.remove() })
      // Por debajo de la cerca, de punta a punta, y recién afuera de ella sube a la anomalía.
      .fromTo(punto, { x: 404, y: 222, opacity: 0 }, { opacity: 1, duration: 0.1 })
      .to(punto, { x: ANOMALIA.x, duration: 0.6, ease: 'power1.in' })
      .to(punto, { x: ANOMALIA.x, y: ANOMALIA.y, duration: 0.35, ease: 'power1.out' })
      .to(punto, {
        opacity: 0,
        scale: 2,
        svgOrigin: `${ANOMALIA.x} ${ANOMALIA.y}`,
        duration: 0.2,
      });
    gsap.fromTo(
      this.anomalia,
      { opacity: 1 },
      { opacity: 0.4, duration: 0.12, yoyo: true, repeat: 5, delay: 1.05 },
    );
  }

  private festejar(): void {
    this.nave?.animo('contenta');
    this.nave?.saltito(18);
    this.chispasDeLaNave();
  }
}
