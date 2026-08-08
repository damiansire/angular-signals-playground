import { Type } from '@angular/core';

/**
 * Árbol de conceptos y sub-niveles del recorrido. Vive en `interfaces/` (tipos compartidos) y no
 * en `components/`: es el contrato entre el routing y la vista integrada, no un tipo de un
 * componente de feature.
 */
export interface RouteItem {
  path: string;
  // Los niveles no llevan componente propio (en la molécula son átomos, no páginas);
  // sí lo llevan los sub-niveles, que la vista integrada embebe.
  component?: Type<unknown>;
  // Nombre del sub-nivel para el topbar de la vista integrada. Es un contrato explícito a
  // propósito: antes el motor sacaba el título del primer <h1> del componente montado, y como
  // ningún sub-nivel tiene <h1> propio, terminaba mostrando el de un widget interno.
  // El dato lo declara quien arma el árbol, no lo adivina el DOM.
  title?: string;
  subLevels?: RouteItem[];
}
