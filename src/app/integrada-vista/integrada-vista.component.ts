import {
  ApplicationRef,
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  ElementRef,
  EnvironmentInjector,
  ErrorHandler,
  Injector,
  Provider,
  TemplateRef,
  Type,
  afterNextRender,
  createComponent,
  createEnvironmentInjector,
  inject,
  isDevMode,
  computed,
  effect,
  signal,
  untracked,
  viewChild,
} from '@angular/core';
import { Location, NgTemplateOutlet } from '@angular/common';
import { RouterLink } from '@angular/router';

import { MascotaVivaComponent } from '../components-draw/mascota-viva/mascota-viva.component';
import {
  LUZ_DE,
  NAVE_DEL_VIAJE,
  TripulacionComponent,
  type LineaDelViaje,
  type QuienDelViaje,
} from '../components-draw/tripulacion/tripulacion.component';
import { RetratoDeNaveComponent } from '../components-draw/tripulacion/retrato-de-nave.component';
import { acentoDe } from './cinematicas/escenas/acentos';
import { guionDe, idDeLineaDelViaje } from './guion-del-viaje';
import { palabrasDeLinea } from '../libs/guion';
import { VOCES_GRABADAS } from './voces-grabadas';
import { sinMovimiento } from '../libs/muelle';
import {
  caminoDeColina,
  estrellas,
  floresDeLadera,
  initInicioAngie,
  juncos,
  letrasDelDicho,
  letrasDelTitulo,
  matasDePasto,
  TECLA_MS,
  rayosDelSol,
  type InicioAngie,
} from './inicio-angie';
import { LO_QUE_DICE_EL_SOL, LO_QUE_RESPONDE_ANGIE } from './intercambio-del-sol';
import { LO_QUE_DECIDE, LO_QUE_PRESIENTE } from './pensamientos-de-la-colina';
import type { HuecoDelPrologo } from './operadores-del-prologo';
import { PAGINAS_DEL_MANUAL, pasoEnElManual, type PaginaDelManual } from './manual-de-a-bordo';
import { HojaDelHuecoComponent } from './hoja-del-hueco/hoja-del-hueco.component';
import { PAGINA_DEL_MANUAL } from '../signals/level-0-introduction/manual/pagina-del-manual';
import { vigilarEstampado } from './estampado-tardio';
import { apagarLaTele, encenderLaTele } from './tele-del-manual';
import { tocarManual } from './musica-del-manual';
import type { Musica } from './musica-del-presentimiento';
import { sonido } from '../libs/sonido';
import { AYUDA_DE_ANGIE } from '../components-atom/manipulable-system/manipulable-system.component';

import { signalsRoutesTree } from '../signals/signals-routes-tree';
import { type RouteItem, type SubNivelDiferido } from '../interfaces/route-item.interface';
import { initIntroTusi, type IntroTusiHandle } from './intro-tusi';
import { buildWhereQuery, parseWhereQuery } from './url-sync';
import { guardarPausaFondo, initPausaDelFondo, leerPausaFondo } from './pausa-del-fondo';
import {
  almacenDelNavegador,
  cargarPartida,
  conCinematica,
  conEstablecido,
  conPrologo,
  conPunto,
  conViaje,
  conceptosEstablecidos,
  guardarPartida,
  PARTIDA_VACIA,
  type LugarDelViaje,
  type Partida,
} from '../libs/partida';
import { CinematicaComponent } from './cinematicas/cinematica.component';
import { PUNTOS_DEL_PROLOGO } from './puntos-del-prologo';
import { despuesDelAviso, entradaDeLaHistoria } from './retomar';
import { AvisoAuricularesComponent } from './aviso-auriculares/aviso-auriculares.component';
import {
  CAPITULO_FINAL,
  CAPITULO_REVELACION,
  type Cinematica,
} from './cinematicas/cinematica-guion';
import {
  CAPITULO_DE_CONCEPTO,
  conceptoDeCapitulo,
  esElFin,
  etapaDe,
  finDelViaje,
  lugarDelLink,
  paginasDeEtapa,
  siguienteEtapa,
} from './viaje';

/** Cuánto dura el "¿seguro?" de "Empezar de cero" antes de volver a su estado normal. */
const CONFIRMACION_DE_BORRADO_MS = 4000;

/**
 * Qué libro muestra la hoja: su nombre, cómo se cierra y desde qué número cuenta sus leyes. Una
 * etapa del viaje dice además su concepto, para anotar lo resuelto, y lleva la pista de Angie: ya
 * pactaron, y desde ahí ella enseña.
 */
interface Libro {
  readonly nombre: string;
  /** Lo que dice el botón de la última página: adónde sigue la historia. */
  readonly sigue: string;
  readonly primeraLey: number;
  readonly concepto?: number;
  readonly ayuda?: boolean;
}
const MANUAL: Libro = { nombre: 'Manual de a bordo', sigue: 'Seguir la historia', primeraLey: 1 };
const SIGNAL_SPACE: Libro = {
  nombre: 'Signal Space',
  sigue: 'Seguir',
  primeraLey: PAGINAS_DEL_MANUAL.length + 1,
};

/**
 * `?prologo=<id de línea>` (solo en dev) se lee al cargar el módulo: para cuando el prólogo
 * arranca, el viaje puede haber reescrito la barra y el parámetro ya no estar.
 */
const PROLOGO_PEDIDO =
  typeof location === 'undefined' ? null : new URLSearchParams(location.search).get('prologo');

/**
 * Vista integrada: la historia entera en la ruta `/`. La colina, el prólogo y el viaje por los once
 * capítulos, cada uno con su cinemática y su hoja. Cada página de la hoja EMBEBE el componente REAL de
 * `/signals/level/X/sub-level/Z` (sacado de `signalsRoutesTree`).
 *
 * La colina y el prólogo son imperativos (canvas, SVG, audio); se arrancan en `afterNextRender`
 * (solo browser) y el cleanup corta rAF y listeners.
 */
