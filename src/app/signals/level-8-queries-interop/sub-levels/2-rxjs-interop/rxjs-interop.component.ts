import { Component, ChangeDetectionStrategy, computed, signal, untracked } from '@angular/core';
import { toObservable, toSignal } from '@angular/core/rxjs-interop';
import { interval, map, scan } from 'rxjs';
import { CodeLine } from '../../../../components-atom/component-atom.interface';
import { ColumnAndCodeLayoutComponent } from '../../../../layouts/column-and-code-layout/column-and-code-layout.component';

@Component({
  selector: 'app-rxjs-interop',
  templateUrl: './rxjs-interop.component.html',
  styleUrl: './rxjs-interop.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ColumnAndCodeLayoutComponent],
})
export class RxjsInteropComponent {
  // Observable -> signal: un cronómetro de RxJS leído como signal.
  readonly seconds = toSignal(interval(1000).pipe(map((tick) => tick + 1)), { initialValue: 0 });

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
