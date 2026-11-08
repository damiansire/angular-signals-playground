import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  afterNextRender,
  computed,
  inject,
  input,
  linkedSignal,
  output,
} from '@angular/core';
import { ManipulableSystemComponent } from '../../components-atom/manipulable-system/manipulable-system.component';
import { tramosDeFrase } from '../../libs/tramos-de-frase';
import { pistaDe, type Corrida } from '../ayuda-del-hueco';
import type { HuecoDelPrologo } from '../operadores-del-prologo';

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

  constructor() {
    const host: HTMLElement = inject(ElementRef).nativeElement;
    // El foco va a la hoja: con teclado, la orden se atiende sin buscarla.
    afterNextRender(() => host.focus());
  }
}
