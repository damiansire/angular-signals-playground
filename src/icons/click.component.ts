import { Component, ChangeDetectionStrategy } from '@angular/core';

@Component({
  standalone: true,
  selector: 'icon-click',
  changeDetection: ChangeDetectionStrategy.Eager,
  templateUrl: './click.component.svg',
})
export class SvgComponent {}
