import { Component, ChangeDetectionStrategy } from '@angular/core';
import { TitleComponent } from '../../components-atom/title/title.component';

@Component({
  selector: 'app-queries-interop-level',
  templateUrl: './queries-interop-level.component.html',
  styleUrl: './queries-interop-level.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [TitleComponent],
})
export class QueriesInteropLevelComponent {}
