import { Component, ChangeDetectionStrategy, computed, signal } from '@angular/core';
import { CodeLine } from '../../../../components-atom/component-atom.interface';
import { ColumnAndCodeLayoutComponent } from '../../../../layouts/column-and-code-layout/column-and-code-layout.component';
import { BadgeComponent } from './badge/badge.component';
import { ManipulableSystemComponent } from '../../../../components-atom/manipulable-system/manipulable-system.component';
import { INPUT_REQUIRED_SYSTEM } from '../../io-systems';

@Component({
  selector: 'app-input-required',
  templateUrl: './input-required.component.html',
  styleUrl: './input-required.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ManipulableSystemComponent, ColumnAndCodeLayoutComponent, BadgeComponent],
})
export class InputRequiredComponent {
  readonly closingSystem = INPUT_REQUIRED_SYSTEM;
  readonly count = signal(3);
  readonly highlight = signal(false);

  more() {
    this.count.update((value) => value + 1);
  }

  toggle() {
    this.highlight.update((value) => !value);
  }

  readonly lines = computed<CodeLine[]>(() => [
    { line: '// En el hijo:', active: false },
    { line: 'label = input.required<string>();', active: true },
    { line: 'count = input(0, { transform: numberAttribute });', active: true },
    { line: 'highlight = input(false, { transform: booleanAttribute });', active: true },
    { line: '', active: false },
    { line: '// En el padre:', active: false },
    { line: '<app-badge label="Mensajes" [count]="count()"', active: false },
    { line: '           [highlight]="highlight()" />', active: false },
  ]);
}
