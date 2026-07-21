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
  subLevels?: RouteItem[];
}

export type LevelState = 'pending' | 'current' | 'win';
