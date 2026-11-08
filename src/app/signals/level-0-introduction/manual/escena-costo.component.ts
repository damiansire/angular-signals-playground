import { ChangeDetectionStrategy, Component, effect, input } from '@angular/core';
import { gsap } from 'gsap';
import { EscenaDelManual, chispas, pintarPantalla } from './escena-del-manual';
import { PALETA, azar, el } from './nave-del-manual';
import { type Costo, cuadrosDelCosto, saltosDelPaisaje } from './escenas.logica';

const CUADROS = 12;
/** La medida de cuadros en la pantalla: el piso y cuánto alto vale un cuadro entero (16 ms). */
const PISO = 188;
const UN_CUADRO = 62;
const COLOR: Record<Costo, string> = { barato: '#5fd39a', medio: '#f0b34a', caro: '#ff7676' };
const NARIZ = { x: 182, y: 148 };

/**
 * Lámina de la ley 3: la nave vuela, y lo que cuesta el cambio elegido en la demo se nota en cómo
 * vuela. Barato, el paisaje pasa de corrido y los cuadros entran bajo la raya de 16 ms; caro, los
 * cuadros se pasan de la raya, el paisaje avanza a los tirones y la nave se traba.
 */
@Component({
  selector: 'app-escena-costo',
  template: `<svg
    class="esc"
    viewBox="0 0 400 260"
    role="img"
    [attr.aria-label]="'La nave vuela con un cambio ' + costo()"
  >
    <g data-nave transform="translate(112 150) scale(1.05)"></g>
  </svg>`,
  styleUrl: './escena.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EscenaCostoComponent extends EscenaDelManual {
  readonly costo = input<Costo>('caro');
  readonly sano = input(false);

  protected readonly semilla = 37;
  private barras: SVGRectElement[] = [];
  private paisaje: SVGGElement | null = null;
  private vuelo: gsap.core.Tween | null = null;
  private costoVisto: Costo | null = null;

  constructor() {
    super();
    effect(() => {
      const costo = this.costo();
      if (this.lista) this.reaccion(() => this.volar(costo));
    });
    effect(() => {
      if (this.sano() && this.lista) this.reaccion(() => this.festejar());
    });
  }

  protected armar(svg: SVGSVGElement): void {
    // Las estelas del viaje: dos tiras iguales, una detrás de la otra, para que la vuelta no se note.
    this.paisaje = el(svg, 'g', { opacity: 0.55 });
    svg.insertBefore(this.paisaje, svg.querySelector('[data-nave]'));
    for (const copia of [0, 400]) {
      for (let i = 0; i < 9; i++) {
        const x = copia + azar(i * 4.1 + 2) * 400;
        const y = 70 + azar(i * 2.3 + 9) * 170;
        el(this.paisaje, 'path', {
          d: `M${x.toFixed(1)} ${y.toFixed(1)}h${(18 + azar(i) * 40).toFixed(1)}`,
          stroke: '#d9ccff',
          'stroke-width': 1.6,
          'stroke-linecap': 'round',
        });
      }
    }

    const pantalla = pintarPantalla(svg, NARIZ);
    el(pantalla, 'path', { d: `M226 ${PISO}H376`, stroke: '#6c5ca8', 'stroke-width': 1.4 });
    this.barras = Array.from({ length: CUADROS }, (_, i) =>
      el(pantalla, 'rect', {
        x: 229 + i * 12.4,
        y: PISO - 4,
        width: 8.6,
        height: 4,
        rx: 2,
        fill: COLOR.barato,
      }),
    );
    // La raya del presupuesto: lo que la pasa es un cuadro que no llegó a tiempo.
    const raya = PISO - UN_CUADRO;
    el(pantalla, 'path', {
      d: `M226 ${raya}H376`,
      stroke: PALETA.luz,
      'stroke-width': 1.4,
      'stroke-dasharray': '5 4',
    });
    const rotulo = el(pantalla, 'text', {
      x: 376,
      y: raya - 6,
      'text-anchor': 'end',
      'font-family': "'JetBrains Mono', Consolas, monospace",
      'font-size': 10,
      'font-weight': 700,
      fill: PALETA.luz,
    });
    rotulo.textContent = '16 ms';
    this.volar(this.costo(), true);
  }

  private volar(costo: Costo, primeraVez = false): void {
    if (costo === this.costoVisto) return;
    this.costoVisto = costo;
    const t = this.quieta || primeraVez ? 0 : 1;

    cuadrosDelCosto(costo, CUADROS).forEach((c, i) => {
      const alto = Math.min(c, 2.3) * UN_CUADRO;
      gsap.to(this.barras[i], {
        attr: { y: PISO - alto, height: alto, fill: c > 1 ? COLOR.caro : COLOR[costo] },
        duration: 0.35 * t,
        delay: i * 0.025 * t,
        ease: 'back.out(1.6)',
        overwrite: 'auto',
      });
    });

    // El paisaje pasa de corrido o a los tirones, según cuántos cuadros llegan.
    this.vuelo?.kill();
    if (this.paisaje && !this.quieta) {
      const saltos = saltosDelPaisaje(costo);
      gsap.set(this.paisaje, { x: 0 });
      this.vuelo = gsap.to(this.paisaje, {
        x: -400,
        duration: 2.4,
        ease: saltos ? `steps(${saltos})` : 'none',
        repeat: -1,
      });
    }

    const nave = this.nave;
    if (!nave) return;
    nave.mirar(300, 120);
    nave.animo(costo === 'barato' ? 'contenta' : costo === 'medio' ? 'atenta' : 'preocupada');
    if (!t) return;
    if (costo === 'caro') nave.trabarse(7);
    else if (costo === 'medio') nave.trabarse(3);
    else nave.saltito(8);
  }

  private festejar(): void {
    this.nave?.animo('contenta');
    this.nave?.saltito(18);
    const svg = this.host.querySelector('svg');
    if (svg) chispas(svg, 140, 118);
  }
}
