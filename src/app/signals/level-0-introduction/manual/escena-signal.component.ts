import { ChangeDetectionStrategy, Component, computed, effect, input } from '@angular/core';
import { gsap } from 'gsap';
import { CD_EDGES, CD_NODES, SIGNAL_DEPENDENTS } from '../../../libs/cd-tree';
import { CIELO_DEL_ESCENARIO, EscenaDelManual } from './escena-del-manual';
import { PALETA, el } from './nave-del-manual';

/** Un cambio de valor; `n` sube con cada uno, aunque el modo se repita. */
export interface Aviso {
  readonly n: number;
  /** El valor es un signal: avisa a quien lo lee. Si no, se barre el árbol entero, como en casa. */
  readonly signal: boolean;
}

/** Lo que dibuja la pantalla: arriba la lectura, el árbol, y debajo la caja del valor. */
export const PANTALLA_SIGNAL = '214 26 174 214';
/** La caja del valor, debajo del árbol y entre sus dos lectores: de ahí suben los hilos. */
const CAJA = { x: 320, y: 214 };
/**
 * El árbol de la demo, en la pantalla de la nave, corrido hacia abajo: arriba va la lectura. Los
 * hilos entran a los nodos desde abajo, así que la lectura abajo los cruzaba.
 */
const aPantalla = (x: number, y: number): { x: number; y: number } => ({
  x: 232 + (x - 50) * 0.56,
  y: 80 + (y - 40) * 0.53,
});
const LECTURA = { x: 222, y: 38, ancho: 158, alto: 26 } as const;
const APAGADO = '#3e3170';
const ENTERADO = '#7fdcae';
/** Revisado por el barrido de casa: se nota que pasó por ahí, pero no es la luz de un aviso. */
const BARRIDO = '#b0508f';
const TOTAL_DE_NODOS = CD_NODES.length;

/**
 * Lámina de la ley 6, que es el escenario de su página: en la pantalla de la nave (`render`, al lado
 * del código), ya no hay cerca de Zone.js. El valor es una
 * caja ámbar con un hilo hasta cada nodo que lo lee, y la lectura de arriba de la pantalla cuenta
 * cuántos nodos se revisaron. Si el valor es un signal, el aviso viaja solo por esos hilos y se
 * encienden los dos `<p>`; el resto del árbol ni se mueve. Si no, vuelve la costumbre de casa:
 * alguien barre el árbol entero, y la nave lo nota.
 */
