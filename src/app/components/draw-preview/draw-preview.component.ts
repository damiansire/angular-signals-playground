import { Component, Input, ChangeDetectionStrategy } from '@angular/core';

@Component({
    selector: 'app-draw-preview',
    imports: [],
    templateUrl: './draw-preview.component.html',
    changeDetection: ChangeDetectionStrategy.Eager,
    styleUrl: './draw-preview.component.css'
})
export class DrawPreviewComponent {
  @Input() imgUrl: string = '';
}
