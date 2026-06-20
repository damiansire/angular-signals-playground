import { Component, ChangeDetectionStrategy } from '@angular/core';
import { TitleComponent } from '../../components-atom/title/title.component';

@Component({
    selector: 'app-introduction',
    imports: [TitleComponent],
    templateUrl: './introduction.component.html',
    changeDetection: ChangeDetectionStrategy.OnPush,
    styleUrl: './introduction.component.css'
})
export class IntroductionComponent {

}