@Component({
  selector: 'app-escena-signal',
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
export class EscenaSignalComponent extends EscenaDelManual {
  readonly aviso = input<Aviso | null>(null);
  /** El valor de `total`, en la caja. */
  readonly valor = input(0);
  readonly sano = input(false);

  protected readonly semilla = 61;
  protected readonly cielo = CIELO_DEL_ESCENARIO;
  private readonly revisados = computed(() => {
    const aviso = this.aviso();
    return aviso ? (aviso.signal ? SIGNAL_DEPENDENTS.length : TOTAL_DE_NODOS) : 0;
  });
  protected readonly descripcion = computed(
    () =>
      `Pantalla de la nave: total ${this.valor()}, ` +
      `${this.revisados()} de ${TOTAL_DE_NODOS} nodos revisados`,
  );
  private nodos = new Map<string, { circulo: SVGCircleElement; depth: number }>();
  private hilos: SVGPathElement[] = [];
  private caja: SVGGElement | null = null;
  private valorEnLaCaja: SVGTextElement | null = null;
  private capa: SVGGElement | null = null;
  private lectura: { caja: SVGRectElement; cuenta: SVGTextElement } | null = null;
  private visto = 0;

  constructor() {
    super();
    effect(() => {
      const aviso = this.aviso();
      const valor = this.valor();
      if (!this.lista) return;
      this.reaccion(() => {
        if (this.valorEnLaCaja) this.valorEnLaCaja.textContent = String(valor);
        if (!aviso || aviso.n === this.visto) return;
        this.visto = aviso.n;
        if (aviso.signal) this.avisar();
        else this.barrerComoEnCasa();
        // La cuenta cambia cuando el aviso llega a los lectores o el barrido termina, no antes.
        if (this.quieta) this.leer(aviso);
        else gsap.delayedCall(aviso.signal ? 0.8 : 0.55, () => this.leer(aviso));
      });
    });
    effect(() => {
      if (this.sano() && this.lista) this.reaccion(() => this.festejar());
    });
  }

  protected armar(render: SVGSVGElement): void {
    const pantalla = el(render, 'g');
    this.armarLectura(pantalla);
    const ramas = el(pantalla, 'g', { stroke: '#6c5ca8', 'stroke-width': 2 });
    for (const e of CD_EDGES) {
      const a = CD_NODES.find((n) => n.id === e.from)!;
      const b = CD_NODES.find((n) => n.id === e.to)!;
      const p = aPantalla(a.x, a.y);
      const q = aPantalla(b.x, b.y);
      el(ramas, 'path', { d: `M${p.x} ${p.y}L${q.x} ${q.y}` });
    }

    // Los hilos de lectura van debajo de los nodos: llegan a ellos, no los cruzan.
    const hilos = el(render, 'g', { fill: 'none', 'pointer-events': 'none' });
    for (const id of SIGNAL_DEPENDENTS) {
      const n = CD_NODES.find((x) => x.id === id)!;
      const q = aPantalla(n.x, n.y);
      // Sale de la tapa de la caja, del lado de su lector, y le entra desde abajo: no cruza ramas.
      const x = CAJA.x + Math.sign(q.x - CAJA.x) * 8;
      const d = `M${x} ${CAJA.y - 16}C${x} ${CAJA.y - 34} ${q.x} ${q.y + 30} ${q.x} ${q.y + 9}`;
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
    render.appendChild(pantalla);

    // El `translate` va en un grupo de afuera: GSAP pisa el `transform` del grupo que anima.
    const lugar = el(render, 'g', { transform: `translate(${CAJA.x} ${CAJA.y})` });
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
    this.valorEnLaCaja = el(this.caja, 'text', {
      y: 9,
      'text-anchor': 'middle',
      'font-family': "'JetBrains Mono', Consolas, monospace",
      'font-size': 13,
      'font-weight': 800,
      fill: PALETA.tinta,
    });
    this.valorEnLaCaja.textContent = String(this.valor());

    this.capa = el(render, 'g', { 'pointer-events': 'none' });
    const aviso = this.aviso();
    this.visto = aviso?.n ?? 0;
    this.leer(aviso, 0);
    if (aviso?.signal) this.pintarLectores(0);
    else if (aviso) this.pintarBarrido(0);
    if (!this.quieta) {
      for (const hilo of this.hilos) {
        gsap.to(hilo, { strokeDashoffset: -16, duration: 1.4, ease: 'none', repeat: -1 });
      }
    }
  }

  /** La lectura de arriba de la pantalla: cuántos nodos revisó el último cambio. */
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
      y: y + 17,
      'font-family': mono,
      'font-size': 11.5,
      'font-weight': 700,
      fill: '#b9aee0',
    });
    rotulo.textContent = 'revisados';
    const cuenta = el(pantalla, 'text', {
      x: x + ancho - 10,
      y: y + 18,
      'text-anchor': 'end',
      'font-family': 'Georgia, serif',
      'font-size': 16,
      fill: '#f2ecff',
    });
    this.lectura = { caja, cuenta };
  }

  private leer(aviso: Aviso | null, t = this.quieta ? 0 : 0.25): void {
    const lectura = this.lectura;
    if (!lectura) return;
    const revisados = aviso ? (aviso.signal ? SIGNAL_DEPENDENTS.length : TOTAL_DE_NODOS) : 0;
    lectura.cuenta.textContent = `${revisados}/${TOTAL_DE_NODOS}`;
    const barrido = aviso !== null && !aviso.signal;
    gsap.to(lectura.caja, {
      attr: {
        stroke: barrido ? '#ff7676' : aviso ? ENTERADO : '#5b4a96',
        fill: barrido ? '#4a2440' : '#2f2556',
      },
      duration: t,
      overwrite: 'auto',
    });
    gsap.to(lectura.cuenta, {
      attr: { fill: barrido ? '#ffb3b3' : aviso ? ENTERADO : '#f2ecff' },
      duration: t,
      overwrite: 'auto',
    });
  }

  /** Los dos lectores encendidos y el resto apagado: lo que deja un aviso. */
  private pintarLectores(t: number): void {
    for (const [id, { circulo }] of this.nodos) {
      const lee = SIGNAL_DEPENDENTS.includes(id);
      if (lee && t) continue;
      gsap.to(circulo, {
        attr: { fill: lee ? ENTERADO : APAGADO, r: 9 },
        duration: 0.25 * t,
        overwrite: 'auto',
      });
    }
  }

  /** El valor cambia: la caja salta, el aviso corre por los dos hilos y se encienden sus lectores. */
  private avisar(): void {
    const nave = this.nave;
    nave?.animo('atenta');
    this.mirarLaPantalla(CAJA.x, CAJA.y);
    if (this.quieta || !this.caja || !this.capa) {
      this.pintarLectores(0);
      nave?.animo('contenta');
      return;
    }
    // Lo que barrió la corrida de antes se apaga: esta vez nadie más se entera.
    this.pintarLectores(1);
    this.saltarLaCaja();

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
    gsap.delayedCall(0.5, () => this.mirarLaPantalla(300, 150));
    gsap.delayedCall(0.95, () => {
      nave?.animo('contenta');
      nave?.saltito(8);
    });
  }

  /** Anticipación, golpe y rebote más chico: el valor se nota antes de que salga el aviso. */
  private saltarLaCaja(): void {
    if (!this.caja) return;
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
  }

  /** El árbol entero marcado como revisado: lo que deja el barrido de casa. */
  private pintarBarrido(t: number): void {
    for (const { circulo, depth } of this.nodos.values()) {
      gsap.fromTo(
        circulo,
        { attr: { fill: t ? '#ff8ac9' : BARRIDO, r: 9 } },
        {
          attr: { fill: BARRIDO },
          duration: 0.5 * t,
          delay: (0.1 + depth * 0.16) * t,
          ease: 'power1.out',
          overwrite: 'auto',
        },
      );
    }
  }

  /** El valor no es un signal: nadie sabe quién lo lee, así que se revisa todo, como en casa. */
  private barrerComoEnCasa(): void {
    const nave = this.nave;
    nave?.animo('preocupada');
    this.mirarLaPantalla(300, 120);
    this.pintarBarrido(this.quieta ? 0 : 1);
    if (this.quieta) return;
    this.saltarLaCaja();
    nave?.trabarse(5);
  }

  private festejar(): void {
    this.nave?.animo('contenta');
    this.nave?.saltito(18);
    this.chispasDeLaNave();
  }
}
