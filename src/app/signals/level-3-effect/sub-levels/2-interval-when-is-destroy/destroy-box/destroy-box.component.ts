import { Component, output, effect, signal, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
    selector: 'app-destroy-box',
    templateUrl: './destroy-box.component.html',
    styleUrl: './destroy-box.component.css',
    changeDetection: ChangeDetectionStrategy.OnPush,
    imports: [CommonModule]
})
export class DestroyBoxComponent {
  readonly autoRefreshEvent = output<boolean>();
  readonly newIntervalOutput = output<Date>();
  currentTime = signal(new Date());
  autoRefresh = signal(false);
  intervalSave: ReturnType<typeof setInterval> | undefined;
  constructor() {
    effect(() => {
      if (this.autoRefresh()) {
        this.intervalSave = setInterval(() => {
          const now = new Date();
          this.currentTime.set(now);
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
