import { gsap } from 'gsap';

import { azar } from '../../../libs/azar';
import { sinMovimiento } from '../../../libs/muelle';
import { el } from '../../../libs/svg';

/** La nave del capitán, con la paleta que tiene en el prólogo. Sin negro: la tinta tiene tono. */
export const PALETA = {
  claro: '#f6f1e8',
  medio: '#cfc5cf',
  oscuro: '#6f6280',
  acento: '#eb9b3c',
  luz: '#ffd27a',
  tinta: '#2b1b33',
} as const;

export type Animo = 'tranquila' | 'atenta' | 'preocupada' | 'contenta';

/** Cejas (grados hacia adentro, + es preocupación) y tamaño de los ojos de cada ánimo. */
const CARAS: Record<Animo, { cejas: number; ojos: number; alto: number }> = {
  tranquila: { cejas: 0, ojos: 1, alto: 0 },
  atenta: { cejas: -6, ojos: 1.12, alto: -1.5 },
  preocupada: { cejas: 20, ojos: 1.2, alto: -2.5 },
  contenta: { cejas: -4, ojos: 0.86, alto: -1 },
};

const QUEJAS = ['¡ey!', '¡piloto a bordo!', '¡la pintura!'];

/** Un muelle: un toque no fija una pose, le suma velocidad. Por eso los toques se acumulan. */
interface Muelle {
  x: number;
  v: number;
  readonly k: number;
  readonly d: number;
}
const muelle = (k: number, d: number): Muelle => ({ x: 0, v: 0, k, d });

let instancias = 0;

/**
 * La nave del capitán como personaje de las láminas del manual: piloto con ojos en tres cuartos,
 * cejas, antena y llama. Cada capa tiene su dueño: `vida` flota sola, `gesto` la mueven las
 * reacciones de la escena (saltos, sustos) y `cuerpo` lo mueven los muelles de los toques, así
 * ninguna pisa a otra.
 *
 * Se arma dentro del `<g>` que la escena le da, ya ubicado. La escena la crea dentro de su
 * `gsap.context`, y al revertirlo se apaga todo.
 */
export class NaveDelManual {
  private readonly vida: SVGGElement;
  private readonly gesto: SVGGElement;
  private readonly cuerpo: SVGGElement;
  private readonly llama: SVGGElement;
  /** Lo que contiene a la llama: se estira con el motor a fondo, sin pisar su chisporroteo. */
  private readonly tobera: SVGGElement;
  /** Cuánto se estira la tobera, a lo largo y a lo ancho. */
  private readonly motor = { x: 1, y: 1 };
  private readonly parpados: SVGGElement[] = [];
  private readonly pupilas: SVGGElement[] = [];
  private readonly cejas: SVGPathElement[] = [];
  private readonly antena: SVGGElement;
  private readonly rot = muelle(150, 7);
  private readonly sq = muelle(260, 10);
  private paciencia = 0;
  private animoActual: Animo = 'tranquila';
  private latiendo = false;
  private parpadeo: gsap.core.Tween | null = null;
  private readonly quieta = sinMovimiento();

