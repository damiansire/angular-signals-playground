import { Component, ChangeDetectionStrategy } from '@angular/core';
import { ConceptCardComponent } from '../../../../components-atom/concept-card/concept-card.component';

@Component({
    selector: 'app-signals-change-detection',
    imports: [ConceptCardComponent],
    templateUrl: './signals-change-detection.component.html',
    changeDetection: ChangeDetectionStrategy.OnPush,
    styleUrl: './signals-change-detection.component.css'
})
export class SignalsChangeDetectionComponent {

}
