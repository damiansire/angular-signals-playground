import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  ElementRef,
  Injector,
  afterNextRender,
  computed,
  effect,
  inject,
  untracked,
  input,
  output,
  signal,
  viewChild,
} from '@angular/core';
import { NgTemplateOutlet } from '@angular/common';
import { gsap } from 'gsap';
import { sinMovimiento } from './nave-del-manual';
import { VueloDeLaNave } from './vuelo-de-la-nave';
import { PAGINA_DEL_MANUAL } from './pagina-del-manual';
import { ManoGuiaComponent, type Punta } from './mano-guia.component';
import { puntaDeLaMano, sigueMostrando } from './guia.logica';

/** Cuántos toques hace "Mostrame" como mucho: el árbol más largo del manual tiene nueve tags. */
const TOPE_DE_TOQUES = 16;

/**
 * Una página del manual de a bordo, en una sola pieza: la ley arriba, la escena de la nave como
 * escenario (`[escena]`), con su pantalla mostrando lo que pasa, y abajo su consola (`[consola]`)
 * con los dos pasos sobre el mismo código, probar (`[hacer]`) y arreglar (`[arreglo]`).
 *
 * La demo dice qué hay que tocar (`guia`, un selector adentro de la página) y la mano lo señala;
 * "Mostrame" lo toca por quien no se anima, con la misma mano.
 */
@Component({
  selector: 'app-pagina-del-manual',
  imports: [ManoGuiaComponent, NgTemplateOutlet],
  templateUrl: './pagina-del-manual.component.html',
  styleUrl: './pagina-del-manual.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '[class.pm-entera]': '!!datos?.pie',
    '[class.pm-pantalla]': 'enPantalla()',
    '[class.pm-en-portada]': 'enPortada()',
  },
})
export class PaginaDelManualComponent {
  protected readonly datos = inject(PAGINA_DEL_MANUAL, { optional: true });
  /** Lo próximo que hay que tocar en la demo; `null` cuando ya no hace falta guiar. */
  readonly guia = input<string | null>(null);
  /** En qué paso de la consola va la página: el otro queda apagado. */
  readonly paso = input<1 | 2>(1);
  /** El arreglo funcionó: los dos pasos quedan hechos. */
  readonly resuelta = input(false);
  /** Lo que "Mostrame" espera entre un toque y el siguiente: que la demo responda y se vea. */
  readonly respiro = input(280);
  /**
   * La consola va adentro de la pantalla de la nave, y la nave a un costado: lo que se toca, lo que
   * se lee y lo que se dibuja, lado a lado. Con la consola abajo, el árbol quedaba lejos de lo que
   * dibuja.
   */
  readonly enPantalla = input(false);
  /**
   * La página abre con su portada en la pantalla de la nave: la ley grande, su dibujo
   * (`[portada]`) y "Leer", que abre la demo. Sin portada, la ley llegaba junto con todo lo que
   * hay que tocar.
   */
  readonly portada = input(false);
  /** Se tocó "Leer": la portada se fue y la demo está en la pantalla. */
  readonly seAbre = output<void>();

  private readonly abierta = signal(false);
  protected readonly enPortada = computed(() => this.portada() && !this.abierta());
  private readonly pantalla = viewChild<ElementRef<HTMLElement>>('pantalla');
  private readonly quieta = sinMovimiento();
  private readonly vuelo = inject(VueloDeLaNave);
  /** La nave ya está saliendo: "Siguiente" no se toca dos veces. */
  protected readonly yendo = signal(false);

  protected readonly punta = signal<Punta | null>(null);
  protected readonly mostrando = signal(false);
  private readonly marco = viewChild.required<ElementRef<HTMLElement>>('marco');
  private readonly mano = viewChild.required(ManoGuiaComponent);
  private readonly injector = inject(Injector);
  private viva = true;
  /** La hoja cambia de alto (el árbol crece, la ventana cambia) y el objetivo se mueve con ella. */
  private observador: ResizeObserver | null = null;

  constructor() {
    // Medir recién después de pintar: el objetivo puede ser un tag que la demo todavía no dibujó.
    effect(() => {
      this.guia();
      // Con la portada no hay a qué señalar; al abrirla, el objetivo recién aparece.
      this.enPortada();
      afterNextRender(() => this.medir(), { injector: this.injector });
    });
    effect(() => {
      if (this.resuelta()) untracked(() => this.datos?.alCumplir?.());
    });
    // Cambia lo que hay que hacer: el globo de la nave salta, para que se vea sin leerlo de nuevo.
    let pasoAntes: string | null = null;
    effect(() => {
      const ahora = `${this.paso()}-${this.resuelta()}`;
      const antes = pasoAntes;
      pasoAntes = ahora;
      if (antes === null || antes === ahora || this.quieta) return;
      const globo = this.marco().nativeElement.querySelector('.pm-globo');
      if (globo) {
        gsap.fromTo(
          globo,
          { scale: 0.86 },
          { scale: 1, duration: 0.34, ease: 'back.out(2.6)', transformOrigin: '45% 100%' },
        );
      }
    });
    afterNextRender(() => {
      this.observador = new ResizeObserver(() => this.medir());
      this.observador.observe(this.marco().nativeElement);
    });
    inject(DestroyRef).onDestroy(() => {
      this.viva = false;
      this.observador?.disconnect();
    });
  }

