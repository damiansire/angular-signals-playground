import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Output, effect, signal, ChangeDetectionStrategy } from '@angular/core';

@Component({
    selector: 'app-component-destroy',
    imports: [CommonModule],
    templateUrl: './component-destroy.component.html',
    changeDetection: ChangeDetectionStrategy.Eager,
    styleUrl: './component-destroy.component.css'
})
export class ComponentDestroyComponent {
  @Output() autoRefreshEvent = new EventEmitter<boolean>();
  @Output() newIntervalOutput = new EventEmitter<Date>();
  currentTime = new Date();
  autoRefresh = signal(false);
  count = signal(0);
  intervalSave: any;
  constructor() {
    effect(() => {
      if (this.autoRefresh()) {
        this.intervalSave = setInterval(() => {
          this.currentTime = new Date();
          this.count.update((x) => x + 1);
          this.newIntervalOutput.emit(this.currentTime);
        }, 1000);
      } else {
        clearInterval(this.intervalSave);
      }
    });
  }

  refreshTime() {
    this.currentTime = new Date();
  }
  toggleAutoRefresh() {
    this.autoRefreshEvent.emit(!this.autoRefresh());
    this.autoRefresh.set(!this.autoRefresh());
  }
}
