import {
  ApplicationRef,
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  ElementRef,
  EnvironmentInjector,
  ErrorHandler,
  Type,
  afterNextRender,
  createComponent,
  createEnvironmentInjector,
  inject,
  isDevMode,
  computed,
  signal,
} from '@angular/core';
import { Location } from '@angular/common';
import { RouterLink } from '@angular/router';

import { signalsRoutesTree } from '../app.routes';
import { type RouteItem, type SubNivelDiferido } from '../interfaces/route-item.interface';
import {
  initMolecule,
  NOMBRES_DE_CONCEPTO,
  TITULOS_DE_CAPITULO,
  type MountSub,
  type SubHandle,
} from './molecule-engine';
import { initIntroTusi, type IntroTusiHandle } from './intro-tusi';
import { initPrologoAnomalia } from './prologo-anomalia';
import { buildWhereQuery, parseWhereQuery } from './url-sync';
import {
  almacenDelNavegador,
  cargarPartida,
  conCinematica,
  conEstablecido,
  conPrologo,
  conceptosEstablecidos,
  guardarPartida,
  PARTIDA_VACIA,
  type Partida,
} from '../libs/partida';
import { CinematicaComponent } from './cinematicas/cinematica.component';
import { BitacoraComponent, type CapituloDeBitacora } from './bitacora/bitacora.component';
import { CAPITULO_FINAL, type Cinematica } from './cinematicas/cinematica-guion';

/**
 * Cuánto tiene que quedarse el recorrido en la parada de un capítulo para que arranque su
 * cinemática. Con scroll-snap, pasar de largo también reporta cada parada: sin esta espera, un
 * gesto largo de trackpad disparaba la cinemática de un capítulo que el jugador solo cruzó.
 */
const ESPERA_CINEMATICA_MS = 650;

