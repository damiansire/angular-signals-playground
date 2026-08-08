/**
 * Tipos de los componentes de feature de esta carpeta. El contrato de routing vive en
 * `interfaces/route-item.interface.ts`: no es un tipo de componente.
 */

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
