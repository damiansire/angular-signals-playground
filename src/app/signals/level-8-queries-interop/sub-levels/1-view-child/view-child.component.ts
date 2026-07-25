import {
  Component,
  ChangeDetectionStrategy,
  ElementRef,
  computed,
  signal,
  viewChild,
} from '@angular/core';
import { CodeLine } from '../../../../components-atom/component-atom.interface';
import { ColumnAndCodeLayoutComponent } from '../../../../layouts/column-and-code-layout/column-and-code-layout.component';
import { ManipulableSystemComponent } from '../../../../components-atom/manipulable-system/manipulable-system.component';
import { VIEW_CHILD_SYSTEM } from '../../queries-systems';

@Component({
  selector: 'app-view-child',
  templateUrl: './view-child.component.html',
  styleUrl: './view-child.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ManipulableSystemComponent, ColumnAndCodeLayoutComponent],
})
export class ViewChildComponent {
  readonly closingSystem = VIEW_CHILD_SYSTEM;
  // viewChild() devuelve un signal; se resuelve tras inicializar la vista.
  readonly nameField = viewChild<ElementRef<HTMLInputElement>>('nameField');

  readonly typed = signal('');
  readonly resolved = computed(() => this.nameField() !== undefined);

  onInput(value: string) {
    this.typed.set(value);
  }

  focusField() {
    this.nameField()?.nativeElement.focus();
  }

  clearField() {
    const field = this.nameField()?.nativeElement;
    if (field) {
      field.value = '';
      this.typed.set('');
      field.focus();
    }
  }

  readonly lines = computed<CodeLine[]>(() => [
    { line: '<input #nameField (input)="onInput($event)" />', active: false },
    { line: '', active: false },
    { line: 'nameField = viewChild<ElementRef>("nameField");', active: true },
    { line: '', active: false },
    { line: 'focusField() {', active: true },
    { line: '  this.nameField()?.nativeElement.focus();', active: true },
    { line: '}', active: true },
  ]);
}
