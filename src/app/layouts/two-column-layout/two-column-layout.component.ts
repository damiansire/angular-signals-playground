import { Component, input, ChangeDetectionStrategy } from '@angular/core';
import { TitleComponent } from '../../components-atom/title/title.component';

@Component({
  selector: 'app-two-column-layout',
  imports: [TitleComponent],
  templateUrl: './two-column-layout.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  styleUrl: './two-column-layout.component.css',
})
export class TwoColumnLayoutComponent {
  readonly title = input('No Title');
}
