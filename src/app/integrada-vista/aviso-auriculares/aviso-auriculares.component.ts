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
import { ALBA_MS, type LuzQueLlega } from '../inicio-angie';
import { PIEDRA_DE_LA_COLINA, SOMBRA_DE_LA_PIEDRA } from '../piedra-de-la-colina';
import {
  BASE_DE_LA_PIEDRA,
  CAJA_DE_LA_PIEDRA,
  CHOQUE_MS,
  LA_COLINA_APARECE_MS,
  LARGO_DE_LA_COLA,
  LLAMADO,
  LLAMADO_TACTIL,
  LOMA_DEL_PLANETA,
  NUBES_DEL_PASO,
  RADIO_DE_LA_LUZ,
  RADIO_DEL_PLANETA,
  TIRON_MS,
  cuadroDeLaCaida,
  cuandoSeAbre,
  cuandoSuena,
  dibujoDelPlaneta,
  estrellasDelAlba,
  letrasDelLlamado,
  planDeLaPrueba,
  tocarPrueba,
  type CuadroDeLaCaida,
  type EscenarioDeLaCaida,
  type Lado,
} from './aviso-auriculares';

type Momento = 'esperando' | 'probando' | 'cayendo' | 'retomando' | 'listo';

/** Los lentes de sol, en el plano de la cara: centrados entre los ojos, uno en espejo del otro. */
const LENTE_IZQUIERDO =
  'M-132 -36H-16C-11 -36 -8 -32 -9 -26L-16 12C-20 34 -42 44 -72 44C-102 44 -122 34 -127 12L-136 -26C-137 -32 -136 -36 -132 -36Z';
const LENTE_DERECHO =
  'M132 -36H16C11 -36 8 -32 9 -26L16 12C20 34 42 44 72 44C102 44 122 34 127 12L136 -26C137 -32 136 -36 132 -36Z';

/** The puffs of a passing cloud: x, y and radius, around its middle. */
const BOLLOS_DE_NUBE = [
  [-90, 4, 46],
  [-34, -36, 62],
  [40, -22, 54],
  [92, 8, 40],
  [0, 18, 52],
  [-50, 22, 40],
  [56, 24, 40],
] as const;

/** For how many frames the notice's loops are stilled again after the fall starts. */
const CUADROS_QUE_SE_AQUIETA = 12;

/**
 * The hill's title comes in once the morning is there and the hill's loops are moving again, a few
 * frames later: together they asked for more video memory than a loaded PC has.
 */
const EL_TITULO_ENTRA_MS = CHOQUE_MS + ALBA_MS + 400;

