import { Component, output, effect, input, signal, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RelojesDelHijo } from '../../../relojes-del-hijo';

@Component({
  selector: 'app-destroy-box',
  templateUrl: './destroy-box.component.html',
  styleUrl: './destroy-box.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule],
})
export class DestroyBoxComponent {
  /** Del padre: el intervalo late ahí y no por un output, que muere con este componente. */
  readonly relojes = input.required<RelojesDelHijo>();
  readonly autoRefreshEvent = output<boolean>();
  currentTime = signal(new Date());
  autoRefresh = signal(false);
  intervalSave: ReturnType<typeof setInterval> | undefined;
  constructor() {
    effect(() => {
      if (this.autoRefresh()) {
        this.intervalSave = setInterval(() => this.latir(), 1000);
        this.relojes().registrar(this.intervalSave);
      } else {
        // Esta rama solo corre si el effect RE-corre. Al destruirse el componente el effect muere
        // sin volver a correr, así que el intervalo queda vivo: es el leak que enseña 3/2.
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

  private latir() {
    const ahora = new Date();
    this.currentTime.set(ahora);
    this.relojes().latir(ahora);
  }
}