  /**
   * "Leer": la portada se achica y se va hacia arriba, la pantalla se agranda hasta el tamaño de la
   * demo y sus columnas entran una tras otra. Cada parte llega por su lado, no con un fundido.
   */
  protected async leer(): Promise<void> {
    const pantalla = this.pantalla()?.nativeElement;
    if (!pantalla || this.quieta) {
      this.abierta.set(true);
      this.seAbre.emit();
      return;
    }
    const antes = pantalla.getBoundingClientRect();
    await gsap.to(pantalla.querySelector('.pm-portada'), {
      opacity: 0,
      y: -26,
      scale: 0.92,
      duration: 0.28,
      ease: 'power2.in',
    });
    this.abierta.set(true);
    this.seAbre.emit();
    afterNextRender(
      () => {
        if (!this.viva) return;
        const despues = pantalla.getBoundingClientRect();
        gsap.from(pantalla, {
          width: antes.width,
          height: antes.height,
          duration: 0.45,
          ease: 'back.out(1.3)',
          clearProps: 'width,height',
        });
        // La ley baja sobre el cielo mientras la pantalla crece.
        gsap.from(this.marco().nativeElement.querySelector(':scope > .pm-cabeza'), {
          opacity: 0,
          y: -18,
          duration: 0.4,
          ease: 'power2.out',
          delay: 0.1,
          clearProps: 'opacity,transform',
        });
        gsap.from(pantalla.querySelectorAll(':scope > [consola] > *'), {
          opacity: 0,
          y: 26,
          scale: 0.88,
          duration: 0.34,
          ease: 'back.out(2)',
          stagger: 0.09,
          delay: despues.width > antes.width ? 0.18 : 0.08,
          clearProps: 'opacity,transform',
          // La mano se midió con la pantalla todavía creciendo: el tamaño del marco no cambia y el
          // observador no avisa, así que señalaba un hueco al lado del primer tag.
          onComplete: () => this.medir(),
        });
        // La nave dice qué hacer recién con la demo a la vista.
        gsap.from(this.marco().nativeElement.querySelector('.pm-globo'), {
          opacity: 0,
          scale: 0.5,
          transformOrigin: '45% 100%',
          duration: 0.32,
          ease: 'back.out(2.2)',
          delay: 0.55,
          clearProps: 'opacity,transform',
        });
      },
      { injector: this.injector },
    );
  }

  /** "Siguiente": la nave sale volando por la derecha y recién ahí el libro pasa de hoja. */
  protected async seguir(): Promise<void> {
    if (this.yendo()) return;
    this.yendo.set(true);
    await this.vuelo.despegar();
    this.datos?.pasar?.(1);
  }

  private objetivo(selector: string | null): HTMLElement | null {
    return selector ? this.marco().nativeElement.querySelector<HTMLElement>(selector) : null;
  }

  private medir(): void {
    const objetivo = this.objetivo(this.guia());
    const caja = objetivo?.getBoundingClientRect();
    // Un objetivo sin caja (escondido, o en una fila que todavía no se armó) no se señala.
    if (!objetivo || !caja || caja.width === 0) {
      this.punta.set(null);
      return;
    }
    const punta = puntaDeLaMano(caja, this.marco().nativeElement.getBoundingClientRect());
    const antes = this.punta();
    if (antes?.x !== punta.x || antes?.y !== punta.y) this.punta.set(punta);
  }

  /** Toca lo que la demo señala, uno por uno, hasta que no señala nada nuevo. */
  protected async mostrar(): Promise<void> {
    if (this.mostrando()) return;
    this.mostrando.set(true);
    let antes: string | null = null;
    for (let pasos = 0; this.viva; pasos++) {
      const ahora = this.guia();
      const objetivo = this.objetivo(ahora);
      if (!sigueMostrando(antes, ahora, pasos, TOPE_DE_TOQUES) || !objetivo) break;
      const caja = objetivo.getBoundingClientRect();
      const punta = puntaDeLaMano(caja, this.marco().nativeElement.getBoundingClientRect());
      await this.mano().tocar(punta, () => objetivo.click());
      antes = ahora;
      await new Promise((listo) => setTimeout(listo, this.respiro()));
    }
    this.mostrando.set(false);
  }
}
