import { Component, ChangeDetectionStrategy } from '@angular/core';
import { TitleComponent } from '../../components-atom/title/title.component';

@Component({
  selector: 'app-after-render-level',
  templateUrl: './after-render-level.component.html',
  styleUrl: './after-render-level.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [TitleComponent],
})
export class AfterRenderLevelComponent {}
