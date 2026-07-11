import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  ElementRef,
  afterNextRender,
  inject,
} from '@angular/core';
import { RouterLink } from '@angular/router';
import { WritableSignalsComponent } from '../signals/level-1-interaction-with-signals/sub-levels/1-writable-signals/writable-signals.component';
import { ComputedSignalsComponent } from '../signals/level-2-computed-signals/sub-levels/1-computed-signals/computed-signals.component';

/**
 * POC (opción 2): recorrido continuo donde el scroll te mete adentro del
 * contenido REAL del nivel, sin click. Alterna "map beats" (los nodos que se
 * acumulan: 0, luego 0 y 1, luego 0 1 2) con "slabs" que embeben un componente
 * de nivel de verdad. Es una prueba de sensación con 2 conceptos, no el final.
 */
@Component({
  selector: 'app-poc',
  imports: [RouterLink, WritableSignalsComponent, ComputedSignalsComponent],
  templateUrl: './poc.component.html',
  styleUrl: './poc.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PocComponent {
  private readonly host = inject(ElementRef<HTMLElement>).nativeElement as HTMLElement;
  private readonly destroyRef = inject(DestroyRef);

  constructor() {
    afterNextRender(() => {
      const io = new IntersectionObserver(
        (entries) => {
          for (const e of entries) {
            if (e.isIntersecting) e.target.classList.add('in');
          }
        },
        { root: this.host, threshold: 0.35 },
      );
      this.host.querySelectorAll('.beat, .slab').forEach((el) => io.observe(el));
      this.destroyRef.onDestroy(() => io.disconnect());
    });
  }
}
