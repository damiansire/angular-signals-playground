import { Component, ChangeDetectionStrategy } from '@angular/core';
import { TitleComponent } from '../../components-atom/title/title.component';

@Component({
    selector: 'app-effect-level',
    imports: [TitleComponent],
    templateUrl: './effect-level.component.html',
    changeDetection: ChangeDetectionStrategy.OnPush,
    styleUrl: './effect-level.component.css'
})
export class EffectLevelComponent {

}
