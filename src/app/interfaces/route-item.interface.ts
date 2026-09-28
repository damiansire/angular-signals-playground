import { EnvironmentProviders, Provider, Type } from '@angular/core';

/**
 * Un sub-nivel que se carga recién cuando el recorrido lo va a mostrar. Puede traer sus propios
 * proveedores (p. ej. `provideHttpClient`): viven en SU chunk, así el bundle inicial no los paga.
 */
export interface SubNivelDiferido {
  readonly component: Type<unknown>;
  readonly providers?: readonly (Provider | EnvironmentProviders)[];
}

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
  // Alternativa diferida a `component`, para sub-niveles con dependencias pesadas (formularios de
  // signals, HttpClient): el componente y sus proveedores llegan en un chunk aparte.
  loadComponent?: () => Promise<SubNivelDiferido>;
  // Nombre del sub-nivel para el topbar de la vista integrada. Es un contrato explícito a
  // propósito: antes el motor sacaba el título del primer <h1> del componente montado, y como
  // ningún sub-nivel tiene <h1> propio, terminaba mostrando el de un widget interno.
  // El dato lo declara quien arma el árbol, no lo adivina el DOM.
  title?: string;
  subLevels?: RouteItem[];
}
