import {
  Component,
  ChangeDetectionStrategy,
  booleanAttribute,
  input,
  numberAttribute,
} from '@angular/core';

@Component({
  selector: 'app-badge',
  changeDetection: ChangeDetectionStrategy.OnPush,
  // Resaltado con texto oscuro: blanco sobre amber-500 daba 2.2:1, justo en el estado que el demo
  // pide alternar.
  template: `
    <span
      class="inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm font-semibold"
      [class]="highlight() ? 'bg-amber-500 text-stone-900' : 'bg-gray-200 text-gray-800'"
    >
      {{ label() }}
      <span class="tabular-nums">{{ count() }}</span>
    </span>
  `,
})
export class BadgeComponent {
  // Requerido: el compilador exige pasarlo en el template (build, strictTemplates);
  // además leerlo antes de que se setee lanza NG0950 en runtime.
  readonly label = input.required<string>();

  // transform: el atributo llega como string y se convierte a number / boolean.
  readonly count = input(0, { transform: numberAttribute });
  readonly highlight = input(false, { transform: booleanAttribute });
}
