import { gsap } from 'gsap';
import {
  asentar,
  avanzarMuelle,
  crearMuelle,
  enReposo,
  motorDeMuelles,
  sinMovimiento,
} from '../../libs/muelle';
import { PALETAS, TINTA, dibujarNave, el, type NaveDibujada } from './nave-del-prologo';

export type Animo = 'tranquila' | 'atenta' | 'preocupada' | 'contenta' | 'harta';

/** Cejas (grados hacia adentro, + es preocupación), tamaño de los ojos y altura de las cejas. */
const CARAS: Record<Animo, { cejas: number; ojos: number; alto: number }> = {
  tranquila: { cejas: 0, ojos: 1, alto: 0 },
  atenta: { cejas: -6, ojos: 1.14, alto: -1.5 },
  preocupada: { cejas: 18, ojos: 1.2, alto: -2.5 },
  contenta: { cejas: -4, ojos: 0.86, alto: -1 },
  harta: { cejas: -16, ojos: 0.9, alto: 1.5 },
};

const QUEJAS = ['¡ey!', '¡piloto a bordo!', '¡la pintura!', '¡estoy manejando!'];
const HARTA = ['¡basta!', '¡ya va!', '¡uf!'];

/** Pseudoazar con semilla: el mismo toque da la misma queja. */
const azar = (k: number): number => {
  const x = Math.sin(k * 127.1 + 311.7) * 43758.5453;
  return x - Math.floor(x);
};

/** Dónde mira la cabina, en el dibujo de la nave: el centro entre los dos ojos. */
const OJOS = { x: 28, y: -18 };

/**
 * Una nave de la tripulación como personaje del viaje: la misma del prólogo, viva. Cada capa tiene
 * su dueño, así ninguna pisa a otra: `vuelo` la trae y la lleva de una página a la otra, `gesto` lo
 * mueven las reacciones (saltitos, sustos), `pose` flota sola y el `rig` lo mueven los muelles de
 * los toques.
 */
export class Tripulante {
  private readonly nave: NaveDibujada;
  private readonly vuelo: SVGGElement;
  private readonly gesto: SVGGElement;
  /** Lo que contiene a la llama: se estira con el motor a fondo, sin pisar su chisporroteo. */
  private readonly tobera: SVGGElement;
  private readonly ojosBase: { readonly g: SVGGElement; readonly base: string }[];
  private readonly cara = { cejas: 0, alto: 0, ojos: 1, parpado: 1 };
  private readonly rot = crearMuelle(0, 150, 7);
  private readonly sq = crearMuelle(0, 260, 10);
  private readonly sacarDelMotor: () => void;
  private animoActual: Animo = 'tranquila';
  private paciencia = 0;
  private toques = 0;
  private vivas: gsap.core.Tween[] = [];
  private parpadeo: gsap.core.Tween | null = null;
  private volviendo: gsap.core.Tween | null = null;

  constructor(
    private readonly padre: SVGGElement,
    readonly indice: number,
    defs: SVGDefsElement,
    prefijo: string,
  ) {
    this.vuelo = el(padre, 'g');
    this.gesto = el(this.vuelo, 'g');
    this.nave = dibujarNave(this.gesto, indice, defs, prefijo);
    this.tobera = el(this.nave.rig, 'g');
    this.nave.rig.insertBefore(this.tobera, this.nave.llama);
    this.tobera.appendChild(this.nave.llama);
    this.ojosBase = this.nave.pupilas.map((p) => {
      const g = p.parentNode as SVGGElement;
      return { g, base: g.getAttribute('transform') ?? '' };
    });
    gsap.set(this.gesto, { svgOrigin: '0 28' });

    this.nave.pose.addEventListener('pointerdown', this.alTocar);
    this.sacarDelMotor = motorDeMuelles().agregar(this.cuadro);
    if (!sinMovimiento()) this.vivir();
  }

  /** Respira, chisporrotea y parpadea a intervalos irregulares: quieta se ve de cartón. */
  private vivir(): void {
    const fase = this.indice * 0.37;
    this.vivas = [
      gsap.to(this.nave.pose, {
        y: -5,
        duration: 1.3 + fase,
        ease: 'sine.inOut',
        yoyo: true,
        repeat: -1,
      }),
      gsap.to(this.nave.pose, {
        rotation: 2.2,
        svgOrigin: '0 0',
        duration: 2.1 + fase,
        ease: 'sine.inOut',
        yoyo: true,
        repeat: -1,
      }),
      gsap.to(this.nave.llama, {
        scaleX: 0.72,
        svgOrigin: '-66 0',
        duration: 0.16,
        ease: 'sine.inOut',
        yoyo: true,
        repeat: -1,
      }),
    ];
    let vez = this.indice * 13;
    const parpadear = (): void => {
      this.parpadeo = gsap.to(this.cara, {
        parpado: 0.08,
        duration: 0.06,
        ease: 'power1.in',
        yoyo: true,
        repeat: 1,
        delay: 1.6 + azar(++vez) * 3.4,
        onUpdate: this.pintarCara,
        onComplete: parpadear,
      });
    };
    parpadear();
  }

