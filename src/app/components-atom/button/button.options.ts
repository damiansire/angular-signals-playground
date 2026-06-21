import { createOptions } from '../../libs/di';

export type AppButtonSize = 's' | 'm' | 'l';
export type AppButtonAppearance = 'primary' | 'secondary';

export interface AppButtonOptions {
  readonly size: AppButtonSize;
  readonly appearance: AppButtonAppearance;
}

export const APP_BUTTON_DEFAULT_OPTIONS: AppButtonOptions = {
  size: 'm',
  appearance: 'primary',
};

/**
 * Token + provider de opciones del botón (estilo Taiga `tuiButtonOptions`).
 * Proveé `provideAppButtonOptions({appearance: 'secondary'})` en cualquier
 * subárbol para cambiar el default sin tocar cada call site.
 */
export const [APP_BUTTON_OPTIONS, provideAppButtonOptions] = createOptions(
  APP_BUTTON_DEFAULT_OPTIONS,
);