/** El final entra después de que el enlace del capítulo 11 terminó de trazarse. */
const ESPERA_FINAL_MS = 1600;

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
  imports: [RouterLink, CinematicaComponent, BitacoraComponent],
  templateUrl: './integrada-vista.component.html',
  styleUrls: [
    './integrada-vista.component.css',
    './intro-tusi.css',
    './prologo-anomalia.css',
    './boot-fallo.css',
    './angosto.css',
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class IntegradaVistaComponent {
  private readonly host = inject(ElementRef<HTMLElement>).nativeElement as HTMLElement;
  private readonly destroyRef = inject(DestroyRef);
  private readonly env = inject(EnvironmentInjector);
  private readonly appRef = inject(ApplicationRef);
  private readonly location = inject(Location);
  private readonly errorHandler = inject(ErrorHandler);

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

  /** El Estudio es una herramienta de autor: su enlace solo aparece mientras se desarrolla. */
  protected readonly modoDesarrollo = isDevMode();

  /** La cinemática en pantalla, si hay una. */
  protected readonly cinematica = signal<Cinematica | null>(null);
  protected readonly cinematicaCompleta = signal(false);
  protected readonly conceptosHechos = computed(() => [...conceptosEstablecidos(this.partida())]);
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

  constructor() {
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
      this.initialFromUrl(),
      (visible) => landing?.setVisible(visible),
      {
        establecidos: new Set(this.partida().establecidos),
        alEstablecer: (concepto, sub) => this.alEstablecer(concepto, sub),
      },
    );
    this.destroyRef.onDestroy(dispose);

    // Landing "par de Tusi" (canvas + audio + overlay Dark/Light). El motor ya fadea el `.intro`.
    //
    // Entre el clima y la construcción va el PRÓLOGO. El orden importa y no es arbitrario: elegir
    // clima es el gesto que el navegador exige para dejar sonar, así que el prólogo arranca con
    // audio ya desbloqueado y sin pedirle nada más a nadie. Y la construcción de Tusi espera de
    // verdad: si corriera detrás durante esos minutos, llegaría terminada y se comería su propio
    // premio, que es ver aparecer el círculo.
    landing = initIntroTusi(this.host, {
      // La preferencia de sonido se elige en el overlay del intro pero quien suena después es el
      // prólogo: viaja con el gatillo para que silenciar antes de entrar valga para los dos.
      onThemePicked: (startBuild) => {
        // Quien ya pasó por el prólogo no lo vuelve a ver impuesto: en un juego, volver es
        // "continuar partida", no repetir la intro.
        if (this.partida().prologo) {
          startBuild();
          return;
        }
        this.cerrarPrologo = initPrologoAnomalia(this.host, {
          alTerminar: () => {
            this.guardar(conPrologo(this.partida()));
            startBuild();
          },
        });
      },
    });
    this.destroyRef.onDestroy(landing.dispose);
    this.destroyRef.onDestroy(() => this.cerrarPrologo?.());
  }

  /**
   * Deep-link: lee `?nivel=X(&sub-nivel=Z)` de la URL para abrir el recorrido donde quedó.
   * `?nivel=X` solo (sin sub-nivel, la vista molécula) también es válido: encuadra el átomo.
   */
  private initialFromUrl(): { concept: number; sub: number } | null {
    return parseWhereQuery(window.location.search);
  }

  /**
   * Refleja el nivel/sub-nivel actual del recorrido en la URL sin navegar ni recargar.
   * `replaceState` reescribe la barra (respetando el base href) sin pasar por el Router,
   * así el componente no se desmonta ni se pierde el scroll. `subIdx` -1 = vista molécula.
   */
  private readonly onWhere = (conceptIdx: number, subIdx: number): void => {
    this.location.replaceState('/', buildWhereQuery(conceptIdx, subIdx));
    this.donde = { concepto: conceptIdx, sub: subIdx };
    this.programarCinematica(conceptIdx, subIdx);
  };

  /**
   * La cinemática de un capítulo se juega la primera vez que el jugador se detiene en su parada de
   * la molécula (no adentro de un sub-nivel: un deep-link a un ejercicio no se interrumpe).
   */
  private programarCinematica(concepto: number, sub: number): void {
    if (this.esperaCinematica) clearTimeout(this.esperaCinematica);
    this.esperaCinematica = null;
    if (concepto < 0 || sub !== -1 || this.cinematica()) return;
    if (this.partida().cinematicas.includes(concepto) || concepto > CAPITULO_FINAL) return;
    // Se adelanta la carga del guion mientras corre la espera: al abrir ya está.
    void this.cargarDatosCinematicas();
    this.esperaCinematica = setTimeout(() => {
      this.esperaCinematica = null;
      if (this.donde.concepto === concepto && this.donde.sub === -1)
        void this.abrirCinematica(concepto);
    }, ESPERA_CINEMATICA_MS);
  }

  protected async abrirCinematica(capitulo: number): Promise<void> {
    const { cinematicaDe } = await this.cargarDatosCinematicas();
    const cine = cinematicaDe(capitulo);
    if (!cine || this.cinematica()) return;
    // El iris se abre desde el átomo del capítulo: la cinemática sale de ESE lugar del mapa.
    const atomo = this.host.querySelector('#atoms .atom.current')?.getBoundingClientRect();
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
  }

  private alEstablecer(concepto: number, sub: number): void {
    const antes = conceptosEstablecidos(this.partida()).has(concepto);
    this.guardar(conEstablecido(this.partida(), concepto, sub));
    const ultimo = this.subComponents.length - 1;
    if (concepto !== ultimo || antes || this.partida().cinematicas.includes(CAPITULO_FINAL)) return;
    // El final entra cuando el enlace del último capítulo termina de trazarse: primero la
    // consecuencia de lo que entendiste, después la ceremonia.
    setTimeout(() => void this.abrirCinematica(CAPITULO_FINAL), ESPERA_FINAL_MS);
  }

  protected async abrirBitacora(): Promise<void> {
    const { cinematicaDe } = await this.cargarDatosCinematicas();
    this.capitulosBitacora.set(
      NOMBRES_DE_CONCEPTO.map((nombre, numero) => ({
        numero,
        nombre,
        titulo: TITULOS_DE_CAPITULO[numero],
        ley: cinematicaDe(numero)?.ley ?? null,
        subs: this.subComponents[numero]?.length ?? 0,
      })),
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
    this.cerrarPrologo?.();
    this.cerrarPrologo = initPrologoAnomalia(this.host, { alTerminar: () => undefined });
  }

  /** Borrar la partida y recargar: el motor arma la molécula desde lo guardado, y ya no hay nada. */
  protected empezarDeCero(): void {
    this.guardar(PARTIDA_VACIA);
    window.location.reload();
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
  ): SubHandle {
    let vivo = true;
    let desmontar: (() => void) | null = null;
    let injector: EnvironmentInjector | null = null;
    cargar()
      .then(({ component, providers }) => {
        if (!vivo) return;
        injector = providers?.length ? createEnvironmentInjector([...providers], this.env) : null;
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
