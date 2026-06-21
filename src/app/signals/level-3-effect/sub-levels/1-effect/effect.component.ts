import { Component, computed, effect, signal, ChangeDetectionStrategy } from '@angular/core';
import { CodeLine } from '../../../../components-atom/component-atom.interface';
import { VariableBoxComponent } from '../../../../components-atom/variable-box/variable-box.component';
import { HistoryElement } from '../../../../components/component.interface';
import { DependenciesStatusComponent } from '../../../../components/dependencies-status/dependencies-status.component';
import { EventHistoryComponent } from '../../../../components/event-history/event-history.component';
import { CodeLegacyComponent } from '../../../../components-atom/code-legacy/code-legacy.component';
import { ConceptCardComponent } from '../../../../components-atom/concept-card/concept-card.component';

@Component({
  selector: 'app-effect',
  templateUrl: './effect.component.html',
  styleUrl: './effect.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    VariableBoxComponent,
    EventHistoryComponent,
    DependenciesStatusComponent,
    CodeLegacyComponent,
    ConceptCardComponent,
  ],
})
export class EffectComponent {
  count = signal(0);
  count2 = signal(0);
  dependencies = computed<string[]>(() => {
    return ['count'];
  });
  dependencies2 = computed<string[]>(() => {
    return ['count2'];
  });
  appEventHistory = signal<HistoryElement[]>([]);
  constructor() {
    effect(() => {
      const trigger = this.count() === 0 ? 'effect(1) inicial' : 'effect(1) corrió';
      this.addConditionalCountRecomputation(trigger, this.count(), false);
      // eslint-disable-next-line no-console -- demo didactica: refleja el console.log mostrado en pantalla
      console.log(`The current count is: ${this.count()}`);
    });
    effect(() => {
      const trigger = this.count2() === 0 ? 'effect(2) inicial' : 'effect(2) corrió';
      this.addConditionalCountRecomputation(trigger, this.count2(), false);
      // eslint-disable-next-line no-console -- demo didactica: refleja el console.log mostrado en pantalla
      console.log(`The current count is: ${this.count2()}`);
    });
  }
  lines = computed<CodeLine[]>(() => [
    { line: 'count = signal(0);', active: false },
    { line: 'count2 = signal(0);', active: false },
    { line: 'effect(() => {', active: false },
    {
      line: '  console.log(`The current count is: ${count()}`);',
      active: true,
    },
    { line: '});', active: false },
    { line: 'effect(() => {', active: false },
    {
      line: '  console.log(`The current count is: ${count2()}`);',
      active: true,
    },
    { line: '});', active: false },
  ]);
  upCount() {
    this.count.update((currentCount: number) => currentCount + 1);
  }
  upCount2() {
    this.count2.update((currentCount: number) => currentCount + 1);
  }
  addConditionalCountRecomputation(
    trigger: string,
    newState: number | string,
    isCountIncrement: boolean,
  ) {
    this.appEventHistory.update((prevHistory) => {
      const newHistory = prevHistory.length ? [...prevHistory] : [];
      newHistory.push({
        date: new Date(),
        trigger,
        newState,
        isCountIncrement,
      });
      return newHistory;
    });
  }
}
