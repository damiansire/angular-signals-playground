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
  corridaDeLaCamara,
  cuadroDelViaje,
  laGemaTapaLaPantalla,
  cuandoSeAbre,
  cuandoSuena,
  estrellasDelAlba,
  profundidadDelViaje,
  profundidadDesdeElOjo,
  letrasDelLlamado,
  QUIETOS_DESDE,
  loopsQueSeRedibujan,
  propiedadesAnimadas,
  siguientePaso,
  tocaRedibujar,
  type PasoDelRedibujado,
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
  /** Los loops que van quietos hasta llegar, con su efecto aparte para devolvérselo. */
  private quietos: { animacion: Animation; efecto: KeyframeEffect; fijas: string[] }[] = [];
  private tapados: (HTMLElement | SVGElement)[] = [];

  constructor() {
    inject(DestroyRef).onDestroy(() => {
      this.temporizadores.forEach(clearTimeout);
      cancelAnimationFrame(this.cuadro);
      this.soltarLoops();
      this.despertarLoops();
      this.destapar();
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
    // El círculo se cierra en el medio de la pantalla y no donde está Angie: en un monitor ancho ella
    // queda a un costado y el aviso se iba achicando hacia allá, corrido.
    const medio = { x: r.width / 2, y: r.height / 2 };
    const esquinas = [
      [0, 0],
      [r.width, 0],
      [0, r.height],
      [r.width, r.height],
    ].map(([x, y]) => [x - medio.x, y - medio.y] as const);
    const matriz = elOjo?.getScreenCTM();
    const profundidad = matriz
      ? profundidadDesdeElOjo(
          { ancho: 2 * MANCHA.radio, alto: 2 * MANCHA.radio },
          matriz.inverse(),
          esquinas,
        )
      : profundidadDelViaje({ ancho: 10, alto: 10 }, r.width, r.height);
    const cubre = aireQueCubre(medio.x, medio.y, r.width, r.height);
    const cabe = aireQueCabe(medio.x, medio.y, r.width, r.height);
    this.host.style.transformOrigin = `${medio.x}px ${medio.y}px`;
    this.host.style.setProperty('--aa-x', `${medio.x}px`);
    this.host.style.setProperty('--aa-y', `${medio.y}px`);
    let corrida = { x: 0, y: 0 };

    /**
     * La cámara sigue al ojo: la cara de Angie se mueve sola, y a cientos de aumentos dos píxeles de
     * su vaivén dejaban el negro corrido y asomaba la cara. Con el ojo como punto fijo de la escala,
     * queda donde estaría sin acercar, y lo que se mueve es apenas lo que se mueve ella.
     */
    const seguirElOjo = (escala: number, colina: number): void => {
      const medido = enPantalla();
      if (medido) {
        // Lo medido viene con la escala y la corrida del cuadro anterior: se deshacen.
        ojo = {
          x: ojo.x + (medido.x - corrida.x - ojo.x) / escala,
          y: ojo.y + (medido.y - corrida.y - ojo.y) / escala,
        };
      }
      escena.style.transformOrigin = `${ojo.x}px ${ojo.y}px`;
      // La cámara lleva el ojo al medio y lo devuelve a su lugar a medida que se aleja, parejo en
      // escala como el viaje: a la mitad del camino en escala, a la mitad del camino en pantalla.
      const k = corridaDeLaCamara(colina, profundidad);
      corrida = { x: (medio.x - ojo.x) * k, y: (medio.y - ojo.y) * k };
      escena.style.translate = `${corrida.x}px ${corrida.y}px`;
      // El aviso, adentro de la escena, se achica alrededor de su medio puesto sobre el ojo.
      this.host.style.translate = `${ojo.x - medio.x}px ${ojo.y - medio.y}px`;
    };

    /**
     * Mientras la gema de Angie tapa la pantalla, lo que está detrás de ella (cielo, lomas, sol,
     * piedra) no se pinta. Estaba igual en capas propias a cientos de aumentos: unos 250 MB de memoria
     * de video sin que se viera nada, y con poca la cara aparecía cortada a rayas por donde asomaba la
     * colina.
     */
    const piezas = [
      ...escena.querySelectorAll<SVGGeometryElement>(
        // De perfil, la silueta de la gema; de frente, las piezas del escudo y la placa de la cara.
        '.ini__angie .mv__perfil > [data-pieza]:first-child > path, ' +
          '.ini__angie .mv__frente > path[data-pieza], .ini__angie .mv__frente[data-pieza] > g > path',
      ),
    ].filter((p) => p.getBoundingClientRect().width > 0);
    let deAngie: Element | null = escena.querySelector('.ini__angie');
    while (deAngie && deAngie.parentElement !== escena) deAngie = deAngie.parentElement;
    const detras: (HTMLElement | SVGElement)[] = [];
    for (let h = deAngie?.previousElementSibling; h; h = h.previousElementSibling) {
      if (h instanceof HTMLElement || h instanceof SVGElement) detras.push(h);
    }

    let escala = 1;
    let dibujadaA = Infinity;
    let paso: PasoDelRedibujado | null = null;
    let cero = 0;
    const pintar = (ahora: number): void => {
      const t = ahora - cero;
      // Al llegar, la cámara queda quieta en la colina mientras termina el último redibujado.
      const llego = t >= VIAJE_MS;
      const c = cuadroDelViaje(Math.min(t, VIAJE_MS), profundidad, cubre, cabe);
      seguirElOjo(escala, c.colina);
      if (laGemaTapaLaPantalla(piezas, r)) this.tapar(detras);
      else this.destapar();
      escala = c.colina;
      // La escena va en una capa propia (`will-change`) que el navegador dibuja una vez y solo achica:
      // redibujada en cada cuadro a la escala nueva, la cara gigante salía a rayas. Esa capa no baja
      // sola su escala y la memoria crecía, así que a cada mitad vuelve a la escala del momento, y
      // los loops igual, hasta que con la colina a la vista se quedan quietos (`QUIETOS_DESDE`). Al
      // llegar se redibuja una última vez, ya a escala 1, y los loops vuelven a moverse.
      paso = siguientePaso(paso, llego || tocaRedibujar(escala, dibujadaA));
      if (paso === 'frenar') {
        dibujadaA = escala;
        if (!llego && !this.quietos.length && escala <= QUIETOS_DESDE) this.aquietarLoops(escena);
        else this.frenarLoops(escena);
      } else if (paso === 'medir') {
        this.medirLoops();
        escena.style.willChange = 'auto';
      } else if (paso === 'soltar') {
        this.soltarLoops();
        if (!llego) escena.style.willChange = 'transform';
        else this.despertarLoops();
      }
      escena.style.scale = `${c.colina}`;
      this.host.style.scale = `${c.aviso}`;
      this.host.style.setProperty('--aa-aire', `${c.aire}px`);
      if (!llego || paso !== 'soltar') {
        this.cuadro = requestAnimationFrame(pintar);
        return;
      }
      // A escala 1 y sin corrida, sacarlas no mueve nada.
      escena.style.removeProperty('scale');
      escena.style.removeProperty('transform-origin');
      escena.style.removeProperty('translate');
      escena.style.removeProperty('will-change');
      this.destapar();
      // El aviso queda en cero hasta que lo oculta `listo`: devuelto a su tamaño, volvía entero un cuadro.
      this.viaje.emit(false);
      this.momento.set('listo');
      this.llego.emit();
    };
    // El primer cuadro va ya, junto con la máscara: sin aire, el aviso desaparecía un cuadro.
    cero = performance.now();
    pintar(cero);
    this.momento.set('alejandose');
  }

  private tapar(detras: (HTMLElement | SVGElement)[]): void {
    if (this.tapados.length) return;
    this.tapados = detras;
    for (const h of detras) h.style.visibility = 'hidden';
  }

  private destapar(): void {
    for (const h of this.tapados) h.style.removeProperty('visibility');
    this.tapados = [];
  }

  private frenarLoops(escena: HTMLElement): void {
    this.frenados = loopsQueSeRedibujan(escena.getAnimations({ subtree: true }), this.host);
    for (const a of this.frenados) {
      a.playbackRate = 0;
      this.fijarEscala(a, true);
    }
  }

  /**
   * Los loops quedan quietos en la pose de este cuadro y sin animación enganchada: así no tienen capa
   * propia. Con velocidad 0 y no con pause(), que le saca al CSS el control de
   * `animation-play-state` (ver la pausa de fondo en `molecule-engine.ts`).
   */
  private aquietarLoops(escena: HTMLElement): void {
    for (const animacion of loopsQueSeRedibujan(
      escena.getAnimations({ subtree: true }),
      this.host,
    )) {
      const efecto = animacion.effect as KeyframeEffect;
      animacion.playbackRate = 0;
      try {
        animacion.commitStyles();
      } catch {
        // Sin dibujar no se puede fijar la pose: sigue como estaba.
        animacion.playbackRate = 1;
        continue;
      }
      animacion.effect = null;
      this.quietos.push({ animacion, efecto, fijas: propiedadesAnimadas(efecto.getKeyframes()) });
    }
  }

  /** Vuelven a moverse desde la pose en que quedaron: sin salto. */
  private despertarLoops(): void {
    for (const { animacion, efecto, fijas } of this.quietos) {
      animacion.effect = efecto;
      const blanco = efecto.target as HTMLElement | SVGElement | null;
      for (const p of fijas) blanco?.style.removeProperty(p);
      animacion.playbackRate = 1;
    }
    this.quietos = [];
  }

  private medirLoops(): void {
    for (const a of this.frenados) this.fijarEscala(a, false);
  }

  private soltarLoops(): void {
    for (const a of this.frenados) {
      a.playbackRate = 1;
      this.fijarEscala(a, false);
    }
    this.frenados = [];
  }

  /** `will-change: transform` mantiene la escala con que el navegador dibujó un loop. */
  private fijarEscala(a: Animation, fija: boolean): void {
    const blanco = (a.effect as KeyframeEffect | null)?.target as HTMLElement | SVGElement | null;
    if (!blanco) return;
    if (fija) blanco.style.willChange = 'transform';
    else blanco.style.removeProperty('will-change');
  }

  private luego(ms: number, fn: () => void): void {
    const id = setTimeout(() => {
      this.temporizadores.delete(id);
      fn();
    }, ms);
    this.temporizadores.add(id);
  }
}
