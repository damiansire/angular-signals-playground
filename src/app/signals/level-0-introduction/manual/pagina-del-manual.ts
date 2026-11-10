import { InjectionToken, type TemplateRef } from '@angular/core';

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
  /**
   * Cuando la página es la pantalla entera (el libro de leyes): las marcas del libro van debajo del
   * título y los botones de página adentro de la consola, nunca sobre el código ni en la fila de la
   * barra. Sin esto, la página va en una hoja que pone los suyos.
   */
  readonly marcas?: TemplateRef<unknown>;
  /** Los botones de página: van en la fila de los pasos, donde estaba "Mostrame". */
  readonly pie?: TemplateRef<unknown>;
  /** La página se cumplió (los dos pasos hechos): recién ahí el libro deja seguir. */
  readonly alCumplir?: () => void;
  /**
   * Para la página en la pantalla de la nave, que pone sus propios botones en vez del `pie`: pasar
   * de hoja (después de que la nave sale volando) y qué dice cada botón, o `null` si no hay a dónde
   * ir. "Siguiente" es `null` hasta que la página se cumple.
   */
  readonly pasar?: (paso: 1 | -1) => void;
  readonly atras?: () => string | null;
  readonly siguiente?: () => string | null;
}

export const PAGINA_DEL_MANUAL = new InjectionToken<DatosDeLaPagina>('PAGINA_DEL_MANUAL');
