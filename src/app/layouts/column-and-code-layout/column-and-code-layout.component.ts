import { Component, input, signal, Signal, ChangeDetectionStrategy } from '@angular/core';
import { TitleComponent } from '../../components-atom/title/title.component';
import { CodeLine } from '../../components-atom/component-atom.interface';
import { CodeLegacyComponent } from '../../components-atom/code-legacy/code-legacy.component';
import { ConceptCardComponent } from '../../components-atom/concept-card/concept-card.component';

@Component({
    selector: 'app-column-and-code-layout',
    templateUrl: './column-and-code-layout.component.html',
    styleUrl: './column-and-code-layout.component.css',
    changeDetection: ChangeDetectionStrategy.OnPush,
    imports: [TitleComponent, CodeLegacyComponent, ConceptCardComponent]
})
export class ColumnAndCodeLayoutComponent {
  readonly title = input('No Title');
  readonly codeLines = input<Signal<CodeLine[]>>(signal<CodeLine[]>([]));
  // Tarjeta didáctica opcional: si se pasa `concept`, se muestra arriba.
  readonly concept = input('');
  readonly action = input('');
  readonly observe = input('');
}
