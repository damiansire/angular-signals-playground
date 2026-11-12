import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  ElementRef,
  afterNextRender,
  afterRenderEffect,
  computed,
  inject,
  input,
  linkedSignal,
  output,
  signal,
  viewChild,
} from '@angular/core';
import { ManipulableSystemComponent } from '../../components-atom/manipulable-system/manipulable-system.component';
import { tramosDeFrase } from '../../libs/tramos-de-frase';
import { operadorEn, pistaDe, type Corrida } from '../ayuda-del-hueco';
import type { HuecoDelPrologo } from '../operadores-del-prologo';

/** Dónde está el operador del hueco, relativo al bloque de juego de la hoja. */
interface Senal {
  readonly x: number;
  readonly y: number;
  readonly w: number;
  readonly h: number;
}

/**
 * Los tres operadores del minijuego y qué hace cada uno, en una frase. Van a la vista a propósito:
 * el prólogo es antes de aprender nada, y elegir entre tres nombres sin saber qué hacen era adivinar.
 */
export const OPERADORES_DEL_HUECO = [
  { nombre: 'map', hace: 'Cambia cada valor por el resultado de la cuenta.' },
  { nombre: 'tap', hace: 'Mira cada valor, hace algo aparte y lo deja pasar igual.' },
  { nombre: 'filter', hace: 'Deja pasar solo los valores donde la cuenta da verdadero.' },
] as const;

/**
 * La hoja del manual de a bordo con el hueco de una nave, en el minijuego de operadores del prólogo.
 * Es componente aparte para cargarse diferida: su plantilla, su CSS, el desafío y su resaltador
 * pesaban en el bundle inicial de la vista, que nadie usa en el primer segundo.
 */
@Component({
  selector: 'app-hoja-del-hueco',
  imports: [ManipulableSystemComponent],
  templateUrl: './hoja-del-hueco.component.html',
  styleUrl: './hoja-del-hueco.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class: 'prologo__operadores',
    tabindex: '-1',
    role: 'region',
    'aria-labelledby': 'prologo-hueco',
    '[attr.data-quien]': 'claveDeNave[hueco().nave]',
  },
})
export class HojaDelHuecoComponent {
  readonly hueco = input.required<HuecoDelPrologo>();
  readonly paso = input.required<number>();
  readonly total = input.required<number>();
  readonly saltar = output<void>();

  /** El último toque del desafío a la vista. Cada hueco nuevo arranca sin corrida. */
  protected readonly corrida = linkedSignal<HuecoDelPrologo, Corrida | null>({
    source: this.hueco,
    computation: () => null,
  });
  protected readonly pista = computed(() => pistaDe(this.hueco(), this.corrida()));
  /** El encargo y la pista traen código entre comillas invertidas: se muestra como código. */
  protected readonly tramos = tramosDeFrase;
  /** La clave de color de cada nave, la misma que usa la caja de diálogo. */
  protected readonly claveDeNave = ['cap', 'naveA', 'naveB'] as const;
  protected readonly operadores = OPERADORES_DEL_HUECO;

  private readonly perilla = computed(() => this.hueco().sistema.knobs[0]);
  /** Los operadores del hueco en el orden de la perilla. */
  private readonly opciones = computed(() => {
    const h = this.hueco();
    const id = this.perilla().id;
    return Array.from({ length: this.perilla().positions }, (_, p) =>
      operadorEn(h, { knobs: { [id]: p }, actions: 0, values: {} }),
    );
  });
  private readonly posicion = computed(() => this.corrida()?.estado.knobs[this.perilla().id] ?? 0);
  /** El operador que está escrito en el hueco ahora. */
  protected readonly puesto = computed(() => this.opciones()[this.posicion()]);
  /**
   * La flecha señala el hueco hasta que lo cambian por primera vez. Después sobra: ya saben dónde
   * está, y el óvalo lo sigue marcando.
   */
  protected readonly conFlecha = computed(() => !this.eligio() && this.posicion() === 0);
  /** Elegir desde el panel el mismo operador del arranque no mueve la perilla, y la flecha sobraba. */
  private readonly eligio = linkedSignal({ source: this.hueco, computation: () => false });

  protected readonly senal = signal<Senal | null>(null, {
    equal: (a, b) =>
      a === b || (!!a && !!b && a.x === b.x && a.y === b.y && a.w === b.w && a.h === b.h),
  });

  private readonly desafio = viewChild(ManipulableSystemComponent);
  private readonly juego = viewChild<ElementRef<HTMLElement>>('juego');
  private readonly trazo = viewChild<ElementRef<SVGPathElement>>('trazo');

  constructor() {
    const host: HTMLElement = inject(ElementRef).nativeElement;
    // El foco va a la hoja: con teclado, la orden se atiende sin buscarla.
    afterNextRender(() => host.focus());
    // La hoja es la misma para los tres huecos: bajada en uno, el siguiente abría sin su título.
    afterRenderEffect(() => {
      this.hueco();
      host.scrollTop = 0;
    });

    // El operador cambia de ancho con cada nombre y el bloque se reacomoda con la ventana: la flecha
    // se mide después de cada render y en cada cambio de tamaño, contra el token real del código.
    afterRenderEffect(() => {
      this.corrida();
      this.hueco();
      this.medir();
    });
    // Con cada operador nuevo el óvalo se vuelve a trazar: así se ve que el cambio cayó ahí.
    const quieto = matchMedia('(prefers-reduced-motion: reduce)');
    afterRenderEffect(() => {
      this.puesto();
      if (quieto.matches) return;
      this.trazo()?.nativeElement.animate([{ strokeDashoffset: 1 }, { strokeDashoffset: 0 }], {
        duration: 450,
        easing: 'ease-out',
      });
    });
    const vigia = new ResizeObserver(() => this.medir());
    afterNextRender(() => {
      const juego = this.juego()?.nativeElement;
      if (juego) vigia.observe(juego);
    });
    inject(DestroyRef).onDestroy(() => vigia.disconnect());
  }

  /** Poner un operador desde el panel: es lo mismo que girar la perilla hasta él. */
  protected elegir(nombre: string): void {
    const posicion = this.opciones().indexOf(nombre);
    this.eligio.set(true);
    if (posicion >= 0) this.desafio()?.fijar(this.perilla().id, posicion);
  }

  private medir(): void {
    const juego = this.juego()?.nativeElement;
    // El primer token de la perilla es el operador: el resto del renglón no cambia.
    const token = juego?.querySelector<HTMLElement>('.ms__knob .ms__tk');
    if (!juego || !token) return this.senal.set(null);
    const j = juego.getBoundingClientRect();
    const t = token.getBoundingClientRect();
    if (t.width === 0) return this.senal.set(null);
    this.senal.set({
      x: Math.round(t.left - j.left),
      y: Math.round(t.top - j.top),
      w: Math.round(t.width),
      h: Math.round(t.height),
    });
  }
}
