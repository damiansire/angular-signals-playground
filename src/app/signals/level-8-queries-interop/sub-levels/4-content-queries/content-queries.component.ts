import { Component, ChangeDetectionStrategy, computed, signal } from '@angular/core';
import { CodeLine } from '../../../../components-atom/component-atom.interface';
import { ColumnAndCodeLayoutComponent } from '../../../../layouts/column-and-code-layout/column-and-code-layout.component';
import { TagListComponent } from './tag-list/tag-list.component';
import { ManipulableSystemComponent } from '../../../../components-atom/manipulable-system/manipulable-system.component';
import { CONTENT_QUERY_SYSTEM } from '../../queries-systems';

@Component({
  selector: 'app-content-queries',
  templateUrl: './content-queries.component.html',
  styleUrl: './content-queries.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ManipulableSystemComponent, ColumnAndCodeLayoutComponent, TagListComponent],
})
export class ContentQueriesComponent {
  readonly closingSystem = CONTENT_QUERY_SYSTEM;
  readonly names = signal<string[]>(['Ada', 'Alan', 'Grace']);
  private readonly pool = ['Ada', 'Alan', 'Grace', 'Linus', 'Margaret'];

  add() {
    this.names.update((list) => [...list, this.pool[list.length % this.pool.length]]);
  }

  removeLast() {
    this.names.update((list) => list.slice(0, -1));
  }

  readonly lines = computed<CodeLine[]>(() => [
    { line: '// En el hijo (app-tag-list):', active: false },
    { line: 'tags = contentChildren("tag");', active: true },
    { line: 'first = contentChild("tag");', active: true },
    { line: '', active: false },
    { line: '// En el padre, contenido proyectado:', active: false },
    { line: '<app-tag-list>', active: false },
    { line: '  @for (n of names(); track n) {', active: false },
    { line: '    <span #tag>{{ n }}</span>', active: false },
    { line: '  }', active: false },
    { line: '</app-tag-list>', active: false },
  ]);
}
