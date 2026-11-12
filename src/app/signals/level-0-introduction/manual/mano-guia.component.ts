import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  ElementRef,
  effect,
  inject,
  input,
  viewChild,
} from '@angular/core';
import { gsap } from 'gsap';
import { sinMovimiento } from '../../../libs/muelle';

/** Lo que la mano espera para entrar: primero se lee la ley. */
const DEMORA_DE_ENTRADA_MS = 1200;

export interface Punta {
  readonly x: number;
  readonly y: number;
}

/**
 * La mano del manual: un guante de papel que señala lo próximo que hay que tocar y lo toca de
 * mentira, una y otra vez, hasta que alguien lo toca de verdad. Con "Mostrame" lo toca ella: viaja,
 * aprieta y el toque es real (el mismo click que haría el dedo). La página decide adónde apunta.
 */
@Component({
  selector: 'app-mano-guia',
  template: `
    <div #mano class="mano" aria-hidden="true">
      <span #onda class="mano__onda"></span>
      <svg #guante class="mano__guante" viewBox="0 0 64 72" overflow="visible">
        <g transform="rotate(-28 20 4)">
          <rect class="mano__puno" x="15" y="58" width="28" height="11" rx="3" />
          <rect class="mano__papel" x="9" y="30" width="38" height="31" rx="12" />
          <rect class="mano__papel" x="26" y="28" width="11" height="15" rx="5.5" />
          <rect class="mano__papel" x="36" y="31" width="10" height="14" rx="5" />
          <rect class="mano__papel" x="13" y="3" width="14" height="38" rx="7" />
          <ellipse
            class="mano__papel"
            cx="11"
            cy="45"
            rx="6"
            ry="9"
            transform="rotate(-32 11 45)"
          />
          <path class="mano__sombra" d="M14 52c8 5 22 5 31 0" />
          <path class="mano__brillo" d="M17.5 9v18" />
        </g>
      </svg>
    </div>
  `,
  styles: `
    :host {
      position: absolute;
      inset: 0;
      pointer-events: none;
      z-index: 6;
    }
    .mano {
      position: absolute;
      left: 0;
      top: 0;
      /* Del tamaño del guante y no 0: en pantallas angostas la vista integrada topa todo lo montado
         con max-width: 100%, y adentro de una caja de 0 el guante también medía 0. */
      width: 56px;
      height: 63px;
      opacity: 0;
      visibility: hidden;
    }
    /* El dedo cae justo en (0, 0): el guante se corre lo que mide la punta dentro del dibujo. */
    .mano__guante {
      position: absolute;
      left: -17.5px;
      top: -3.5px;
      width: 56px;
      height: 63px;
      transform-origin: 17.5px 3.5px;
      filter: drop-shadow(3px 4px 0 rgb(43 34 48 / 22%));
    }
    .mano__papel,
    .mano__puno {
      stroke: #2b2230;
      stroke-width: 3;
      stroke-linejoin: round;
    }
    .mano__papel {
      fill: #fffaf2;
    }
    .mano__puno {
      fill: #ffd27a;
    }
    .mano__sombra {
      fill: none;
      stroke: rgb(93 74 94 / 30%);
      stroke-width: 2.5;
      stroke-linecap: round;
    }
    .mano__brillo {
      stroke: #ffffff;
      stroke-width: 2.5;
      stroke-linecap: round;
    }
    .mano__onda {
      position: absolute;
      left: -16px;
      top: -16px;
      width: 32px;
      height: 32px;
      border: 3px solid #ffd27a;
      border-radius: 999px;
      box-shadow: 0 0 10px rgb(255 210 122 / 70%);
      opacity: 0;
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ManoGuiaComponent {
  /** Dónde apoya el dedo, relativo a la página; `null` si ya no hay nada que señalar. */
  readonly punta = input<Punta | null>(null);

  private readonly mano = viewChild.required<ElementRef<HTMLElement>>('mano');
  private readonly guante = viewChild.required<ElementRef<SVGSVGElement>>('guante');
  private readonly onda = viewChild.required<ElementRef<HTMLElement>>('onda');
  private visible = false;
  /** Hasta cuándo espera para entrar, en el reloj de `performance.now()`; `null` si no espera. */
  private entraEn: number | null = null;
  private ocupada = false;
  private amague: gsap.core.Timeline | null = null;
  private viaje: gsap.core.Tween | null = null;

  constructor() {
    effect(() => {
      const punta = this.punta();
      if (this.ocupada) return;
      if (punta) this.ir(punta);
      else this.irse();
    });
    inject(DestroyRef).onDestroy(() => {
      this.amague?.kill();
      this.viaje?.kill();
      gsap.killTweensOf([this.mano().nativeElement, this.guante().nativeElement]);
    });
  }

  /**
   * Viaja hasta `punta`, aprieta, y en el fondo del apretón hace `tocar`: lo que se ve (el dedo
   * hundido, la onda) cae junto con lo que pasa. Resuelve cuando el dedo terminó de subir.
   */
  tocar(punta: Punta, tocar: () => void): Promise<void> {
    this.ocupada = true;
    this.amague?.kill();
    this.viaje?.kill();
    const mano = this.mano().nativeElement;
    const guante = this.guante().nativeElement;
    if (sinMovimiento()) {
      gsap.set(mano, { x: punta.x, y: punta.y, autoAlpha: 1, scale: 1 });
      tocar();
      this.visible = true;
      this.soltar();
      return Promise.resolve();
    }
    return new Promise((listo) => {
      const tl = gsap.timeline({
        onComplete: () => {
          this.soltar();
          listo();
        },
      });
      // Esperando su entrada cuenta como no estar: "Mostrame" la trae ya.
      if (!this.visible || (this.entraEn !== null && this.entraEn > performance.now())) {
        tl.set(mano, { x: punta.x + 40, y: punta.y + 40 });
        tl.to(mano, { autoAlpha: 1, scale: 1, duration: 0.2, ease: 'back.out(2)' });
      }
      this.entraEn = null;
      this.visible = true;
      tl.to(mano, { x: punta.x, y: punta.y, duration: 0.38, ease: 'power2.inOut' })
        .to(guante, { scale: 0.86, y: 5, duration: 0.1, ease: 'power2.in' })
        .add(() => {
          tocar();
          this.ondear();
        })
        .to(guante, { scale: 1, y: 0, duration: 0.22, ease: 'back.out(2.5)' });
    });
  }

  /** Mientras tocaba, la página pudo moverle el objetivo: al soltar va adonde señala ahora. */
  private soltar(): void {
    this.ocupada = false;
    const punta = this.punta();
    if (punta) this.ir(punta);
    else this.irse();
  }

  private ir(punta: Punta): void {
    const mano = this.mano().nativeElement;
    this.amague?.kill();
    this.viaje?.kill();
    if (sinMovimiento()) {
      gsap.set(mano, { x: punta.x, y: punta.y, autoAlpha: 1 });
      this.visible = true;
      return;
    }
    const ahora = performance.now();
    if (!this.visible) this.entraEn = ahora + DEMORA_DE_ENTRADA_MS;
    if (this.entraEn !== null && this.entraEn > ahora) {
      // Entra después de que se leyó la ley: aparecer junto con el título le robaba la mirada. Si la
      // página vuelve a medir mientras espera (lo hace al terminar de entrar la demo), sigue
      // esperando lo que le falta: antes ese viaje la traía enseguida, a medio segundo de la ley.
      gsap.set(mano, { x: punta.x + 36, y: punta.y + 44, scale: 0.4, autoAlpha: 0 });
      this.viaje = gsap.to(mano, {
        x: punta.x,
        y: punta.y,
        scale: 1,
        autoAlpha: 1,
        duration: 0.35,
        delay: (this.entraEn - ahora) / 1000,
        ease: 'back.out(2)',
        onComplete: () => this.amagar(),
      });
    } else {
      // Con la escala y la opacidad: si la página re-mide mientras la mano entra, este viaje corta
      // la entrada, y sin ellas la mano quedaba invisible.
      this.viaje = gsap.to(mano, {
        x: punta.x,
        y: punta.y,
        scale: 1,
        autoAlpha: 1,
        duration: 0.45,
        ease: 'power2.inOut',
        onComplete: () => this.amagar(),
      });
    }
    this.visible = true;
  }

  private irse(): void {
    this.amague?.kill();
    this.viaje?.kill();
    if (!this.visible) return;
    this.visible = false;
    this.entraEn = null;
    if (sinMovimiento()) {
      gsap.set(this.mano().nativeElement, { autoAlpha: 0 });
      return;
    }
    this.viaje = gsap.to(this.mano().nativeElement, {
      scale: 0.5,
      autoAlpha: 0,
      duration: 0.25,
      ease: 'power2.in',
    });
  }

  /** El toque de mentira: aprieta, deja la onda y espera, como quien muestra dónde. */
  private amagar(): void {
    const guante = this.guante().nativeElement;
    this.amague = gsap
      .timeline({ repeat: -1, repeatDelay: 1.1 })
      .to(guante, { scale: 0.88, y: 4, duration: 0.12, ease: 'power2.in' })
      .add(() => this.ondear())
      .to(guante, { scale: 1, y: 0, duration: 0.25, ease: 'back.out(2.5)' });
  }

  private ondear(): void {
    gsap.fromTo(
      this.onda().nativeElement,
      { scale: 0.2, opacity: 0.9 },
      { scale: 1.6, opacity: 0, duration: 0.5, ease: 'power2.out' },
    );
  }
}
