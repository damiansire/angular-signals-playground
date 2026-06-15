import { Component, computed, signal, ChangeDetectionStrategy } from '@angular/core';
import { CodeLine } from '../../../../components-atom/component-atom.interface';
import { TitleComponent } from '../../../../components-atom/title/title.component';
import { TextDescriptionComponent } from '../../../../components-atom/text-description/text-description.component';
import { VariableBoxDrawComponent } from '../../../../components-draw/variable-box-draw/variable-box-draw.component';
import { CodeLegazyComponent } from '../../../../components-atom/code-legazy/code-legazy.component';

@Component({
    selector: 'app-types-of-signals',
    imports: [
        TitleComponent,
        TextDescriptionComponent,
        VariableBoxDrawComponent,
        CodeLegazyComponent,
    ],
    templateUrl: './types-of-signals.component.html',
    changeDetection: ChangeDetectionStrategy.Eager,
    styleUrl: './types-of-signals.component.css'
})
export class TypesOfSignalsComponent {
  example = signal('');
  lines = computed<CodeLine[]>(() => [
    { line: '', active: false },
    { line: `count = signal(${this.example()});      `, active: false },
    { line: '', active: false },
  ]);
  dataTypes = [
    { text: 'Number', example: '64' },
    { text: 'String', example: '"Damian"' },
    { text: 'Boolean', example: 'true' },
    { text: 'Object', example: "{name : 'Damian'}" },
    { text: 'Array', example: '[ 1, 2, 3]' },
  ];

  selectType($event: any) {
    const id = $event.name;
    const exampleElement = this.dataTypes.find((x) => x.text === id);
    if (exampleElement?.example) {
      this.example.set(exampleElement.example);
    }
  }
}
