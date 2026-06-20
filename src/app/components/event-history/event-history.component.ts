import { Component, input, Signal, signal, ChangeDetectionStrategy } from '@angular/core';
import { HistoryElement } from '../component.interface';


@Component({
    selector: 'app-event-history',
    imports: [],
    templateUrl: './event-history.component.html',
    changeDetection: ChangeDetectionStrategy.OnPush,
    styleUrl: './event-history.component.css'
})
export class EventHistoryComponent {
  readonly title = input('text');
  readonly stateName = input('Count');
  readonly history = input<Signal<HistoryElement[]>>(signal([]));
  beforeNumber(value: string | number): number {
    return Number(value) - 1;
  }
}
