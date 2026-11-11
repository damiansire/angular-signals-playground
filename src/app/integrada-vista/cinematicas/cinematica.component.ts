import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  ElementRef,
  Injector,
  Type,
  ViewEncapsulation,
  afterNextRender,
  computed,
  inject,
  input,
  output,
  signal,
  viewChild,
} from '@angular/core';
import { NgComponentOutlet } from '@angular/common';

import { sonido } from '../../libs/sonido';
import {
  dibujarNave,
  el,
  gradientesDeNaves,
} from '../../components-draw/tripulacion/nave-del-prologo';
import { variablesDeResorteSiSoporta } from '../../libs/resorte';
import {
  CAPITULO_FINAL,
  CAPITULO_REVELACION,
  PASO_APERTURA_MS,
  duracionDe,
  relojDe,
  type Cinematica,
  type Hablante,
  type LineaEnPantalla,
} from './cinematica-guion';
import { cargarEscena } from './escenas';
import { queHaceElToque } from '../toque-de-dialogo';

export type FinDeCinematica = 'fin' | 'salteada';

/** Nombres en pantalla. Es el dato que el prólogo nunca mostraba: quién está hablando. */
const NOMBRES: Readonly<Record<Hablante, string>> = {
  cap: 'Capitán',
  naveA: 'Nave A',
  naveB: 'Nave B',
  nave4: 'Exploradora',
  mascota: 'Mascota',
  todos: 'Todos',
};

/** La tarjeta del capítulo se lee en el centro y después se corre a un rincón, sin irse. */
const TITULO_AL_RINCON_MS = 2400;

/**
 * Cuánto espera la primera línea: que la tarjeta del capítulo se haya leído y que la apertura haya
 * puesto al héroe en escena. Primero el entorno, después el héroe, al final el texto.
 */
const ANTES_DE_HABLAR_MS = 1500;

/**
 * Lo que tarda una línea en entrar entera: cada palabra entra 42 ms después de la anterior (el
 * `--i` del CSS) y tarda su resorte, unos 520 ms.
 */
const ENTRA_UNA_PALABRA_MS = 520;
const ENTRE_PALABRAS_MS = 42;

/** Teclas que scrollean el recorrido de atrás: con la cinemática abierta se consumen acá. */
const TECLAS_DE_DESPLAZAMIENTO = new Set([
  'ArrowUp',
  'ArrowDown',
  'PageUp',
  'PageDown',
  'Home',
  'End',
]);

interface Evento {
  readonly t: number;
  readonly hacer: () => void;
}

/**
 * El reproductor de las cinemáticas de capítulo. Es un diálogo modal a pantalla completa, con
 * barras de cine, la escena del capítulo y una caja de diálogo con quién habla.
 *
 * Todo el movimiento es CSS: el reloj solo enciende clases (`b-<beat>`) y cambia la línea en
 * pantalla, con un `setTimeout` por evento. Cero `requestAnimationFrame`, así que en reposo no
 * cuesta nada, y congelar es sacar los timers y pausar las animaciones.
 *
 * Los estilos van sin encapsular a propósito: las escenas de cada capítulo son otros componentes y
 * tienen que poder reaccionar a los beats que enciende este. Todo lleva prefijo `cine` o `k-`.
 */
@Component({
  selector: 'app-cinematica',
  imports: [NgComponentOutlet],
  templateUrl: './cinematica.component.html',
  styleUrl: './cinematica.component.css',
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class: 'cine-host cine-host--antes',
    '[style]': 'variables',
  },
})
export class CinematicaComponent {
  readonly cinematica = input.required<Cinematica>();
  /** Si el jugador estableció los doce capítulos: el final cambia algunas líneas. */
  readonly completo = input(false);
  /**
   * Capítulos que el jugador estableció. Llegan a la escena como clases `e-<n>` en la raíz: el
   * final enciende solo esos átomos y deja punteado el resto, que es la deuda visible de la partida.
   */
  readonly establecidos = input<readonly number[]>([]);
  /** Punto de la pantalla del que se abre el iris (el átomo del capítulo), en px. */
  readonly origen = input<{ x: number; y: number } | null>(null);
  /**
   * Congela la escena en un beat (el estado final de todo lo que pasó hasta la primera línea que lo
   * enciende), sin reloj, sin sonido y sin transiciones. Es para revisar escenas cuadro por cuadro:
   * `fin` muestra el último cuadro. `null` = reproducción normal.
   */
  readonly fotograma = input<string | null>(null);
  /**
   * Con un cuadro congelado, el botón de arriba hace esto en vez de saltar: el último cuadro de la
   * historia ofrece empezar de cero. `null` = el "Saltar" de siempre.
   */
  readonly accionFinal = input<string | null>(null);
  readonly accion = output<void>();
  readonly termino = output<FinDeCinematica>();

