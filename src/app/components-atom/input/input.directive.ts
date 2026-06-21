import { Directive } from '@angular/core';

const INPUT_CLASSES =
  'w-full rounded-md border border-[#e0e0e0] bg-white py-3 px-6 text-base ' +
  'font-medium text-[#6B7280] outline-none focus:border-[#6A64F1] focus:shadow-md';

/**
 * Estilo de input al estilo Taiga UI: directiva sobre el `<input>`/`<textarea>`
 * nativo. El consumidor conserva el control nativo (validación, `[(ngModel)]`,
 * `formControl`, eventos) y se encarga del `<label>`: etiquetar es
 * responsabilidad de quien usa el componente en cada contexto.
 */
@Directive({
  selector: 'input[appInput], textarea[appInput]',
  host: { class: INPUT_CLASSES },
})
export class AppInput {}
