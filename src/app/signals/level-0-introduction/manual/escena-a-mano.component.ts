import { ChangeDetectionStrategy, Component, computed, effect, input } from '@angular/core';
import { gsap } from 'gsap';
import { CIELO_DEL_ESCENARIO, EscenaDelManual, chispas, pintarPantalla } from './escena-del-manual';
import { PALETA, el } from './nave-del-manual';

/** Un lugar del panel: lo que muestra y si quedó viejo. */
export interface LugarDelPanel {
  readonly id: string;
  /** Su rótulo en el panel: el mismo selector con que el handler lo busca. */
  readonly rotulo: string;
  readonly valor: string;
  readonly viejo: boolean;
  /** El handler lo actualiza: el lápiz pasa por acá. */
  readonly sincronizado: boolean;
}

const FILA = { x: 226, ancho: 150, alto: 44, y0: 40, paso: 54 } as const;
const NARIZ = { x: 182, y: 148 };
// Apoyado en la esquina de la pantalla: más abajo, el escenario apaisado lo cortaba.
const REPOSO = { x: 360, y: 236 };

/**
 * Lámina de la ley 4, que es el escenario de su página: el panel de la nave tiene tres lugares que
 * dependen del mismo número, rotulados con el selector que los busca, y el handler los actualiza a
 * mano. Con cada `increment()` el lápiz pasa por los lugares que el handler nombra; el que se
 * olvida queda con el número viejo, en rojo, y la nave lo mira preocupada.
 */
