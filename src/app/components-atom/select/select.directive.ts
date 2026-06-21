import { Directive } from '@angular/core';

const SELECT_CLASSES =
  'w-full rounded-md border border-[#e0e0e0] bg-white py-3 px-6 text-base ' +
  'font-medium text-[#6B7280] outline-none focus:border-[#6A64F1] focus:shadow-md';

/**
 * Estilo de select al estilo Taiga UI: directiva sobre el `<select>` nativo.
 * Las `<option>` y el manejo de valor (`[(ngModel)]`, `formControl`) quedan en
 * manos del consumidor; la directiva sólo aporta estilo.
 */
@Directive({
  selector: 'select[appSelect]',
  host: { class: SELECT_CLASSES },
})
export class AppSelect {}
