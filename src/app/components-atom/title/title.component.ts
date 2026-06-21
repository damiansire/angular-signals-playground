import { ChangeDetectionStrategy, Component, input } from '@angular/core';
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
}
