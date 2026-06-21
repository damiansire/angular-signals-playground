import { computed, Directive, inject, input } from '@angular/core';

import {
  APP_BUTTON_OPTIONS,
  type AppButtonAppearance,
  type AppButtonSize,
} from './button.options';

const BASE_CLASSES =
  'inline-flex items-center justify-center text-center cursor-pointer ' +
  'font-semibold font-body transition ease-in-out duration-300 border-0 ' +
  'rounded focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-60';

const SIZE_CLASSES: Record<AppButtonSize, string> = {
  s: 'text-xs px-4 py-2 h-10',
  m: 'text-sm px-6 py-3.5 h-12',
  l: 'text-sm px-8 py-4 h-14',
};

const APPEARANCE_CLASSES: Record<AppButtonAppearance, string> = {
  primary: 'bg-black text-white hover:bg-gray-600 hover:shadow-cart',
  secondary: 'bg-white text-black border border-black hover:bg-gray-100',
};

/**
 * Botón al estilo Taiga UI: una **directiva sobre el elemento nativo**
 * (`<button appButton>` / `<a appButton>`) en lugar de un componente envoltorio.
 * Así el consumidor conserva el `<button>` real (foco, `type`, `form`, teclado,
 * ARIA) y el contenido proyectado; la directiva sólo aporta estilo y tamaño.
 *
 * Los defaults salen del token de opciones, configurable por DI.
 */
@Directive({
  selector: 'button[appButton], a[appButton]',
  host: {
    '[class]': 'classes()',
    '[attr.data-size]': 'size()',
    '[attr.data-appearance]': 'appearance()',
  },
})
export class AppButton {
  public readonly size = input<AppButtonSize>(inject(APP_BUTTON_OPTIONS).size);
  public readonly appearance = input<AppButtonAppearance>(
    inject(APP_BUTTON_OPTIONS).appearance,
  );

  protected readonly classes = computed(
    () =>
      `${BASE_CLASSES} ${SIZE_CLASSES[this.size()]} ${APPEARANCE_CLASSES[this.appearance()]}`,
  );
}