  constructor(private readonly padre: SVGGElement) {
    const id = `nm-${++instancias}`;
    const defs = el(padre, 'defs');
    const casco = el(defs, 'linearGradient', { id: `${id}-casco`, x1: 0, y1: 0, x2: 0, y2: 1 });
    el(casco, 'stop', { offset: 0, 'stop-color': PALETA.claro });
    el(casco, 'stop', { offset: 0.55, 'stop-color': PALETA.medio });
    el(casco, 'stop', { offset: 1, 'stop-color': PALETA.oscuro });
    const vidrio = el(defs, 'radialGradient', { id: `${id}-vidrio`, cx: 0.35, cy: 0.3, r: 0.8 });
    el(vidrio, 'stop', { offset: 0, 'stop-color': '#f2fbff' });
    el(vidrio, 'stop', { offset: 1, 'stop-color': '#8fb9dc' });
    const fuego = el(defs, 'linearGradient', { id: `${id}-fuego`, x1: 1, y1: 0, x2: 0, y2: 0 });
    el(fuego, 'stop', { offset: 0, 'stop-color': '#fff1c7' });
    el(fuego, 'stop', { offset: 0.45, 'stop-color': '#f6b562' });
    el(fuego, 'stop', { offset: 1, 'stop-color': '#e2683c', 'stop-opacity': 0 });

    this.vida = el(padre, 'g');
    this.gesto = el(this.vida, 'g');
    this.cuerpo = el(this.gesto, 'g');
    const c = this.cuerpo;

    // La llama detrás del motor: se estira y se encoge sola, y con un susto chisporrotea.
    this.tobera = el(c, 'g', { transform: 'translate(-68 0)' });
    this.llama = el(this.tobera, 'g');
    el(this.llama, 'path', {
      d: 'M0 -9C-18 -10-36 -4-50 0C-36 4-18 10 0 9Z',
      fill: `url(#${id}-fuego)`,
    });
    el(this.llama, 'path', { d: 'M0 -4C-8 -5-16 -2-22 0C-16 2-8 5 0 4Z', fill: '#fff8e2' });

    // Aletas y tobera, atrás del casco.
    el(c, 'path', {
      d: 'M-34 -22-54 -44-26 -40-14 -27Z',
      fill: PALETA.acento,
      stroke: PALETA.tinta,
      'stroke-width': 2,
      'stroke-linejoin': 'round',
    });
    el(c, 'path', {
      d: 'M-34 21-52 40-24 36-12 25Z',
      fill: '#c97a26',
      stroke: PALETA.tinta,
      'stroke-width': 2,
      'stroke-linejoin': 'round',
    });
    el(c, 'path', {
      d: 'M-56 -13-70 -17-70 17-56 13Z',
      fill: '#4a3d58',
      stroke: PALETA.tinta,
      'stroke-width': 2,
      'stroke-linejoin': 'round',
    });

    // El casco: una cápsula orgánica, con la panza más oscura y la franja del capitán.
    el(c, 'path', {
      d: 'M-58 -8C-52 -30 4 -38 42 -24C60 -17 68 -7 68 1C68 10 58 19 40 23C4 31-50 28-58 10Z',
      fill: `url(#${id}-casco)`,
      stroke: PALETA.tinta,
      'stroke-width': 2.4,
    });
    el(c, 'path', {
      d: 'M-50 9C-20 15 22 15 58 6',
      fill: 'none',
      stroke: PALETA.acento,
      'stroke-width': 5,
      'stroke-linecap': 'round',
    });
    el(c, 'path', {
      d: 'M-46 -16C-28 -27 0 -30 24 -27',
      fill: 'none',
      stroke: '#fff',
      'stroke-opacity': 0.7,
      'stroke-width': 3,
      'stroke-linecap': 'round',
    });
    el(c, 'circle', { cx: -30, cy: 0, r: 3.2, fill: PALETA.oscuro });
    el(c, 'circle', { cx: -18, cy: 2, r: 3.2, fill: PALETA.oscuro });

    // La antena con su luz: se queda atrás cuando la nave se mueve.
    this.antena = el(c, 'g', { transform: 'translate(-8 -30)' });
    el(this.antena, 'path', {
      d: 'M0 0-4 -15',
      stroke: PALETA.tinta,
      'stroke-width': 2.2,
      'stroke-linecap': 'round',
    });
    el(this.antena, 'circle', {
      cx: -4,
      cy: -17,
      r: 4.2,
      fill: PALETA.luz,
      stroke: PALETA.tinta,
      'stroke-width': 1.6,
    });

    // La cabina con el piloto: el ojo lejano más chico, así se lee de tres cuartos.
    el(c, 'ellipse', {
      cx: 26,
      cy: -13,
      rx: 25,
      ry: 17,
      fill: `url(#${id}-vidrio)`,
      stroke: PALETA.tinta,
      'stroke-width': 2.2,
    });
    const ojos = [
      { x: 20, y: -14, r: 5.4 },
      { x: 35, y: -13, r: 7 },
    ];
    for (const o of ojos) {
      const ojo = el(c, 'g', { transform: `translate(${o.x} ${o.y})` });
      const parpado = el(ojo, 'g');
      el(parpado, 'ellipse', {
        rx: o.r * 0.92,
        ry: o.r,
        fill: '#fffaf2',
        stroke: PALETA.tinta,
        'stroke-width': 1.1,
      });
      const pupila = el(parpado, 'g');
      el(pupila, 'circle', { r: o.r * 0.52, fill: PALETA.tinta });
      el(pupila, 'circle', { cx: -o.r * 0.18, cy: -o.r * 0.22, r: o.r * 0.18, fill: '#fff' });
      this.parpados.push(parpado);
      this.pupilas.push(pupila);
      // La ceja se ubica en su grupo y se anima adentro: GSAP reescribe el `transform` de lo que
      // mueve, y con el lugar en el mismo atributo la ceja caía debajo del ojo.
      const lugar = el(c, 'g', { transform: `translate(${o.x} ${o.y - o.r - 3.5})` });
      const ceja = el(lugar, 'path', {
        d: `M${-o.r * 0.8} 0Q0 ${-o.r * 0.32} ${o.r * 0.8} 0`,
        fill: 'none',
        stroke: PALETA.tinta,
        'stroke-width': 2.2,
        'stroke-linecap': 'round',
      });
      this.cejas.push(ceja);
    }
    el(c, 'path', {
      d: 'M8 -22C14 -28 26 -30 36 -27',
      fill: 'none',
      stroke: '#fff',
      'stroke-opacity': 0.75,
      'stroke-width': 2.6,
      'stroke-linecap': 'round',
    });

    gsap.set(this.parpados, { transformOrigin: '50% 50%' });
    gsap.set(this.cejas, { transformOrigin: '50% 100%' });
    // La llama se dibuja desde la boca del motor (x = 0) hacia atrás: la boca es el borde DERECHO de
    // su caja. Con el origen en el izquierdo chisporroteaba desde la punta y se despegaba del motor.
    gsap.set(this.llama, { transformOrigin: '100% 50%' });
    gsap.set(this.gesto, { svgOrigin: '0 26' });

    // Tocarla es lo primero que hace la gente: se sacude, se queja y, si insisten, se harta.
    padre.style.cursor = 'pointer';
    padre.addEventListener('pointerdown', this.alTocar);

    if (!this.quieta) this.vivir();
  }

