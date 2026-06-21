import { type FactoryProvider, InjectionToken } from '@angular/core';

import { provideOptions } from './provide-options';

/**
 * Crea un token de opciones con sus defaults y su provider en cascada
 * (estilo Taiga UI `tuiCreateOptions`). Devuelve la tupla `[token, providerFn]`:
 * el token resuelve a `defaults`; `providerFn(partial)` arma un provider que
 * mezcla los defaults del ancestro con el override local.
 *
 * NOTA (demo): en este repo este patron alimenta un unico consumidor (el boton),
 * asi que es un EJERCICIO del patron Taiga, no infraestructura necesaria. Para un
 * unico consumidor alcanza con un `InjectionToken` simple; se conserva aqui solo
 * para mostrar como Taiga modela opciones en cascada por DI.
 *
 * @example
 * export const [APP_BUTTON_OPTIONS, provideAppButtonOptions] =
 *   createOptions(APP_BUTTON_DEFAULT_OPTIONS);
 */
export function createOptions<T>(
  defaults: T,
): [
  token: InjectionToken<T>,
  provider: (options: Partial<T> | (() => Partial<T>)) => FactoryProvider,
] {
  const token = new InjectionToken<T>('Options token', { factory: () => defaults });

  return [token, (options) => provideOptions(token, options, defaults)];
}
