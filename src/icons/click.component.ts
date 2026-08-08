import { Component, ChangeDetectionStrategy } from '@angular/core';

@Component({
  selector: 'app-click-icon',
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './click.component.svg',
})
export class SvgComponent {}