  /** Mira hacia un punto de la ventana. */
  mirar(clienteX: number, clienteY: number): void {
    const ctm = this.nave.rig.getScreenCTM();
    if (!ctm) return;
    const p = new DOMPoint(clienteX, clienteY).matrixTransform(ctm.inverse());
    const dx = p.x - OJOS.x;
    const dy = p.y - OJOS.y;
    const d = Math.hypot(dx, dy) || 1;
    const m = Math.min(2.6, d / 12);
    gsap.to(this.nave.pupilas, {
      x: (dx / d) * m,
      y: (dy / d) * m,
      duration: sinMovimiento() ? 0 : 0.22,
      ease: 'power2.out',
      overwrite: 'auto',
    });
  }

  animo(animo: Animo): void {
    if (animo === this.animoActual) return;
    this.animoActual = animo;
    const cara = CARAS[animo];
    gsap.to(this.cara, {
      cejas: cara.cejas,
      alto: cara.alto,
      ojos: cara.ojos,
      duration: sinMovimiento() ? 0 : 0.28,
      ease: 'back.out(2)',
      overwrite: 'auto',
      onUpdate: this.pintarCara,
      onComplete: this.pintarCara,
    });
  }

  /** Un ánimo por un rato, y después vuelve al de antes. */
  animoUnRato(animo: Animo, segundos = 1.2): void {
    const antes = this.animoActual;
    this.animo(animo);
    gsap.delayedCall(segundos, () => this.animo(antes === animo ? 'tranquila' : antes));
  }

  private readonly pintarCara = (): void => {
    const { cejas, alto, ojos, parpado } = this.cara;
    this.nave.cejas.forEach((ceja, k) => {
      const giro = k === 0 ? -cejas : cejas;
      ceja.setAttribute(
        'transform',
        `${this.nave.cejasBase[k]} translate(0 ${alto.toFixed(2)}) rotate(${giro.toFixed(2)})`,
      );
    });
    for (const { g, base } of this.ojosBase) {
      g.setAttribute(
        'transform',
        `${base} scale(${ojos.toFixed(3)} ${(ojos * parpado).toFixed(3)})`,
      );
    }
  };

  /** La antena titila cuando esta nave habla por radio. */
  hablar(habla: boolean): void {
    gsap.killTweensOf(this.nave.ondas);
    if (!habla || sinMovimiento()) {
      gsap.set(this.nave.ondas, { opacity: habla ? 0.8 : 0 });
      return;
    }
    gsap.fromTo(
      this.nave.ondas,
      { opacity: 0 },
      { opacity: 0.9, duration: 0.4, ease: 'sine.inOut', yoyo: true, repeat: 5 },
    );
    this.saltito(8);
  }

  /** Un saltito de gusto: anticipa, sube, cae y se aplasta un poco. */
  saltito(alto = 14, demora = 0): void {
    if (sinMovimiento()) return;
    gsap
      .timeline({ delay: demora })
      .to(this.gesto, { scaleY: 0.9, scaleX: 1.06, duration: 0.08, ease: 'power2.out' })
      .to(this.gesto, { y: -alto, scaleY: 1.06, scaleX: 0.96, duration: 0.18, ease: 'power2.out' })
      .to(this.gesto, { y: 0, scaleY: 1, scaleX: 1, duration: 0.2, ease: 'power2.in' })
      .add(() => this.empujar(0, 3));
  }

  /** Un respingo: algo cambió cerca y se echa para atrás, con las cejas arriba. */
  respingo(): void {
    this.animoUnRato('atenta', 0.9);
    if (sinMovimiento()) return;
    gsap
      .timeline()
      .to(this.gesto, { x: -7, duration: 0.09, ease: 'power2.out' })
      .to(this.gesto, { x: 0, duration: 0.32, ease: 'back.out(2.4)' });
    this.empujar(-60, 2);
  }

  /** Suma velocidad a los muelles: así cualquier golpe de la escena la sacude. */
  empujar(giro: number, aplaste: number): void {
    if (sinMovimiento()) return;
    this.rot.v += giro;
    this.sq.v = Math.min(this.sq.v + aplaste, 6.5);
    motorDeMuelles().despertar();
  }

