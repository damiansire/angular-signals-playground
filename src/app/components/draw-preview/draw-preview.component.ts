import { Component, input, ChangeDetectionStrategy } from '@angular/core';

@Component({
    selector: 'app-draw-preview',
    imports: [],
    templateUrl: './draw-preview.component.html',
    changeDetection: ChangeDetectionStrategy.OnPush,
    styleUrl: './draw-preview.component.css'
})
export class DrawPreviewComponent {
  readonly imgUrl = input('');
}
