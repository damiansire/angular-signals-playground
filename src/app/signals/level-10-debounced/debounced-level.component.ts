import { Component, ChangeDetectionStrategy } from '@angular/core';
import { TitleComponent } from '../../components-atom/title/title.component';

@Component({
  selector: 'app-debounced-level',
  templateUrl: './debounced-level.component.html',
  styleUrl: './debounced-level.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [TitleComponent],
})
export class DebouncedLevelComponent {}
