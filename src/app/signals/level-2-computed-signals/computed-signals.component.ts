import { Component, ChangeDetectionStrategy } from '@angular/core';
import { TitleComponent } from '../../components-atom/title/title.component';

@Component({
    selector: 'app-computed-signals-level',
    imports: [TitleComponent],
    templateUrl: './computed-signals.component.html',
    changeDetection: ChangeDetectionStrategy.OnPush,
    styleUrl: './computed-signals.component.css'
})
export class ComputedSignalsLevelComponent {}
