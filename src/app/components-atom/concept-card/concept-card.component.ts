import { ChangeDetectionStrategy, Component, input } from '@angular/core';

/**
 * Tarjeta didáctica reutilizable: explica de qué va una demo sin obligar a leer
 * el código. Pensada para encabezar cada ejemplo (Concepto / Qué hacer / Qué observar).
 */
@Component({
  selector: 'app-concept-card',
  templateUrl: './concept-card.component.html',
  styleUrl: './concept-card.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ConceptCardComponent {
  readonly concept = input.required<string>();
  readonly action = input<string>('');
  readonly observe = input<string>('');
}
