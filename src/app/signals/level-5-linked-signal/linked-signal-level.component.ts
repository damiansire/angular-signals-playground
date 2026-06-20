import { Component, ChangeDetectionStrategy } from '@angular/core';
import { TitleComponent } from '../../components-atom/title/title.component';

@Component({
  selector: 'app-linked-signal-level',
  templateUrl: './linked-signal-level.component.html',
  styleUrl: './linked-signal-level.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [TitleComponent],
})
export class LinkedSignalLevelComponent {}
