import { Component, Input, Signal, signal, ChangeDetectionStrategy } from '@angular/core';
import { HistoryElement } from '../component.interface';


@Component({
    selector: 'app-event-history',
    imports: [],
    templateUrl: './event-history.component.html',
    changeDetection: ChangeDetectionStrategy.Eager,
    styleUrl: './event-history.component.css'
})
export class EventHistoryComponent {
  @Input() title = 'text';
  @Input() stateName = 'Count';
  @Input() history: Signal<HistoryElement[]> = signal([]);
  beforeNumber(value: string | number): number {
    return Number(value) - 1;
  }
}
