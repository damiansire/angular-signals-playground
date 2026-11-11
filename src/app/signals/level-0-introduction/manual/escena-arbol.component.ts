import { ChangeDetectionStrategy, Component, computed, effect, input } from '@angular/core';
import { gsap } from 'gsap';
import { CIELO_DEL_ESCENARIO, EscenaDelManual } from './escena-del-manual';
import { PALETA, el } from './nave-del-manual';

interface Pieza {
  readonly id: string;
  readonly tag: string;
  readonly x: number;
  readonly y: number;
  readonly ancho: number;
  readonly alto: number;
  readonly color: string;
  /** Renglones de texto: un `<p>` se dibuja como líneas, no como caja. */
  readonly renglones?: readonly number[];
  /** El panel donde la sangría lo pone. */
  readonly panel?: string;
  /** Cuánto cae cuando los tags lo dejan fuera de su panel: al fondo del marco, debajo de él. */
  readonly caida?: number;
}

/**
 * Cada elemento del HTML de la consola es una pieza de la pantalla de la nave, en orden de
 * documento: `<main>` es el marco, `<section>` y `<article>` los paneles, y los títulos y párrafos
 * van adentro de su panel. Que una pieza viva adentro de otra ES el árbol. Debajo de los paneles
 * queda un hueco del marco: ahí caen los hijos de `<main>` que no son paneles.
 */
const PIEZAS: readonly Pieza[] = [
  { id: 'main', tag: 'main', x: 221, y: 33, ancho: 160, alto: 164, color: '#2c2352' },
  { id: 'section', tag: 'section', x: 228, y: 58, ancho: 70, alto: 92, color: '#3e3170' },
  { id: 'h2', tag: 'h2', x: 235, y: 72, ancho: 50, alto: 12, color: PALETA.luz, panel: 'section' },
  {
    id: 'p1',
    tag: 'p',
    x: 235,
    y: 94,
    ancho: 52,
    alto: 27,
    color: '#cbc0f0',
    renglones: [52, 44, 34],
    panel: 'section',
  },
  { id: 'article', tag: 'article', x: 304, y: 58, ancho: 70, alto: 92, color: '#3e3170' },
  {
    id: 'h3',
    tag: 'h3',
    x: 311,
    y: 72,
    ancho: 42,
    alto: 10,
    color: PALETA.acento,
    panel: 'article',
    caida: 88,
  },
  {
    id: 'p2',
    tag: 'p',
    x: 311,
    y: 94,
    ancho: 50,
    alto: 16,
    color: '#cbc0f0',
    renglones: [50, 38],
    panel: 'article',
    caida: 82,
  },
];
const INDICE = new Map(PIEZAS.map((p, i) => [p.id, i]));
/** Un panel sin hijos es una tira: vacío, no ocupa nada. */
const ALTO_VACIO = 9;
const AVISO = '#ff7676';

/**
 * Lámina de la ley 1, que es el escenario de su página: lo que se dibuja (`render`, una columna de
 * la pantalla de la nave, al lado del código y del árbol) se arma con los tags que se tocan. Cada
 * pieza va a donde la ponen los tags, no la sangría: si un panel se cierra antes de tiempo, queda
 * chico y vacío, sus hijos caen fuera de él y la nave se preocupa. Moviendo el cierre, suben a su
 * lugar.
 */
