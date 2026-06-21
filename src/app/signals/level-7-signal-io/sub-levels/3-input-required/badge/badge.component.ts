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
  template: `
    <span
      class="inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm font-semibold"
      [class]="highlight() ? 'bg-amber-500 text-white' : 'bg-gray-200 text-gray-800'"
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
