import { Component, computed, ChangeDetectionStrategy } from '@angular/core';
import { CodeLine } from '../../../../components-atom/component-atom.interface';
import { TitleComponent } from '../../../../components-atom/title/title.component';
import { CodeLegazyComponent } from '../../../../components-atom/code-legazy/code-legazy.component';

@Component({
    selector: 'app-create-new-signals',
    imports: [
        TitleComponent,
        CodeLegazyComponent,
    ],
    templateUrl: './create-new-signals.component.html',
    changeDetection: ChangeDetectionStrategy.Eager,
    styleUrl: './create-new-signals.component.css'
})
export class CreateNewSignalsComponent {
  lines = computed<CodeLine[]>(() => [
    { line: 'count = signal(0);', active: true },
  ]);
  htmlLines = computed<CodeLine[]>(() => [
    { line: '<div>', active: false },
    { line: '     <span>', active: false },
    { line: '            count()', active: true },
    { line: '     </span>', active: false },
    { line: '<div>', active: false },
  ]);
}
