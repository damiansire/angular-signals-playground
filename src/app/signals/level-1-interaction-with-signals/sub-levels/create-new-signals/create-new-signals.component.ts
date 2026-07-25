import { Component, computed, ChangeDetectionStrategy } from '@angular/core';
import { CodeLine } from '../../../../components-atom/component-atom.interface';
import { TitleComponent } from '../../../../components-atom/title/title.component';
import { CodeComponent } from '../../../../components-atom/code/code.component';
import { ConceptCardComponent } from '../../../../components-atom/concept-card/concept-card.component';
import { ManipulableSystemComponent } from '../../../../components-atom/manipulable-system/manipulable-system.component';
import { READ_SIGNAL_SYSTEM } from '../../signals-systems';

@Component({
  selector: 'app-create-new-signals',
  imports: [ManipulableSystemComponent, TitleComponent, CodeComponent, ConceptCardComponent],
  templateUrl: './create-new-signals.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  styleUrl: './create-new-signals.component.css',
})
export class CreateNewSignalsComponent {
  readonly closingSystem = READ_SIGNAL_SYSTEM;
  lines = computed<CodeLine[]>(() => [{ line: 'count = signal(0);', active: true }]);
  htmlLines = computed<CodeLine[]>(() => [
    { line: '<div>', active: false },
    { line: '     <span>', active: false },
    { line: '            count()', active: true },
    { line: '     </span>', active: false },
    { line: '</div>', active: false },
  ]);
}
