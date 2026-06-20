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
  component: Type<unknown>; // Asegúrate de importar tus componentes
  subLevels?: RouteItem[];
}

export type LevelState = 'pending' | 'current' | 'win';
