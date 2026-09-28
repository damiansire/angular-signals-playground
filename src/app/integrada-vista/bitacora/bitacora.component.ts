import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  ElementRef,
  afterNextRender,
  computed,
  inject,
  input,
  output,
  signal,
} from '@angular/core';

import { conceptosEstablecidos, subsEstablecidos, type Partida } from '../../libs/partida';
import { variablesDeResorteSiSoporta } from '../../libs/resorte';
import { acentoDe } from '../cinematicas/escenas/acentos';

export interface CapituloDeBitacora {
  readonly numero: number;
  readonly nombre: string;
  readonly titulo: string;
  /** La ley del mundo que enseña. Solo se muestra cuando el capítulo está establecido. */
  readonly ley: string | null;
  readonly subs: number;
}

/** Cuánto dura el "¿seguro?" del botón de empezar de cero antes de volver a su estado normal. */
const CONFIRMACION_MS = 4000;

/**
 * La bitácora de a bordo: el cuaderno de la partida. Dice qué capítulos estableciste, qué ley del
 * mundo escribiste en cada uno, y deja volver a ver las cinemáticas que ya viste y el prólogo.
 *
 * Es el "repaso" que se decidió: no un examen encubierto, sino leer lo que vos ya entendiste. Las
 * leyes de lo que todavía no estableciste no se muestran: la bitácora solo tiene lo que escribiste.
 */
@Component({
  selector: 'app-bitacora',
  templateUrl: './bitacora.component.html',
  styleUrl: './bitacora.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    role: 'dialog',
    'aria-modal': 'true',
    'aria-labelledby': 'bitacora-titulo',
    '(keydown.escape)': 'cerrar.emit()',
    '[style]': 'variables',
  },
})
export class BitacoraComponent {
  readonly partida = input.required<Partida>();
  readonly capitulos = input.required<readonly CapituloDeBitacora[]>();
  /** Ley del final, si ya se vio: es la moraleja de todo el viaje. */
  readonly leyFinal = input<string | null>(null);

  readonly verCinematica = output<number>();
  readonly verPrologo = output<void>();
  readonly borrar = output<void>();
  readonly cerrar = output<void>();

  protected readonly variables = variablesDeResorteSiSoporta();
  protected readonly establecidos = computed(() => conceptosEstablecidos(this.partida()));
  protected readonly cuenta = computed(() => this.establecidos().size);
  protected readonly filas = computed(() => {
    const partida = this.partida();
    const hechos = this.establecidos();
    return this.capitulos().map((c) => {
      const sellados = subsEstablecidos(partida, c.numero);
      return {
        ...c,
        acento: acentoDe(c.numero),
        establecido: hechos.has(c.numero),
        vista: partida.cinematicas.includes(c.numero),
        pips: Array.from({ length: c.subs }, (_, i) => sellados.has(i)),
        sellados: sellados.size,
      };
    });
  });
  protected readonly finalVisto = computed(() => this.partida().cinematicas.includes(12));
  protected readonly confirmando = signal(false);

  private readonly host = inject(ElementRef<HTMLElement>).nativeElement as HTMLElement;
  private confirmacion: ReturnType<typeof setTimeout> | null = null;

  constructor() {
    inject(DestroyRef).onDestroy(() => {
      if (this.confirmacion) clearTimeout(this.confirmacion);
    });
    // El foco entra al diálogo: sin esto, quien navega con teclado seguía en el recorrido de atrás.
    afterNextRender(() => this.host.querySelector<HTMLElement>('.bita__cerrar')?.focus());
  }

  /** Empezar de cero borra la partida entera: pide una segunda confirmación, que caduca sola. */
  protected empezarDeCero(): void {
    if (!this.confirmando()) {
      this.confirmando.set(true);
      this.confirmacion = setTimeout(() => this.confirmando.set(false), CONFIRMACION_MS);
      return;
    }
    if (this.confirmacion) clearTimeout(this.confirmacion);
    this.borrar.emit();
  }
}
