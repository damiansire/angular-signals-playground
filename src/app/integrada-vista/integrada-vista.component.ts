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
  Type,
  afterNextRender,
  createComponent,
  createEnvironmentInjector,
  inject,
  isDevMode,
  computed,
  effect,
  signal,
  viewChild,
} from '@angular/core';
import { Location, NgTemplateOutlet } from '@angular/common';
import { RouterLink } from '@angular/router';

import { MascotaVivaComponent } from '../components-draw/mascota-viva/mascota-viva.component';
import { sinMovimiento } from '../libs/muelle';
import {
  caminoDeColina,
  estrellas,
  floresDeLadera,
  initInicioAngie,
  juncos,
  letrasDelTitulo,
  matasDePasto,
  rayosDelSol,
  type InicioAngie,
} from './inicio-angie';
import { initMundoQueResponde } from './mundo-que-responde';
import { LO_QUE_DICE_EL_SOL, LO_QUE_RESPONDE_ANGIE } from './intercambio-del-sol';
import type { HuecoDelPrologo } from './operadores-del-prologo';
import { PAGINAS_DEL_MANUAL, pasoEnElManual, type PaginaDelManual } from './manual-de-a-bordo';
import { ARBOL_DE_SIGNAL_SPACE } from './arbol-de-signal-space';
import { HojaDelHuecoComponent } from './hoja-del-hueco/hoja-del-hueco.component';
import { PAGINA_DEL_MANUAL } from '../signals/level-0-introduction/manual/pagina-del-manual';
import { vigilarEstampado } from './estampado-tardio';
import { AYUDA_DE_ANGIE } from '../components-atom/manipulable-system/manipulable-system.component';

import { signalsRoutesTree } from '../app.routes';
import { type RouteItem, type SubNivelDiferido } from '../interfaces/route-item.interface';
import {
  initMolecule,
  CAPITULO_DE_CONCEPTO,
  conceptoDeCapitulo,
  NOMBRES_DE_CONCEPTO,
  TITULOS_DE_CAPITULO,
  type MountSub,
  type SubHandle,
} from './molecule-engine';
import { initIntroTusi, type IntroTusiHandle } from './intro-tusi';
import { buildWhereQuery, parseWhereQuery } from './url-sync';
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
import { entradaDeLaHistoria, puntoDelRecorrido } from './retomar';
import { AvisoAuricularesComponent } from './aviso-auriculares/aviso-auriculares.component';
import { BitacoraComponent, type CapituloDeBitacora } from './bitacora/bitacora.component';
import {
  CAPITULO_FINAL,
  CAPITULO_REVELACION,
  type Cinematica,
} from './cinematicas/cinematica-guion';
import { esElFin, etapaDe, finDelViaje, paginasDeEtapa, siguienteEtapa } from './viaje';

/**
 * Cuánto tiene que quedarse el recorrido en la parada de un capítulo para que arranque su
 * cinemática. Con scroll-snap, pasar de largo también reporta cada parada: sin esta espera, un
 * gesto largo de trackpad disparaba la cinemática de un capítulo que el jugador solo cruzó.
 */
const ESPERA_CINEMATICA_MS = 650;

/** El final entra después de que el enlace del capítulo 11 terminó de trazarse. */
const ESPERA_FINAL_MS = 1600;

/** Cuánto dura el "¿seguro?" de "Empezar de cero" antes de volver a su estado normal. */
const CONFIRMACION_DE_BORRADO_MS = 4000;

/**
 * Qué libro muestra la hoja: su nombre, cómo se cierra y desde qué número cuenta sus leyes. Una
 * etapa del viaje dice además su concepto, para anotar lo resuelto, y lleva la pista de Angie: ya
 * pactaron, y desde ahí ella enseña.
 */
