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
  LLAMADO_TACTIL,
  VIAJE_MS,
  aireQueCabe,
  aireQueCubre,
  cuadroDelViaje,
  cuandoSeAbre,
  cuandoSuena,
  estrellasDelAlba,
  profundidadDelViaje,
  profundidadDesdeElOjo,
  letrasDelLlamado,
  loopsQueFrenaElViaje,
  planDeLaPrueba,
  tocarPrueba,
  type Lado,
} from './aviso-auriculares';

type Momento = 'esperando' | 'probando' | 'alejandose' | 'listo';

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
/**
 * Dónde arranca la cámara, en el dibujo del ojo izquierdo de Angie (`.mv__parpado`): el centro y el
 * radio del negro que se puede llenar sin tocar el párpado de arriba, el borde del ojo ni su brillo
 * pensativo, que queda abajo a la derecha.
 */
const MANCHA = { x: 455, y: 613, radio: 8 } as const;

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
  /**
   * La cámara viaja desde el ojo de Angie: mientras dura, ella no parpadea. Un parpadeo a cientos de
   * aumentos abría la pantalla negra de golpe.
   */
  readonly viaje = output<boolean>();
  /** La cámara llegó a la colina: recién ahí entra su título, que de cerca se vería gigante. */
  readonly llego = output<void>();

  protected readonly momento = signal<Momento>('esperando');
  /** El aviso recomienda el sonido: arranca prendido, y apagarlo es una elección explícita. */
  protected readonly conSonido = signal(true);
  /** El lado que está sonando en la prueba: enciende esa copa. */
  protected readonly suena = signal<Lado | null>(null);
  protected readonly estrellas = estrellasDelAlba(11, 70);
  /** Las más grandes, lejos de la franja de arriba: en un celular una cruz caía sobre el sonido. */
  protected readonly destellos = this.estrellas.filter((e) => e.r >= 3 && e.y >= 110);
  protected readonly llamado = LLAMADO;
  protected readonly llamadoTactil = LLAMADO_TACTIL;
  protected readonly letras = letrasDelLlamado(LLAMADO);
  protected readonly letrasTactil = letrasDelLlamado(LLAMADO_TACTIL);
  protected readonly lenteIzquierdo = LENTE_IZQUIERDO;
  protected readonly lenteDerecho = LENTE_DERECHO;

  private readonly seguir = viewChild.required<ElementRef<HTMLButtonElement>>('seguir');
  private readonly angie = viewChild.required(MascotaVivaComponent);
  private readonly host: HTMLElement = inject(ElementRef<HTMLElement>).nativeElement;
  private readonly temporizadores = new Set<ReturnType<typeof setTimeout>>();
  private cuadro = 0;
  private frenados: Animation[] = [];

  constructor() {
    inject(DestroyRef).onDestroy(() => {
      this.temporizadores.forEach(clearTimeout);
      cancelAnimationFrame(this.cuadro);
      this.soltarLoops();
    });
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
   * La cámara se aleja desde el ojo de Angie en la colina, como en Powers of Ten: la noche del aviso
   * era lo que ella miraba. Primero el aviso se cierra en un círculo y se va hasta desaparecer en el
   * negro de su ojo, que ocupa toda la pantalla; después la cámara se aleja a la cara, a Angie en la
   * piedra y a la colina entera. Va cuadro a cuadro desde acá y no con una animación del navegador:
   * animada por el compositor, la colina agrandada se pintaba una sola vez y, al alejarse, aparecía
   * cortada en rectángulos. Cada cuadro cambia la escala y el navegador la vuelve a dibujar.
   */
  private alejarse(conSonido: boolean): void {
    this.elegido.emit(conSonido);
    const escena = this.host.parentElement;
    if (sinMovimiento() || !escena) {
      this.momento.set('listo');
      this.llego.emit();
      return;
    }
    const r = this.host.getBoundingClientRect();
    this.viaje.emit(true);
    this.frenados = loopsQueFrenaElViaje(escena.getAnimations({ subtree: true }), this.host);
    for (const a of this.frenados) a.playbackRate = 0;
    // Los ojos de frente: los del perfil también existen, apagados, y miden cero.
    const elOjo = [...escena.querySelectorAll<SVGGraphicsElement>('.ini__angie .mv__parpado')].find(
      (o) => o.getBoundingClientRect().width > 0,
    );
    const enPantalla = (): { x: number; y: number } | null => {
      const m = elOjo?.getScreenCTM();
      if (!m) return null;
      const p = new DOMPoint(MANCHA.x, MANCHA.y).matrixTransform(m);
      return { x: p.x - r.left, y: p.y - r.top };
    };
    let ojo = enPantalla() ?? { x: r.width / 2, y: r.height * 0.6 };
    const esquinas = [
      [0, 0],
      [r.width, 0],
      [0, r.height],
      [r.width, r.height],
    ].map(([x, y]) => [x - ojo.x, y - ojo.y] as const);
    const matriz = elOjo?.getScreenCTM();
    const profundidad = matriz
      ? profundidadDesdeElOjo(
          { ancho: 2 * MANCHA.radio, alto: 2 * MANCHA.radio },
          matriz.inverse(),
          esquinas,
        )
      : profundidadDelViaje({ ancho: 10, alto: 10 }, r.width, r.height);
    const cubre = aireQueCubre(ojo.x, ojo.y, r.width, r.height);
    const cabe = aireQueCabe(ojo.x, ojo.y, r.width, r.height);

    /**
     * La cámara sigue al ojo: la cara de Angie se mueve sola, y a cientos de aumentos dos píxeles de
     * su vaivén dejaban el negro corrido y asomaba la cara. Con el ojo como punto fijo de la escala,
     * queda donde estaría sin acercar, y lo que se mueve es apenas lo que se mueve ella.
     */
    const seguirElOjo = (escala: number): void => {
      const medido = enPantalla();
      if (medido) {
        // Lo medido viene con la escala de este cuadro alrededor del ojo anterior: se deshace.
        ojo = { x: ojo.x + (medido.x - ojo.x) / escala, y: ojo.y + (medido.y - ojo.y) / escala };
      }
      const origen = `${ojo.x}px ${ojo.y}px`;
      escena.style.transformOrigin = origen;
      this.host.style.transformOrigin = origen;
      this.host.style.setProperty('--aa-x', `${ojo.x}px`);
      this.host.style.setProperty('--aa-y', `${ojo.y}px`);
    };

    let escala = 1;
    let cero = 0;
    const pintar = (ahora: number): void => {
      const t = ahora - cero;
      const c = cuadroDelViaje(t, profundidad, cubre, cabe);
      seguirElOjo(escala);
      escala = c.colina;
      escena.style.scale = `${c.colina}`;
      this.host.style.scale = `${c.aviso}`;
      this.host.style.setProperty('--aa-aire', `${c.aire}px`);
      if (t < VIAJE_MS) {
        this.cuadro = requestAnimationFrame(pintar);
        return;
      }
      escena.style.removeProperty('scale');
      escena.style.removeProperty('transform-origin');
      // El aviso queda en cero hasta que lo oculta `listo`: devuelto a su tamaño, volvía entero un cuadro.
      this.soltarLoops();
      this.viaje.emit(false);
      this.momento.set('listo');
      this.llego.emit();
    };
    // El primer cuadro va ya, junto con la máscara: sin aire, el aviso desaparecía un cuadro.
    cero = performance.now();
    pintar(cero);
    this.momento.set('alejandose');
  }

  private soltarLoops(): void {
    for (const a of this.frenados) a.playbackRate = 1;
    this.frenados = [];
  }

  private luego(ms: number, fn: () => void): void {
    const id = setTimeout(() => {
      this.temporizadores.delete(id);
      fn();
    }, ms);
    this.temporizadores.add(id);
  }
}
