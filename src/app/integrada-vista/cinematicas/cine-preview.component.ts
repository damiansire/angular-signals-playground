import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { map } from 'rxjs';

import { CinematicaComponent } from './cinematica.component';
import { CAPITULO_FINAL } from './cinematica-guion';
import { CINEMATICAS, cinematicaDe } from './cinematicas-datos';

/**
 * Sala de proyección: reproduce la cinemática de un capítulo sin tener que recorrer el juego hasta
 * ahí (`/cine/6`, `/cine/12?completo=0` para la variante incompleta del final, y `?cuadro=<beat>`
 * para congelar un fotograma). Sirve para escribir y revisar escenas, y no toca la partida
 * guardada: mirar acá no marca nada como visto.
 */
@Component({
  selector: 'app-cine-preview',
  imports: [CinematicaComponent, RouterLink],
  template: `
    @if (cine(); as c) {
      @if (jugando()) {
        <app-cinematica
          [cinematica]="c"
          [completo]="completo()"
          [fotograma]="cuadro()"
          [establecidos]="establecidos()"
          (termino)="jugando.set(false)"
        />
      }
    }
    <main class="sala">
      <h1 class="sala__titulo">
        {{ cine() ? 'Capítulo ' + cine()!.capitulo + ' · ' + cine()!.titulo : 'No hay cinemática' }}
      </h1>
      <button class="sala__repetir" type="button" (click)="jugando.set(true)" [disabled]="!cine()">
        ▶ Reproducir
      </button>
      <nav class="sala__capitulos" aria-label="Capítulos">
        @for (c of capitulos; track c) {
          <a [routerLink]="['/cine', c]" [class.actual]="c === numero()">{{
            c === final ? 'Final' : c
          }}</a>
        }
      </nav>
    </main>
  `,
  styles: `
    .sala {
      min-height: 100vh;
      display: grid;
      place-content: center;
      justify-items: center;
      gap: 18px;
      background: #f5f0e2;
      color: #201d16;
      font-family: system-ui, sans-serif;
    }
    .sala__titulo {
      margin: 0;
      font:
        500 26px/1.2 Georgia,
        serif;
    }
    .sala__repetir,
    .sala__capitulos a {
      padding: 8px 14px;
      border-radius: 999px;
      border: 1px solid #d3cab6;
      background: #fffdf6;
      color: #2d281f;
      text-decoration: none;
      cursor: pointer;
    }
    .sala__capitulos {
      display: flex;
      flex-wrap: wrap;
      justify-content: center;
      gap: 8px;
    }
    .sala__capitulos a.actual {
      background: #201d16;
      color: #fff;
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CinePreviewComponent {
  private readonly ruta = inject(ActivatedRoute);

  protected readonly final = CAPITULO_FINAL;
  protected readonly capitulos = CINEMATICAS.map((c) => c.capitulo).sort((a, b) => a - b);
  protected readonly numero = toSignal(
    this.ruta.paramMap.pipe(map((p) => Number(p.get('capitulo')))),
    { initialValue: NaN },
  );
  protected readonly completo = toSignal(
    this.ruta.queryParamMap.pipe(map((q) => q.get('completo') !== '0')),
    { initialValue: true },
  );
  /** `?cuadro=<beat>` congela la escena en ese beat (ver `fotograma` en el reproductor). */
  protected readonly cuadro = toSignal(this.ruta.queryParamMap.pipe(map((q) => q.get('cuadro'))), {
    initialValue: null,
  });
  /**
   * `?est=0,1,4` simula qué capítulos estableció el jugador (para el final). Sin el parámetro: todos
   * en la variante completa, y los pares en la incompleta.
   */
  protected readonly establecidos = toSignal(
    this.ruta.queryParamMap.pipe(
      map((q) => {
        const est = q.get('est');
        if (est !== null) return est.split(',').filter(Boolean).map(Number);
        const todos = Array.from({ length: CAPITULO_FINAL }, (_, i) => i);
        return q.get('completo') === '0' ? todos.filter((i) => i % 2 === 0) : todos;
      }),
    ),
    { initialValue: [] as number[] },
  );
  protected readonly cine = computed(() => cinematicaDe(this.numero()));
  protected readonly jugando = signal(true);
}
