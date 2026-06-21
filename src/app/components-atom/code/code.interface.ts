export interface CodeClick {
  target: 'Line' | 'Element';
  action: 'Select' | 'Deselect';
  id: string;
}
