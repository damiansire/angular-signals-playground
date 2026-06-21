import { type ExistingProvider, type ProviderToken } from '@angular/core';

/**
 * Alias provider tipado (estilo Taiga UI `tuiProvide`): expone `provide` como un
 * alias `useExisting` de otro token, conservando el tipo.
 */
export function provide<T>(
  token: ProviderToken<T>,
  useExisting: ProviderToken<T>,
  multi = false,
): ExistingProvider {
  return { provide: token, useExisting, multi };
}
