import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  ElementRef,
  afterNextRender,
  inject,
  output,
  signal,
  viewChild,
} from '@angular/core';
import { sinMovimiento } from '../../libs/muelle';
import { sonido } from '../../libs/sonido';
import {
  cuandoSeAbre,
  cuandoSuena,
  estrellasDelAlba,
  planDeLaPrueba,
  tocarPrueba,
  type Lado,
} from './aviso-auriculares';

type Momento = 'esperando' | 'probando' | 'abriendo' | 'listo';

/** Lo que tarda el telón en subir (el CSS usa el mismo número). */
const SUBIR_MS = 1100;

/**
 * Antes de la mañana de Angie, todavía de noche: unos auriculares esperan en el medio. El toque que
 * activa el sonido es el gesto que el navegador exige para dejar sonar, así que toda la intro llega
 * con audio. Suena la prueba de un oído al otro, y el telón sube como un amanecer: recién ahí la
 * colina se despierta y Angie arranca a caminar.
 */
@Component({
  selector: 'app-aviso-auriculares',
  templateUrl: './aviso-auriculares.component.html',
  styleUrl: './aviso-auriculares.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    role: 'dialog',
    'aria-modal': 'true',
    'aria-labelledby': 'aa-titulo',
    '[class.aa--probando]': "momento() === 'probando'",
    '[class.aa--abriendo]': "momento() === 'abriendo'",
    '[class.aa--izquierda]': "suena() === 'izquierda'",
    '[class.aa--derecha]': "suena() === 'derecha'",
    '[class.aa--ambos]': "suena() === 'ambos'",
    '[hidden]': "momento() === 'listo'",
    '(pointerdown)': '$event.stopPropagation()',
    '(click)': 'alTocar($event)',
  },
})
export class AvisoAuricularesComponent {
  /** Se eligió (con o sin sonido) y el telón empieza a subir: la colina puede despertarse. */
  readonly elegido = output<boolean>();

  protected readonly momento = signal<Momento>('esperando');
  /** El lado que está sonando en la prueba: enciende esa copa. */
  protected readonly suena = signal<Lado | null>(null);
  protected readonly estrellas = estrellasDelAlba(11, 70);

  private readonly activar = viewChild.required<ElementRef<HTMLButtonElement>>('activar');
  private readonly host: HTMLElement = inject(ElementRef<HTMLElement>).nativeElement;
  private readonly temporizadores = new Set<ReturnType<typeof setTimeout>>();

  constructor() {
    inject(DestroyRef).onDestroy(() => this.temporizadores.forEach(clearTimeout));
    // El foco va a la entrada, así Enter alcanza; no si la landing arranca tapada (un deep-link).
    afterNextRender(() => {
      if (!this.host.closest('.gone')) this.activar().nativeElement.focus({ preventScroll: true });
    });
  }

  /** Tocar en cualquier lado activa el sonido: buscar el botón era tarea. Menos en "sin sonido". */
  protected alTocar(e: MouseEvent): void {
    e.stopPropagation();
    if ((e.target as Element | null)?.closest('.aa__sin')) return;
    this.conSonido();
  }

  protected conSonido(): void {
    if (this.momento() !== 'esperando') return;
    sonido().alternar(true);
    sonido().desbloquear();
    const plan = planDeLaPrueba();
    const salida = sonido().salida();
    if (salida) tocarPrueba(salida, plan);
    if (sinMovimiento()) {
      this.abrir(true);
      return;
    }
    this.momento.set('probando');
    for (const lado of ['izquierda', 'derecha', 'ambos'] as const) {
      this.luego(cuandoSuena(plan, lado) * 1000, () => this.suena.set(lado));
    }
    this.luego(cuandoSeAbre(plan) * 1000, () => this.abrir(true));
  }

  protected sinSonido(): void {
    if (this.momento() !== 'esperando') return;
    sonido().alternar(false);
    this.abrir(false);
  }

  private abrir(conSonido: boolean): void {
    this.elegido.emit(conSonido);
    if (sinMovimiento()) {
      this.momento.set('listo');
      return;
    }
    this.momento.set('abriendo');
    this.luego(SUBIR_MS, () => this.momento.set('listo'));
  }

  private luego(ms: number, fn: () => void): void {
    const id = setTimeout(() => {
      this.temporizadores.delete(id);
      fn();
    }, ms);
    this.temporizadores.add(id);
  }
}
