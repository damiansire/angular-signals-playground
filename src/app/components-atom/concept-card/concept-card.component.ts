import { ChangeDetectionStrategy, Component, input, signal, viewChild } from '@angular/core';
import { MascotaVivaComponent } from '../../components-draw/mascota-viva/mascota-viva.component';

/**
 * Tarjeta didáctica reutilizable: explica de qué va una demo sin obligar a leer el código
 * (Concepto / Qué hacer / Qué observar). La cuenta la mascota: arranca oculta y el usuario la
 * abre tocando la mascota, para no tapar el ejemplo por default y sumar un gesto de descubrimiento.
 */
@Component({
  selector: 'app-concept-card',
  templateUrl: './concept-card.component.html',
  styleUrl: './concept-card.component.css',
  imports: [MascotaVivaComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ConceptCardComponent {
  readonly concept = input.required<string>();
  readonly action = input<string>('');
  readonly observe = input<string>('');

  /** La pista arranca cerrada; se abre al tocar la mascota. */
  readonly open = signal(false);
  private readonly mascota = viewChild(MascotaVivaComponent);

  toggle(): void {
    this.open.update((v) => !v);
  }

  /** Con puntero, el toque ya lo resolvió la física de la mascota; con teclado, saluda. */
  protected alActivar(e: MouseEvent): void {
    if (e.detail === 0) this.mascota()?.saludar();
    this.toggle();
  }
}