@Component({
  selector: 'app-escena-a-mano',
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
export class EscenaAManoComponent extends EscenaDelManual {
  readonly lugares = input<readonly LugarDelPanel[]>([]);
  /** Sube con cada `increment()`. */
  readonly cuenta = input(0);
  readonly sano = input(false);

  protected readonly semilla = 41;
  protected readonly cielo = CIELO_DEL_ESCENARIO;
  protected readonly descripcion = computed(
    () =>
      'Panel de la nave: ' +
      this.lugares()
        .map((l) => `${l.rotulo} ${l.valor}${l.viejo ? ' (viejo)' : ''}`)
        .join(', '),
  );

  private filas = new Map<
    string,
    { caja: SVGRectElement; valor: SVGTextElement; marca: SVGGElement; y: number }
  >();
  private lapiz: SVGGElement | null = null;
  private cuentaVista = 0;
  private recorrido: gsap.core.Timeline | null = null;

  constructor() {
    super();
    effect(() => {
      const lugares = this.lugares();
      const cuenta = this.cuenta();
      if (!this.lista) return;
      this.reaccion(() => {
        if (cuenta !== this.cuentaVista) this.escribir(lugares);
        else this.pintarTodo(lugares);
        this.cuentaVista = cuenta;
      });
    });
    effect(() => {
      if (this.sano() && this.lista) this.reaccion(() => this.festejar());
    });
  }

  protected armar(svg: SVGSVGElement): void {
    const pantalla = pintarPantalla(svg, NARIZ);
    this.lugares().forEach((l, i) => {
      const y = FILA.y0 + i * FILA.paso;
      const caja = el(pantalla, 'rect', {
        x: FILA.x,
        y,
        width: FILA.ancho,
        height: FILA.alto,
        rx: 9,
        fill: '#2f2556',
        stroke: '#5b4a96',
        'stroke-width': 1.4,
      });
      const rotulo = el(pantalla, 'text', {
        x: FILA.x + 14,
        y: y + 28,
        'font-family': "'JetBrains Mono', Consolas, monospace",
        'font-size': 12.5,
        'font-weight': 700,
        fill: '#b9aee0',
      });
      rotulo.textContent = l.rotulo;
      const valor = el(pantalla, 'text', {
        x: FILA.x + FILA.ancho - 46,
        y: y + 31,
        'text-anchor': 'end',
        'font-family': 'Georgia, serif',
        'font-size': 24,
        fill: '#f2ecff',
      });
      // La marca de viejo: un signo de alerta que titila al lado del número.
      const marca = el(pantalla, 'g', {
        opacity: 0,
        transform: `translate(${FILA.x + FILA.ancho - 22} ${y + 22})`,
      });
      el(marca, 'circle', { r: 10, fill: '#ff7676', stroke: PALETA.tinta, 'stroke-width': 1.5 });
      el(marca, 'path', {
        d: 'M0 -5v5.5',
        stroke: PALETA.tinta,
        'stroke-width': 2.6,
        'stroke-linecap': 'round',
      });
      el(marca, 'circle', { cy: 5, r: 1.6, fill: PALETA.tinta });
      this.filas.set(l.id, { caja, valor, marca, y });
    });

    // El lápiz que escribe a mano: descansa abajo de la pantalla, a la vista.
    this.lapiz = el(svg, 'g', { 'pointer-events': 'none' });
    const cuerpo = el(this.lapiz, 'g', { transform: 'rotate(-35)' });
    el(cuerpo, 'rect', {
      x: -4,
      y: -34,
      width: 8,
      height: 28,
      rx: 1.5,
      fill: PALETA.luz,
      stroke: PALETA.tinta,
      'stroke-width': 1.6,
    });
    el(cuerpo, 'rect', {
      x: -4,
      y: -40,
      width: 8,
      height: 7,
      rx: 2,
      fill: '#ff8a9a',
      stroke: PALETA.tinta,
      'stroke-width': 1.6,
    });
    el(cuerpo, 'path', {
      d: 'M-4 -6 0 2 4 -6Z',
      fill: '#f3d9b0',
      stroke: PALETA.tinta,
      'stroke-width': 1.6,
      'stroke-linejoin': 'round',
    });
    gsap.set(this.lapiz, REPOSO);
    this.cuentaVista = this.cuenta();
    this.pintarTodo(this.lugares());
  }

  private pintar(l: LugarDelPanel): void {
    const fila = this.filas.get(l.id);
    if (!fila) return;
    fila.valor.textContent = l.valor;
    const t = this.quieta ? 0 : 0.2;
    gsap.to(fila.caja, {
      attr: { stroke: l.viejo ? '#ff7676' : '#5b4a96', fill: l.viejo ? '#4a2440' : '#2f2556' },
      duration: t,
      overwrite: 'auto',
    });
    gsap.to(fila.valor, {
      attr: { fill: l.viejo ? '#ffb3b3' : '#f2ecff' },
      duration: t,
      overwrite: 'auto',
    });
    gsap.killTweensOf(fila.marca);
    if (l.viejo && !this.quieta) {
      gsap.fromTo(
        fila.marca,
        { opacity: 1, scale: 0.4, transformOrigin: '50% 50%' },
        { scale: 1, duration: 0.3, ease: 'back.out(3)' },
      );
      gsap.to(fila.marca, {
        opacity: 0.35,
        duration: 0.5,
        ease: 'sine.inOut',
        yoyo: true,
        repeat: -1,
        delay: 0.3,
      });
    } else {
      gsap.set(fila.marca, { opacity: l.viejo ? 1 : 0, scale: 1 });
    }
  }

  private pintarTodo(lugares: readonly LugarDelPanel[]): void {
    lugares.forEach((l) => this.pintar(l));
    this.mirarAlViejo(lugares);
  }

  private mirarAlViejo(lugares: readonly LugarDelPanel[]): void {
    const viejo = lugares.find((l) => l.viejo);
    const fila = viejo && this.filas.get(viejo.id);
    if (fila) {
      this.nave?.mirar(FILA.x + FILA.ancho, fila.y + 20);
      this.nave?.animo('preocupada');
    } else {
      this.nave?.mirar(FILA.x + 60, 110);
      this.nave?.animo('tranquila');
    }
  }

  /** `increment()`: el lápiz pasa por cada lugar que el handler nombra, y nada más. */
  private escribir(lugares: readonly LugarDelPanel[]): void {
    this.recorrido?.progress(1).kill();
    const lapiz = this.lapiz;
    if (this.quieta || !lapiz) {
      this.pintarTodo(lugares);
      return;
    }
    const tl = gsap.timeline({ onComplete: () => this.mirarAlViejo(lugares) });
    this.recorrido = tl;
    for (const l of lugares) {
      const fila = this.filas.get(l.id);
      if (!fila) continue;
      if (!l.sincronizado) {
        tl.add(() => this.pintar(l));
        continue;
      }
      const x = FILA.x + FILA.ancho - 58;
      tl.to(lapiz, { x, y: fila.y + 30, duration: 0.2, ease: 'power2.inOut' })
        .add(() => this.nave?.mirar(x, fila.y + 20))
        .to(lapiz, { x: x + 10, duration: 0.05, ease: 'none', yoyo: true, repeat: 3 })
        .add(() => this.pintar(l))
        .fromTo(
          fila.valor,
          { scale: 0.7, transformOrigin: '100% 70%' },
          { scale: 1, duration: 0.24, ease: 'back.out(3)' },
          '<',
        );
    }
    tl.to(lapiz, { ...REPOSO, duration: 0.3, ease: 'power2.in' });
  }

  private festejar(): void {
    this.nave?.animo('contenta');
    this.nave?.saltito(18);
    const svg = this.host.querySelector('svg');
    if (svg) chispas(svg, 140, 118);
  }
}
