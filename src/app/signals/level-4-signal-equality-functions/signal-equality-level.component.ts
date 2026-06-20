import { Component, ChangeDetectionStrategy } from '@angular/core';
import { TitleComponent } from '../../components-atom/title/title.component';

@Component({
  selector: 'app-signal-equality-level',
  templateUrl: './signal-equality-level.component.html',
  styleUrl: './signal-equality-level.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [TitleComponent],
})
export class SignalEqualityLevelComponent {}
