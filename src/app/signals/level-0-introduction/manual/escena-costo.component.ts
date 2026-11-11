import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  input,
  untracked,
} from '@angular/core';
import { gsap } from 'gsap';
import {
  ESTACIONES,
  type MutationKind,
  estacionesQueCorren,
  recorridoDelFlujo,
  renderCost,
  stagesTriggered,
} from '../../../libs/render-pipeline';
import { CIELO_DEL_ESCENARIO, EscenaDelManual } from './escena-del-manual';
import { PALETA, azar, el } from './nave-del-manual';
import { type Costo, saltosDelPaisaje } from './escenas.logica';

/** Una corrida del cuadro; `n` sube con cada una, aunque se repita la misma propiedad. */
export interface CorridaDelCuadro {
  readonly n: number;
  readonly kind: MutationKind;
  readonly propiedad: string;
}

const MONO = "'JetBrains Mono', Consolas, monospace";
/**
 * El pipeline en vertical, en la pantalla de la nave: una fila por estación. Los rótulos van más
 * grandes que en las otras pantallas (13.5 unidades el más chico): en un teléfono la escena se
 * achica y tienen que llegar a 11 px.
 */
const PUNTO_X = 252;
const CARRIL_X = 234;
const ROTULO_X = 266;
const fila = (i: number): number => 44 + i * 38;
const COLOR: Record<Costo, string> = { barato: '#5fd39a', medio: '#f0b34a', caro: '#ff7676' };
const QUIETO = { fill: '#3e3170', stroke: '#8f80cc' };
const FUENTE = { fill: '#26346e', stroke: '#8fb3ff' };
const ROTULO = { quieto: '#b9aee0', corre: '#f2ecff', salteado: '#8a7fb5' };

interface Estacion {
  readonly punto: SVGCircleElement;
  readonly rotulo: SVGTextElement;
}

/** El veredicto de una corrida, como etiqueta: suelto al lado de style, se leía como de style. */
interface Veredicto {
  readonly grupo: SVGGElement;
  readonly fondo: SVGRectElement;
  readonly texto: SVGTextElement;
}
/** Hasta que se corre, lo que cuesta la propiedad del código no se sabe. */
const SIN_CORRER = '¿?';
const GRIS = '#8a7fb5';
/** Lo que hay entre el final de "DOM" y el borde, en unidades del dibujo. */
const LUGAR_DE_LA_PROPIEDAD = 72;

/**
 * Lámina de la ley 3, que es el escenario de su página: la nave vuela y su pantalla (`render`, al
 * lado del código) es el pipeline de render, de DOM a composite, con las capas caras (layout y paint) marcadas. Cada corrida del
 * cuadro dibuja su flujo de arriba abajo: un cambio caro pasa por todas; transform salta por el
 * carril de la izquierda, por encima de las caras. Y lo que cuesta se nota en el vuelo: barato, el
 * paisaje pasa de corrido; caro, a los tirones, y la nave se traba.
 */
