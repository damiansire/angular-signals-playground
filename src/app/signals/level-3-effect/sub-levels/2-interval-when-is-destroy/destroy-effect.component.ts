import { Component, computed, effect, signal, ChangeDetectionStrategy } from '@angular/core';
import { DestroyBoxComponent } from './destroy-box/destroy-box.component';
import { CodeLine } from '../../../../components-atom/component-atom.interface';
import { HistoryElement } from '../../../../components/component.interface';
import { EventHistoryComponent } from '../../../../components/event-history/event-history.component';
import { CodeLegazyComponent } from '../../../../components-atom/code-legazy/code-legazy.component';

@Component({
    selector: 'app-destroy-effect',
    templateUrl: './destroy-effect.component.html',
    styleUrl: './destroy-effect.component.css',
    changeDetection: ChangeDetectionStrategy.Eager,
    imports: [
        DestroyBoxComponent,
        EventHistoryComponent,
        CodeLegazyComponent,
    ]
})
export class DestroyEffectComponent {
  autoRefresh = signal(false);
  appEventHistory = signal<HistoryElement[]>([]);
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
  showComponent = true;

  constructor() {
    effect(() => {
      if (this.autoRefresh()) {
        this.intervalSave = setInterval(() => {
          const event = new Date();
          this.addConditionalCountRecomputation(
            'interval',
            this.getFormattedTime(event),
            false
          );
        }, 1000);
      } else {
        clearInterval(this.intervalSave);
      }
    });
  }

  destroy() {
    this.showComponent = false;
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
