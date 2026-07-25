import {
  ChangeDetectionStrategy,
  Component,
  computed,
  ElementRef,
  inject,
  input,
  linkedSignal,
} from '@angular/core';
import {
  act,
  ManipulableChallenge,
  readings,
  startOf,
  SystemState,
  turn,
} from '../../libs/manipulable-challenge';

/**
 * Cierre de un sub-nivel donde el código ES el control: el bloque arranca averiado, el usuario mueve
 * la parte que se puede mover, y la lectura del sistema contesta. No hay opciones enumeradas, ni
 * razón escrita, ni cartel de acierto: si el sistema quedó sano se ve en los números, y darse cuenta
 * solo es el punto.
 */
@Component({
  selector: 'app-manipulable-system',
  templateUrl: './manipulable-system.component.html',
  styleUrl: './manipulable-system.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ManipulableSystemComponent {
  readonly system = input.required<ManipulableChallenge>();

  /** Arranca averiado, y vuelve a arrancar si se monta otro sistema en el mismo lugar. */
  private readonly state = linkedSignal(() => startOf(this.system()));

  /**
   * La sangría viaja aparte del cuerpo: si entra adentro del botón, el subrayado de la perilla
   * arranca en el margen y la línea entera se lee como un divisor en vez de como algo tocable.
   */
  readonly lines = computed(() =>
    this.system()
      .code(this.state().knobs)
      .map((line) => {
        const body = line.text.trimStart();
        return { ...line, indent: line.text.slice(0, line.text.length - body.length), body };
      }),
  );
  readonly gauges = computed(() => readings(this.system(), this.state()));
  readonly healthy = computed(() => this.system().healthy(this.state()));

  private readonly host: ElementRef<HTMLElement> = inject(ElementRef);

  press(): void {
    this.settle(() => act(this.system(), this.state()));
  }

  move(knobId: string): void {
    this.settle(() => turn(this.system(), this.state(), knobId));
  }

  /**
   * Al quedar sano avisa por evento del DOM: el recorrido traza el enlace al concepto siguiente.
   * Sale solo en la TRANSICIÓN, no en cada toque, así el enlace se dibuja una vez.
   */
  private settle(next: () => SystemState): void {
    const wasHealthy = this.healthy();
    this.state.set(next());
    if (!wasHealthy && this.healthy()) {
      this.host.nativeElement.dispatchEvent(
        new CustomEvent('sistema-establecido', { bubbles: true }),
      );
    }
  }

  /** Quien ve la pantalla lee la perilla del código; esto es para quien la escucha. */
  knobLabel(knobId: string): string {
    return this.system().knobs.find((knob) => knob.id === knobId)?.label ?? '';
  }
}
