import { Component, computed, effect, signal, ChangeDetectionStrategy } from '@angular/core';
import { ComponentDestroyComponent } from './component-destroy/component-destroy.component';
import { CodeLine } from '../../../../components-atom/component-atom.interface';
import { HistoryElement } from '../../../../components/component.interface';
import { EventHistoryComponent } from '../../../../components/event-history/event-history.component';
import { ConceptCardComponent } from '../../../../components-atom/concept-card/concept-card.component';

@Component({
    selector: 'app-effect-destroy',
    templateUrl: './effect-destroy.component.html',
    styleUrl: './effect-destroy.component.css',
    changeDetection: ChangeDetectionStrategy.OnPush,
    imports: [ComponentDestroyComponent, EventHistoryComponent, ConceptCardComponent]
})
export class EffectDestroyComponent {
  autoRefresh = signal(false);
  appEventHistory = signal<HistoryElement[]>([]);
  count = signal(0);
  lines = computed<CodeLine[]>(() => [
    { line: 'effect(() => {', active: false },
    { line: '  if (this.autoRefresh()) {', active: this.autoRefresh() },
    { line: '    this.intervalSave = setInterval(() => {', active: this.autoRefresh() },
    { line: '      this.count.update((x) => x + 1);', active: this.autoRefresh() },
    { line: '      this.addToHistory(this.count());', active: this.autoRefresh() },
    { line: '    }, 1000);', active: this.autoRefresh() },
    { line: '  } else {', active: !this.autoRefresh() },
    { line: '    clearInterval(this.intervalSave);', active: !this.autoRefresh() },
    { line: '  }', active: false },
    { line: '});', active: false },
    { line: '', active: false },
    { line: 'destroy() {', active: false },
    { line: '  this.showComponent = false;', active: false },
    { line: '  clearInterval(this.intervalSave); // limpieza -> se detiene', active: true },
    { line: '}', active: false },
  ]);
  intervalSave: ReturnType<typeof setInterval> | undefined;

  constructor() {
    effect(() => {
      if (this.autoRefresh()) {
        this.intervalSave = setInterval(() => {
          this.count.update((x) => x + 1);
          const event = new Date();
          this.addConditionalCountRecomputation(
            this.getFormattedTime(event),
            this.count(),
            true
          );
        }, 1000);
      } else {
        clearInterval(this.intervalSave);
      }
    });
  }
  showComponent = true;
  destroy() {
    this.showComponent = false;
    clearInterval(this.intervalSave);
  }
  setAutoRefresh(event: boolean) {
    this.autoRefresh.set(event);
  }
  addConditionalCountRecomputation(
    trigger: string,
    newState: number | string,
    isCountIncrement: boolean
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
  getFormattedTime(date: Date) {
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    const seconds = String(date.getSeconds()).padStart(2, '0');

    return `${hours}:${minutes}:${seconds}`;
  }
}
