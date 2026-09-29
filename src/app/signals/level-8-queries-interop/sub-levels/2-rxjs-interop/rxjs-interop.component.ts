import {
  Component,
  ChangeDetectionStrategy,
  ElementRef,
  computed,
  inject,
  signal,
  untracked,
} from '@angular/core';
import { toObservable, toSignal } from '@angular/core/rxjs-interop';
import { filter, interval, scan } from 'rxjs';
import { CodeLine } from '../../../../components-atom/component-atom.interface';
import { ColumnAndCodeLayoutComponent } from '../../../../layouts/column-and-code-layout/column-and-code-layout.component';
import { ManipulableSystemComponent } from '../../../../components-atom/manipulable-system/manipulable-system.component';
import { RXJS_INTEROP_SYSTEM } from '../../queries-systems';

@Component({
  selector: 'app-rxjs-interop',
  templateUrl: './rxjs-interop.component.html',
  styleUrl: './rxjs-interop.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ManipulableSystemComponent, ColumnAndCodeLayoutComponent],
})
export class RxjsInteropComponent {
  readonly closingSystem = RXJS_INTEROP_SYSTEM;
  private readonly host = inject(ElementRef).nativeElement as HTMLElement;
  // Observable -> signal: un cronómetro de RxJS leído como signal.
  //
  // Solo cuenta con el capítulo activo: la vista integrada pre-monta las 12 cards y marca `inert` la
  // que no se ve, así que sin el filtro el cronómetro corre desde que carga la página. Se cuentan los
  // ticks que pasaron el filtro (`scan`) y no el índice de `interval`: al volver al capítulo sigue
  // desde donde quedó en vez de saltar de golpe. La pausa del recorrido (`.fondo-en-pausa`) NO lo
  // frena: el conteo es la lección, no vida de fondo.
  readonly seconds = toSignal(
    interval(1000).pipe(
      filter(() => !this.host.closest('[inert]')),
      scan((total) => total + 1, 0),
    ),
    { initialValue: 0 },
  );

  // signal -> observable -> signal: contamos cuántas veces cambió `count`.
  readonly count = signal(0);
  private readonly count$ = toObservable(this.count);
  readonly emissions = toSignal(this.count$.pipe(scan((total) => total + 1, 0)), {
    initialValue: 0,
  });

  // untracked(): `result` depende de `base` pero NO de `multiplier`.
  readonly base = signal(10);
  readonly multiplier = signal(2);
  readonly result = computed(() => this.base() * untracked(() => this.multiplier()));

  incCount() {
    this.count.update((value) => value + 1);
  }

  incBase() {
    this.base.update((value) => value + 1);
  }

  incMultiplier() {
    this.multiplier.update((value) => value + 1);
  }

  readonly lines = computed<CodeLine[]>(() => [
    { line: 'seconds = toSignal(interval(1000), ...);', active: false },
    { line: '', active: false },
    { line: 'count$ = toObservable(this.count);', active: false },
    { line: '', active: false },
    { line: 'result = computed(() =>', active: true },
    { line: '  this.base() * untracked(() => this.multiplier())', active: true },
    { line: ');', active: true },
  ]);
}
