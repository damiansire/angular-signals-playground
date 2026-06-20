import { CommonModule } from '@angular/common';
import { Component, output, effect, signal, ChangeDetectionStrategy } from '@angular/core';

@Component({
    selector: 'app-component-destroy',
    imports: [CommonModule],
    templateUrl: './component-destroy.component.html',
    changeDetection: ChangeDetectionStrategy.OnPush,
    styleUrl: './component-destroy.component.css'
})
export class ComponentDestroyComponent {
  readonly autoRefreshEvent = output<boolean>();
  readonly newIntervalOutput = output<Date>();
  currentTime = signal(new Date());
  autoRefresh = signal(false);
  count = signal(0);
  intervalSave: ReturnType<typeof setInterval> | undefined;
  constructor() {
    effect(() => {
      if (this.autoRefresh()) {
        this.intervalSave = setInterval(() => {
          const now = new Date();
          this.currentTime.set(now);
          this.count.update((x) => x + 1);
          this.newIntervalOutput.emit(now);
        }, 1000);
      } else {
        clearInterval(this.intervalSave);
      }
    });
  }

  refreshTime() {
    this.currentTime.set(new Date());
  }
  toggleAutoRefresh() {
    this.autoRefreshEvent.emit(!this.autoRefresh());
    this.autoRefresh.set(!this.autoRefresh());
  }
}