  /** Respira, chisporrotea y parpadea a intervalos irregulares: quieta se ve de cartón. */
  private vivir(): void {
    gsap.to(this.vida, { y: -4, duration: 1.4, ease: 'sine.inOut', yoyo: true, repeat: -1 });
    gsap.to(this.vida, {
      rotation: 2,
      svgOrigin: '0 0',
      duration: 2.3,
      ease: 'sine.inOut',
      yoyo: true,
      repeat: -1,
    });
    gsap.to(this.llama, {
      scaleX: 0.72,
      duration: 0.16,
      ease: 'sine.inOut',
      yoyo: true,
      repeat: -1,
    });
    const parpadear = (): void => {
      this.parpadeo = gsap.to(this.parpados, {
        scaleY: 0.08,
        duration: 0.06,
        ease: 'power1.in',
        yoyo: true,
        repeat: 1,
        delay: 1.6 + azar(Date.now() % 997) * 3.4,
        onComplete: parpadear,
      });
    };
    parpadear();
  }

  /** Mira hacia un punto de la escena (en las coordenadas del padre de la nave). */
  mirar(x: number, y: number): void {
    // De la escena a la nave pasando por la pantalla: vale con cualquier escala y ubicación.
    const escena = this.padre.ownerSVGElement?.getScreenCTM();
    const nave = this.padre.getScreenCTM();
    const local =
      escena && nave
        ? new DOMPoint(x, y).matrixTransform(escena).matrixTransform(nave.inverse())
        : new DOMPoint(x, y);
    const dx = local.x - 30;
    const dy = local.y + 13;
    const d = Math.hypot(dx, dy) || 1;
    const m = Math.min(2.6, d / 12);
    gsap.to(this.pupilas, {
      x: (dx / d) * m,
      y: (dy / d) * m,
      duration: this.quieta ? 0 : 0.22,
      ease: 'power2.out',
      overwrite: 'auto',
    });
  }

  animo(animo: Animo): void {
    if (animo === this.animoActual) return;
    this.animoActual = animo;
    const cara = CARAS[animo];
    const t = this.quieta ? 0 : 0.28;
    gsap.to(this.cejas[0], {
      rotation: -cara.cejas,
      y: cara.alto,
      duration: t,
      ease: 'back.out(2)',
      overwrite: 'auto',
    });
    gsap.to(this.cejas[1], {
      rotation: cara.cejas,
      y: cara.alto,
      duration: t,
      ease: 'back.out(2)',
      overwrite: 'auto',
    });
    gsap.to(this.parpados, {
      scale: cara.ojos,
      duration: t,
      ease: 'back.out(2)',
      overwrite: 'auto',
    });
  }

  /**
   * El motor: 1 es ralentí, más es a fondo (la llama se estira hacia atrás) y menos, frenando. Se
   * estira la tobera, desde la boca del motor, para no pisar el chisporroteo de la llama.
   */
  propulsar(fuerza: number, duracion = 0.2): void {
    if (this.quieta) return;
    // A mano, alrededor del 0 de la tobera (la boca del motor): el origen de GSAP sale de la caja de
    // la llama, que chisporrotea, y a fondo la llama se despegaba del motor.
    gsap.to(this.motor, {
      x: fuerza,
      y: 1 + (fuerza - 1) * 0.18,
      duration: duracion,
      ease: 'power2.out',
      overwrite: 'auto',
      onUpdate: () =>
        this.tobera.setAttribute(
          'transform',
          `translate(-68 0) scale(${this.motor.x.toFixed(3)} ${this.motor.y.toFixed(3)})`,
        ),
    });
  }

