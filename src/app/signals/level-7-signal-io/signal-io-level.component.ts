import { Component, ChangeDetectionStrategy } from '@angular/core';
import { TitleComponent } from '../../components-atom/title/title.component';

@Component({
  selector: 'app-signal-io-level',
  templateUrl: './signal-io-level.component.html',
  styleUrl: './signal-io-level.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [TitleComponent],
})
export class SignalIoLevelComponent {}
