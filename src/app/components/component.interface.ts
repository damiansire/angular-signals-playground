import { Type } from '@angular/core';

export interface ClickInButton {
  date: Date;
  firstName: string;
  surname: string;
}

export interface HistoryElement {
  date: Date;
  trigger: string;
  newState: number | string;
  isCountIncrement: boolean;
}

export interface RouteItem {
  path: string;
  // Los niveles no llevan componente propio (en la molécula son átomos, no páginas);
  // sí lo llevan los sub-niveles, que la vista integrada embebe.
  component?: Type<unknown>;
  // Nombre del sub-nivel para el topbar de la vista integrada. Es un contrato explícito a
  // propósito: antes el motor sacaba el título del primer <h1> del componente montado, y como
  // ningún sub-nivel tiene <h1> propio, terminaba mostrando el del formulario de demo que hay
  // adentro ("Damian Sire!"). El dato lo declara quien arma el árbol, no lo adivina el DOM.
  title?: string;
  subLevels?: RouteItem[];
}

export type LevelState = 'pending' | 'current' | 'win';
