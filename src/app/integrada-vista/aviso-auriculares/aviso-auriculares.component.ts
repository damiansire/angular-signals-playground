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
import { MascotaVivaComponent } from '../../components-draw/mascota-viva/mascota-viva.component';
import { sinMovimiento } from '../../libs/muelle';
import { sonido } from '../../libs/sonido';
import {
  LLAMADO,
  cuandoSeAbre,
  cuandoSuena,
  estrellasDelAlba,
  letrasDelLlamado,
  planDeLaPrueba,
  tocarPrueba,
  type Lado,
} from './aviso-auriculares';

type Momento = 'esperando' | 'probando' | 'alejandose' | 'listo';

/** Lo que tarda la cámara en alejarse hasta la colina. */
const ALEJARSE_MS = 1700;
/** De qué tan cerca viene la colina: el aviso es un primer plano de la escena. */
const CERCA = 2.6;
/** Hasta dónde se achica el aviso mientras se va: se pierde a lo lejos, no desaparece en su lugar. */
const LEJOS = 0.3;

/** Los lentes de sol, en el plano de la cara: centrados entre los ojos, uno en espejo del otro. */
const LENTE_IZQUIERDO =
  'M-132 -36H-16C-11 -36 -8 -32 -9 -26L-16 12C-20 34 -42 44 -72 44C-102 44 -122 34 -127 12L-136 -26C-137 -32 -136 -36 -132 -36Z';
const LENTE_DERECHO =
  'M132 -36H16C11 -36 8 -32 9 -26L16 12C20 34 42 44 72 44C102 44 122 34 127 12L136 -26C137 -32 136 -36 132 -36Z';

/**
 * Antes de la mañana de Angie, todavía de noche: ella espera en el medio con los auriculares puestos
 * y lentes de sol. Tocar en cualquier lado es el gesto que el navegador exige para dejar sonar, así
 * que toda la intro llega con audio; arriba se puede apagar. Suena la prueba de un oído al otro,
 * Angie se vuelca hacia el lado que suena, y la cámara se aleja: el aviso queda a lo lejos y aparece
 * la colina, con ella sentada en la piedra.
 */
@Component({
  selector: 'app-aviso-auriculares',
  imports: [MascotaVivaComponent],
  templateUrl: './aviso-auriculares.component.html',
  styleUrl: './aviso-auriculares.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    role: 'dialog',
    'aria-modal': 'true',
    'aria-labelledby': 'aa-titulo',
    '[class.aa--probando]': "momento() === 'probando'",
    '[class.aa--alejandose]': "momento() === 'alejandose'",
    '[class.aa--mudo]': '!conSonido()',
    '[class.aa--izquierda]': "suena() === 'izquierda'",
    '[class.aa--derecha]': "suena() === 'derecha'",
    '[class.aa--ambos]': "suena() === 'ambos'",
    '[hidden]': "momento() === 'listo'",
    '(pointerdown)': '$event.stopPropagation()',
    '(click)': 'alTocar($event)',
  },
})
export class AvisoAuricularesComponent {
  /** Se eligió (con o sin sonido) y la cámara empieza a alejarse: la colina puede despertarse. */
  readonly elegido = output<boolean>();

  protected readonly momento = signal<Momento>('esperando');
  /** El aviso recomienda el sonido: arranca prendido, y apagarlo es una elección explícita. */
  protected readonly conSonido = signal(true);
  /** El lado que está sonando en la prueba: enciende esa copa. */
  protected readonly suena = signal<Lado | null>(null);
  protected readonly estrellas = estrellasDelAlba(11, 70);
  protected readonly llamado = LLAMADO;
  protected readonly letras = letrasDelLlamado(LLAMADO);
  protected readonly lenteIzquierdo = LENTE_IZQUIERDO;
  protected readonly lenteDerecho = LENTE_DERECHO;

  private readonly seguir = viewChild.required<ElementRef<HTMLButtonElement>>('seguir');
  private readonly angie = viewChild.required(MascotaVivaComponent);
  private readonly host: HTMLElement = inject(ElementRef<HTMLElement>).nativeElement;
  private readonly temporizadores = new Set<ReturnType<typeof setTimeout>>();

