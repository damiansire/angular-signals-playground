import { Component, ChangeDetectionStrategy } from '@angular/core';
import { TitleComponent } from '../../components-atom/title/title.component';

@Component({
  selector: 'app-interaction-with-signals',
  imports: [TitleComponent],
  templateUrl: './interaction-with-signals.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  styleUrl: './interaction-with-signals.component.css',
})
export class InteractionWithSignalsComponent {}
