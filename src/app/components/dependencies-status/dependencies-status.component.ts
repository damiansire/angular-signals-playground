import { Component, Input, Signal, signal, ChangeDetectionStrategy } from '@angular/core';

@Component({
    selector: 'app-dependencies-status',
    imports: [],
    templateUrl: './dependencies-status.component.html',
    changeDetection: ChangeDetectionStrategy.Eager,
    styleUrl: './dependencies-status.component.css'
})
export class DependenciesStatusComponent {
  @Input() dependencies: Signal<string[]> = signal([]);
  @Input() signalsInside: Signal<string[]> = signal([]);
  @Input() computedName: string = '';
}