  private readonly cuadro = (dt: number): boolean => {
    avanzarMuelle(this.rot, dt);
    avanzarMuelle(this.sq, dt);
    this.paciencia = Math.max(0, this.paciencia - dt * 0.45);
    if (enReposo(this.rot) && enReposo(this.sq)) {
      asentar(this.rot);
      asentar(this.sq);
      this.nave.rig.removeAttribute('transform');
      this.nave.antena.setAttribute('transform', 'translate(-6 -30)');
      return false;
    }
    const sq = Math.max(-0.3, Math.min(0.3, this.sq.x / 10));
    this.nave.rig.setAttribute(
      'transform',
      `rotate(${this.rot.x.toFixed(2)}) scale(${(1 + sq * 0.8).toFixed(3)} ${(1 - sq).toFixed(3)})`,
    );
    // La antena sigue la velocidad del cuerpo, no su posición: queda atrás.
    this.nave.antena.setAttribute(
      'transform',
      `translate(-6 -30) rotate(${(-this.rot.v * 0.12).toFixed(2)})`,
    );
    return true;
  };

  /** El motor: 1 es ralentí, más es a fondo (la llama se estira hacia atrás). */
  private propulsar(fuerza: number, duracion = 0.2): void {
    gsap.to(this.tobera, {
      scaleX: fuerza,
      scaleY: 1 + (fuerza - 1) * 0.18,
      svgOrigin: '-66 0',
      duration: duracion,
      ease: 'power2.out',
      overwrite: 'auto',
    });
  }

  /** Sale volando por la derecha: el motor a fondo, un tirón hacia atrás y se va. */
  irse(distancia: number, demora = 0): Promise<void> {
    this.volviendo?.kill();
    if (sinMovimiento()) return Promise.resolve();
    return new Promise((listo) => {
      gsap
        .timeline({ delay: demora, onComplete: () => listo() })
        .add(() => this.propulsar(2.3, 0.18))
        .to(this.vuelo, { x: -14, duration: 0.14, ease: 'power2.out' })
        .to(this.vuelo, { x: distancia, duration: 0.5, ease: 'power3.in' });
    });
  }

  /** Llega volando desde la izquierda, frena con la llama corta y se acomoda en su lugar. */
  llegar(distancia: number, demora = 0): void {
    if (sinMovimiento()) {
      gsap.set(this.vuelo, { x: 0 });
      return;
    }
    gsap.set(this.vuelo, { x: -distancia });
    this.propulsar(2, 0.1);
    this.volviendo = gsap.to(this.vuelo, {
      x: 0,
      duration: 0.7,
      delay: demora,
      ease: 'back.out(1.4)',
      onStart: () => gsap.delayedCall(0.35, () => this.propulsar(0.55, 0.16)),
      onComplete: () => {
        this.propulsar(1, 0.3);
        this.empujar(-90, 2);
      },
    });
  }

  private readonly alTocar = (e: PointerEvent): void => {
    const ctm = this.nave.rig.getScreenCTM();
    if (!ctm) return;
    const p = new DOMPoint(e.clientX, e.clientY).matrixTransform(ctm.inverse());
    const lado = Math.max(-1, Math.min(1, p.x / 60));
    this.paciencia += 1;
    this.toques += 1;
    this.empujar(-lado * 170 - (p.y < -10 ? 40 : 0), p.y < -10 ? 6 : 4);
    const harta = this.paciencia > 4;
    const lista = harta ? HARTA : QUEJAS;
    this.queja(lista[Math.floor(azar(this.toques * 7.3 + this.indice) * lista.length)], e);
    this.animoUnRato(harta ? 'harta' : 'atenta', 0.9);
  };

  /** La onomatopeya que sube desde donde la tocaron, en el plano de la tripulación. */
  private queja(texto: string, e: PointerEvent): void {
    if (sinMovimiento()) return;
    const ctm = this.padre.getScreenCTM();
    if (!ctm) return;
    const p = new DOMPoint(e.clientX, e.clientY).matrixTransform(ctm.inverse());
    const t = el(this.padre, 'text', {
      x: p.x.toFixed(1),
      y: (p.y - 22).toFixed(1),
      'text-anchor': 'middle',
      'font-family': 'var(--font-display, system-ui, sans-serif)',
      'font-weight': 800,
      'font-size': 22,
      fill: PALETAS[this.indice].luz,
      stroke: TINTA,
      'stroke-width': 4,
      'paint-order': 'stroke',
      'pointer-events': 'none',
    });
    t.textContent = texto;
    gsap.fromTo(
      t,
      { opacity: 0, y: 8, scale: 0.7, svgOrigin: `${p.x} ${p.y - 22}` },
      { opacity: 1, y: -6, scale: 1, duration: 0.24, ease: 'back.out(2.2)' },
    );
    gsap.to(t, {
      opacity: 0,
      y: -24,
      duration: 0.4,
      delay: 0.6,
      ease: 'power1.in',
      onComplete: () => t.remove(),
    });
  }

  apagar(): void {
    this.nave.pose.removeEventListener('pointerdown', this.alTocar);
    this.sacarDelMotor();
    this.parpadeo?.kill();
    this.volviendo?.kill();
    for (const t of this.vivas) t.kill();
    gsap.killTweensOf([this.cara, this.gesto, this.vuelo, this.tobera, this.nave.ondas]);
    gsap.killTweensOf(this.nave.pupilas);
  }
}
