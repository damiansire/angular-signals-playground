import { CommonModule } from '@angular/common';
import { Component, output, effect, input, signal, ChangeDetectionStrategy } from '@angular/core';
import { RelojesDelHijo } from '../../../relojes-del-hijo';

@Component({
  selector: 'app-component-destroy',
  imports: [CommonModule],
  templateUrl: './component-destroy.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  styleUrl: './component-destroy.component.css',
})
export class ComponentDestroyComponent {
  /** Del padre, igual que en 3/2: así la única diferencia entre los dos hijos es el onCleanup. */
  readonly relojes = input.required<RelojesDelHijo>();
  readonly autoRefreshEvent = output<boolean>();
  currentTime = signal(new Date());
  autoRefresh = signal(false);
  intervalSave: ReturnType<typeof setInterval> | undefined;
  constructor() {
    effect((onCleanup) => {
      if (this.autoRefresh()) {
        this.intervalSave = setInterval(() => this.latir(), 1000);
        this.relojes().registrar(this.intervalSave);
        // Es la lección del onCleanup idiomático: corre al re-evaluar el effect (apagar el
        // intervalo) Y cuando el effect muere con el componente, que es justo el caso que la rama
        // else de 3/2 nunca alcanza. Por eso acá destruirlo sí frena los latidos.
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

  private latir() {
    const ahora = new Date();
    this.currentTime.set(ahora);
    this.relojes().latir(ahora);
  }
}