  private readonly host = inject(ElementRef<HTMLElement>).nativeElement as HTMLElement;
  protected readonly variables = variablesDeResorteSiSoporta();

  /** La escena del capítulo, cuando terminó de cargar su chunk. */
  protected readonly escena = signal<Type<unknown> | null>(null);
  protected readonly reloj = computed(() => relojDe(this.cinematica(), this.completo()));
  protected readonly etiqueta = computed(() => {
    const c = this.cinematica().capitulo;
    if (c === CAPITULO_REVELACION) return 'La revelación';
    return c === CAPITULO_FINAL ? 'Final' : `Capítulo ${c}`;
  });

  protected readonly linea = signal<LineaEnPantalla | null>(null);
  /** Un toque la completó a medio entrar: sus palabras saltan a su lugar. */
  protected readonly escrita = signal(false);
  private lineaDesde = 0;
  private completadaEn: number | null = null;
  private readonly beats = signal<ReadonlySet<string>>(new Set());
  protected readonly clasesDeBeats = computed(() =>
    [
      ...[...this.beats()].map((b) => `b-${b}`),
      ...this.establecidos().map((n) => `e-${n}`),
      this.completo() ? 'cine--completo' : 'cine--incompleto',
    ].join(' '),
  );
  protected readonly quieta = signal(false);
  protected readonly congelada = signal(false);

  private eventos: readonly Evento[] = [];
  private timers: ReturnType<typeof setTimeout>[] = [];
  /** Tiempo de la cinemática ya consumido antes del tramo actual (se congela al pausar). */
  private base = 0;
  private arranco = 0;
  private corriendo = false;
  private cerrada = false;
  private focoPrevio: HTMLElement | null = null;

  constructor() {
    const destroyRef = inject(DestroyRef);
    const reducido = matchMedia('(prefers-reduced-motion: reduce)');
    this.quieta.set(reducido.matches);
    const alCambiarMovimiento = (e: MediaQueryListEvent): void =>
      this.quieta.set(e.matches || this.fondoEnPausa());
    reducido.addEventListener('change', alCambiarMovimiento);

    const alCambiarVisibilidad = (): void => {
      if (document.visibilityState === 'hidden') this.pausar();
      else this.reanudar();
    };
    document.addEventListener('visibilitychange', alCambiarVisibilidad);
    document.addEventListener('keydown', this.alTeclear, { capture: true });

    destroyRef.onDestroy(() => {
      this.limpiarTimers();
      sonido().callar();
      reducido.removeEventListener('change', alCambiarMovimiento);
      document.removeEventListener('visibilitychange', alCambiarVisibilidad);
      document.removeEventListener('keydown', this.alTeclear, { capture: true });
      document.documentElement.classList.remove('cine-vt-abre', 'cine-vt-cierra');
      this.focoPrevio?.focus({ preventScroll: true });
    });

    const injector = inject(Injector);
    afterNextRender(() => {
      this.dibujarNaves();
      // El iris se abre sobre la escena ya dibujada: primero se carga su chunk y se espera un
      // render, recién ahí arranca el reloj.
      void cargarEscena(this.cinematica().capitulo)
        .then((tipo) => {
          if (this.cerrada) return;
          this.escena.set(tipo);
          afterNextRender(() => this.abrir(), { injector });
        })
        .catch(() => this.abrir());
    });
  }

  private readonly defs = viewChild.required<ElementRef<SVGSVGElement>>('defs');

  /**
   * Las naves de la tripulación, las mismas del prólogo y del viaje, en los símbolos que usan todas
   * las escenas. Antes eran la flecha del prólogo viejo, y la historia mostraba dos tripulaciones.
   */
  private dibujarNaves(): void {
    const defs = this.defs().nativeElement.querySelector('defs');
    if (!defs) return;
    gradientesDeNaves(defs, 'cine');
    const simbolos: readonly (readonly [string, number])[] = [
      ['cine-nave-cap', 0],
      ['cine-nave', 1],
      ['cine-nave-b', 2],
      ['cine-nave-4', 3],
    ];
    for (const [id, i] of simbolos) {
      const simbolo = defs.querySelector(`#${id}`);
      if (!simbolo || simbolo.childElementCount > 0) continue;
      dibujarNave(el(simbolo, 'g'), i, defs, 'cine').pose.removeAttribute('style');
    }
  }

  /** El retrato de quien habla: su nave, con su paleta. */
  protected simboloDe(quien: Hablante): string {
    if (quien === 'cap') return '#cine-nave-cap';
    if (quien === 'naveB') return '#cine-nave-b';
    if (quien === 'nave4') return '#cine-nave-4';
    return '#cine-nave';
  }

  protected nombreDe(quien: Hablante): string {
    return NOMBRES[quien];
  }

