import { InjectionToken, type Provider } from '@angular/core';

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
 * Token de opciones del botón (estilo Taiga `tuiButtonOptions`), configurable por
 * DI. Resuelve a `APP_BUTTON_DEFAULT_OPTIONS` si nadie lo provee; para cambiar el
 * default de un subárbol sin tocar cada call site, proveé
 * `provideAppButtonOptions({ appearance: 'secondary' })`.
 */
export const APP_BUTTON_OPTIONS = new InjectionToken<AppButtonOptions>('APP_BUTTON_OPTIONS', {
  factory: () => APP_BUTTON_DEFAULT_OPTIONS,
});

/** Override los defaults del botón para un subárbol de DI (merge sobre los defaults). */
export function provideAppButtonOptions(options: Partial<AppButtonOptions>): Provider {
  return {
    provide: APP_BUTTON_OPTIONS,
    useValue: { ...APP_BUTTON_DEFAULT_OPTIONS, ...options },
  };
}
