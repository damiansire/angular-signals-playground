import { Component, Input, signal, Signal, ChangeDetectionStrategy } from '@angular/core';
import { TitleComponent } from '../../components-atom/title/title.component';
import { CodeLine } from '../../components-atom/component-atom.interface';
import { CodeLegazyComponent } from '../../components-atom/code-legazy/code-legazy.component';

@Component({
    selector: 'app-column-and-code-layout',
    templateUrl: './column-and-code-layout.component.html',
    styleUrl: './column-and-code-layout.component.css',
    changeDetection: ChangeDetectionStrategy.Eager,
    imports: [TitleComponent, CodeLegazyComponent]
})
export class ColumnAndCodeLayoutComponent {
  @Input() title = 'No Title';
  @Input() codeLines: Signal<CodeLine[]> = signal<CodeLine[]>([]);
}
