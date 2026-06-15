import { ChangeDetectionStrategy, Component, input } from '@angular/core';

@Component({
    selector: 'app-text-description',
    imports: [],
    changeDetection: ChangeDetectionStrategy.OnPush,
    templateUrl: './text-description.component.html',
    styleUrl: './text-description.component.css'
})
export class TextDescriptionComponent {
  text = input<string>('');
}