interface Libro {
  readonly nombre: string;
  readonly cerrar: string;
  readonly primeraLey: number;
  readonly concepto?: number;
  readonly ayuda?: boolean;
}
const MANUAL: Libro = { nombre: 'Manual de a bordo', cerrar: 'Cerrar el manual', primeraLey: 1 };
const SIGNAL_SPACE: Libro = {
  nombre: 'Signal Space',
  cerrar: 'Seguir',
  primeraLey: PAGINAS_DEL_MANUAL.length + 1,
};

/**
 * `?prologo=<id de línea>` (solo en dev) se lee al cargar el módulo: para cuando el prólogo
 * arranca, la sincronía con la URL ya reescribió la barra y el parámetro no está más.
 */
const PROLOGO_PEDIDO =
  typeof location === 'undefined' ? null : new URLSearchParams(location.search).get('prologo');

/**
 * Vista integrada: el recorrido de los 12 conceptos como una MOLÉCULA reactiva.
 * Cada concepto es un átomo; al scrollear, la cámara bucea a su contenido y sus
 * sub-niveles orbitan la card. Cada sub-nivel EMBEBE el componente REAL de
 * `/signals/level/X/sub-level/Z` (sacado de `signalsRoutesTree`), así toda la app
 * de niveles vive dentro de esta única vista.
 *
 * La animación es imperativa (SVG/cámara/scroll-snap) y vive en `molecule-engine`;
 * se arranca en `afterNextRender` (solo browser) y el cleanup corta rAF y listeners.
 */
