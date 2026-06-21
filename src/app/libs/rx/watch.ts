import { ChangeDetectorRef, inject } from '@angular/core';
import { type MonoTypeOperatorFunction, tap } from 'rxjs';

/**
 * Operador que marca el componente para chequeo en cada emisión
 * (estilo Taiga UI `tuiWatch`). Inyecta el `ChangeDetectorRef` con un default,
 * así es ergonómico en el call site y testeable.
 *
 * @example stream$.pipe(watch(), takeUntilDestroyed())
 */
export function watch<T>(
  cdr = inject(ChangeDetectorRef),
): MonoTypeOperatorFunction<T> {
  return tap(() => cdr.markForCheck());
}
