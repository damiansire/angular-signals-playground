import { DestroyRef, Directive, ElementRef, afterNextRender, inject, input } from '@angular/core';
import { gsap } from 'gsap';
import { trazoDelHaz } from './escenas.logica';
import { azar } from '../../../libs/azar';
import { sinMovimiento } from '../../../libs/muelle';
import { el } from '../../../libs/svg';
import { NaveDelManual, PALETA } from './nave-del-manual';
import { VueloDeLaNave } from './vuelo-de-la-nave';

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
export function cieloCentradoEn(y: number, alto = 340): string {
  return `-200 ${y - alto / 2} 800 ${alto}`;
}

/** El de la mayoría: la nave, su pantalla y lo que descansa debajo (y 18 a 240). */
export const CIELO_DEL_ESCENARIO = cieloCentradoEn(129);

/** Dónde vive la pantalla de la nave en cada lámina: a la derecha, proyectada desde la nariz. */
export const PANTALLA = { x: 214, y: 26, ancho: 174, alto: 178 } as const;

/** La punta de la nave en su propio dibujo (`.esc-nave`): de ahí sale el haz hacia la pantalla. */
export const NARIZ_DE_LA_NAVE = { x: 66, y: 0 } as const;

/**
 * La base de las láminas: la noche de la ventanilla, la nave del capitán en su carril y lo que
 * muestra su pantalla, con el ciclo de vida de GSAP atado al componente. La nave va en su propio
 * SVG (`.esc-nave`, en el carril que le deja la página con `--pm-nave-*`), y la pantalla es de la
 * página (`[data-pantalla]`, hermana de la escena en la ventanilla): la lámina dibuja adentro, en
 * `render`, y traza el haz que la une con la nariz. En el mismo cielo, la pantalla en HTML se le
 * encimaba a la nave según la proporción de la ventana. Cada lámina dibuja lo suyo en `armar` y
 * reacciona a la demo con `reaccion`, que corre dentro del mismo contexto: al desmontar la página se
 * revierte todo, también los bucles.
 */
@Directive()
export abstract class EscenaDelManual {
  /**
   * Dónde se dibuja la pantalla: un SVG con el `viewBox` de `PANTALLA`, que pone la página. Como
   * `Element`: el chequeo de plantillas tipa toda referencia a un elemento como `HTMLElement`.
   */
  readonly render = input.required<Element>();
  protected readonly host: HTMLElement = inject(ElementRef).nativeElement;
  protected readonly quieta = sinMovimiento();
  protected nave: NaveDelManual | null = null;
  private ctx: gsap.Context | null = null;
  private readonly pasoDeHoja = inject(VueloDeLaNave);
  private soltarDespegue: (() => void) | null = null;
  private haz: SVGPathElement | null = null;

  constructor() {
    const destruir = inject(DestroyRef);
    afterNextRender(() => {
      const cielo = this.host.querySelector<SVGSVGElement>('svg.esc');
      const render = this.render();
      if (!cielo || !(render instanceof SVGSVGElement)) return;
      this.ctx = gsap.context(() => {
        pintarCielo(cielo, this.semilla);
        const lugar = this.host.querySelector<SVGGElement>('[data-nave]');
        if (lugar) this.nave = new NaveDelManual(lugar);
        this.armarHaz();
        this.armar(render, cielo);
        if (lugar) {
          this.soltarDespegue = this.pasoDeHoja.alDespegar(() => this.despegar(lugar));
          if (this.pasoDeHoja.llegaVolando()) this.aterrizar(lugar);
        }
      }, this.host);
      // El haz sigue a las dos: la ventanilla cambia, y la pantalla crece desde la portada.
      const observador = new ResizeObserver(() => this.trazarHaz());
      observador.observe(this.host);
      const pantalla = this.pantalla();
      if (pantalla) observador.observe(pantalla);
      destruir.onDestroy(() => observador.disconnect());
    });
    destruir.onDestroy(() => {
      this.soltarDespegue?.();
      this.nave?.apagar();
      this.ctx?.revert();
    });
  }

  private pantalla(): HTMLElement | null {
    return this.host.parentElement?.querySelector<HTMLElement>('[data-pantalla]') ?? null;
  }

  protected naveSvg(): SVGSVGElement | null {
    return this.host.querySelector<SVGSVGElement>('.esc-nave');
  }

  /** El haz va en el SVG de la nave, debajo de ella, y se prende cuando la nave ya llegó. */
  private armarHaz(): void {
    const svg = this.naveSvg();
    if (!svg) return;
    this.haz = el(svg, 'path', { fill: PALETA.luz, opacity: 0, 'pointer-events': 'none' });
    svg.insertBefore(this.haz, svg.querySelector('[data-nave]'));
    this.trazarHaz();
    gsap.to(this.haz, { opacity: 0.1, duration: 0.6, delay: this.quieta ? 0 : 0.9 });
  }

  private trazarHaz(): void {
    const svg = this.haz?.ownerSVGElement;
    const caja = this.pantalla()?.getBoundingClientRect();
    const aDibujo = svg?.getScreenCTM()?.inverse();
    if (!this.haz || !caja || !aDibujo) return;
    const punto = (x: number, y: number) => new DOMPoint(x, y).matrixTransform(aDibujo);
    const arriba = punto(caja.left, caja.top);
    const abajo = punto(caja.left, caja.bottom);
    const d = trazoDelHaz(NARIZ_DE_LA_NAVE, {
      izquierda: arriba.x,
      arriba: arriba.y,
      abajo: abajo.y,
    });
    this.haz.setAttribute('d', d ?? '');
  }

