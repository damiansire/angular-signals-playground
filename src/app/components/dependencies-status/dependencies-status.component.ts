import { Component, input, Signal, signal, ChangeDetectionStrategy } from '@angular/core';

@Component({
  selector: 'app-dependencies-status',
  imports: [],
  templateUrl: './dependencies-status.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  styleUrl: './dependencies-status.component.css',
})
export class DependenciesStatusComponent {
  readonly dependencies = input<Signal<string[]>>(signal([]));
  readonly signalsInside = input<Signal<string[]>>(signal([]));
  readonly computedName = input('');
}
