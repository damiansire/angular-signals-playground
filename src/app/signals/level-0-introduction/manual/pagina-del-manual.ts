import { InjectionToken } from '@angular/core';

/**
 * Lo que el manual de a bordo le dice a la página que monta: en qué número va y qué ley enseña. Las
 * frases viven en un solo lugar (`PAGINAS_DEL_MANUAL`, en la vista integrada); la página solo pone
 * la demo, la escena y el desafío.
 */
export interface DatosDeLaPagina {
  /** Desde 1, como se cuentan las leyes en el libro. */
  readonly numero: number;
  readonly ley: string;
  readonly enLaNave: string;
}

export const PAGINA_DEL_MANUAL = new InjectionToken<DatosDeLaPagina>('PAGINA_DEL_MANUAL');
