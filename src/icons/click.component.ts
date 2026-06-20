import { Component, ChangeDetectionStrategy } from '@angular/core';

@Component({
  standalone: true,
  selector: 'app-click-icon',
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './click.component.svg',
})
export class SvgComponent {}
