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
  imports: [ComponentDestroyComponent, EventHistoryComponent, ConceptCardComponent],
})
export class EffectDestroyComponent {
  autoRefresh = signal(false);
  appEventHistory = signal<HistoryElement[]>([]);
  count = signal(0);
  lines = computed<CodeLine[]>(() => [
    { line: 'effect((onCleanup) => {', active: false },
    { line: '  if (this.autoRefresh()) {', active: this.autoRefresh() },
    { line: '    this.intervalSave = setInterval(() => {', active: this.autoRefresh() },
    { line: '      this.count.update((x) => x + 1);', active: this.autoRefresh() },
    { line: '      this.addToHistory(this.count());', active: this.autoRefresh() },
    { line: '    }, 1000);', active: this.autoRefresh() },
    {
      line: '    onCleanup(() => clearInterval(this.intervalSave)); // limpieza idiomatica',
      active: this.autoRefresh(),
    },
    { line: '  }', active: false },
    { line: '});', active: false },
  ]);
  intervalSave: ReturnType<typeof setInterval> | undefined;

  constructor() {
    effect((onCleanup) => {
      if (this.autoRefresh()) {
        this.intervalSave = setInterval(() => {
          this.count.update((x) => x + 1);
          const event = new Date();
          this.addConditionalCountRecomputation(this.getFormattedTime(event), this.count(), true);
        }, 1000);
        // onCleanup corre al re-evaluar el effect (autoRefresh -> false) Y al
        // destruirse el componente (navegacion). Asi el setInterval nunca queda
        // huerfano: sin leak aunque se salga por ruta.
        onCleanup(() => clearInterval(this.intervalSave));
      }
    });
  }
  showComponent = true;
  destroy() {
    this.showComponent = false;
    this.autoRefresh.set(false);
  }
  setAutoRefresh(event: boolean) {
    this.autoRefresh.set(event);
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
  getFormattedTime(date: Date) {
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    const seconds = String(date.getSeconds()).padStart(2, '0');

    return `${hours}:${minutes}:${seconds}`;
  }
}