  protected palabrasDe(linea: LineaEnPantalla): readonly { txt: string; corte: boolean }[] {
    const salida: { txt: string; corte: boolean }[] = [];
    linea.txt.split('\n').forEach((renglon, r) => {
      renglon
        .split(/\s+/)
        .filter(Boolean)
        .forEach((txt, i) => salida.push({ txt, corte: r > 0 && i === 0 }));
    });
    return salida;
  }

  /**
   * Enter, espacio o el botón, como en cualquier RPG: a medio entrar, la línea se completa; entera,
   * la siguiente entra ya (`queHaceElToque`). Antes todo toque pasaba, y dos clics rápidos se
   * llevaban una línea sin que se leyera.
   */
  protected avanzar(): void {
    if (this.cerrada) return;
    const l = this.linea();
    if (l) {
      const ms = performance.now() - this.lineaDesde;
      const entra = (this.palabrasDe(l).length - 1) * ENTRE_PALABRAS_MS + ENTRA_UNA_PALABRA_MS;
      const hace = queHaceElToque(ms, entra, this.completadaEn);
      if (hace === 'nada') return;
      if (hace === 'completar') {
        this.completadaEn = ms;
        this.escrita.set(true);
        return;
      }
    }
    sonido().efecto('toque');
    const ahora = this.ahora();
    const proxima = this.eventos.find((e) => e.t > ahora + 30 && this.esLinea(e));
    if (!proxima) {
      this.cerrar('fin');
      return;
    }
    this.limpiarTimers();
    for (const e of this.eventos) if (e.t > ahora && e.t <= proxima.t) e.hacer();
    this.base = proxima.t;
    this.arranco = performance.now();
    this.agendar(proxima.t);
  }

  protected saltar(): void {
    this.cerrar('salteada');
  }

  private fondoEnPausa(): boolean {
    return this.host.closest('.fondo-en-pausa') !== null;
  }

  private readonly lineaEventos = new WeakSet<Evento>();

  private esLinea(e: Evento): boolean {
    return this.lineaEventos.has(e);
  }

  private readonly alTeclear = (e: KeyboardEvent): void => {
    if (this.cerrada) return;
    if (e.key === 'Escape') {
      e.preventDefault();
      this.saltar();
      return;
    }
    const enBoton = e.target instanceof Element && e.target.closest('button') !== null;
    if (e.key === 'Enter' || e.key === 'ArrowRight' || (e.code === 'Space' && !enBoton)) {
      // Sobre un botón, Enter y espacio son de ese botón (Saltar o Siguiente), no del teclado global.
      if (enBoton && e.key === 'Enter') return;
      e.preventDefault();
      this.avanzar();
      return;
    }
    if (TECLAS_DE_DESPLAZAMIENTO.has(e.key)) e.preventDefault();
  };

  private abrir(): void {
    this.focoPrevio = document.activeElement as HTMLElement | null;
    const fotograma = this.fotograma();
    if (fotograma) {
      this.congelarEn(fotograma);
      return;
    }
    this.eventos = this.armarEventos();

    const o = this.origen();
    const raiz = document.documentElement;
    raiz.style.setProperty('--cine-iris-x', o ? `${Math.round(o.x)}px` : '50%');
    raiz.style.setProperty('--cine-iris-y', o ? `${Math.round(o.y)}px` : '50%');

    const mostrar = (): void => {
      this.host.classList.remove('cine-host--antes');
      this.host.querySelector<HTMLElement>('.cine__seguir')?.focus({ preventScroll: true });
    };
    // Se abre sola al llegar a un capítulo, así que la pausa de la vida de fondo del recorrido
    // también la alcanza: se cuenta en su modo quieto (el de reduced-motion), el diálogo sigue y el
    // movimiento no. Se mira acá y no en el constructor, cuando el host todavía no tiene ancestros.
    if (this.fondoEnPausa()) this.quieta.set(true);
    const vt = this.quieta() ? null : iniciarTransicion(raiz, 'cine-vt-abre', mostrar);
    if (!vt) mostrar();

    sonido().efecto('titulo');
    this.corriendo = true;
    this.base = 0;
    this.arranco = performance.now();
    this.agendar(0);
    if (document.visibilityState === 'hidden') this.pausar();
  }

  /** Aplica de una todos los estados hasta el beat pedido: el cuadro, no el viaje hasta él. */
  private congelarEn(beat: string): void {
    const cine = this.cinematica();
    const reloj = this.reloj();
    const hasta = beat === 'fin' ? reloj.length - 1 : reloj.findIndex((l) => l.beat === beat);
    const lineas = reloj.slice(0, (hasta < 0 ? 0 : hasta) + 1);
    const beats = new Set(['abre', ...cine.apertura, 'titulo-rincon']);
    for (const l of lineas) if (l.beat) beats.add(l.beat);
    if (beat !== 'fin' && hasta < 0) beats.add(beat);
    this.quieta.set(true);
    this.beats.set(beats);
    this.linea.set(lineas[lineas.length - 1] ?? null);
    this.cerrada = true;
    this.host.classList.remove('cine-host--antes');
  }