@Component({
  selector: 'app-integrada-vista',
  imports: [
    NgTemplateOutlet,
    RouterLink,
    CinematicaComponent,
    BitacoraComponent,
    MascotaVivaComponent,
    AvisoAuricularesComponent,
    HojaDelHuecoComponent,
  ],
  templateUrl: './integrada-vista.component.html',
  styleUrls: [
    './integrada-vista.component.css',
    './intro-tusi.css',
    './inicio-angie.css',
    './prologo-anomalia.css',
    './manual-de-a-bordo.css',
    './boot-fallo.css',
    './aviso-mas-abajo.css',
    './angosto.css',
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

  /** La noche del aviso vuelve a su boca mientras la cámara se aleja: era un suspiro suyo. */
  protected angieSuspira(): void {
    this.angieInicio()?.suspirar();
  }

  /** La escena de la colina, para que el aviso le avise cuando se va. */
  private inicio: InicioAngie | null = null;

  /**
   * El aviso se va y aparece la colina: entra el título y empieza su música. Aunque hayan elegido
   * sin sonido: la música espera callada, y si lo prenden en la colina, suena ahí.
   */
  protected alIrseElAviso(): void {
    this.inicio?.revelar();
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

  /** Lo que se dicen el sol y Angie antes de que ella piense; la respuesta, en sus renglones. */
  protected readonly intercambio = {
    sol: LO_QUE_DICE_EL_SOL,
    angie: LO_QUE_RESPONDE_ANGIE.split('\n'),
  };

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

  /** Componentes reales de cada sub-nivel, por concepto (del árbol de conceptos). Un sub-nivel
   *  siempre trae componente; el tipo admite `undefined` porque `RouteItem.component` es opcional
   *  (los niveles no lo llevan) y `mountSub` ya cubre el caso faltante. */
  private readonly subComponents: RouteItem[][] = signalsRoutesTree.map(
    (lvl) => lvl.subLevels ?? [],
  );

  /** Nombre de cada sub-nivel, en el mismo orden que `subComponents`: es lo que muestra el topbar. */
  private readonly subTitles: (string | undefined)[][] = signalsRoutesTree.map((lvl) =>
    (lvl.subLevels ?? []).map((sl) => sl.title),
  );

  /**
   * El boot falló y no hay recorrido que mostrar. La vista es 100% imperativa: sin esto, cualquier
   * excepción en el arranque deja al usuario mirando una pantalla muerta, sin mensaje y sin forma
   * de saber que hay algo roto. Angular no puede renderizar un fallback que nadie declaró.
   */
  readonly bootFallo = signal(false);

  /** La cinemática en pantalla, si hay una. */
  protected readonly cinematica = signal<Cinematica | null>(null);
  protected readonly cinematicaCompleta = signal(false);
  /**
   * Lo establecido, por número de capítulo, para el final, que dibuja los doce átomos de antes. El 0
   * (la Introducción) va siempre: ya no es un concepto del recorrido, lo cuenta la historia.
   */
  protected readonly capitulosHechos = computed(() => [
    0,
    ...[...conceptosEstablecidos(this.partida())].map((c) => CAPITULO_DE_CONCEPTO[c]),
  ]);
  protected readonly origenIris = signal<{ x: number; y: number } | null>(null);

  protected readonly partida = signal<Partida>(PARTIDA_VACIA);
  private readonly almacen = almacenDelNavegador();
  private donde = { concepto: -1, sub: -1 };
  private esperaCinematica: ReturnType<typeof setTimeout> | null = null;
  private cerrarPrologo: (() => void) | null = null;
  /** Atributo de encapsulación que el motor estampa en lo que crea a mano (ver `arrancar`). */
  private enc: string | null = null;

  protected readonly bitacoraAbierta = signal(false);
  /** Los capítulos como los lista la bitácora: nombre, título, ley y cuántos sub-niveles tiene. */
  protected readonly capitulosBitacora = signal<readonly CapituloDeBitacora[]>([]);
  protected readonly leyFinal = signal<string | null>(null);

  /**
   * Los guiones de las trece cinemáticas se piden recién cuando hacen falta (al llegar a un
   * capítulo o al abrir la bitácora): en el bundle inicial eran 12 kB de texto que casi nadie lee
   * en el primer segundo. Se piden una sola vez.
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
   * leída y pide `leerManual`; esto muestra una página por vez y resuelve al cerrarlo. Se lee a
   * modo de estudio: se puede ir y volver, y cerrarlo no exige resolver nada (ADR 0002).
   *
   * También se abre suelto desde la bitácora, para quien salteó el prólogo. Suelto va afuera del
   * escenario; en la historia va adentro del prólogo, porque la pantalla completa es la del prólogo
   * y lo que queda afuera no se ve.
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
  private readonly hojaDelManual = viewChild<ElementRef<HTMLElement>>('hojaDelManual');
  private readonly pantallaDelManual = viewChild<ElementRef<HTMLElement>>('pantallaDelManual');
  private readonly cuerpoDelManual = viewChild<ElementRef<HTMLElement>>('cuerpoDelManual');
  /** La página que se veía antes: dice para qué lado se da vuelta la hoja. */
  private paginaPrevia: number | null = null;
  /** Cierra la hoja: `true` si se leyó hasta el final, `false` si se cerró antes. */
  private terminarManual: ((completo: boolean) => void) | null = null;
  /** Cada página que se abre, para que el viaje guarde dónde quedó. */
  private alAbrirPagina: ((i: number) => void) | null = null;
  /**
   * La misma hoja sirve para el árbol que Angie muestra en Signal Space: es una página más del libro
   * de leyes, la sexta, pero ya no es el manual de la nave.
   */
  protected readonly libro = signal<Libro>(MANUAL);

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
      this.terminarManual = (completo) => {
        // El botón con el foco desaparece con la hoja: el foco vuelve a quien lo abrió, no al `body`.
        // Suelto, eso está en el escenario, que se prende antes para poder recibirlo.
        if (this.manualSuelto()) this.escenarioInerte(false);
        this.host
          .querySelector<HTMLElement>(this.manualSuelto() ? '.tb-bitacora' : '.prologo__pause')
          ?.focus({ preventScroll: true });
        this.pagina.set(null);
        this.terminarManual = null;
        this.alAbrirPagina = null;
        listo(completo);
      };
      this.irAPagina(Math.min(Math.max(desde, 0), paginas.length - 1));
    });
  }

  private irAPagina(i: number): void {
    this.pagina.set(i);
    this.alAbrirPagina?.(i);
  }

  /** Un desafío resuelto en una etapa del viaje se anota como en la molécula: es el mismo. */
  protected alEstablecerEnLaHoja(): void {
    const concepto = this.libro().concepto;
    const i = this.pagina();
    if (concepto !== undefined && i !== null) this.alEstablecer(concepto, i);
  }

  /**
   * Escape cierra el manual y las flechas de costado pasan de página, salvo adentro de la pantalla,
   * donde las flechas pueden ser de la demo. Las de leer scrollean la hoja a mano: el
   * `preventDefault` aparta al recorrido de atrás, que escucha las flechas en `window`, y también
   * frena el scroll nativo.
   */
  protected teclaDelManual(e: KeyboardEvent): void {
    const hoja = this.hojaDelManual()?.nativeElement;
    if (this.pagina() === null || !hoja || e.defaultPrevented) return;
    const objetivo = e.target instanceof Element ? e.target : null;
    const enLaPantalla = objetivo?.closest('.subhost');
    if (e.key === 'Escape') {
      // En el viaje la hoja no se cierra: la historia sigue con la página siguiente.
      if (this.libro().concepto === undefined) this.terminarManual?.(false);
    } else if (e.key === 'ArrowRight' && !enLaPantalla) this.pasarPagina(1);
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

  protected cerrarManual(): void {
    this.terminarManual?.(false);
  }

  protected pasarPagina(paso: 1 | -1): void {
    const i = this.pagina();
    if (i === null) return;
    const j = i + paso;
    if (j >= this.paginas().length) this.terminarManual?.(true);
    else if (j >= 0) this.irAPagina(j);
  }

  /**
   * Cada página monta la pantalla REAL, igual que la card del recorrido: el mismo `.subhost`, el
   * mismo estampado y la misma armonización, así se ve como se veía en la molécula.
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
    const previa = this.paginaPrevia;
    this.paginaPrevia = i;
    // En el prólogo Angie todavía no interviene: los desafíos de las páginas van sin su pista.
    const montada = this.montarDiferido(host, pagina.cargar, pagina.ley, [
      { provide: AYUDA_DE_ANGIE, useValue: this.libro().ayuda ?? false },
      {
        provide: PAGINA_DEL_MANUAL,
        useValue: {
          numero: this.libro().primeraLey + i,
          ley: pagina.ley,
          enLaNave: pagina.enLaNave,
        },
      },
    ]);
    const vigia = this.enc ? vigilarEstampado(host, this.enc) : null;
    // Cada página arranca arriba, y el foco va a la hoja: con teclado, se lee sin buscarla.
    hoja.scrollTop = 0;
    hoja.focus({ preventScroll: true });
    const cuerpo = this.cuerpoDelManual()?.nativeElement;
    if (previa !== null && previa !== i && cuerpo) this.darVueltaLaHoja(i > previa, cuerpo);
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
    // Nombre del atributo de encapsulación que Angular pone a los elementos del template;
    // el motor lo estampa en lo que crea a mano para que el CSS scopeado les aplique.
    const enc = (this.enc =
      this.host
        .querySelector('#stage')
        ?.getAttributeNames()
        .find((a) => a.startsWith('_ngcontent')) ?? null);
    const subCounts = this.subComponents.map((subs) => subs.length);
    this.partida.set(cargarPartida(this.almacen, subCounts));
    this.destroyRef.onDestroy(() => {
      if (this.esperaCinematica) clearTimeout(this.esperaCinematica);
    });
    // El motor arranca antes que la landing, así que el aviso de visibilidad se enruta por acá:
    // el motor es el único que sabe si la landing está a la vista (lo decide el scroll) y la
    // landing es la única que sabe qué hacer con eso (cortar audio y dejar de dibujar).
    let landing: IntroTusiHandle | null = null;
    const dispose = initMolecule(
      this.host,
      this.mountSub,
      subCounts,
      enc,
      this.onWhere,
      // La molécula solo se abre con un link: sin él, la historia sigue desde la colina (ADR 0008).
      this.initialFromUrl(),
      (visible) => landing?.setVisible(visible),
      {
        establecidos: new Set(this.partida().establecidos),
        alEstablecer: (concepto, sub) => this.alEstablecer(concepto, sub),
      },
    );
    this.destroyRef.onDestroy(dispose);
    this.destroyRef.onDestroy(initMundoQueResponde(this.host));

    // Landing "par de Tusi" (canvas + audio + pantalla de inicio). El motor ya fadea el `.intro`.
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
    });
    this.inicio = inicio;
    this.destroyRef.onDestroy(() => inicio.dispose());
    landing = initIntroTusi(this.host, {
      despedida: () => {
        this.angieEsperando.set(false);
        return inicio.despedir();
      },
      // La preferencia de sonido se elige en el overlay del intro pero quien suena después es el
      // prólogo: viaja con el gatillo para que silenciar antes de entrar valga para los dos.
      alEntrar: () => {
        // Las luces de Angie suben a las estrellas y ahí están las naves: el comienzo es la
        // continuación de esa escena, y el viaje la continuación del comienzo. Es una sola
        // historia: entrar la sigue donde quedó, nunca abre la molécula (ADR 0008).
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
    this.destroyRef.onDestroy(landing.dispose);
    this.destroyRef.onDestroy(() => {
      // Un pedido en vuelo que llega después de desmontar no tiene dónde montarse.
      this.pedidoPrologo++;
      this.cerrarPrologo?.();
    });
  }

  /**
   * Deep-link: lee `?nivel=X(&sub-nivel=Z)` de la URL para abrir el recorrido donde quedó.
   * `?nivel=X` solo (sin sub-nivel, la vista molécula) también es válido: encuadra el átomo.
   * `X` es el número de capítulo, no la posición: un capítulo que ya no está en el recorrido (el 0,
   * que pasó a la historia) se ignora, y manda lo guardado.
   */
  private initialFromUrl(): { concept: number; sub: number } | null {
    const link = parseWhereQuery(window.location.search);
    const concepto = link ? conceptoDeCapitulo(link.concept) : null;
    return link && concepto !== null ? { concept: concepto, sub: link.sub } : null;
  }

  /**
   * Refleja el nivel/sub-nivel actual del recorrido en la URL sin navegar ni recargar.
   * `replaceState` reescribe la barra (respetando el base href) sin pasar por el Router,
   * así el componente no se desmonta ni se pierde el scroll. `subIdx` -1 = vista molécula.
   */
  private readonly onWhere = (conceptIdx: number, subIdx: number): void => {
    const capitulo = conceptIdx >= 0 ? (CAPITULO_DE_CONCEPTO[conceptIdx] ?? -1) : -1;
    this.location.replaceState('/', buildWhereQuery(capitulo, subIdx));
    const llego = conceptIdx !== this.donde.concepto;
    // Llegar a otro átomo es lo único que cambia lo que dice el globo: la mascota lo anuncia.
    if (subIdx === -1 && conceptIdx >= 0 && llego) {
      this.guia()?.saltar(0.8);
      this.sacudirGlobo();
    }
    this.donde = { concepto: conceptIdx, sub: subIdx };
    this.guardar(
      conPunto(this.partida(), puntoDelRecorrido(this.partida().punto, conceptIdx, subIdx)),
    );
    this.programarCinematica(conceptIdx, subIdx, llego);
  };

  /** Teclado o lector de pantalla: el puntero ya lo resuelve la mascota con su física. */
  protected alTocarGuia(e: MouseEvent): void {
    if (e.detail === 0) this.guia()?.saludar();
    this.sacudirGlobo();
  }

  /** El globo es de quien habla: si la mascota salta o la tocan, él también se entera. */
  protected sacudirGlobo(): void {
    if (sinMovimiento()) return;
    this.host.querySelector('.rec-guide__bubble')?.animate(
      [
        { transform: 'scale(.86) rotate(-1.5deg)', transformOrigin: '100% 80%' },
        { transform: 'scale(1.05) rotate(.8deg)', transformOrigin: '100% 80%', offset: 0.45 },
        { transform: 'scale(.99) rotate(-.3deg)', transformOrigin: '100% 80%', offset: 0.75 },
        { transform: 'scale(1) rotate(0)', transformOrigin: '100% 80%' },
      ],
      { duration: 380, easing: 'ease-out' },
    );
  }

  /**
   * La cinemática de un capítulo se juega cada vez que el jugador llega a su parada de la molécula,
   * aunque ya la haya visto (ADR 0004). Salir de un sub-nivel al átomo del mismo capítulo no es
   * llegar: repetirla ahí cortaría cada ejercicio. Adentro de un sub-nivel tampoco se juega, para
   * que un deep-link a un ejercicio no se interrumpa.
   */
  private programarCinematica(concepto: number, sub: number, llego: boolean): void {
    if (this.esperaCinematica) clearTimeout(this.esperaCinematica);
    this.esperaCinematica = null;
    const capitulo = CAPITULO_DE_CONCEPTO[concepto];
    if (capitulo === undefined || sub !== -1 || this.cinematica()) return;
    if (!llego && this.partida().cinematicas.includes(capitulo)) return;
    // Se adelanta la carga del guion mientras corre la espera: al abrir ya está.
    void this.cargarDatosCinematicas();
    this.esperaCinematica = setTimeout(() => {
      this.esperaCinematica = null;
      if (this.donde.concepto === concepto && this.donde.sub === -1)
        void this.abrirCinematica(capitulo);
    }, ESPERA_CINEMATICA_MS);
  }

  protected async abrirCinematica(capitulo: number, desdeElAtomo = true): Promise<void> {
    const { cinematicaDe } = await this.cargarDatosCinematicas();
    const cine = cinematicaDe(capitulo);
    if (!cine || this.cinematica()) return;
    // El iris se abre desde el átomo del capítulo: la cinemática sale de ESE lugar del mapa.
    const atomo = desdeElAtomo
      ? this.host.querySelector('#atoms .atom.current')?.getBoundingClientRect()
      : undefined;
    this.origenIris.set(
      atomo && atomo.width > 0
        ? { x: atomo.left + atomo.width / 2, y: atomo.top + atomo.height / 2 }
        : null,
    );
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
   * Una cinemática que se espera hasta el final, vista o salteada con Escape: la del viaje, y la
   * revelación antes del final. Sin iris desde un átomo: en el viaje la molécula todavía no está.
   */
  private async verEntera(capitulo: number): Promise<void> {
    await this.abrirCinematica(capitulo, false);
    if (this.cinematica()?.capitulo !== capitulo) return;
    await new Promise<void>((listo) => (this.alCerrarCinematica = listo));
  }

  /**
   * El viaje: después del comienzo, cada capítulo es una etapa con su cinemática y su hoja, después
   * la revelación y el final, y al terminar la historia queda en su último cuadro. Se guarda cada
   * paso, así recargar lo sigue en el mismo lugar. No hay salida a la molécula: la hoja no se cierra,
   * pero nunca exige resolver nada para seguir (ADR 0002, ADR 0008).
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
   * El último cuadro de la historia: el final congelado, con su última línea, y arriba la única
   * acción que queda, empezar de cero. Recargar vuelve acá.
   */
  protected readonly enElFin = signal(false);
  private async mostrarElFin(): Promise<void> {
    this.enElFin.set(true);
    await this.abrirCinematica(CAPITULO_FINAL, false);
  }

  /** La hoja de una etapa, desde la página donde quedó; cada página que se abre queda guardada. */
  private async leerEtapa(concepto: number, desde: number): Promise<void> {
    const capitulo = CAPITULO_DE_CONCEPTO[concepto];
    const libro: Libro = {
      nombre: etapaDe(capitulo)?.nombre ?? NOMBRES_DE_CONCEPTO[concepto],
      cerrar: 'Seguir el viaje',
      primeraLey: 1,
      concepto,
      ayuda: true,
    };
    const paginas = paginasDeEtapa(capitulo, this.subComponents[concepto] ?? []);
    this.manualSuelto.set(true);
    this.escenarioInerte(true);
    await this.leerManual(paginas, libro, desde, (pagina) =>
      this.guardar(conViaje(this.partida(), { concepto, pagina })),
    );
    this.manualSuelto.set(false);
  }

  /** Desde la bitácora de la molécula (a la que se llega con un link): el viaje sigue donde quedó. */
  protected seguirElViajeDesdeBitacora(): void {
    this.bitacoraAbierta.set(false);
    this.escenarioInerte(false);
    void this.viajar();
  }

  private alEstablecer(concepto: number, sub: number): void {
    const antes = conceptosEstablecidos(this.partida()).has(concepto);
    this.guardar(conEstablecido(this.partida(), concepto, sub));
    const ultimo = this.subComponents.length - 1;
    if (concepto !== ultimo || antes || this.partida().cinematicas.includes(CAPITULO_FINAL)) return;
    // En el viaje, el final llega cuando se deja la última hoja, no a mitad de ella.
    if (this.viajando) return;
    // El final entra cuando el enlace del último capítulo termina de trazarse: primero la
    // consecuencia de lo que entendiste, después la ceremonia. Antes va la revelación: el final
    // cuenta lo que pasa después de que Angie dice quién es.
    setTimeout(async () => {
      await this.verEntera(CAPITULO_REVELACION);
      void this.abrirCinematica(CAPITULO_FINAL);
    }, ESPERA_FINAL_MS);
  }

  protected async abrirBitacora(): Promise<void> {
    const { cinematicaDe } = await this.cargarDatosCinematicas();
    this.capitulosBitacora.set(
      NOMBRES_DE_CONCEPTO.map((nombre, concepto) => {
        const numero = CAPITULO_DE_CONCEPTO[concepto];
        return {
          concepto,
          numero,
          nombre,
          titulo: TITULOS_DE_CAPITULO[concepto],
          ley: cinematicaDe(numero)?.ley ?? null,
          subs: this.subComponents[concepto]?.length ?? 0,
        };
      }),
    );
    this.leyFinal.set(cinematicaDe(CAPITULO_FINAL)?.ley ?? null);
    this.escenarioInerte(true);
    this.bitacoraAbierta.set(true);
  }

  protected cerrarBitacora(): void {
    this.bitacoraAbierta.set(false);
    this.escenarioInerte(false);
    this.host.querySelector<HTMLElement>('.tb-bitacora')?.focus({ preventScroll: true });
  }

  protected verCinematicaDesdeBitacora(capitulo: number): void {
    this.bitacoraAbierta.set(false);
    this.escenarioInerte(false);
    void this.abrirCinematica(capitulo);
  }

  /**
   * El prólogo vive en la landing, así que para verlo de nuevo se vuelve arriba. Al terminar no
   * arranca nada: la construcción de Tusi ya está hecha y el recorrido sigue donde estaba guardado.
   */
  protected verPrologoDesdeBitacora(): void {
    this.cerrarBitacora();
    const stage = this.host.querySelector<HTMLElement>('#stage');
    if (stage) stage.scrollTop = 0;
    this.abrirPrologo(() => undefined);
  }

  /**
   * El manual suelto, sin la escena: quien salteó el prólogo también lo puede leer. El escenario
   * sigue apagado mientras está abierto, como con la bitácora.
   */
  protected async verManualDesdeBitacora(): Promise<void> {
    await this.leerSuelto(PAGINAS_DEL_MANUAL, MANUAL);
  }

  /** El árbol de Signal Space suelto: quien no vio el prólogo no lo vio nunca. */
  protected async verArbolDesdeBitacora(): Promise<void> {
    await this.leerSuelto([ARBOL_DE_SIGNAL_SPACE], SIGNAL_SPACE);
  }

  private async leerSuelto(paginas: readonly PaginaDelManual[], libro: Libro): Promise<void> {
    this.bitacoraAbierta.set(false);
    this.manualSuelto.set(true);
    await this.leerManual(paginas, libro);
    this.manualSuelto.set(false);
  }

  /**
   * Borrar la partida y volver al principio. Se recarga sin la query: con `?nivel=` en la barra,
   * el link reabría el recorrido en el mismo lugar que se acababa de borrar.
   */
  protected empezarDeCero(): void {
    this.guardar(PARTIDA_VACIA);
    window.location.assign(window.location.pathname);
  }

  /** "Empezar de cero" a la vista pide una segunda confirmación, que caduca sola. */
  protected readonly confirmandoBorrado = signal(false);
  /**
   * Borrar no es un link más: en el "¿seguro?" toma el rojo de la acción que no se deshace. Va en
   * línea porque la hoja de la vista ya está en su presupuesto.
   */
  protected readonly colorDeBorrar = '#a3361c';
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

  /** Lo de atrás no recibe foco, clicks ni teclas mientras corre una cinemática. */
  private escenarioInerte(inerte: boolean): void {
    const stage = this.host.querySelector<HTMLElement>('#stage');
    if (stage) stage.inert = inerte;
  }

  private guardar(partida: Partida): void {
    this.partida.set(partida);
    guardarPartida(this.almacen, partida);
  }

  /** Monta el componente REAL del sub-nivel (concepto ci, sub si) y lo integra a la CD. */
  private readonly mountSub: MountSub = (host, ci, si) => {
    const sub = this.subComponents[ci]?.[si];
    if (!sub?.component && sub?.loadComponent) {
      return this.montarDiferido(host, sub.loadComponent, this.subTitles[ci]?.[si]);
    }
    const type = sub?.component;
    if (!type) return { dispose: () => undefined };
    return { title: this.subTitles[ci]?.[si], dispose: this.montar(host, type, this.env) };
  };

  /** Crea el componente en `host`, lo integra a la CD y devuelve cómo desmontarlo. */
  private montar(host: HTMLElement, type: Type<unknown>, env: EnvironmentInjector): () => void {
    // No pasamos `hostElement: host`: al destruir, `ref.destroy()` borraría ESE nodo, y `host`
    // es la `.subhost` persistente de la card. Creamos el componente en su propio nodo y lo
    // appendeamos adentro; así `destroy()` solo se lleva el nodo del componente, no la `.subhost`.
    const ref = createComponent(type, { environmentInjector: env });
    host.appendChild(ref.location.nativeElement);
    this.appRef.attachView(ref.hostView);
    // La app es zoneless: montar desde el listener nativo de scroll no agenda ningún tick,
    // así que la vista recién adjuntada nunca correría su primera CD y quedaría en blanco.
    // Forzamos la detección inicial acá; las interacciones posteriores ya agendan su propio tick.
    ref.changeDetectorRef.detectChanges();
    return () => {
      this.appRef.detachView(ref.hostView);
      ref.destroy();
    };
  }

  /**
   * Un sub-nivel diferido: su chunk (y sus proveedores, en un injector propio) llega recién cuando
   * el recorrido lo va a mostrar. Si el jugador ya se fue antes de que termine de cargar, no se
   * monta nada. El motor estampa el árbol al montar, y acá el árbol llega después: se estampa al
   * llegar, para que la armonización del `.subhost` le aplique igual.
   */
  private montarDiferido(
    host: HTMLElement,
    cargar: () => Promise<SubNivelDiferido>,
    title: string | undefined,
    lugar: readonly Provider[] = [],
  ): SubHandle {
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
      })
      .catch((error: unknown) => this.errorHandler.handleError(error));
    return {
      title,
      dispose: () => {
        vivo = false;
        desmontar?.();
        injector?.destroy();
      },
    };
  }
}
