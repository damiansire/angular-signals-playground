import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  ElementRef,
  afterNextRender,
  inject,
  input,
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
  CUADROS_DE_ESPERA,
  HOLGURA_DE_DIBUJO,
  LA_COLINA_APARECE_MS,
  TIRON_MS,
  aireQueCabe,
  aireQueCubre,
  camaraSobreLoDibujado,
  corridaDeLaCamara,
  cuadroDelViaje,
  escalaDeDibujo,
  esLoopQueCorre,
  laCapaTapaSuLugar,
  laGemaTapaLaPantalla,
  cuandoSeAbre,
  cuandoSuena,
  estrellasDelAlba,
  profundidadDelViaje,
  profundidadDesdeElOjo,
  letrasDelLlamado,
  loopsQueSeRedibujan,
  propiedadesAnimadas,
  marcaDelPseudo,
  tocaRedibujar,
  type Dibujada,
  planDeLaPrueba,
  tocarPrueba,
  type Lado,
} from './aviso-auriculares';

type Momento = 'esperando' | 'probando' | 'alejandose' | 'retomando' | 'listo';

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
  /**
   * Hay una partida para retomar: el toque es solo el gesto que deja sonar, sin prueba ni colina
   * (ADR 0015).
   */
  readonly retoma = input(false);
  /** El toque ya dejó sonar: la historia puede seguir donde quedó. */
  readonly retomar = output<void>();
  /**
   * Quien retoma no pasa por la colina, que tenía su ficha para borrar la partida: la lleva el aviso.
   * La confirmación es la de toda la vista, así dice lo mismo en todos lados.
   */
  readonly confirmandoBorrado = input(false);
  readonly empezarDeCero = output<void>();

  protected readonly momento = signal<Momento>('esperando');
  /**
   * El aviso recomienda el sonido: la primera vez arranca prendido, y apagarlo es una elección
   * explícita. Esa elección se guarda y vale en toda la app: quien lo apagó lo encuentra apagado.
   * Arrancando siempre prendido, seguir desde el aviso le volvía a prender el sonido.
   */
  protected readonly conSonido = signal(sonido().activo());
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
  /** La colina y la capa que la contiene, mientras llevan puesta la cámara. */
  private conCamara: HTMLElement[] = [];
  /** Los loops que van quietos hasta llegar, con su efecto aparte para devolvérselo. */
  private quietos: { animacion: Animation; efecto: KeyframeEffect; fijas: string[] }[] = [];
  /** Los pseudo-elementos con su pulso apagado hasta llegar. */
  private apagados: { blanco: Element; marca: string }[] = [];
  private tapados: (HTMLElement | SVGElement)[] = [];
  /**
   * La colina de atrás, mientras el aviso la tapa. Es un diálogo modal: Tab salía de la invitación a
   * la lamparita, a las fichas y a "Entrar" de la colina, que no se veían.
   */
  private inertes: HTMLElement[] = [];
  /** La página lleva el negro del ojo de fondo, mientras la cámara está adentro. */
  private conFondoNegro = false;
  /** Lo que el aviso tapa entero mientras espera y mientras se cierra: no se dibuja. */
  private bajoElAviso: (HTMLElement | SVGElement)[] = [];

  constructor() {
    inject(DestroyRef).onDestroy(() => {
      this.temporizadores.forEach(clearTimeout);
      cancelAnimationFrame(this.cuadro);
      this.sacarLaCamara();
      this.despertarLoops();
      this.destapar();
      this.soltarLaColina();
    });
    // El foco va a la invitación, así Enter alcanza; no si la landing arranca tapada (un deep-link).
    afterNextRender(() => {
      this.inertes = [...(this.host.parentElement?.children ?? [])].filter(
        (el): el is HTMLElement => el instanceof HTMLElement && el !== this.host && !el.inert,
      );
      for (const el of this.inertes) el.inert = true;
      // Tampoco se dibuja: el aviso la tapa entera, y sus capas (el cielo, las lomas, los juncos, el
      // globo) eran más de 100 MB de memoria de video a 3440 px. El paisaje es un SVG: no entra entre
      // los inertes, pero también se oculta.
      this.bajoElAviso = [...(this.host.parentElement?.children ?? [])].filter(
        (el): el is HTMLElement | SVGElement =>
          (el instanceof HTMLElement || el instanceof SVGElement) && el !== this.host,
      );
      for (const el of this.bajoElAviso) el.style.visibility = 'hidden';
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
    if ((e.target as Element | null)?.closest('.aa__mudo, .aa__de-cero')) return;
    if (this.momento() !== 'esperando') return;
    if (this.retoma()) this.seguirDondeQuedo();
    else if (this.conSonido()) this.probar();
    else this.sinSonido();
  }

  /**
   * El aviso sigue a la vista mientras la pantalla de inicio se desvanece entera: ocultarlo dejaba
   * ver la colina de día un instante entre la noche del aviso y la de la historia. Al terminar el
   * fundido se oculta: sus estrellas y su llamado seguían latiendo debajo, con opacidad cero.
   */
  private seguirDondeQuedo(): void {
    const conSonido = this.conSonido();
    sonido().alternar(conSonido);
    if (conSonido) sonido().desbloquear();
    this.momento.set('retomando');
    this.elegido.emit(conSonido);
    this.retomar.emit();
    const fundido = this.fundidoDeLaPantalla();
    if (fundido) {
      void fundido.then(() => {
        this.soltarLaColina();
        this.momento.set('listo');
      });
    }
  }

  /**
   * Termina cuando la pantalla de inicio, ya sin la colina (`.gone`), terminó de desvanecerse. Se
   * espera a su transición y no a un tiempo copiado de su CSS; sin transición (movimiento reducido),
   * ya terminó. `null` si nadie la está desvaneciendo: ocultarse dejaría ver la colina.
   */
  private fundidoDeLaPantalla(): Promise<unknown> | null {
    const pantalla = this.host.closest<HTMLElement>('.gone');
    if (!pantalla) return null;
    const fundidos = pantalla
      .getAnimations()
      .filter((a) => a instanceof CSSTransition && a.transitionProperty === 'opacity');
    return Promise.allSettled(fundidos.map((a) => a.finished));
  }

  protected pedirEmpezarDeCero(e: MouseEvent): void {
    e.stopPropagation();
    this.empezarDeCero.emit();
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
   * cortada en rectángulos. La colina se dibuja por escalones y la capa que la contiene pone el resto
   * (ver «La colina dibujada por escalones» en `aviso-auriculares.ts`).
   */
  private alejarse(conSonido: boolean): void {
    this.elegido.emit(conSonido);
    const escena = this.host.parentElement;
    const capa = escena && capaDeLaCamara(escena);
    if (sinMovimiento() || !escena || !capa) {
      this.llegar();
      return;
    }
    const r = this.host.getBoundingClientRect();
    const deLaCapa = capa.getBoundingClientRect();
    /** La capa, en las coordenadas de la colina: es lo que la colina dibujada tiene que tapar. */
    const caja = {
      x: deLaCapa.left - r.left,
      y: deLaCapa.top - r.top,
      ancho: deLaCapa.width,
      alto: deLaCapa.height,
    };
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
      corrida = laCorrida(colina, ojo);
    };
    /**
     * La cámara lleva el ojo al medio y lo devuelve a su lugar a medida que se aleja, parejo en
     * escala como el viaje: a la mitad del camino en escala, a la mitad del camino en pantalla.
     */
    const laCorrida = (
      colina: number,
      desde: { x: number; y: number },
    ): { x: number; y: number } => {
      const k = corridaDeLaCamara(colina, profundidad);
      return { x: (medio.x - desde.x) * k, y: (medio.y - desde.y) * k };
    };

    /**
     * Un escalón: la colina queda dibujada a la escala del final del tramo que empieza, y hasta
     * entonces solo la mueve la capa. Con el ojo muy cerca de un borde la capa agrandada no llegaría
     * a tapar el otro: se prueba con menos holgura hasta que tape.
     */
    const dibujar = (colina: number, llego: boolean): Dibujada => {
      // Los loops que hayan arrancado desde el escalón anterior también van quietos.
      this.aquietarLoops(escena);
      // Ya asoma la cara: la página deja de tener el negro del ojo de fondo.
      if (colina < profundidad) this.sacarElFondoNegro();
      let dibujada: Dibujada = { escala: 1, ojo, corrida: { x: 0, y: 0 } };
      for (let holgura = HOLGURA_DE_DIBUJO; !llego; holgura = Math.sqrt(holgura)) {
        const escalon = holgura < 1.01 ? colina : escalaDeDibujo(colina, holgura);
        dibujada = { escala: escalon, ojo, corrida: laCorrida(escalon, ojo) };
        const vista = camaraSobreLoDibujado(dibujada, colina, ojo, corrida);
        if (escalon === colina || laCapaTapaSuLugar(vista.escala, vista.corrida, ojo, caja)) break;
      }
      escena.style.transformOrigin = `${ojo.x}px ${ojo.y}px`;
      escena.style.scale = `${dibujada.escala}`;
      escena.style.translate = `${dibujada.corrida.x}px ${dibujada.corrida.y}px`;
      capa.style.transformOrigin = `${ojo.x - caja.x}px ${ojo.y - caja.y}px`;
      return dibujada;
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

    /**
     * El color del ojo de Angie, que llena la pantalla mientras la cámara está adentro. Mientras el
     * aviso se cierra, la colina no se dibuja: detrás hay solo ese negro, liso, que no pide memoria
     * de video. Los dos juntos desde el arranque eran más de 100 MB a 3440 px, y con poca memoria
     * al aviso le faltaban pedazos. La colina aparece un momento antes de que arranque la cámara, con
     * el aviso ya chico. Sin ojo que medir no hay negro que valga: la colina sale enseguida.
     */
    const negro = elOjo ? getComputedStyle(elOjo.firstElementChild ?? elOjo).fill : null;
    let aLaVista = false;

    let escala = 1;
    let dibujada: Dibujada | null = null;
    let reloj = 0;
    let anterior = 0;
    const pintar = (ahora: number): void => {
      // Un tirón no se salta: el viaje sigue donde iba. Con el reloj de pared, después de armar la
      // capa de la colina (un cuarto de segundo a 3440 px) lo que seguía aparecía ya empezado.
      reloj += Math.max(0, Math.min(ahora - anterior, TIRON_MS));
      anterior = ahora;
      const llego = reloj >= VIAJE_MS;
      const c = cuadroDelViaje(Math.min(reloj, VIAJE_MS), profundidad, cubre, cabe);
      if (!aLaVista) {
        if (negro && reloj < LA_COLINA_APARECE_MS) {
          // Sin la colina debajo, el aviso lleva la escala que tiene en pantalla.
          this.host.style.scale = `${c.aviso * c.colina}`;
          this.host.style.setProperty('--aa-aire', `${c.aire}px`);
          this.cuadro = requestAnimationFrame(pintar);
          return;
        }
        aLaVista = true;
        this.mostrarLaColina();
        escena.style.removeProperty('background-color');
        // La capa nace ya agrandada: el navegador la dibuja a esa escala y después solo la achica.
        capa.style.willChange = 'transform';
      }
      seguirElOjo(escala, c.colina);
      if (laGemaTapaLaPantalla(piezas, r)) this.tapar(detras);
      else this.destapar();
      escala = c.colina;
      // La capa es la que se mueve en cada cuadro; la colina solo cambia en los escalones. Los loops
      // van quietos todo el viaje (`aquietarLoops`, desde el primer escalón, con la colina recién
      // aparecida). Al llegar, el último escalón deja la colina a escala 1 y la capa sin nada que
      // agregar.
      let vista = dibujada && camaraSobreLoDibujado(dibujada, escala, ojo, corrida);
      if (
        !dibujada ||
        !vista ||
        llego ||
        tocaRedibujar(escala, dibujada.escala) ||
        !laCapaTapaSuLugar(vista.escala, vista.corrida, dibujada.ojo, caja)
      ) {
        dibujada = dibujar(escala, llego);
        vista = camaraSobreLoDibujado(dibujada, escala, ojo, corrida);
      }
      capa.style.scale = `${vista.escala}`;
      capa.style.translate = `${vista.corrida.x}px ${vista.corrida.y}px`;
      if (escala < profundidad) {
        // Cuando la cámara arranca, el aviso ya es una mota de pocos píxeles y deja de dibujarse, un
        // instante antes de llegar a cero. Con los dos a la vez, el navegador redibujaba la colina
        // entera cada tres cuadros, y la memoria de video del aviso todavía no había vuelto cuando
        // llegaba el primer escalón: con poca, la pantalla salía en blanco un cuadro. Sin dibujarse
        // tampoco recalcula el estilo de todo lo suyo en cada cuadro del viaje.
        this.host.style.visibility = 'hidden';
      } else {
        // El aviso, adentro de la colina agrandada, se achica alrededor de su medio puesto sobre el
        // ojo.
        this.host.style.translate = `${ojo.x - medio.x}px ${ojo.y - medio.y}px`;
        this.host.style.scale = `${c.aviso}`;
        this.host.style.setProperty('--aa-aire', `${c.aire}px`);
      }
      this.cuadro = requestAnimationFrame(llego ? terminar : pintar);
    };
    /**
     * Un cuadro después del último escalón, ya a escala 1 y sin corrida, sacar la cámara no mueve
     * nada. Los loops despiertan unos cuadros más tarde: cada uno vuelve a su capa, y juntas con la
     * de la cámara, que todavía no devolvió su memoria de video, pedían de más y a la colina le
     * faltaba una franja un cuadro.
     */
    const terminar = (): void => {
      this.sacarLaCamara();
      this.destapar();
      this.enCuadros(CUADROS_DE_ESPERA, () => {
        this.despertarLoops();
        // El aviso sigue sin dibujarse hasta que lo oculta `listo`: devuelto, volvía entero un cuadro.
        this.viaje.emit(false);
        this.llegar();
      });
    };
    this.conCamara = [escena, capa];
    this.alivianarElAviso();
    // La máscara entra con el aviso entero: sin aire, el aviso desaparecía un cuadro.
    this.host.style.setProperty('--aa-aire', `${cubre}px`);
    this.momento.set('alejandose');
    if (negro) {
      // Mientras la colina no se dibuja, detrás del aviso hay solo el negro del ojo.
      escena.style.backgroundColor = negro;
      // Y también es el fondo de la página hasta el primer escalón: si al navegador le falta memoria
      // de video para un cuadro, muestra lo que falta con el color de la página, y adentro del ojo
      // tiene que ser negro. En blanco, al aparecer la colina quedaba una franja clara un cuadro.
      document.documentElement.style.backgroundColor = negro;
      this.conFondoNegro = true;
    }
    anterior = performance.now();
    pintar(anterior);
  }

  /** Corre `fn` dentro de `cuadros` cuadros de pantalla; se cancela con la vista. */
  private enCuadros(cuadros: number, fn: () => void): void {
    this.cuadro = requestAnimationFrame(() => {
      if (cuadros <= 1) fn();
      else this.enCuadros(cuadros - 1, fn);
    });
  }

  /**
   * Mientras se cierra, el aviso es una sola capa que el navegador dibuja una vez y solo achica. Con
   * sus loops andando eran tres a pantalla entera (el cielo, el velo y lo de adelante, partidos por
   * las setenta estrellas que titilan en el medio): 57 MB de memoria de video a 3440 px que, con poca,
   * no dejaban lugar para el primer escalón de la colina, y le faltaban pedazos un cuadro. Quietos en
   * su pose no se nota: el aviso se va en un segundo y medio. No vuelven a moverse, que el aviso no
   * vuelve.
   */
  private alivianarElAviso(): void {
    for (const animacion of this.host.getAnimations({ subtree: true }).filter(esLoopQueCorre)) {
      animacion.playbackRate = 0;
      try {
        animacion.commitStyles();
        animacion.effect = null;
      } catch {
        // Un pseudo-elemento, o algo que no se dibuja: queda quieto con su animación puesta.
      }
    }
    this.host.style.willChange = 'transform';
    // Angie sigue moviéndose con sus muelles (el salto del acorde, las cejas caídas): con capa propia
    // se redibuja ella sola. En la del aviso, cada cuadro suyo redibujaba franjas del ancho de la
    // pantalla, 14 MB por cuadro a 3440 px que el navegador tardaba en devolver.
    this.host
      .querySelector<HTMLElement>('.aa__angie')
      ?.style.setProperty('will-change', 'transform');
  }

  private sacarElFondoNegro(): void {
    if (!this.conFondoNegro) return;
    document.documentElement.style.removeProperty('background-color');
    this.conFondoNegro = false;
  }

  private sacarLaCamara(): void {
    this.sacarElFondoNegro();
    for (const el of this.conCamara) {
      for (const p of [
        'scale',
        'transform-origin',
        'translate',
        'will-change',
        'background-color',
      ]) {
        el.style.removeProperty(p);
      }
    }
    this.host.style.removeProperty('will-change');
    this.conCamara = [];
  }

  /** La colina queda a la vista: vuelve a ser tocable y a estar en el orden de foco. */
  private llegar(): void {
    this.soltarLaColina();
    this.momento.set('listo');
    this.llego.emit();
  }

  private soltarLaColina(): void {
    this.mostrarLaColina();
    for (const el of this.inertes) el.inert = false;
    this.inertes = [];
  }

  /** La colina vuelve a dibujarse, todavía sin poder tocarse: el aviso está por dejar de taparla. */
  private mostrarLaColina(): void {
    for (const el of this.bajoElAviso) el.style.removeProperty('visibility');
    this.bajoElAviso = [];
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

  /**
   * Los loops quedan quietos en la pose de este cuadro y sin animación enganchada: así no tienen capa
   * propia y la colina entera es una sola, que solo se redibuja en cada escalón. Animando, cada
   * pieza de Angie era una capa que a ×100–×500 cubría la pantalla: con poca memoria de video no
   * entraban al redibujar y la colina salía un cuadro en blanco. Con velocidad 0 y no con pause(),
   * que le saca al CSS el control de `animation-play-state` (ver `pausa-del-fondo.ts`).
   */
  private aquietarLoops(escena: HTMLElement): void {
    for (const animacion of loopsQueSeRedibujan(
      escena.getAnimations({ subtree: true }),
      this.host,
    )) {
      const efecto = animacion.effect as KeyframeEffect;
      const marca = efecto.target ? marcaDelPseudo(efecto.pseudoElement) : null;
      if (efecto.target && marca) {
        // `commitStyles` no escribe en un pseudo-elemento, y una animación que sostiene su pose
        // también le pide capa: se apaga entero (`data-quieto` en `intro-tusi.css`).
        alternarMarca(efecto.target, marca, true);
        this.apagados.push({ blanco: efecto.target, marca });
        continue;
      }
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

  /**
   * Vuelven a moverse desde la pose en que quedaron: sin salto. Los pseudo-elementos arrancan su
   * pulso de cero, que es la pose en que estuvieron apagados.
   */
  private despertarLoops(): void {
    for (const { animacion, efecto, fijas } of this.quietos) {
      animacion.effect = efecto;
      const blanco = efecto.target as HTMLElement | SVGElement | null;
      for (const p of fijas) blanco?.style.removeProperty(p);
      animacion.playbackRate = 1;
    }
    this.quietos = [];
    for (const { blanco, marca } of this.apagados) alternarMarca(blanco, marca, false);
    this.apagados = [];
  }

  private luego(ms: number, fn: () => void): void {
    const id = setTimeout(() => {
      this.temporizadores.delete(id);
      fn();
    }, ms);
    this.temporizadores.add(id);
  }
}

/**
 * La capa que lleva la cámara: el contenedor de más afuera que recorta su contenido. Recortada, la
 * capa mide lo que la pantalla y no lo que la colina agrandada. Y tiene que ser el de más afuera:
 * con otro recorte por encima, el navegador pasa ese recorte al dibujo de la capa, que cambia con
 * cada cuadro de la cámara, y la capa entera se volvía a dibujar en casi todos (620 mosaicos en un
 * segundo y medio a 3440 px, contra 232 con la capa afuera, que son los de los escalones).
 */
function capaDeLaCamara(escena: HTMLElement): HTMLElement | null {
  let capa: HTMLElement | null = null;
  for (let el = escena.parentElement; el && el !== document.body; el = el.parentElement) {
    if (el === document.documentElement) break;
    if (getComputedStyle(el).overflowX !== 'visible') capa = el;
  }
  return capa ?? escena.parentElement;
}

/** Prende o apaga una marca de `data-quieto` sin tocar las otras del mismo elemento. */
function alternarMarca(blanco: Element, marca: string, prendida: boolean): void {
  const marcas = new Set((blanco.getAttribute('data-quieto') ?? '').split(' ').filter(Boolean));
  if (prendida) marcas.add(marca);
  else marcas.delete(marca);
  if (marcas.size) blanco.setAttribute('data-quieto', [...marcas].join(' '));
  else blanco.removeAttribute('data-quieto');
}