@Component({
  selector: 'app-escena-costo',
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
export class EscenaCostoComponent extends EscenaDelManual {
  readonly corrida = input<CorridaDelCuadro | null>(null);
  /**
   * La propiedad que está en el código. Si no es la de la última corrida, la pantalla no muestra
   * esa corrida: mostraba `transform` y "barato" con `textContent` en el código.
   */
  readonly enElCodigo = input<string | null>(null);
  readonly sano = input(false);

  protected readonly semilla = 37;
  protected readonly cielo = CIELO_DEL_ESCENARIO;
  protected readonly descripcion = computed(() => {
    const c = this.corrida();
    const enElCodigo = this.enElCodigo();
    if (enElCodigo !== null && c?.propiedad !== enElCodigo) {
      return `Pantalla de la nave: el pipeline de render, quieto; ${enElCodigo} todavía no corrió`;
    }
    if (!c) return 'Pantalla de la nave: el pipeline de render, quieto';
    return (
      `Pantalla de la nave: ${c.propiedad} pasa por ${stagesTriggered(c.kind).join(', ')}; ` +
      `cuesta ${renderCost(c.kind)}`
    );
  });

  private estaciones: Estacion[] = [];
  private flujo: SVGGElement | null = null;
  private lectura: { propiedad: SVGTextElement; costo: Veredicto } | null = null;
  private pintada: CorridaDelCuadro | null = null;
  private paisaje: SVGGElement | null = null;
  private vuelo: gsap.core.Tween | null = null;
  private dibujo: gsap.core.Timeline | null = null;
  private vista = 0;

  constructor() {
    super();
    effect(() => {
      const corrida = this.corrida();
      if (!this.lista || !corrida || corrida.n === this.vista) return;
      this.vista = corrida.n;
      this.reaccion(() => this.pintar(corrida, this.quieta ? 0 : 1));
    });
    effect(() => {
      const enElCodigo = this.enElCodigo();
      if (!this.lista || enElCodigo === null) return;
      if (this.pintada?.propiedad === enElCodigo) return;
      // Dar toda la vuelta a la rueda vuelve a lo último que corrió: eso sí se sabe.
      const corrida = untracked(this.corrida);
      this.reaccion(() =>
        corrida?.propiedad === enElCodigo ? this.pintar(corrida, 0) : this.sinCorrer(enElCodigo),
      );
    });
    effect(() => {
      if (this.sano() && this.lista) this.reaccion(() => this.festejar());
    });
  }

  protected armar(render: SVGSVGElement, cielo: SVGSVGElement): void {
    this.armarPaisaje(cielo);
    this.armarPipeline(el(render, 'g'));
    this.volar(null);
    const corrida = this.corrida();
    const enElCodigo = this.enElCodigo();
    if (corrida && (enElCodigo === null || corrida.propiedad === enElCodigo)) {
      this.vista = corrida.n;
      this.pintar(corrida, 0);
    } else if (enElCodigo !== null) {
      this.vista = corrida?.n ?? 0;
      this.sinCorrer(enElCodigo);
    }
  }

  /** Las estelas del viaje, en todo el cielo: dos tiras iguales, una detrás de la otra. */
  private armarPaisaje(cielo: SVGSVGElement): void {
    this.paisaje = el(cielo, 'g', { opacity: 0.55 });
    for (const copia of [0, 800]) {
      for (let i = 0; i < 16; i++) {
        const x = -200 + copia + azar(i * 4.1 + 2) * 800;
        const y = 20 + azar(i * 2.3 + 9) * 220;
        el(this.paisaje, 'path', {
          d: `M${x.toFixed(1)} ${y.toFixed(1)}h${(18 + azar(i) * 40).toFixed(1)}`,
          stroke: '#d9ccff',
          'stroke-width': 1.6,
          'stroke-linecap': 'round',
        });
      }
    }
  }

  private armarPipeline(pantalla: SVGGElement): void {
    // Las capas caras, detrás de layout y paint: lo que transform sobrevuela.
    el(pantalla, 'rect', {
      x: 240,
      y: fila(2) - 16,
      width: 142,
      height: fila(3) - fila(2) + 32,
      rx: 10,
      fill: 'rgb(255 118 118 / 8%)',
      stroke: 'rgb(255 118 118 / 45%)',
      'stroke-width': 1.4,
      'stroke-dasharray': '4 4',
    });
    const caras = el(pantalla, 'text', {
      x: 376,
      y: (fila(2) + fila(3)) / 2 + 4.8,
      'text-anchor': 'end',
      'font-family': MONO,
      'font-size': 13.5,
      'font-weight': 700,
      fill: '#ffb3b3',
    });
    caras.textContent = 'capas caras';

    // El riel: todo el recorrido posible, punteado.
    for (let i = 0; i < ESTACIONES.length - 1; i++) {
      el(pantalla, 'path', {
        d: `M${PUNTO_X} ${fila(i) + 8}V${fila(i + 1) - 8}`,
        stroke: '#5b4a96',
        'stroke-width': 2,
        'stroke-dasharray': '3 4',
      });
    }
    this.flujo = el(pantalla, 'g');

    this.estaciones = ESTACIONES.map((nombre, i) => {
      const color = i === 0 ? FUENTE : QUIETO;
      const punto = el(pantalla, 'circle', {
        cx: PUNTO_X,
        cy: fila(i),
        r: 7,
        fill: color.fill,
        stroke: color.stroke,
        'stroke-width': 2,
      });
      const rotulo = el(pantalla, 'text', {
        x: ROTULO_X,
        y: fila(i) + 5,
        'font-family': MONO,
        'font-size': 14.5,
        'font-weight': 700,
        fill: i === 0 ? '#c4d4ff' : ROTULO.quieto,
      });
      rotulo.textContent = nombre;
      return { punto, rotulo };
    });

    // Arriba a la derecha, al lado de DOM y style: qué se tocó y cuánto costó.
    const propiedad = el(pantalla, 'text', {
      x: 378,
      y: fila(0) + 5,
      'text-anchor': 'end',
      'font-family': MONO,
      'font-size': 13.5,
      'font-weight': 700,
      fill: '#b9aee0',
    });
    // Una etiqueta y no una palabra suelta: al lado de style, "barato" se leía como de style.
    const grupo = el(pantalla, 'g', { opacity: 0 });
    const fondo = el(grupo, 'rect', { y: fila(1) - 11, height: 22, rx: 11, 'stroke-width': 1.4 });
    const texto = el(grupo, 'text', {
      x: 371,
      y: fila(1) + 5,
      'text-anchor': 'end',
      'font-family': 'Georgia, serif',
      'font-style': 'italic',
      'font-weight': 700,
      'font-size': 15,
    });
    this.lectura = { propiedad, costo: { grupo, fondo, texto } };
  }

  /**
   * Una corrida: el flujo se dibuja de arriba abajo y, al llegar, se nota en el vuelo. Con `t` en 0,
   * de una, sin animar.
   */
  private pintar(corrida: CorridaDelCuadro, t: number): void {
    const costo = renderCost(corrida.kind);
    const color = COLOR[costo];
    const corre = estacionesQueCorren(corrida.kind);
    const piezas = recorridoDelFlujo(corrida.kind);
    const total = piezas.at(-1)?.fin ?? 0;
    this.dibujo?.kill();
    this.flujo?.replaceChildren();

    this.pintada = corrida;
    // Todo vuelve a quieto, y las que el cambio no dispara quedan huecas desde el arranque.
    this.estaciones.forEach((e, i) => {
      if (i > 0) {
        gsap.set(e.punto, {
          attr: {
            fill: corre[i] ? QUIETO.fill : '#1c1434',
            stroke: corre[i] ? QUIETO.stroke : '#6c5ca8',
            'stroke-dasharray': corre[i] ? 'none' : '2.5 2.5',
            r: 7,
          },
        });
      }
      gsap.set(e.rotulo, {
        attr: { fill: i === 0 ? '#c4d4ff' : corre[i] ? ROTULO.quieto : ROTULO.salteado },
      });
    });
    if (this.lectura) {
      this.rotularPropiedad(corrida.propiedad);
      gsap.set(this.lectura.costo.grupo, { opacity: 0 });
    }

    const dibujo = gsap.timeline();
    this.dibujo = dibujo;
    const pulso =
      this.flujo && t ? el(this.flujo, 'circle', { r: 4.5, fill: color, opacity: 0 }) : null;
    for (const pieza of piezas) {
      if (!this.flujo) break;
      const trazo = el(this.flujo, 'path', {
        d: this.trazoDe(pieza.desde, pieza.hasta),
        fill: 'none',
        stroke: color,
        'stroke-width': 4,
        'stroke-linecap': 'round',
        'stroke-linejoin': 'round',
        pathLength: 1,
        'stroke-dasharray': 1,
        'stroke-dashoffset': t ? 1 : 0,
      });
      if (!t) continue;
      // El pulso viaja por la punta del trazo, como en el pipeline de la demo vieja.
      const largo = trazo.getTotalLength();
      const tramo: gsap.core.Tween = gsap.to(trazo, {
        attr: { 'stroke-dashoffset': 0 },
        duration: pieza.fin - pieza.retraso,
        ease: 'none',
        onUpdate: () => {
          if (!pulso) return;
          const p = trazo.getPointAtLength(tramo.progress() * largo);
          gsap.set(pulso, { attr: { cx: p.x, cy: p.y }, opacity: 0.95 });
        },
      });
      dibujo.add(tramo, pieza.retraso);
    }
    // Cada estación se enciende cuando el flujo llega a ella.
    for (const pieza of [{ hasta: 0, fin: 0 }, ...piezas]) {
      const e = this.estaciones[pieza.hasta];
      dibujo.add(() => this.encender(e, pieza.hasta, color, t), pieza.fin);
    }
    dibujo.add(() => {
      pulso?.remove();
      if (this.lectura) {
        this.veredicto(costo, color);
        if (t) {
          gsap.fromTo(
            this.lectura.costo.grupo,
            { scale: 0.5, transformOrigin: '100% 50%' },
            { scale: 1, duration: 0.3, ease: 'back.out(3)' },
          );
        }
      }
      this.volar(costo, t);
    }, total);
    if (!t) dibujo.progress(1);
  }

  /**
   * Lo que se tocó, al lado de DOM. Achica la letra si no entra: a 13,5 "textContent" se montaba
   * sobre "DOM".
   */
  private rotularPropiedad(texto: string): void {
    const rotulo = this.lectura?.propiedad;
    if (!rotulo) return;
    rotulo.textContent = texto;
    rotulo.setAttribute(
      'font-size',
      String(Math.min(13.5, LUGAR_DE_LA_PROPIEDAD / (texto.length * 0.6))),
    );
  }

  /** La etiqueta del costo, del ancho de lo que dice. */
  private veredicto(texto: string, color: string): void {
    const costo = this.lectura?.costo;
    if (!costo) return;
    costo.texto.textContent = texto;
    costo.texto.setAttribute('fill', color);
    const ancho = texto.length * 8 + 16;
    costo.fondo.setAttribute('x', String(379 - ancho));
    costo.fondo.setAttribute('width', String(ancho));
    costo.fondo.setAttribute('fill', `color-mix(in srgb, ${color} 14%, transparent)`);
    costo.fondo.setAttribute('stroke', color);
    gsap.set(costo.grupo, { opacity: 1 });
  }

  /**
   * La propiedad del código todavía no corrió: la pantalla vuelve a quieta, sin el flujo de la
   * corrida anterior, con la propiedad nueva y su costo por saber.
   */
  private sinCorrer(propiedad: string): void {
    this.pintada = null;
    this.dibujo?.kill();
    this.flujo?.replaceChildren();
    this.estaciones.forEach((e, i) => {
      if (i > 0) {
        gsap.set(e.punto, {
          attr: { fill: QUIETO.fill, stroke: QUIETO.stroke, 'stroke-dasharray': 'none', r: 7 },
        });
      }
      gsap.set(e.rotulo, { attr: { fill: i === 0 ? '#c4d4ff' : ROTULO.quieto } });
    });
    this.rotularPropiedad(propiedad);
    this.veredicto(SIN_CORRER, GRIS);
    this.volar(null);
  }

  private encender(e: Estacion, i: number, color: string, t: number): void {
    if (i > 0) {
      gsap.set(e.punto, { attr: { fill: color, stroke: PALETA.tinta } });
      gsap.set(e.rotulo, { attr: { fill: ROTULO.corre } });
    }
    if (t) {
      gsap.fromTo(
        e.punto,
        { attr: { r: 7 } },
        { attr: { r: 10 }, duration: 0.1, yoyo: true, repeat: 1, ease: 'power2.out' },
      );
    }
  }

  /** De una estación a otra: derecho si son vecinas; si no, por el carril de la izquierda. */
  private trazoDe(desde: number, hasta: number): string {
    const a = fila(desde);
    const b = fila(hasta);
    if (hasta === desde + 1) return `M${PUNTO_X} ${a}V${b}`;
    const x = CARRIL_X;
    return (
      `M${PUNTO_X - 7} ${a}H${x + 9}Q${x} ${a} ${x} ${a + 9}` +
      `V${b - 9}Q${x} ${b} ${x + 9} ${b}H${PUNTO_X - 7}`
    );
  }

  /**
   * El vuelo según lo que cuesta cada cuadro: barato, el paisaje de corrido; caro, a los tirones.
   * Sin corrida todavía, la nave vuela tranquila.
   */
  private volar(costo: Costo | null, t = 0): void {
    this.vuelo?.kill();
    if (this.paisaje && !this.quieta) {
      const saltos = costo ? saltosDelPaisaje(costo) * 2 : 0;
      this.vuelo = gsap.fromTo(
        this.paisaje,
        { x: 0 },
        { x: -800, duration: 4.8, ease: saltos ? `steps(${saltos})` : 'none', repeat: -1 },
      );
    }
    const nave = this.nave;
    if (!nave) return;
    this.mirarLaPantalla(300, 110);
    if (!costo) return;
    nave.animo(costo === 'barato' ? 'contenta' : costo === 'medio' ? 'atenta' : 'preocupada');
    if (!t) return;
    if (costo === 'caro') nave.trabarse(7);
    else if (costo === 'medio') nave.trabarse(3);
    else nave.saltito(8);
  }

  private festejar(): void {
    // Después de que el flujo llega: si no, el saltito se pisa con el dibujo.
    const dibujo = this.dibujo;
    const espera = dibujo ? (1 - dibujo.progress()) * dibujo.duration() : 0;
    gsap.delayedCall(espera, () => {
      this.nave?.animo('contenta');
      this.nave?.saltito(18);
      this.chispasDeLaNave();
    });
  }
}
