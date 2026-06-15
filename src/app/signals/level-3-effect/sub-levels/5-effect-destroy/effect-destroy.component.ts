import { Component, computed, effect, signal, ChangeDetectionStrategy } from '@angular/core';
import { ComponentDestroyComponent } from './component-destroy/component-destroy.component';
import { CodeLine } from '../../../../components-atom/component-atom.interface';
import { HistoryElement } from '../../../../components/component.interface';
import { EventHistoryComponent } from '../../../../components/event-history/event-history.component';

@Component({
    selector: 'app-effect-destroy',
    templateUrl: './effect-destroy.component.html',
    styleUrl: './effect-destroy.component.css',
    changeDetection: ChangeDetectionStrategy.Eager,
    imports: [ComponentDestroyComponent, EventHistoryComponent]
})
export class EffectDestroyComponent {
  autoRefresh = signal(false);
  appEventHistory = signal<HistoryElement[]>([]);
  count = signal(0);
  lines = computed<CodeLine[]>(() => [
    {
      line: 'constructor() {',
      active: false,
    },
    {
      line: '  effect(() => {',
      active: false,
    },
    {
      line: '    if (this.autoRefresh()) {',
      active: this.autoRefresh(),
    },
    {
      line: '      this.intervalSave = setInterval(() => {',
      active: this.autoRefresh(),
    },
    {
      line: '        this.currentTime = new Date();',
      active: this.autoRefresh(),
    },
    {
      line: '        console.log("Estoy aca");',
      active: this.autoRefresh(),
    },
    {
      line: '      }, 1000);',
      active: this.autoRefresh(),
    },
    {
      line: '    } else {',
      active: !this.autoRefresh(),
    },
    {
      line: '      clearInterval(this.intervalSave);',
      active: !this.autoRefresh(),
    },
    {
      line: '    }',
      active: false,
    },
    {
      line: '  });',
      active: false,
    },
    {
      line: '}',
      active: false,
    },
  ]);
  intervalSave: any;

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
  newIntervalOutput(event: Date) {
    this.addConditionalCountRecomputation(
      'interval',
      this.getFormattedTime(event),
      false
    );
  }
}
