import {
  Component,
  ChangeDetectionStrategy,
  ElementRef,
  computed,
  signal,
  viewChildren,
} from '@angular/core';
import { CodeLine } from '../../../../components-atom/component-atom.interface';
import { ColumnAndCodeLayoutComponent } from '../../../../layouts/column-and-code-layout/column-and-code-layout.component';

@Component({
  selector: 'app-view-children',
  templateUrl: './view-children.component.html',
  styleUrl: './view-children.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ColumnAndCodeLayoutComponent],
})
export class ViewChildrenComponent {
  readonly names = signal<string[]>(['Ada', 'Alan', 'Grace']);

  // viewChildren() devuelve un signal con TODOS los elementos que matchean.
  private readonly chips = viewChildren<ElementRef<HTMLElement>>('chip');
  readonly chipCount = computed(() => this.chips().length);

  private readonly pool = ['Ada', 'Alan', 'Grace', 'Linus', 'Margaret', 'Donald'];

  add() {
    const next = this.pool[this.names().length % this.pool.length];
    this.names.update((list) => [...list, next]);
  }

  removeLast() {
    this.names.update((list) => list.slice(0, -1));
  }

  readonly lines = computed<CodeLine[]>(() => [
    { line: '@for (n of names(); track n) {', active: false },
    { line: '  <span #chip>{{ n }}</span>', active: false },
    { line: '}', active: false },
    { line: '', active: false },
    { line: 'chips = viewChildren("chip");', active: true },
    { line: 'chipCount = computed(() => this.chips().length);', active: true },
  ]);
}