  private armarEventos(): Evento[] {
    const cine = this.cinematica();
    const eventos: Evento[] = [];
    const encender = (beat: string): void => {
      this.beats.update((b) => new Set([...b, beat]));
      if (beat === 'transmision') sonido().efecto('transmision');
      else if (beat !== 'titulo' && beat !== 'titulo-rincon') sonido().efecto('beat');
    };

    eventos.push({ t: 0, hacer: () => encender('abre') });
    cine.apertura.forEach((beat, i) =>
      eventos.push({ t: 120 + i * PASO_APERTURA_MS, hacer: () => encender(beat) }),
    );
    eventos.push({ t: TITULO_AL_RINCON_MS, hacer: () => encender('titulo-rincon') });

    const desfase = Math.max(ANTES_DE_HABLAR_MS, 120 + cine.apertura.length * PASO_APERTURA_MS);
    for (const l of this.reloj()) {
      const evento: Evento = {
        t: desfase + l.t0,
        hacer: () => {
          this.linea.set(l);
          this.escrita.set(false);
          this.lineaDesde = performance.now();
          this.completadaEn = null;
          if (l.beat) encender(l.beat);
          sonido().hablar(l.quien, l.txt, l.t1 - l.t0);
        },
      };
      this.lineaEventos.add(evento);
      eventos.push(evento);
    }
    eventos.push({ t: desfase + duracionDe(this.reloj()), hacer: () => this.cerrar('fin') });
    return eventos.sort((a, b) => a.t - b.t);
  }

  private ahora(): number {
    return this.corriendo ? this.base + (performance.now() - this.arranco) : this.base;
  }

  private agendar(desde: number): void {
    this.limpiarTimers();
    for (const e of this.eventos) {
      if (e.t < desde || (desde > 0 && e.t === desde)) continue;
      this.timers.push(setTimeout(e.hacer, e.t - desde));
    }
  }

  private limpiarTimers(): void {
    for (const t of this.timers) clearTimeout(t);
    this.timers = [];
  }

  private pausar(): void {
    if (!this.corriendo || this.cerrada) return;
    this.base = this.ahora();
    this.corriendo = false;
    this.limpiarTimers();
    this.congelada.set(true);
    sonido().callar();
  }

  private reanudar(): void {
    if (this.corriendo || this.cerrada || !this.eventos.length) return;
    this.corriendo = true;
    this.arranco = performance.now();
    this.congelada.set(false);
    this.agendar(this.base);
  }

  private cerrar(motivo: FinDeCinematica): void {
    if (this.cerrada) return;
    this.cerrada = true;
    this.corriendo = false;
    this.limpiarTimers();
    sonido().callar();
    sonido().efecto('cierre');

    const avisar = (): void => this.termino.emit(motivo);
    const ocultar = (): void => this.host.classList.add('cine-host--fuera');
    const vt = this.quieta()
      ? null
      : iniciarTransicion(document.documentElement, 'cine-vt-cierra', ocultar);
    if (vt) {
      vt.finished.then(avisar, avisar);
      return;
    }
    // Sin View Transitions (o con movimiento reducido) el cierre es un fundido corto por CSS.
    ocultar();
    setTimeout(avisar, this.quieta() ? 0 : 280);
  }
}

/**
 * Corre un cambio de DOM dentro de una View Transition, si el navegador la tiene. La clase en la
 * raíz elige qué animación usa el pseudo-elemento (abrir y cerrar son dos iris distintos).
 * Devuelve `null` si no hay API: el llamador hace el cambio a mano.
 */
function iniciarTransicion(
  raiz: HTMLElement,
  clase: 'cine-vt-abre' | 'cine-vt-cierra',
  cambio: () => void,
): { finished: Promise<unknown> } | null {
  const doc = document as Document & {
    startViewTransition?: (cb: () => void) => {
      finished: Promise<unknown>;
      ready: Promise<unknown>;
    };
  };
  if (typeof doc.startViewTransition !== 'function') return null;
  raiz.classList.add(clase);
  try {
    const vt = doc.startViewTransition(cambio);
    // Una transición abortada (otra que arranca encima, o la pestaña que se oculta) rechaza `ready`,
    // pero el cambio de DOM igual se aplica: no hay nada que hacer, salvo no ensuciar la consola.
    vt.ready.catch(() => undefined);
    vt.finished.catch(() => undefined).finally(() => raiz.classList.remove(clase));
    return vt;
  } catch {
    raiz.classList.remove(clase);
    return null;
  }
}