@Component({
  selector: 'app-integrada-vista',
  imports: [
    NgTemplateOutlet,
    RouterLink,
    CinematicaComponent,
    MascotaVivaComponent,
    AvisoAuricularesComponent,
    HojaDelHuecoComponent,
    TripulacionComponent,
    RetratoDeNaveComponent,
  ],
  templateUrl: './integrada-vista.component.html',
  styleUrls: [
    './integrada-vista.component.css',
    './intro-tusi.css',
    './inicio-angie.css',
    './prologo-anomalia.css',
    './manual-de-a-bordo.css',
    './boot-fallo.css',
    './angosto.css',
    './viaje-cine.css',
    './viaje-angosto.css',
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  // En `document`: un botón de la pantalla que se rehace al tocarlo deja el foco en el `body`.
  host: { '(document:keydown)': 'teclaDelManual($event)' },
})
export class IntegradaVistaComponent {
  private readonly host = inject(ElementRef<HTMLElement>).nativeElement as HTMLElement;
  private readonly destroyRef = inject(DestroyRef);
  private readonly env = inject(EnvironmentInjector);
  private readonly injector = inject(Injector);
  private readonly appRef = inject(ApplicationRef);
  private readonly location = inject(Location);
  private readonly errorHandler = inject(ErrorHandler);
  // Por nombre: la pantalla de inicio tiene su propia Angie, y la primera del template no es esta.
  private readonly guia = viewChild('guia', { read: MascotaVivaComponent });
  /** La de la colina: la escena la lleva hasta el borde, y el paso y la pose los pone ella. */
  private readonly angieInicio = viewChild('angieInicio', { read: MascotaVivaComponent });

  /** La cámara viaja desde su ojo: mientras dura, Angie no parpadea. */
  protected angieMiraFijo(fijo: boolean): void {
    this.angieInicio()?.sinParpadear(fijo);
  }

  /** La escena de la colina, para que el aviso le avise cuando se va. */
  private inicio: InicioAngie | null = null;
  /** La pantalla de inicio, para entrar sin la colina cuando hay dónde retomar. */
  private landing: IntroTusiHandle | null = null;

  /**
   * La cámara llegó desde el ojo de Angie a la colina: entra el título y empieza su música. Aunque hayan elegido
   * sin sonido: la música espera callada, y si lo prenden en la colina, suena ahí.
   */
  protected alLlegarALaColina(): void {
    this.inicio?.revelar();
  }

  /** Con una partida para retomar, el aviso no lleva a la colina: sigue la historia donde quedó. */
  protected readonly retomaDespuesDelAviso = computed(() => {
    const { punto, prologo } = this.partida();
    return despuesDelAviso(punto, PUNTOS_DEL_PROLOGO, prologo) !== 'colina';
  });

  protected retomarDondeQuedo(): void {
    this.angieEsperando.set(false);
    this.landing?.entrarSinDespedida();
  }

  /** El título, la bajada y el llamado de la colina, en letras: entran y se mueven de a una. */
  protected readonly titulo = letrasDelTitulo(
    ['Las aventuras de Angie', 'por el SignalVerso'],
    new Set(['SignalVerso']),
  );
  protected readonly bajada = letrasDelTitulo(['Una introducción interactiva a los Signals'])[0];
  protected readonly llamado = letrasDelTitulo(['Hacé click para iniciar las aventuras'])[0];
  /** En una pantalla táctil no hay click: se toca. El CSS muestra la que corresponde. */
  protected readonly llamadoTactil = letrasDelTitulo(['Tocá para iniciar las aventuras'])[0];

  /** Lo que se dicen el sol y Angie y lo que ella piensa, en letras: los globos se escriben de a una. */
  protected readonly intercambio = {
    sol: letrasDelDicho(LO_QUE_DICE_EL_SOL),
    angie: letrasDelDicho(LO_QUE_RESPONDE_ANGIE),
    /** Los dos pensamientos en la misma nube, en el orden en que los piensa. */
    piensa: [letrasDelDicho(LO_QUE_PRESIENTE), letrasDelDicho(LO_QUE_DECIDE)],
  };
  protected readonly tecla = `${TECLA_MS}ms`;

  /** Angie en la colina se mueve sola hasta que la despedida la desarma: ahí manda la salida. */
  protected readonly angieEsperando = signal(true);
  /** Angie del prólogo: tiene vida propia solo mientras está en escena y la escena corre. */
  protected readonly angiePrologo = signal(false);

  /** El paisaje de la pantalla de inicio. Con semilla: la misma mañana en cada visita. */
  protected readonly paisaje = {
    colina: caminoDeColina(),
    rayos: rayosDelSol(),
    matas: matasDePasto(11, 70),
    flores: floresDeLadera(23, 46),
    juncosIzq: juncos(31, 9, -1),
    juncosDer: juncos(47, 9, 1),
    estrellas: estrellas(59, 70),
  };

  /** Las pantallas de cada concepto (del árbol de conceptos): son las páginas de su etapa. */
  private readonly subComponents: RouteItem[][] = signalsRoutesTree.map(
    (lvl) => lvl.subLevels ?? [],
  );

  /**
   * El boot falló. La colina y el prólogo son imperativos: sin esto, cualquier excepción en el
   * arranque deja al usuario mirando una pantalla muerta, sin mensaje y sin forma de saber que hay
   * algo roto. Angular no puede renderizar un fallback que nadie declaró.
   */
  readonly bootFallo = signal(false);

  /** La cinemática en pantalla, si hay una. */
  protected readonly cinematica = signal<Cinematica | null>(null);
  protected readonly cinematicaCompleta = signal(false);
  /**
   * Lo establecido, por número de capítulo, para el final, que dibuja los doce átomos de antes. El 0
   * (la Introducción) va siempre: ya no es un concepto del viaje, lo cuenta la historia.
   */
  protected readonly capitulosHechos = computed(() => [
    0,
    ...[...conceptosEstablecidos(this.partida())].map((c) => CAPITULO_DE_CONCEPTO[c]),
  ]);

  protected readonly partida = signal<Partida>(PARTIDA_VACIA);
  private readonly almacen = almacenDelNavegador();
  private cerrarPrologo: (() => void) | null = null;
  /** Atributo de encapsulación que se estampa en lo que las páginas montan a mano (ver `arrancar`). */
  private enc: string | null = null;

  /**
   * La pausa de la vida de fondo, elegida en la colina. Se recuerda entre visitas; el frenado de
   * las animaciones lo hace `pausa-del-fondo`, que arranca con la vista.
   */
  protected readonly pausaFondo = signal(leerPausaFondo(almacenDelNavegador()));
  private pausaDelFondo: { aplicar: (pausa: boolean) => void } | null = null;

  protected alternarPausa(): void {
    this.pausaFondo.update((p) => !p);
    guardarPausaFondo(this.almacen, this.pausaFondo());
    this.pausaDelFondo?.aplicar(this.pausaFondo());
  }

  /**
   * La colina está tapada mientras el viaje ocupa la pantalla entera: una cinemática o la hoja de una
   * etapa. Tapada, deja de dibujar, de sonar y de animar: debajo de una capa opaca seguía
   * redibujándose, y con poca memoria de GPU a lo de arriba le faltaban tiles. El prólogo no la tapa:
   * vive adentro de ella.
   */
  protected readonly colinaTapada = computed(
    () => this.cinematica() !== null || this.paginaSuelta() !== null,
  );
  private readonly avisarALaColina = effect(() => {
    const tapada = this.colinaTapada();
    untracked(() => this.landing?.setVisible(!tapada));
  });

  /**
   * Los guiones de las trece cinemáticas se piden recién cuando hacen falta (al llegar a un
   * capítulo): en el bundle inicial eran 12 kB de texto que casi nadie lee en el primer segundo. Se
   * piden una sola vez.
   */
  private datosCinematicas: Promise<typeof import('./cinematicas/cinematicas-datos')> | null = null;
  private cargarDatosCinematicas(): Promise<typeof import('./cinematicas/cinematicas-datos')> {
    this.datosCinematicas ??= import('./cinematicas/cinematicas-datos');
    return this.datosCinematicas;
  }

  /**
   * El minijuego de operadores del prólogo. El motor frena la historia en la orden y pide
   * `jugarOperadores` con sus huecos; esto muestra uno por nave y resuelve cuando se terminan,
   * resueltos o salteados. Nunca traba: cada hueco se puede saltear (ADR 0002). Los huecos llegan
   * desde el motor, que carga diferido: en el bundle inicial no los necesita nadie.
   */
  protected readonly huecos = signal<readonly HuecoDelPrologo[]>([]);
  protected readonly hueco = signal<number | null>(null);
  protected readonly huecoActual = computed(() => {
    const i = this.hueco();
    return i === null ? null : (this.huecos()[i] ?? null);
  });
  private avisarArreglo: ((nave: number, operador: string) => void) | null = null;
  private terminarOperadores: (() => void) | null = null;
  /** El respiro entre un hueco sano y el siguiente, para ver a la nave disparar. */
  private respiroHueco: ReturnType<typeof setTimeout> | null = null;
  /** Mientras dura ese respiro la hoja se aparta: el disparo es el único aviso del acierto. */
  protected readonly disparando = signal(false);

  private jugarOperadores(
    huecos: readonly HuecoDelPrologo[],
    alArreglar: (nave: number, operador: string) => void,
  ): Promise<void> {
    return new Promise((listo) => {
      this.huecos.set(huecos);
      this.avisarArreglo = alArreglar;
      this.terminarOperadores = () => {
        this.cortarRespiro();
        this.hueco.set(null);
        this.avisarArreglo = null;
        this.terminarOperadores = null;
        listo();
      };
      this.hueco.set(0);
    });
  }

  /** Sin cartel de acierto (ADR 0002): la respuesta es la nave que dispara su operador. */
  protected alArreglarHueco(e: Event): void {
    e.stopPropagation();
    const h = this.huecoActual();
    if (!h || this.respiroHueco) return;
    this.avisarArreglo?.(h.nave, h.operador);
    this.disparando.set(true);
    this.respiroHueco = setTimeout(() => this.siguienteHueco(), 1400);
  }

  protected siguienteHueco(): void {
    this.cortarRespiro();
    const i = this.hueco();
    if (i === null) return;
    if (i + 1 < this.huecos().length) this.hueco.set(i + 1);
    else this.terminarOperadores?.();
  }

  private cortarRespiro(): void {
    if (this.respiroHueco) clearTimeout(this.respiroHueco);
    this.respiroHueco = null;
    this.disparando.set(false);
  }

  /**
   * El manual de a bordo del prólogo. El motor frena la historia con la orden del capitán ya
   * leída y pide `leerManual`; esto muestra una página por vez y resuelve después de la última. Se
   * lee a modo de estudio: se puede ir y volver, y pasar de página no exige resolver nada (ADR
   * 0002). No se cierra: es la pantalla de la nave, y la historia sigue al terminarla.
   *
   * La misma hoja es la de cada etapa del viaje, que va suelta, afuera del escenario. En el prólogo
   * va adentro de él, porque la pantalla completa es la del prólogo y lo que queda afuera no se ve.
   */
  protected readonly paginas = signal<readonly PaginaDelManual[]>([]);
  protected readonly pagina = signal<number | null>(null);
  protected readonly manualSuelto = signal(false);
  protected readonly paginaActual = computed(() => {
    const i = this.pagina();
    return i === null ? null : (this.paginas()[i] ?? null);
  });
  protected readonly paginaEnElPrologo = computed(() =>
    this.manualSuelto() ? null : this.paginaActual(),
  );
  protected readonly paginaSuelta = computed(() =>
    this.manualSuelto() ? this.paginaActual() : null,
  );
  /**
   * Las páginas del libro que ya se cumplieron. Recién cumplida, una página deja seguir; y queda
   * cumplida: volver a ella no obliga a hacerla de nuevo. Una etapa del viaje no se traba.
   */
  private readonly cumplidas = signal<ReadonlySet<string>>(new Set());
  protected readonly puedeSeguir = computed(() => {
    const id = this.paginaActual()?.id;
    return this.libro().concepto !== undefined || (id !== undefined && this.cumplidas().has(id));
  });
  /** Mientras la pantalla se apaga, los botones de página ya no hacen nada. */
  private apagandose = false;
  private readonly hojaDelManual = viewChild<ElementRef<HTMLElement>>('hojaDelManual');
  private readonly pantallaDelManual = viewChild<ElementRef<HTMLElement>>('pantallaDelManual');
  private readonly cuerpoDelManual = viewChild<ElementRef<HTMLElement>>('cuerpoDelManual');
  private readonly marcasDelLibro = viewChild.required<TemplateRef<unknown>>('marcasDelLibro');
  private readonly pieDelLibro = viewChild.required<TemplateRef<unknown>>('pieDelLibro');
  /** La página que se veía antes: dice para qué lado se da vuelta la hoja. */
  private paginaPrevia: number | null = null;
  /** Deja la hoja: `true` si se leyó hasta el final, `false` si se salió antes. */
  private terminarManual: ((completo: boolean) => void) | null = null;
  /** Cada página que se abre, para que el viaje guarde dónde quedó. */
  private alAbrirPagina: ((i: number) => void) | null = null;
  /** La música para estudiar suena con el manual abierto, en la historia y suelto. */
  private musicaDelManual: Musica | null = null;
  /**
   * La misma hoja sirve para el árbol que Angie muestra en Signal Space: es una página más del libro
   * de leyes, la sexta, pero ya no es el manual de la nave.
   */
  protected readonly libro = signal<Libro>(MANUAL);

  /**
   * La etapa del viaje en la estética de las cinemáticas: la tripulación en el cielo, su objeto de
   * mundo y la caja de diálogo abajo. Cada página es un momento de la historia: al llegar dicen qué
   * encontraron, al resolver qué entendieron, y para pasar de página se van volando.
   */
  private readonly tripulacion = viewChild(TripulacionComponent);
  protected readonly capituloDeEtapa = computed(() => {
    const concepto = this.libro().concepto;
    return concepto === undefined ? 0 : (CAPITULO_DE_CONCEPTO[concepto] ?? 0);
  });
  protected readonly acentoDeEtapa = computed(() => acentoDe(this.capituloDeEtapa()));
  protected readonly lineaDeEtapa = signal<LineaDelViaje | null>(null);
  protected readonly palabrasDeLinea = palabrasDeLinea;
  protected readonly naveDe = (quien: QuienDelViaje): number => NAVE_DEL_VIAJE[quien];
  protected readonly luzDe = (quien: QuienDelViaje): string => LUZ_DE[quien];
  protected nombreDeNave(quien: QuienDelViaje): string {
    return quien === 'cap' ? 'Capitán' : quien === 'naveA' ? 'Nave A' : 'Nave B';
  }
  /** La tripulación ya salió volando: "Siguiente" no se toca dos veces. */
  private volando = false;
  private mirada: number | null = null;

  /** Con `id`, la línea suena con su voz grabada si la tiene; sin voz, se lee callada como antes. */
  private decir(linea: LineaDelViaje | null, id?: string): void {
    this.lineaDeEtapa.set(linea);
    if (linea) this.tripulacion()?.hablar(linea.quien);
    sonido().decirGrabada((linea && id && VOCES_GRABADAS[id]?.archivo) || null);
  }

  /** Las voces del viaje se piden todas juntas al abrir la primera hoja: pesan poco y así no esperan. */
  private precargarVocesDelViaje(): void {
    sonido().precargar(
      Object.values(VOCES_GRABADAS)
        .map((v) => v.archivo)
        .filter((a) => a.startsWith('voces/viaje/')),
    );
  }

  /** Cada toque de la pantalla tiene una consecuencia en el cielo: lo miran y una se entera. */
  protected tocarLaEtapa(e: PointerEvent): void {
    this.tripulacion()?.seTocoAlgo(e.clientX, e.clientY);
  }

  /** Con el mouse, la tripulación sigue al puntero con la mirada: un cuadro, una mirada. */
  protected mirarLaEtapa(e: PointerEvent): void {
    if (e.pointerType !== 'mouse' || this.mirada !== null || !this.tripulacion()) return;
    const { clientX, clientY } = e;
    this.mirada = requestAnimationFrame(() => {
      this.mirada = null;
      this.tripulacion()?.mirar(clientX, clientY);
    });
  }

  private leerManual(
    paginas: readonly PaginaDelManual[],
    libro: Libro = MANUAL,
    desde = 0,
    alAbrir: ((i: number) => void) | null = null,
  ): Promise<boolean> {
    return new Promise((listo) => {
      this.libro.set(libro);
      this.paginas.set(paginas);
      this.alAbrirPagina = alAbrir;
      if (paginas === PAGINAS_DEL_MANUAL) {
        this.musicaDelManual = tocarManual(() => sonido().salida());
      }
      this.terminarManual = (completo) => {
        this.callarMusicaDelManual(1.5);
        // El botón con el foco desaparece con la hoja: en el prólogo, el foco vuelve a su pausa y no
        // al `body`. Suelta no hay a quién volver: después de la hoja de una etapa sigue el viaje.
        if (this.manualSuelto()) this.escenarioInerte(false);
        else
          this.host.querySelector<HTMLElement>('.prologo__pause')?.focus({ preventScroll: true });
        this.pagina.set(null);
        this.terminarManual = null;
        this.alAbrirPagina = null;
        listo(completo);
      };
      this.irAPagina(Math.min(Math.max(desde, 0), paginas.length - 1));
    });
  }

  private callarMusicaDelManual(sale?: number): void {
    this.musicaDelManual?.apagar(sale);
    this.musicaDelManual = null;
  }

  private irAPagina(i: number): void {
    this.pagina.set(i);
    this.alAbrirPagina?.(i);
  }

  /**
   * Un desafío resuelto en una etapa del viaje queda en la partida, como `"concepto/página"`. El
   * desafío avisa con un evento del DOM (`sistema-establecido`) que la hoja escucha: no conoce a la
   * vista. Lo resuelto en el prólogo (el manual, el árbol) no se anota: no es una etapa.
   */
  protected alEstablecerEnLaHoja(): void {
    const concepto = this.libro().concepto;
    const i = this.pagina();
    if (concepto !== undefined && i !== null) {
      this.alEstablecer(concepto, i);
      this.tripulacion()?.festejar();
      const id = this.paginaActual()?.id;
      this.decir(
        id ? (guionDe(id)?.resuelta ?? null) : null,
        id ? idDeLineaDelViaje(id, 'resuelta') : undefined,
      );
    }
  }

  /**
   * Las flechas de costado pasan de página, salvo adentro de la pantalla, donde pueden ser de la
   * demo. Escape no hace nada: el libro no se cierra, se sigue. Las de leer scrollean la hoja a mano: el
   * `preventDefault` frena el scroll nativo y le avisa a quien más escuche la tecla que ya se usó.
   */
  protected teclaDelManual(e: KeyboardEvent): void {
    const hoja = this.hojaDelManual()?.nativeElement;
    if (this.pagina() === null || !hoja || e.defaultPrevented) return;
    const objetivo = e.target instanceof Element ? e.target : null;
    const enLaPantalla = objetivo?.closest('.subhost');
    if (e.key === 'ArrowRight' && !enLaPantalla) this.pasarPagina(1);
    else if (e.key === 'ArrowLeft' && !enLaPantalla) this.pasarPagina(-1);
    else {
      // En la historia, una tecla afuera de la hoja es del prólogo (la pausa, por ejemplo). Un botón
      // que se rehace al tocarlo deja el foco en el `body`: eso sigue siendo de la hoja.
      const deLaHoja = this.manualSuelto() || objetivo === document.body || hoja.contains(objetivo);
      const paso = deLaHoja ? pasoEnElManual(e, hoja.clientHeight, hoja.scrollHeight) : null;
      if (paso === null) return;
      hoja.scrollBy({ top: paso });
    }
    e.preventDefault();
  }

  protected pasarPagina(paso: 1 | -1): void {
    const i = this.pagina();
    if (i === null || this.apagandose || this.volando) return;
    if (paso === 1 && !this.puedeSeguir()) return;
    // En el viaje, seguir es seguir viaje: la tripulación sale volando y recién ahí se pasa de hoja.
    const tripulacion = this.libro().concepto !== undefined ? this.tripulacion() : undefined;
    if (paso === 1 && tripulacion) {
      this.volando = true;
      void tripulacion.irse().then(() => {
        this.volando = false;
        this.irDesde(i, paso);
      });
      return;
    }
    this.irDesde(i, paso);
  }

  private irDesde(i: number, paso: 1 | -1): void {
    const j = i + paso;
    if (j >= this.paginas().length) void this.dejarLaHoja(true);
    else if (j >= 0) this.irAPagina(j);
  }

  /** El libro se deja como se entró: la pantalla se apaga y la historia sigue detrás. */
  private async dejarLaHoja(completo: boolean): Promise<void> {
    const hoja = this.hojaDelManual()?.nativeElement;
    if (hoja && this.libro().concepto === undefined) {
      this.apagandose = true;
      await apagarLaTele(hoja).catch(() => undefined);
      this.apagandose = false;
    }
    this.terminarManual?.(completo);
  }

  /**
   * Cada página monta la pantalla REAL en el `.subhost` de la hoja, con el estampado y la
   * armonización de los demos embebidos (`.card--dissolve` en styles.css).
   */
  private readonly montarPagina = effect((onCleanup) => {
    const pagina = this.paginaActual();
    const host = this.pantallaDelManual()?.nativeElement;
    const hoja = this.hojaDelManual()?.nativeElement;
    if (!pagina || !host || !hoja) {
      this.paginaPrevia = null;
      return;
    }
    const i = this.pagina()!;
    const siguiente = this.paginas()[i + 1];
    const previa = this.paginaPrevia;
    this.paginaPrevia = i;
    // La primera página del libro entra prendiendo la pantalla, cuando ya está montada.
    const prender =
      previa === null && this.libro().concepto === undefined
        ? encenderLaTele(
            hoja,
            this.manualSuelto() ? null : this.host.querySelector('.prologo__escena'),
          )
        : null;
    // En el prólogo Angie todavía no interviene: los desafíos de las páginas van sin su pista.
    const montada = this.montarDiferido(
      host,
      pagina.cargar,
      [
        { provide: AYUDA_DE_ANGIE, useValue: this.libro().ayuda ?? false },
        {
          provide: PAGINA_DEL_MANUAL,
          useValue: {
            numero: this.libro().primeraLey + i,
            ley: pagina.ley,
            enLaNave: pagina.enLaNave,
            ...(this.libro().concepto === undefined
              ? {
                  marcas: this.marcasDelLibro(),
                  pie: this.pieDelLibro(),
                  alCumplir: () => this.cumplidas.update((c) => new Set(c).add(pagina.id)),
                  pasar: (paso: 1 | -1) => this.pasarPagina(paso),
                  atras: () => (i > 0 ? 'Anterior' : null),
                  siguiente: () =>
                    !this.puedeSeguir()
                      ? null
                      : i + 1 < this.paginas().length
                        ? 'Siguiente página'
                        : this.libro().sigue,
                }
              : {}),
          },
        },
      ],
      () => {
        prender?.();
        // Con la página a la vista se pide la que sigue: pasar de página no espera a la red.
        void siguiente?.cargar().catch(() => undefined);
      },
    );
    const vigia = this.enc ? vigilarEstampado(host, this.enc) : null;
    // Cada página arranca arriba, y el foco va a la hoja: con teclado, se lee sin buscarla.
    hoja.scrollTop = 0;
    hoja.focus({ preventScroll: true });
    const cuerpo = this.cuerpoDelManual()?.nativeElement;
    if (previa !== null && previa !== i && cuerpo) this.darVueltaLaHoja(i > previa, cuerpo);
    if (this.libro().concepto !== undefined) {
      untracked(() => {
        this.precargarVocesDelViaje();
        this.decir(guionDe(pagina.id)?.llegada ?? null, idDeLineaDelViaje(pagina.id, 'llegada'));
        // Llegan volando a la página nueva: venían de irse por la derecha.
        if (previa !== null && i > previa) this.tripulacion()?.llegar();
      });
    }
    onCleanup(() => {
      vigia?.();
      montada.dispose();
    });
  });

  /**
   * Pasar de página se ve: la página nueva entra deslizándose desde el lado al que se va, con su
   * título. Sin animación, la pantalla nueva reemplazaba a la vieja de golpe y no se notaba que había
   * cambiado. Antes giraba una hoja de papel desde el lomo, pero la hoja ya no es de papel: sobre el
   * cielo, el papel girando de borde a borde se veía como un fogonazo blanco.
   */
  private darVueltaLaHoja(adelante: boolean, cuerpo: HTMLElement): void {
    if (sinMovimiento()) return;
    cuerpo.animate(
      [
        { opacity: 0, translate: `${adelante ? 48 : -48}px 0` },
        { opacity: 1, translate: '0 0' },
      ],
      { duration: 420, easing: 'cubic-bezier(0.22, 1, 0.36, 1)', fill: 'backwards' },
    );
  }

  /**
   * El prólogo se pide recién al bajar de la colina: son 25 kB de escena que nadie ve en el
   * primer segundo, y el aviso de auriculares más la colina dan tiempo de sobra para traerlos.
   * Cada pedido invalida al anterior, así un pedido viejo que llega tarde no monta un segundo
   * prólogo. Si el pedazo no llega (red caída a mitad de camino), se sigue como si se hubiera
   * saltado: quedarse en la noche sin construcción sería peor que perderse la escena.
   */
  private pedidoPrologo = 0;
  private abrirPrologo(
    alTerminar: () => void,
    historia: { desde: string | null; alPasarPunto: (linea: string) => void } | null = null,
  ): void {
    this.cerrarPrologo?.();
    this.cerrarPrologo = null;
    const pedido = ++this.pedidoPrologo;
    import('./prologo-anomalia').then(
      ({ initPrologoAnomalia }) => {
        if (pedido !== this.pedidoPrologo) return;
        // La primera página del manual se pide ya: cuando el capitán lo abre, la pantalla se prende
        // con ella montada, y no queda negra mientras llega.
        PAGINAS_DEL_MANUAL[0]?.cargar().catch(() => undefined);
        this.cerrarPrologo = initPrologoAnomalia(this.host, {
          // Saltar la intro en pleno minijuego también lo cierra.
          alTerminar: () => {
            this.terminarOperadores?.();
            this.terminarManual?.(false);
            alTerminar();
          },
          operadores: (huecos, alArreglar) => this.jugarOperadores(huecos, alArreglar),
          manual: async (paginas) => void (await this.leerManual(paginas)),
          arbol: async (pagina) => void (await this.leerManual([pagina], SIGNAL_SPACE)),
          alCambiarMascota: (viva) => this.angiePrologo.set(viva),
          desde: (isDevMode() ? PROLOGO_PEDIDO : null) ?? historia?.desde ?? null,
          alPasarPunto: historia?.alPasarPunto,
        });
      },
      (error: unknown) => {
        if (pedido !== this.pedidoPrologo) return;
        this.errorHandler.handleError(error);
        alTerminar();
      },
    );
  }

  constructor() {
    this.destroyRef.onDestroy(() => this.cortarRespiro());
    this.destroyRef.onDestroy(() => this.callarMusicaDelManual());
    this.destroyRef.onDestroy(() => {
      // La línea que estaba sonando es de esta pantalla: no sigue hablando en la práctica.
      sonido().callar();
      if (this.confirmacionBorrado) clearTimeout(this.confirmacionBorrado);
      if (this.mirada !== null) cancelAnimationFrame(this.mirada);
    });
    afterNextRender(() => {
      try {
        this.arrancar();
      } catch (error) {
        // El diagnóstico va igual al ErrorHandler de la app (no se traga), pero la pantalla deja
        // de estar muda: el usuario ve qué pasó y puede recargar.
        this.bootFallo.set(true);
        this.errorHandler.handleError(error);
      }
    });
  }

  /** El boot es de una sola pasada: para reintentarlo hay que volver a montar todo. */
  protected recargar(): void {
    window.location.reload();
  }

  private arrancar(): void {
    // Nombre del atributo de encapsulación que Angular pone a los elementos del template: se estampa
    // en lo que las páginas montan a mano, para que el CSS scopeado les aplique.
    this.enc =
      this.host
        .querySelector('#stage')
        ?.getAttributeNames()
        .find((a) => a.startsWith('_ngcontent')) ?? null;
    const subCounts = this.subComponents.map((subs) => subs.length);
    this.partida.set(cargarPartida(this.almacen, subCounts));
    // La molécula ya no existe (ADR 0019): un link `?nivel=` lleva a la misma pantalla, en la hoja
    // del viaje. Se guarda como el lugar del viaje, y el aviso sigue directo ahí (ADR 0015).
    const link = this.initialFromUrl();
    const lugarPedido = link && lugarDelLink(link.concept, link.sub, subCounts);
    if (lugarPedido)
      this.guardar(conViaje(conPunto(this.partida(), { lugar: 'viaje' }), lugarPedido));

    const pausa = initPausaDelFondo(this.host);
    this.pausaDelFondo = pausa;
    this.destroyRef.onDestroy(pausa.dispose);

    // Landing "par de Tusi" (canvas + audio + pantalla de inicio).
    //
    // Entre entrar y la construcción va el PRÓLOGO. El orden importa y no es arbitrario: tocar
    // Entrar es el gesto que el navegador exige para dejar sonar, así que el prólogo arranca con
    // audio ya desbloqueado y sin pedirle nada más a nadie. Y la construcción de Tusi espera de
    // verdad: si corriera detrás durante esos minutos, llegaría terminada y se comería su propio
    // premio, que es ver aparecer el círculo.
    //
    // Angie ya está sentada en la piedra desde el principio, detrás del aviso de auriculares: al
    // alejarse el aviso, la escena aparece con ella ahí.
    const inicio = initInicioAngie(this.host, {
      sentarse: (deUna) => this.angieInicio()?.sentarse(deUna),
      sonreir: () => this.angieInicio()?.sonreir(),
    });
    this.inicio = inicio;
    this.destroyRef.onDestroy(() => inicio.dispose());
    const landing = initIntroTusi(this.host, {
      despedida: () => {
        this.angieEsperando.set(false);
        return inicio.despedir();
      },
      // La preferencia de sonido se elige en el overlay del intro pero quien suena después es el
      // prólogo: viaja con el gatillo para que silenciar antes de entrar valga para los dos.
      alEntrar: () => {
        // Las luces de Angie suben a las estrellas y ahí están las naves: el comienzo es la
        // continuación de esa escena, y el viaje la continuación del comienzo. Es una sola
        // historia: entrar la sigue donde quedó (ADR 0008).
        const { punto, prologo } = this.partida();
        const entrada = entradaDeLaHistoria(punto, PUNTOS_DEL_PROLOGO, prologo);
        if (entrada.a === 'viaje') {
          void this.viajar();
          return;
        }
        this.abrirPrologo(
          () => {
            this.guardar(conPrologo(this.partida()));
            void this.viajar();
          },
          {
            desde: entrada.desde,
            alPasarPunto: (linea) =>
              this.guardar(conPunto(this.partida(), { lugar: 'prologo', linea })),
          },
        );
      },
    });
    this.landing = landing;
    landing.setVisible(!this.colinaTapada());
    this.destroyRef.onDestroy(landing.dispose);
    this.destroyRef.onDestroy(() => {
      // Un pedido en vuelo que llega después de desmontar no tiene dónde montarse.
      this.pedidoPrologo++;
      this.cerrarPrologo?.();
    });
    // Al final: frena también lo que la colina y el prólogo acaban de arrancar.
    pausa.aplicar(this.pausaFondo());
  }

  /**
   * Deep-link: lee `?nivel=X(&sub-nivel=Z)` de la URL para abrir el viaje en esa pantalla. `X` es el
   * número de capítulo, no la posición: un capítulo que ya no está en el viaje (el 0, que pasó a la
   * historia) se ignora, y manda lo guardado.
   */
  private initialFromUrl(): { concept: number; sub: number } | null {
    const link = parseWhereQuery(window.location.search);
    const concepto = link ? conceptoDeCapitulo(link.concept) : null;
    return link && concepto !== null ? { concept: concepto, sub: link.sub } : null;
  }

  protected async abrirCinematica(capitulo: number): Promise<void> {
    const { cinematicaDe } = await this.cargarDatosCinematicas();
    const cine = cinematicaDe(capitulo);
    if (!cine || this.cinematica()) return;
    this.cinematicaCompleta.set(
      conceptosEstablecidos(this.partida()).size >= this.subComponents.length,
    );
    this.escenarioInerte(true);
    this.cinematica.set(cine);
  }

  protected alTerminarCinematica(): void {
    const cine = this.cinematica();
    if (cine) this.guardar(conCinematica(this.partida(), cine.capitulo));
    this.cinematica.set(null);
    this.escenarioInerte(false);
    const listo = this.alCerrarCinematica;
    this.alCerrarCinematica = null;
    // Lo que sigue (el final después de la revelación) espera a que esta salga de la pantalla: abierta
    // en el mismo tick, el `@if` nunca ve el null y reusa la instancia ya desvanecida.
    if (listo) afterNextRender(listo, { injector: this.injector });
  }

  /** Lo que espera a que la cinemática en pantalla termine: el viaje, para seguir. */
  private alCerrarCinematica: (() => void) | null = null;

  /**
   * Una cinemática que se espera hasta el final, vista o salteada con Escape: la de cada etapa, y la
   * revelación antes del final.
   */
  private async verEntera(capitulo: number): Promise<void> {
    await this.abrirCinematica(capitulo);
    if (this.cinematica()?.capitulo !== capitulo) return;
    await new Promise<void>((listo) => (this.alCerrarCinematica = listo));
  }

  /**
   * El viaje: después del comienzo, cada capítulo es una etapa con su cinemática y su hoja, después
   * la revelación y el final, y al terminar la historia queda en su último cuadro. Se guarda cada
   * paso, así recargar lo sigue en el mismo lugar. La hoja no se cierra, pero nunca exige resolver
   * nada para seguir (ADR 0002, ADR 0008).
   */
  private viajando = false;
  private async viajar(): Promise<void> {
    if (this.viajando) return;
    this.viajando = true;
    const subs = this.subComponents.map((s) => s.length);
    let lugar: LugarDelViaje = this.partida().viaje ?? { concepto: 0, pagina: -1 };
    try {
      while (lugar.concepto < subs.length) {
        this.guardar(conViaje(conPunto(this.partida(), { lugar: 'viaje' }), lugar));
        this.mostrarEnLaBarra(lugar);
        const capitulo = CAPITULO_DE_CONCEPTO[lugar.concepto];
        if (lugar.pagina < 0) {
          await this.verEntera(capitulo);
          lugar = { concepto: lugar.concepto, pagina: 0 };
          continue;
        }
        await this.leerEtapa(lugar.concepto, lugar.pagina);
        lugar = siguienteEtapa(lugar.concepto, subs);
      }
      if (!esElFin(lugar, subs)) {
        // El cierre: recargar acá vuelve a la revelación, no al principio del viaje.
        this.guardar(conViaje(conPunto(this.partida(), { lugar: 'viaje' }), lugar));
        await this.verEntera(CAPITULO_REVELACION);
        await this.verEntera(CAPITULO_FINAL);
      }
      this.guardar(conViaje(conPunto(this.partida(), { lugar: 'viaje' }), finDelViaje(subs)));
      await this.mostrarElFin();
    } finally {
      this.viajando = false;
    }
  }

  /**
   * El lugar del viaje en la barra de direcciones, sin navegar: copiar el link lleva a la misma
   * página (`lugarDelLink`). La cinemática de un capítulo es el link con solo el nivel.
   */
  private mostrarEnLaBarra(lugar: LugarDelViaje): void {
    const capitulo = CAPITULO_DE_CONCEPTO[lugar.concepto] ?? -1;
    this.location.replaceState('/', buildWhereQuery(capitulo, lugar.pagina));
  }

  /**
   * El último cuadro de la historia: el final congelado, con su última línea, y arriba la única
   * acción que queda, empezar de cero. Recargar vuelve acá.
   */
  protected readonly enElFin = signal(false);
  private async mostrarElFin(): Promise<void> {
    this.enElFin.set(true);
    await this.abrirCinematica(CAPITULO_FINAL);
  }

  /** La hoja de una etapa, desde la página donde quedó; cada página que se abre queda guardada. */
  private async leerEtapa(concepto: number, desde: number): Promise<void> {
    const capitulo = CAPITULO_DE_CONCEPTO[concepto];
    const libro: Libro = {
      nombre: etapaDe(capitulo)?.nombre ?? '',
      sigue: 'Seguir el viaje',
      primeraLey: 1,
      concepto,
      ayuda: true,
    };
    const paginas = paginasDeEtapa(capitulo, this.subComponents[concepto] ?? []);
    this.manualSuelto.set(true);
    this.escenarioInerte(true);
    await this.leerManual(paginas, libro, desde, (pagina) => {
      const lugar = { concepto, pagina };
      this.guardar(conViaje(this.partida(), lugar));
      // La barra sigue a la página: el link le gana a la partida, así que con la barra todavía en
      // la página 1, recargar en la 2 volvía a la 1.
      this.mostrarEnLaBarra(lugar);
    });
    this.manualSuelto.set(false);
  }

  private alEstablecer(concepto: number, sub: number): void {
    this.guardar(conEstablecido(this.partida(), concepto, sub));
  }

  /**
   * Borrar la partida y volver al principio. Se recarga sin la query: con `?nivel=` en la barra,
   * el link reabría el viaje en el mismo lugar que se acababa de borrar.
   */
  protected empezarDeCero(): void {
    this.guardar(PARTIDA_VACIA);
    window.location.assign(window.location.pathname);
  }

  /** "Empezar de cero" a la vista pide una segunda confirmación, que caduca sola. */
  protected readonly confirmandoBorrado = signal(false);
  private confirmacionBorrado: ReturnType<typeof setTimeout> | null = null;
  protected pedirEmpezarDeCero(): void {
    if (this.confirmacionBorrado) clearTimeout(this.confirmacionBorrado);
    if (this.confirmandoBorrado()) {
      this.empezarDeCero();
      return;
    }
    this.confirmandoBorrado.set(true);
    this.confirmacionBorrado = setTimeout(
      () => this.confirmandoBorrado.set(false),
      CONFIRMACION_DE_BORRADO_MS,
    );
  }

  /** Lo de atrás no recibe foco, clicks ni teclas mientras el viaje ocupa la pantalla. */
  private escenarioInerte(inerte: boolean): void {
    const stage = this.host.querySelector<HTMLElement>('#stage');
    if (stage) stage.inert = inerte;
  }

  private guardar(partida: Partida): void {
    this.partida.set(partida);
    guardarPartida(this.almacen, partida);
  }

  /** Crea el componente en `host`, lo integra a la CD y devuelve cómo desmontarlo. */
  private montar(host: HTMLElement, type: Type<unknown>, env: EnvironmentInjector): () => void {
    // No pasamos `hostElement: host`: al destruir, `ref.destroy()` borraría ESE nodo, y `host`
    // es la `.subhost` de la hoja. Creamos el componente en su propio nodo y lo appendeamos
    // adentro; así `destroy()` solo se lleva el nodo del componente, no la `.subhost`.
    const ref = createComponent(type, { environmentInjector: env });
    host.appendChild(ref.location.nativeElement);
    this.appRef.attachView(ref.hostView);
    // La app es zoneless: montar desde la promesa de la carga no agenda ningún tick, así que la
    // vista recién adjuntada nunca correría su primera CD y quedaría en blanco. Forzamos la
    // detección inicial acá; las interacciones posteriores ya agendan su propio tick.
    ref.changeDetectorRef.detectChanges();
    return () => {
      this.appRef.detachView(ref.hostView);
      ref.destroy();
    };
  }

  /**
   * Una pantalla diferida: su chunk (y sus proveedores, en un injector propio) llega recién cuando la
   * hoja la va a mostrar. Si el jugador ya pasó de página antes de que termine de cargar, no se monta
   * nada. El árbol se estampa al llegar, para que la armonización del `.subhost` le aplique.
   */
  private montarDiferido(
    host: HTMLElement,
    cargar: () => Promise<SubNivelDiferido>,
    lugar: readonly Provider[] = [],
    alMontar: (() => void) | null = null,
  ): { dispose: () => void } {
    let vivo = true;
    let desmontar: (() => void) | null = null;
    let injector: EnvironmentInjector | null = null;
    cargar()
      .then(({ component, providers }) => {
        if (!vivo) return;
        const todos = [...(providers ?? []), ...lugar];
        injector = todos.length ? createEnvironmentInjector(todos, this.env) : null;
        desmontar = this.montar(host, component, injector ?? this.env);
        const enc = this.enc;
        if (enc) host.querySelectorAll('*').forEach((e) => e.setAttribute(enc, ''));
        alMontar?.();
      })
      .catch((error: unknown) => this.errorHandler.handleError(error));
    return {
      dispose: () => {
        vivo = false;
        desmontar?.();
        injector?.destroy();
      },
    };
  }
}
