import { Component, Input, ChangeDetectionStrategy } from '@angular/core';
import { TitleComponent } from '../../components-atom/title/title.component';

@Component({
    selector: 'app-two-column-layout',
    imports: [TitleComponent],
    templateUrl: './two-column-layout.component.html',
    changeDetection: ChangeDetectionStrategy.Eager,
    styleUrl: './two-column-layout.component.css'
})
export class TwoColumnLayoutComponent {
  @Input() title = 'No Title';
}