  /** Un saltito de gusto: anticipa, sube, cae y se aplasta un poco. */
  saltito(alto = 14): gsap.core.Timeline | null {
    if (this.quieta) return null;
    return gsap
      .timeline()
      .to(this.gesto, { scaleY: 0.9, scaleX: 1.06, duration: 0.08, ease: 'power2.out' })
      .to(this.gesto, { y: -alto, scaleY: 1.06, scaleX: 0.96, duration: 0.18, ease: 'power2.out' })
      .to(this.gesto, { y: 0, scaleY: 1, scaleX: 1, duration: 0.2, ease: 'power2.in' })
      .add(() => this.empujar(0, 3));
  }

  /** Un tirón seco, como un cuadro que se traba. `fuerza` en unidades del dibujo. */
  trabarse(fuerza = 6): void {
    if (this.quieta) return;
    gsap.fromTo(
      this.gesto,
      { x: 0 },
      {
        x: fuerza,
        duration: 0.05,
        ease: 'steps(1)',
        yoyo: true,
        repeat: 3,
        overwrite: 'auto',
        onComplete: () => void gsap.set(this.gesto, { x: 0 }),
      },
    );
    this.empujar(fuerza * 9, 2);
  }

  /** Suma velocidad a los muelles: así cualquier golpe de la escena la sacude. */
  empujar(giro: number, aplaste: number): void {
    if (this.quieta) return;
    this.rot.v += giro;
    this.sq.v = Math.min(this.sq.v + aplaste, 6.5);
    if (!this.latiendo) {
      this.latiendo = true;
      gsap.ticker.add(this.latir);
    }
  }

  private readonly latir = (_t: number, delta: number): void => {
    const h = Math.min(delta / 1000, 0.034) / 2;
    for (let n = 0; n < 2; n++) {
      for (const s of [this.rot, this.sq]) {
        s.v += (-s.x * s.k - s.v * s.d) * h;
        s.x += s.v * h;
      }
    }
    const sq = Math.max(-0.3, Math.min(0.3, this.sq.x / 10));
    this.cuerpo.setAttribute(
      'transform',
      `rotate(${this.rot.x.toFixed(2)}) scale(${(1 + sq * 0.8).toFixed(3)} ${(1 - sq).toFixed(3)})`,
    );
    // La antena sigue la velocidad del cuerpo, no su posición: queda atrás.
    this.antena.setAttribute(
      'transform',
      `translate(-8 -30) rotate(${(-this.rot.v * 0.12).toFixed(2)})`,
    );
    this.paciencia = Math.max(0, this.paciencia - h * 0.9);
    const quieto = [this.rot, this.sq].every((s) => Math.abs(s.x) < 0.01 && Math.abs(s.v) < 0.01);
    if (quieto) {
      this.latiendo = false;
      gsap.ticker.remove(this.latir);
      this.cuerpo.removeAttribute('transform');
    }
  };

  private readonly alTocar = (e: PointerEvent): void => {
    const svg = this.padre.ownerSVGElement;
    const ctm = this.padre.getScreenCTM();
    if (!svg || !ctm) return;
    const p = new DOMPoint(e.clientX, e.clientY).matrixTransform(ctm.inverse());
    const lado = Math.max(-1, Math.min(1, p.x / 60));
    this.paciencia += 1;
    this.empujar(-lado * 160 - (p.y < -10 ? 40 : 0), p.y < -10 ? 6 : 4);
    const harta = this.paciencia > 4;
    this.queja(
      harta ? '¡basta!' : QUEJAS[Math.floor(azar(this.paciencia * 7.3) * QUEJAS.length)],
      p.x,
      p.y,
    );
    const antes = this.animoActual;
    this.animo(harta ? 'preocupada' : 'atenta');
    gsap.delayedCall(0.9, () => this.animo(antes));
  };

  /** La onomatopeya que sube desde donde la tocaron. */
  private queja(texto: string, x: number, y: number): void {
    if (this.quieta) return;
    const t = el(this.padre, 'text', {
      x,
      y: y - 18,
      'text-anchor': 'middle',
      'font-family': 'var(--font-display, system-ui, sans-serif)',
      'font-weight': 800,
      'font-size': 15,
      fill: PALETA.luz,
      stroke: PALETA.tinta,
      'stroke-width': 3,
      'paint-order': 'stroke',
      'pointer-events': 'none',
    });
    t.textContent = texto;
    gsap.fromTo(
      t,
      { opacity: 0, y: 8, scale: 0.7, svgOrigin: `${x} ${y - 18}` },
      { opacity: 1, y: -6, scale: 1, duration: 0.24, ease: 'back.out(2.2)' },
    );
    gsap.to(t, {
      opacity: 0,
      y: -20,
      duration: 0.4,
      delay: 0.55,
      ease: 'power1.in',
      onComplete: () => t.remove(),
    });
  }

  apagar(): void {
    this.padre.removeEventListener('pointerdown', this.alTocar);
    gsap.ticker.remove(this.latir);
    this.parpadeo?.kill();
    gsap.killTweensOf(this.motor);
  }
}
