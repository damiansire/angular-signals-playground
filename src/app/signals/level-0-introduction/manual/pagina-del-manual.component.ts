import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  ElementRef,
  Injector,
  afterNextRender,
  effect,
  inject,
  input,
  signal,
  viewChild,
} from '@angular/core';
import { NgTemplateOutlet } from '@angular/common';
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
  host: { '[class.pm-entera]': '!!datos?.pie' },
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
      afterNextRender(() => this.medir(), { injector: this.injector });
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
