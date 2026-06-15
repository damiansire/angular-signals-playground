import { Component, EventEmitter, Output, effect, signal, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
    selector: 'app-destroy-box',
    templateUrl: './destroy-box.component.html',
    styleUrl: './destroy-box.component.css',
    changeDetection: ChangeDetectionStrategy.Eager,
    imports: [CommonModule]
})
export class DestroyBoxComponent {
  @Output() autoRefreshEvent = new EventEmitter<boolean>();
  @Output() newIntervalOutput = new EventEmitter<Date>();
  currentTime = new Date();
  autoRefresh = signal(false);
  intervalSave: any;
  constructor() {
    effect(() => {
      if (this.autoRefresh()) {
        this.intervalSave = setInterval(() => {
          this.currentTime = new Date();
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
