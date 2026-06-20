import { Component, ChangeDetectionStrategy } from '@angular/core';
import { TitleComponent } from '../../components-atom/title/title.component';

@Component({
  selector: 'app-zoneless-level',
  templateUrl: './zoneless-level.component.html',
  styleUrl: './zoneless-level.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [TitleComponent],
})
export class ZonelessLevelComponent {}