/**
 * Antes de la mañana de Angie, todavía de noche: ella espera en el medio con los auriculares puestos
 * y lentes de sol. Tocar en cualquier lado es el gesto que el navegador exige para dejar sonar, así
 * que toda la intro llega con audio; arriba se puede apagar. Suena la prueba de un oído al otro,
 * Angie se vuelca hacia el lado que suena, y después se vuelve luz y cae en su planetita: en la
 * colina, de noche, donde vuelve a ser ella y amanece.
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
    '[class.aa--cayendo]': "momento() === 'cayendo'",
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
  /** Se eligió (con o sin sonido) y Angie se va: la colina puede despertarse. */
  readonly elegido = output<boolean>();
  /**
   * The hill is about to be drawn again under the clouds, and it has to be night already, without
   * Angie. Not before: its night multiplies, and that alone gave the hidden hill a full-screen layer
   * of its own (and the notice another) while Angie jumped.
   */
  readonly anochece = output<void>();
  /** The light touched the hill's stone: the notice is gone, and Angie comes back there. */
  readonly aterriza = output<LuzQueLlega>();
  /** Angie is on the hill and the morning came: now its title comes in. */
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
  protected readonly radioDeLaLuz = RADIO_DE_LA_LUZ;
  /** Las más grandes, lejos de la franja de arriba: en un celular una cruz caía sobre el sonido. */
  protected readonly destellos = this.estrellas.filter((e) => e.r >= 3 && e.y >= 110);
  protected readonly llamado = LLAMADO;
  protected readonly llamadoTactil = LLAMADO_TACTIL;
  protected readonly letras = letrasDelLlamado(LLAMADO);
  protected readonly letrasTactil = letrasDelLlamado(LLAMADO_TACTIL);
  protected readonly lenteIzquierdo = LENTE_IZQUIERDO;
  protected readonly lenteDerecho = LENTE_DERECHO;

  /** Angie's little planet, with a seed: the same one on every visit. */
  protected readonly planeta = dibujoDelPlaneta(7);
  protected readonly radioDelPlaneta = RADIO_DEL_PLANETA;
  protected readonly lomaDelPlaneta = LOMA_DEL_PLANETA;
  protected readonly cajaDeLaPiedra = CAJA_DE_LA_PIEDRA;
  protected readonly piedra = PIEDRA_DE_LA_COLINA;
  protected readonly sombraDeLaPiedra = SOMBRA_DE_LA_PIEDRA;
  protected readonly rayosDelSol = Array.from({ length: 12 }, (_, i) => i * 30);
  protected readonly nubesDelPaso = NUBES_DEL_PASO;
  protected readonly bollosDeNube = BOLLOS_DE_NUBE;
  protected readonly colaDeLaLuz = Array.from({ length: LARGO_DE_LA_COLA }, (_, i) => i);

  private readonly seguir = viewChild.required<ElementRef<HTMLButtonElement>>('seguir');
  private readonly angie = viewChild.required(MascotaVivaComponent);
  private readonly host: HTMLElement = inject(ElementRef<HTMLElement>).nativeElement;
  private readonly temporizadores = new Set<ReturnType<typeof setTimeout>>();
  private cuadro = 0;
  /**
   * La colina de atrás, mientras el aviso la tapa. Es un diálogo modal: Tab salía de la invitación a
   * la lamparita, a las fichas y a "Entrar" de la colina, que no se veían.
   */
  private inertes: HTMLElement[] = [];
  /** Lo que el aviso tapa entero mientras espera y mientras Angie cae: no se dibuja. */
  private bajoElAviso: (HTMLElement | SVGElement)[] = [];

  constructor() {
    inject(DestroyRef).onDestroy(() => {
      this.temporizadores.forEach(clearTimeout);
      cancelAnimationFrame(this.cuadro);
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
      this.caer(true);
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
    this.luego(cuandoSeAbre(plan) * 1000, () => this.caer(true));
  }

  private sinSonido(): void {
    sonido().alternar(false);
    this.caer(false);
  }

  /**
   * Angie turns into light and falls onto the hill (see «The fall» in `aviso-auriculares.ts`). It
   * goes frame by frame from here, with a clock that does not skip a hitch: after a heavy frame the
   * fall goes on where it was instead of showing up already advanced. The hill waits under the
   * notice, is drawn again under the clouds at its real size and at night (`anochece`), and gets Angie
   * back when the light touches the stone (`aterriza`).
   */
  private caer(conSonido: boolean): void {
    this.elegido.emit(conSonido);
    const escenario = sinMovimiento() ? null : this.escenarioDeLaCaida();
    if (!escenario) {
      this.llegar();
      return;
    }
    const piezas = this.piezasDeLaCaida();
    this.aquietarElAviso();
    this.momento.set('cayendo');
    let reloj = 0;
    let anterior = performance.now();
    let colinaALaVista = false;
    let c0 = 0;
    const pintar = (ahora: number): void => {
      reloj += Math.max(0, Math.min(ahora - anterior, TIRON_MS));
      anterior = ahora;
      if (!colinaALaVista && reloj >= LA_COLINA_APARECE_MS) {
        colinaALaVista = true;
        this.anochece.emit();
        this.mostrarLaColina();
      }
      // Leaving the waiting moment restarts some of Angie's loops after they were stilled: still
      // them again while she can be seen, or she keeps a layer that splits the rest in three.
      if (c0 < CUADROS_QUE_SE_AQUIETA) {
        c0++;
        this.aquietarElAviso();
      }
      if (reloj >= CHOQUE_MS) {
        // The star touched the stone: from here the hill draws the light and Angie (`aterrizar`).
        // The notice stops being drawn in this same frame: over the hill's night, which
        // multiplies, it is a full-screen layer of its own, and keeping it while the sun came up
        // was more than a loaded PC's video memory.
        const caja = this.host.getBoundingClientRect();
        const { x, y, escala } = cuadroDeLaCaida(CHOQUE_MS, escenario).estrella;
        this.host.style.display = 'none';
        this.aterriza.emit({ x: caja.left + x, y: caja.top + y, r: RADIO_DE_LA_LUZ * escala });
        this.luego(EL_TITULO_ENTRA_MS - reloj, () => this.llegar());
        return;
      }
      pintarLaCaida(piezas, cuadroDeLaCaida(reloj, escenario), reloj, escenario.alto);
      this.cuadro = requestAnimationFrame(pintar);
    };
    pintar(anterior);
  }

  /**
   * Where the notice's Angie and the hill's stone are, in px of the notice. The hill is hidden but
   * laid out, so it can be measured.
   */
  private escenarioDeLaCaida(): EscenarioDeLaCaida | null {
    const piedra = this.host.parentElement?.querySelector<HTMLElement>('.ini__piedra');
    const angie = this.host.querySelector('.aa__angie');
    const r = this.host.getBoundingClientRect();
    if (!piedra || !angie || !r.width || !r.height || !piedra.offsetWidth) return null;
    const a = angie.getBoundingClientRect();
    const s = piedra.getBoundingClientRect();
    // The stone's drawing is a square. It leans a little with the hill: its middle barely moves.
    const lado = piedra.offsetWidth;
    return {
      ancho: r.width,
      alto: r.height,
      angie: { x: a.left + a.width / 2 - r.left, y: a.top + a.height / 2 - r.top },
      piedra: {
        x: s.left + s.width / 2 - r.left,
        y: s.top + s.height / 2 - r.top + (BASE_DE_LA_PIEDRA - 0.5) * lado,
        ancho: lado,
      },
    };
  }

  private piezasDeLaCaida(): PiezasDeLaCaida {
    const una = <T extends Element>(selector: string): T => {
      const el = this.host.querySelector<T>(selector);
      // Fail fast: a missing layer would leave the fall half drawn without a word.
      if (!el) throw new Error(`aviso-auriculares: falta ${selector}`);
      return el;
    };
    const todas = <T extends Element>(selector: string): T[] => [
      ...this.host.querySelectorAll<T>(selector),
    ];
    return {
      textos: [una<HTMLElement>('.aa__titulo'), una<HTMLElement>('.aa__pie')],
      escena: una('.aa__escena'),
      noche: una('.aa__cielo'),
      lejos: una('.aa__lejos'),
      espacio: una('.aa__espacio'),
      lienzo: una('.aa__lienzo-del-planeta'),
      planeta: una('.aa__planeta'),
      sombra: una('.aa__noche-del-planeta'),
      sol: una('.aa__sol-lejano'),
      atmosfera: una('.aa__atmosfera'),
      nubesDelPaso: una('.aa__nubes-del-paso'),
      nubes: todas('.aa__nubes-del-paso > g'),
      cola: todas('.aa__luz > circle:not([class])'),
      luz: una('.aa__luz-que-cae'),
      brillo: una('.aa__brillo-de-la-luz'),
      estallido: una('.aa__estallido'),
    };
  }

  /**
   * The notice's loops stand still in their pose while Angie falls: the stars that twinkle in the
   * night that slides away gave every layer above them a layer of its own, the size of the screen.
   * The notice does not come back, so they never move again.
   */
  private aquietarElAviso(): void {
    for (const animacion of this.host.getAnimations({ subtree: true })) {
      if (animacion.effect?.getComputedTiming().iterations !== Infinity) continue;
      animacion.playbackRate = 0;
      try {
        animacion.commitStyles();
        animacion.effect = null;
      } catch {
        // A pseudo-element, or something not drawn: it stays still with its animation on.
      }
    }
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

  private luego(ms: number, fn: () => void): void {
    const id = setTimeout(() => {
      this.temporizadores.delete(id);
      fn();
    }, ms);
    this.temporizadores.add(id);
  }
}

/** The fall's layers, found once when it starts. */
interface PiezasDeLaCaida {
  readonly textos: readonly HTMLElement[];
  /** Angie with her halo and her floor of light. */
  readonly escena: HTMLElement;
  readonly noche: HTMLElement;
  readonly lejos: HTMLElement;
  readonly espacio: HTMLElement;
  readonly lienzo: SVGSVGElement;
  readonly planeta: SVGGElement;
  readonly sombra: SVGElement;
  readonly sol: SVGGElement;
  readonly atmosfera: HTMLElement;
  readonly nubesDelPaso: SVGSVGElement;
  readonly nubes: readonly SVGGElement[];
  readonly cola: readonly SVGCircleElement[];
  readonly luz: SVGGElement;
  readonly brillo: SVGElement;
  readonly estallido: SVGCircleElement;
}

const px = (v: number): string => v.toFixed(1);
const k = (v: number): string => v.toFixed(4);

/**
 * What is not seen is not drawn: a layer at opacity 0 still costs its video memory, and the night,
 * space and the clouds are each the size of the screen.
 */
function verSi(el: HTMLElement | SVGElement, si: boolean): void {
  el.style.visibility = si ? '' : 'hidden';
}

function circulo(
  el: SVGCircleElement,
  c: { x: number; y: number; r: number; opacidad: number },
): void {
  el.setAttribute('cx', px(c.x));
  el.setAttribute('cy', px(c.y));
  el.setAttribute('r', px(c.r));
  el.setAttribute('opacity', k(c.opacidad));
}

function pintarLaCaida(p: PiezasDeLaCaida, c: CuadroDeLaCaida, t: number, alto: number): void {
  for (const el of p.textos) {
    el.style.opacity = k(c.texto.opacidad);
    el.style.translate = `0 ${px(c.texto.dy)}px`;
  }

  p.escena.style.opacity = k(c.angie.opacidad);
  p.escena.style.translate = `0 ${px(c.angie.dy)}px`;
  p.escena.style.scale = `${k(c.angie.sx)} ${k(c.angie.sy)}`;
  p.escena.style.filter = `brightness(${k(c.angie.brillo)})`;
  verSi(p.escena, c.angie.opacidad > 0);

  p.noche.style.opacity = k(c.noche.opacidad);
  p.noche.style.translate = `0 ${px(c.noche.dy)}px`;
  // Its top edge fades into space: a hard edge read as a curtain being pulled. The fade grows with
  // what the night went down: a fixed one made the top of the screen go see-through at once.
  const borde = Math.min(c.noche.dy, 0.39 * alto);
  p.noche.style.maskImage = borde > 0 ? `linear-gradient(transparent, #000 ${px(borde)}px)` : '';
  verSi(p.noche, c.noche.opacidad > 0);

  p.lejos.style.opacity = k(c.lejos);
  verSi(p.lejos, c.lejos > 0);
  p.espacio.style.opacity = k(c.espacio);
  p.lienzo.style.opacity = k(c.planeta.opacidad);
  verSi(p.lienzo, c.planeta.opacidad > 0);
  p.planeta.setAttribute(
    'transform',
    `translate(${px(c.planeta.x)} ${px(c.planeta.y)}) scale(${k(c.planeta.k)})`,
  );
  p.sombra.setAttribute('transform', `rotate(${px(c.planeta.sombra)})`);
  p.sol.setAttribute(
    'transform',
    `translate(${px(c.solLejano.x)} ${px(c.solLejano.y)}) scale(${k(c.solLejano.escala)})`,
  );
  p.sol.setAttribute('opacity', k(c.solLejano.opacidad));
  p.atmosfera.style.opacity = k(c.atmosfera);

  c.nubes.forEach((n, i) => {
    const g = p.nubes[i];
    if (!g) return;
    g.setAttribute('transform', `translate(${px(n.x)} ${px(n.y)}) scale(${k(n.escala)})`);
    g.setAttribute('opacity', k(n.opacidad));
  });
  verSi(
    p.nubesDelPaso,
    c.nubes.some((n) => n.opacidad > 0),
  );

  c.cola.forEach((punto, i) => {
    const el = p.cola[i];
    if (el) circulo(el, punto);
  });
  const e = c.estrella;
  p.luz.setAttribute('transform', `translate(${px(e.x)} ${px(e.y)}) scale(${k(e.escala)})`);
  p.luz.setAttribute('opacity', k(e.opacidad));
  // The sparkle turns and breathes: a still star read as a sticker.
  p.brillo.setAttribute(
    'transform',
    `rotate(${px(e.giro)}) scale(${k(1 + 0.18 * Math.sin(t * 0.03))})`,
  );
  circulo(p.estallido, c.destello);
}
