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
import { TIEMPO_MS } from '../../components-draw/mascota-viva/escuchar';
import { MascotaVivaComponent } from '../../components-draw/mascota-viva/mascota-viva.component';
import { sinMovimiento } from '../../libs/muelle';
import { sonido } from '../../libs/sonido';
import {
  LLAMADO,
  aireQueCabe,
  aireQueCubre,
  caminoDelAire,
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
const ALEJARSE_MS = 2400;
/** La boca de Angie, en el dibujo de la mascota: de ahí salió la noche, ahí vuelve. */
const BOCA = { x: 526.58, y: 662 };
/**
 * Hasta acá de la salida el aviso sigue del tamaño de la pantalla mientras la bocanada se cierra: si
 * se achicara antes, asomarían sus bordes rectos. De ahí en más, nube y cámara van juntas a la boca.
 */
const ENCAJA = 0.3;
/** Cuándo, en la salida, Angie suelta el aire: con la bocanada ya cerrada sobre ella. */
const SUSPIRA_EN = 0.5;
/**
 * De qué tan cerca viene la colina: apenas, un paso de cámara. A 2,6× el navegador pintaba solo lo
 * que se veía al arrancar y, al abrirse, la colina y Angie aparecían cortadas en rectángulos.
 */
const CERCA = 1.12;
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
  /** La bocanada llega a la boca de Angie en la colina: que suspire. */
  readonly suspiro = output<void>();

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
      // El primer tiempo llega con el timer y no al montar: si la vista se va enseguida, no queda
      // un cuadro pedido al motor.
      this.luego(TIEMPO_MS, () => this.marcarTiempo(0));
    });
  }

  /**
   * La música que Angie tiene en los auriculares mientras espera: un tiempo por vez, y ella lo
   * sigue. Sin sonido no hay música, y vuelve a empezar el compás cuando el sonido vuelve.
   */
  private marcarTiempo(tiempo: number): void {
    if (this.momento() !== 'esperando') return;
    if (this.conSonido()) this.angie().escuchar(tiempo);
    this.luego(TIEMPO_MS, () => this.marcarTiempo(this.conSonido() ? tiempo + 1 : 0));
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
    // Con sonido salta de contenta; sin él se le corta la música y se le caen las cejas.
    if (prende) {
      this.angie().saltar(0.45);
    } else {
      this.angie().dejarDeEscuchar();
      this.angie().inclinarse(1);
    }
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
    // La prueba le saca su música: ahora escucha de qué lado suena.
    this.angie().dejarDeEscuchar();
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
   * La cámara se aleja desde la boca de Angie en la colina: la noche del aviso era un suspiro suyo.
   * La colina viene de muy cerca y se abre con la boca como punto fijo; el aviso, delante, compensa
   * esa escala (arranca en `1 / CERCA`, así no salta) y se cierra como una bocanada que vuelve a la
   * boca mientras ella suelta el aire. Sin esquinas: un rectángulo que se achica era una ventana.
   */
  private alejarse(conSonido: boolean): void {
    this.elegido.emit(conSonido);
    const escena = this.host.parentElement;
    if (sinMovimiento() || !escena) {
      this.momento.set('listo');
      return;
    }
    const r = this.host.getBoundingClientRect();
    const boca = this.bocaDeLaColina(escena) ?? {
      x: r.left + r.width / 2,
      y: r.top + r.height * 0.6,
    };
    const x = boca.x - r.left;
    const y = boca.y - r.top;
    const origen = `${x}px ${y}px`;
    this.host.style.setProperty('--aa-x', `${x}px`);
    this.host.style.setProperty('--aa-y', `${y}px`);
    this.momento.set('alejandose');
    // Las tres animaciones comparten curva: así los cuadros clave caen en el mismo instante.
    const tiempo: KeyframeAnimationOptions = {
      duration: ALEJARSE_MS,
      easing: 'cubic-bezier(0.45, 0, 0.2, 1)',
    };
    escena.animate(
      [
        { scale: CERCA, transformOrigin: origen },
        { scale: 1, transformOrigin: origen },
      ],
      tiempo,
    );
    const colinaAlEncajar = CERCA - (CERCA - 1) * ENCAJA;
    this.host.animate(
      [
        { scale: 1 / CERCA, transformOrigin: origen, opacity: 1 },
        { scale: 1 / colinaAlEncajar, transformOrigin: origen, offset: ENCAJA },
        { opacity: 1, offset: 0.8 },
        { scale: LEJOS, transformOrigin: origen, opacity: 0 },
      ],
      tiempo,
    );
    this.host.animate(
      [
        ...caminoDelAire(
          aireQueCubre(x, y, r.width, r.height),
          aireQueCabe(x, y, r.width, r.height),
          ENCAJA,
        ).map(([offset, aire]) => ({ '--aa-aire': `${aire}px`, offset })),
      ],
      { ...tiempo, fill: 'forwards' },
    );
    this.luego(ALEJARSE_MS * SUSPIRA_EN, () => this.suspiro.emit());
    this.luego(ALEJARSE_MS, () => this.momento.set('listo'));
  }

  /** Dónde está la boca de Angie en la colina, en la pantalla, o nada si la colina no está. */
  private bocaDeLaColina(escena: HTMLElement): { x: number; y: number } | null {
    const dibujo = escena.querySelector<SVGSVGElement>('.ini__angie svg');
    const m = dibujo?.getScreenCTM();
    if (!m) return null;
    const p = new DOMPoint(BOCA.x, BOCA.y).matrixTransform(m);
    return { x: p.x, y: p.y };
  }

  private luego(ms: number, fn: () => void): void {
    const id = setTimeout(() => {
      this.temporizadores.delete(id);
      fn();
    }, ms);
    this.temporizadores.add(id);
  }
}