@Component({
  selector: 'app-escena-arbol',
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
export class EscenaArbolComponent extends EscenaDelManual {
  /** Los elementos revelados, por id. */
  readonly reveladas = input<readonly string[]>([]);
  /** Los elementos que los tags dejan fuera del panel donde los pone la sangría. */
  readonly fuera = input<readonly string[]>([]);
  /** La página quedó sana: la nave festeja. */
  readonly sano = input(false);
  /** La portada se abrió: la pantalla ya muestra la demo. */
  readonly abierta = input(true);

  protected readonly semilla = 11;
  protected readonly cielo = CIELO_DEL_ESCENARIO;
  private readonly armadas = computed(() => this.reveladas().filter((id) => INDICE.has(id)));
  private readonly caidas = computed(() =>
    this.armadas().filter((id) => this.fuera().includes(id)),
  );
  protected readonly descripcion = computed(() => {
    const caidas = this.caidas().length;
    return (
      `Pantalla de la nave: ${this.armadas().length} de ${PIEZAS.length} piezas` +
      (caidas ? `, ${caidas} fuera de su panel` : '')
    );
  });

  private piezas: SVGGElement[] = [];
  private cajas = new Map<string, SVGRectElement>();
  private aviso: SVGRectElement | null = null;
  private etiquetas: SVGGElement | null = null;
  private vistas = new Set<string>();
  private caidasVistas = new Set<string>();

  constructor() {
    super();
    effect(() => {
      const ahora = new Set(this.armadas());
      const fuera = new Set(this.fuera());
      if (this.lista) this.reaccion(() => this.mostrar(ahora, fuera));
    });
    effect(() => {
      if (this.sano() && this.lista) this.reaccion(() => this.festejar());
    });
    effect(() => {
      if (this.abierta() && this.lista) this.reaccion(() => this.alAbrirse());
    });
  }

  protected armar(render: SVGSVGElement): void {
    const pantalla = el(render, 'g');
    // El lugar de cada pieza, punteado: la pantalla vacía se lee como algo por armar. Los de adentro
    // del marco van encima de él: un panel que quedó chico deja a la vista los lugares que perdió.
    const punteado = {
      fill: 'none',
      stroke: '#7d6cc4',
      'stroke-width': 1.3,
      'stroke-dasharray': '4 4',
      opacity: 0.8,
    };
    const marco = el(pantalla, 'g', punteado);
    const fantasma = el(pantalla, 'g', punteado);
    for (const p of PIEZAS) {
      el(p.id === 'main' ? marco : fantasma, 'rect', {
        x: p.x,
        y: p.y,
        width: p.ancho,
        height: p.renglones ? 12 : p.alto,
        rx: 5,
      });
    }
    // El aviso: lo que cayó fuera de su panel, rodeado en rojo.
    const aviso = el(pantalla, 'rect', {
      x: 305,
      y: 154,
      width: 68,
      height: 39,
      rx: 7,
      fill: 'rgb(255 118 118 / 12%)',
      stroke: AVISO,
      'stroke-width': 1.4,
      'stroke-dasharray': '5 3',
      opacity: 0,
    });
    this.aviso = aviso;
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
        const caja = el(g, 'rect', {
          x: p.x,
          y: p.y,
          width: p.ancho,
          height: p.alto,
          rx: p.tag === 'main' ? 9 : 5,
          fill: p.color,
        });
        this.cajas.set(p.id, caja);
        if (p.tag === 'main') {
          for (const [i, c] of ['#ff7a8a', '#ffd27a', '#7fdcae'].entries()) {
            el(g, 'circle', { cx: p.x + 10 + i * 9, cy: p.y + 10, r: 3, fill: c });
          }
        }
      }
      gsap.set(g, { svgOrigin: `${p.x + p.ancho / 2} ${p.y + Math.min(p.alto, 24) / 2}` });
      return g;
    });
    this.piezas[0].after(fantasma, aviso);
    this.etiquetas = el(render, 'g', { 'pointer-events': 'none' });
    this.mostrar(new Set(this.armadas()), new Set(this.fuera()), true);
  }

  private mostrar(
    ahora: ReadonlySet<string>,
    fuera: ReadonlySet<string>,
    primeraVez = false,
  ): void {
    const nuevas = PIEZAS.filter((p) => ahora.has(p.id) && !this.vistas.has(p.id));
    const idas = PIEZAS.filter((p) => !ahora.has(p.id) && this.vistas.has(p.id));
    const caidas = new Set([...ahora].filter((id) => fuera.has(id)));
    // Las que ya estaban a la vista y cambiaron de lugar porque se movió el cierre.
    const mudadas = PIEZAS.filter(
      (p) =>
        this.vistas.has(p.id) &&
        ahora.has(p.id) &&
        caidas.has(p.id) !== this.caidasVistas.has(p.id),
    );
    this.vistas = new Set(ahora);
    this.caidasVistas = caidas;
    const t = this.quieta || primeraVez ? 0 : 1;

    // Un panel cuyos hijos quedaron afuera no tiene nada adentro: una tira vacía.
    for (const [id, caja] of this.cajas) {
      const p = PIEZAS[INDICE.get(id) ?? 0];
      const vacio = PIEZAS.some((h) => h.panel === id && fuera.has(h.id));
      gsap.to(caja, {
        attr: { height: vacio ? ALTO_VACIO : p.alto },
        duration: 0.35 * t,
        ease: vacio ? 'power2.in' : 'back.out(1.6)',
        overwrite: 'auto',
      });
    }

    for (const p of idas) {
      gsap.to(this.piezas[INDICE.get(p.id) ?? 0], {
        opacity: 0,
        scale: 0.7,
        duration: 0.2 * t,
        ease: 'power2.in',
        overwrite: 'auto',
      });
    }
    for (const p of nuevas) {
      const g = this.piezas[INDICE.get(p.id) ?? 0];
      const cae = caidas.has(p.id);
      // Aparece donde la pone la sangría y, si los tags la dejan afuera, se cae de ahí.
      gsap
        .timeline()
        .fromTo(
          g,
          { opacity: 0, scale: 0.55, y: 0 },
          { opacity: 1, scale: 1, duration: 0.32 * t, ease: 'back.out(2.2)' },
        )
        .to(g, { y: cae ? (p.caida ?? 0) : 0, duration: 0.55 * t, ease: 'bounce.out' }, '+=0.12');
      if (t) this.rotular(p, cae);
    }
    for (const p of mudadas) {
      const sube = !caidas.has(p.id);
      gsap.to(this.piezas[INDICE.get(p.id) ?? 0], {
        y: sube ? 0 : (p.caida ?? 0),
        duration: 0.6 * t,
        delay: sube ? 0.2 * t : 0,
        ease: sube ? 'back.out(1.8)' : 'bounce.out',
        overwrite: 'auto',
      });
    }

    if (this.aviso) {
      gsap.to(this.aviso, {
        opacity: caidas.size > 0 ? 1 : 0,
        duration: 0.25 * t,
        delay: caidas.size > 0 ? 0.6 * t : 0,
        overwrite: 'auto',
      });
    }

    const nave = this.nave;
    if (!nave) return;
    const ultima = nuevas.at(-1) ?? mudadas.at(-1);
    if (ultima) {
      const dy = caidas.has(ultima.id) ? (ultima.caida ?? 0) : 0;
      this.mirarLaPantalla(ultima.x + ultima.ancho / 2, ultima.y + dy + 6);
      nave.empujar(-30, 1.5);
    } else if (ahora.size === 0) {
      // Vacía, mira hacia el código: es de ahí que va a venir la primera pieza.
      this.mirarLaPantalla(-120, 150);
    }
    nave.animo(
      caidas.size > 0
        ? 'preocupada'
        : ahora.size === PIEZAS.length
          ? 'contenta'
          : ahora.size === 0
            ? 'atenta'
            : 'tranquila',
    );
  }

  /** El nombre del tag sube un momento sobre la pieza que acaba de llegar, donde termina. */
  private rotular(p: Pieza, cae: boolean): void {
    if (!this.etiquetas) return;
    const y = p.y + (cae ? (p.caida ?? 0) : 0);
    const g = el(this.etiquetas, 'g');
    const texto = `<${p.tag}>`;
    const ancho = texto.length * 6.6 + 10;
    const cx = Math.min(p.x + p.ancho / 2, 386 - ancho / 2);
    el(g, 'rect', {
      x: cx - ancho / 2,
      y: y - 9,
      width: ancho,
      height: 16,
      rx: 8,
      fill: PALETA.tinta,
      stroke: cae ? AVISO : PALETA.luz,
      'stroke-width': 1,
    });
    const t = el(g, 'text', {
      x: cx,
      y: y + 3,
      'text-anchor': 'middle',
      'font-family': "'JetBrains Mono', Consolas, monospace",
      'font-size': 10.5,
      'font-weight': 700,
      fill: cae ? '#ffb3b3' : PALETA.luz,
    });
    t.textContent = texto;
    gsap
      .timeline({ onComplete: () => g.remove() })
      .fromTo(
        g,
        { opacity: 0, y: 6 },
        { opacity: 1, y: 0, duration: 0.22, ease: 'back.out(2)', delay: cae ? 0.75 : 0 },
      )
      .to(g, { opacity: 0, y: -8, duration: 0.3, ease: 'power1.in' }, '+=0.7');
  }

  /**
   * "Leer": la nave salta de gusto cuando se agranda su pantalla y, ya con la demo adentro, mira el
   * código, de donde va a venir la primera pieza.
   */
  private alAbrirse(): void {
    this.nave?.animo('contenta');
    this.nave?.saltito(14);
    gsap.delayedCall(this.quieta ? 0 : 0.6, () => {
      this.nave?.animo('atenta');
      this.mirarLaPantalla(-120, 150);
    });
  }

  /** Cuando el título y el párrafo ya subieron a su panel, no mientras suben. */
  private festejar(): void {
    gsap.delayedCall(this.quieta ? 0 : 0.8, () => {
      this.nave?.animo('contenta');
      this.nave?.saltito(18);
      this.chispasDeLaNave();
      // Con la llama más larga: la nave queda lista para seguir viaje.
      this.nave?.propulsar(1.35, 0.4);
    });
  }
}
