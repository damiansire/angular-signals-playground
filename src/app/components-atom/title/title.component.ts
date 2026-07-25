import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { TailwindTextSize } from '../../interfaces/tailwind-css.interface';
@Component({
  selector: 'app-title',
  imports: [],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './title.component.html',
  styleUrl: './title.component.css',
})
export class TitleComponent {
  title = input<string>('Missing Title');
  textSize = input<TailwindTextSize>('text-4xl');

  /**
   * El "!" es parte del tono del playground, pero se pegaba siempre: los títulos que ya cierran con
   * signo quedaban como "¿Qué es un signal?!" o "asReadonly()!". Solo se agrega si el título no
   * termina ya en puntuación.
   */
  readonly displayTitle = computed<string>(() => {
    const raw = this.title().trim();
    return /[.!?)\]:]$/.test(raw) ? raw : `${raw}!`;
  });
}
