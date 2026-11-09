export interface CodeLineElement {
  id: string;
  text: string;
  selected: boolean;
  reservedWord?: boolean;
  /** El nodo al que pertenece el token: la apertura, su texto y su cierre comparten dueño. */
  dueno?: string | null;
}
export interface CodeLine {
  line?: CodeLineElement[] | string;
  elements?: CodeLineElement[];
  selected?: boolean;
  id?: string;
  // @deprecated
  active?: boolean;
  indent?: number;
}