  /** Un punto de un SVG en las coordenadas de otro: la nave y su pantalla son dibujos distintos. */
  private convertir(
    x: number,
    y: number,
    desde: SVGGraphicsElement | null,
    hasta: SVGGraphicsElement | null,
  ): { x: number; y: number } | null {
    const de = desde?.getScreenCTM();
    const a = hasta?.getScreenCTM();
    if (!de || !a) return null;
    const p = new DOMPoint(x, y).matrixTransform(de).matrixTransform(a.inverse());
    return { x: p.x, y: p.y };
  }

  private renderSvg(): SVGSVGElement | null {
    const render = this.render();
    return render instanceof SVGSVGElement ? render : null;
  }

  /** La nave mira un punto de la pantalla (en el `viewBox` de `render`). */
  protected mirarLaPantalla(x: number, y: number): void {
    const p = this.convertir(x, y, this.renderSvg(), this.naveSvg());
    if (p) this.nave?.mirar(p.x, p.y);
  }

  /** Dónde queda la nariz de la nave en el dibujo de la pantalla: de ahí sale lo que manda. */
  protected narizEnLaPantalla(): { x: number; y: number } {
    const { x, y } = NARIZ_DE_LA_NAVE;
    return (
      this.convertir(x, y, this.naveSvg(), this.renderSvg()) ?? {
        x: PANTALLA.x - 30,
        y: PANTALLA.y + PANTALLA.alto / 2,
      }
    );
  }

  /** Estrellitas que saltan de la nave: el festejo de una página sana. */
  protected chispasDeLaNave(): void {
    const svg = this.naveSvg();
    if (svg) chispas(svg, 0, -6);
  }

  /** Cuántos píxeles de pantalla vale una unidad del dibujo donde vive la nave. */
  private escalaDe(lugar: SVGGElement): number | null {
    const padre = lugar.parentNode;
    const escala = padre instanceof SVGGraphicsElement ? padre.getScreenCTM()?.a : undefined;
    return escala ? escala : null;
  }

  /**
   * Pasar de página es seguir viaje: la nave se echa atrás, prende el motor a fondo y sale por la
   * derecha, cruzando lo que tenga adelante. Resuelve cuando ya salió; si la página se desmonta a
   * mitad de camino, igual resuelve, para que el libro no se quede esperando.
   */
  private despegar(lugar: SVGGElement): Promise<void> {
    const nave = this.nave;
    const escala = this.escalaDe(lugar);
    if (!nave || !escala || !this.ctx || this.quieta) return Promise.resolve();
    this.reaccion(() => this.alPartir());
    const caja = lugar.getBoundingClientRect();
    const atras = 26 / escala;
    const lejos = (innerWidth - caja.left + 80) / escala + atras;
    nave.animo('contenta');
    const salida = new Promise<void>((listo) => {
      this.reaccion(() => {
        gsap
          .timeline({ onComplete: listo })
          .add(() => nave.propulsar(0.55, 0.18))
          .to(lugar, { x: `-=${atras}`, duration: 0.22, ease: 'power2.out' })
          .add(() => {
            nave.propulsar(3.4, 0.12);
            nave.empujar(-60, 3);
          })
          .to(lugar, { x: `+=${lejos}`, duration: 0.62, ease: 'power3.in' });
      });
    });
    return Promise.race([salida, new Promise<void>((listo) => setTimeout(listo, 1600))]);
  }

  /** La nave que viene de la página anterior entra por la izquierda, frena y se acomoda. */
  private aterrizar(lugar: SVGGElement): void {
    const nave = this.nave;
    const escala = this.escalaDe(lugar);
    if (!nave || !escala || this.quieta) return;
    const lejos = (lugar.getBoundingClientRect().right + 80) / escala;
    nave.propulsar(3, 0);
    gsap
      .timeline()
      .from(lugar, { x: `-=${lejos}`, duration: 0.9, ease: 'power3.out' })
      // Frena: la llama se encoge antes de llegar, y al parar se sacude por la inercia.
      .add(() => nave.propulsar(0.5, 0.2), 0.45)
      .add(() => {
        nave.propulsar(1, 0.35);
        nave.empujar(45, 2.5);
      });
  }

  /** Para que cada lámina tenga su propio cielo, igual cada vez. */
  protected abstract readonly semilla: number;

  /** La nave arranca a seguir viaje: el haz que la une con su pantalla se apaga. */
  private alPartir(): void {
    if (this.haz) gsap.to(this.haz, { opacity: 0, duration: 0.2, overwrite: 'auto' });
  }

  /**
   * Lo propio de la lámina, ya con la nave armada: lo de la pantalla en `pantalla` (el `render` de
   * la página, con el `viewBox` de `PANTALLA`) y lo del cielo, si tiene, en `cielo`. Corre una vez,
   * con los SVG a la vista.
   */
  protected abstract armar(pantalla: SVGSVGElement, cielo: SVGSVGElement): void;

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
  // El planeta lejos, arriba: abajo se metía detrás de la nave y le borraba la silueta. En el
  // escenario, a la derecha de la pantalla: arriba a la izquierda flota la ley, y le cruzaba el título.
  const lejos = caja.ancho > ANCHO ? { x: 432, y: 46 } : { x: 40, y: 38 };
  el(cielo, 'circle', { cx: lejos.x, cy: lejos.y, r: 22, fill: `url(#${id}-p)`, opacity: 0.85 });
  el(cielo, 'ellipse', {
    cx: lejos.x,
    cy: lejos.y,
    rx: 36,
    ry: 6,
    fill: 'none',
    stroke: '#ffd9a6',
    'stroke-opacity': 0.4,
    'stroke-width': 2,
    transform: `rotate(-14 ${lejos.x} ${lejos.y})`,
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
