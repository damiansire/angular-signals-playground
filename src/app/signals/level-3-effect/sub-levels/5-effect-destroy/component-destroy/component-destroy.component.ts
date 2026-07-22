import { CommonModule } from '@angular/common';
import { Component, output, effect, signal, ChangeDetectionStrategy } from '@angular/core';

@Component({
  selector: 'app-component-destroy',
  imports: [CommonModule],
  templateUrl: './component-destroy.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  styleUrl: './component-destroy.component.css',
})
export class ComponentDestroyComponent {
  readonly autoRefreshEvent = output<boolean>();
  readonly newIntervalOutput = output<Date>();
  currentTime = signal(new Date());
  autoRefresh = signal(false);
  count = signal(0);
  intervalSave: ReturnType<typeof setInterval> | undefined;
  constructor() {
    effect((onCleanup) => {
      if (this.autoRefresh()) {
        this.intervalSave = setInterval(() => {
          const now = new Date();
          this.currentTime.set(now);
          this.count.update((x) => x + 1);
          this.newIntervalOutput.emit(now);
        }, 1000);
        // Es la lección del onCleanup idiomático: se limpia al re-evaluar el effect
        // (autoRefresh -> false) Y al destruirse el componente, así el intervalo no
        // queda huérfano ni siquiera si se sale por navegación.
        onCleanup(() => clearInterval(this.intervalSave));
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