  constructor() {
    inject(DestroyRef).onDestroy(() => this.temporizadores.forEach(clearTimeout));
    // El foco va a la invitación, así Enter alcanza; no si la landing arranca tapada (un deep-link).
    afterNextRender(() => {
      if (!this.host.closest('.gone')) this.seguir().nativeElement.focus({ preventScroll: true });
    });
  }

  /** Tocar en cualquier lado continúa: buscar un botón era tarea. Menos en el control de sonido. */
  protected alTocar(e: MouseEvent): void {
    e.stopPropagation();
    if ((e.target as Element | null)?.closest('.aa__mudo')) return;
    if (this.momento() !== 'esperando') return;
    if (this.conSonido()) this.probar();
    else this.sinSonido();
  }

  protected alternarSonido(e: MouseEvent): void {
    e.stopPropagation();
    if (this.momento() !== 'esperando') return;
    const prende = !this.conSonido();
    this.conSonido.set(prende);
    // Con sonido salta de contenta; sin él, se le caen las cejas detrás de los lentes.
    if (prende) this.angie().saltar(0.45);
    else this.angie().inclinarse(1);
  }

  private probar(): void {
    sonido().alternar(true);
    sonido().desbloquear();
    const plan = planDeLaPrueba();
    const salida = sonido().salida();
    if (salida) tocarPrueba(salida, plan);
    if (sinMovimiento()) {
      this.alejarse(true);
      return;
    }
    this.momento.set('probando');
    const vuelca: Record<Lado, () => void> = {
      izquierda: () => this.angie().inclinarse(-1),
      derecha: () => this.angie().inclinarse(1),
      ambos: () => this.angie().saltar(0.7),
    };
    for (const lado of ['izquierda', 'derecha', 'ambos'] as const) {
      this.luego(cuandoSuena(plan, lado) * 1000, () => {
        this.suena.set(lado);
        vuelca[lado]();
      });
    }
    this.luego(cuandoSeAbre(plan) * 1000, () => this.alejarse(true));
  }

  private sinSonido(): void {
    sonido().alternar(false);
    this.alejarse(false);
  }

  /**
   * La cámara se aleja: la colina (el contenedor del aviso) viene de muy cerca y se abre, y el aviso,
   * que está delante, se achica más rápido y se pierde. El aviso compensa la escala de la colina
   * (arranca en `1 / CERCA`), así en el primer cuadro no salta.
   */
  private alejarse(conSonido: boolean): void {
    this.elegido.emit(conSonido);
    const escena = this.host.parentElement;
    if (sinMovimiento() || !escena) {
      this.momento.set('listo');
      return;
    }
    this.momento.set('alejandose');
    const r = escena.getBoundingClientRect();
    const angie = escena.querySelector('.ini__angie')?.getBoundingClientRect();
    // Hacia Angie en la piedra: el aviso era un primer plano de ella.
    const origen = angie
      ? `${angie.left + angie.width / 2 - r.left}px ${angie.top + angie.height * 0.5 - r.top}px`
      : '50% 60%';
    const tiempo: KeyframeAnimationOptions = {
      duration: ALEJARSE_MS,
      easing: 'cubic-bezier(0.55, 0, 0.15, 1)',
    };
    escena.animate(
      [
        { scale: CERCA, transformOrigin: origen },
        { scale: 1, transformOrigin: origen },
      ],
      tiempo,
    );
    this.host.animate(
      [
        { scale: 1 / CERCA, transformOrigin: origen, opacity: 1, borderRadius: '0px' },
        { opacity: 1, borderRadius: '48px', offset: 0.35 },
        { scale: LEJOS, transformOrigin: origen, opacity: 0, borderRadius: '64px' },
      ],
      tiempo,
    );
    this.luego(ALEJARSE_MS, () => this.momento.set('listo'));
  }

  private luego(ms: number, fn: () => void): void {
    const id = setTimeout(() => {
      this.temporizadores.delete(id);
      fn();
    }, ms);
    this.temporizadores.add(id);
  }
}
