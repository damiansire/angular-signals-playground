import { CommonModule } from '@angular/common';
import { Component, computed, input, ChangeDetectionStrategy } from '@angular/core';
import { ClickInButton } from '../component.interface';

@Component({
  selector: 'app-computed-tracker',
  imports: [CommonModule],
  templateUrl: './computed-tracker.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  styleUrl: './computed-tracker.component.css',
})
export class ComputedTrackerComponent {
  readonly title = input('Calculated Signals');
  readonly computedTracker = input<ClickInButton[]>([]);
  /** Una copia: `reverse()` da vuelta el array en el lugar, y ese array es del padre. */
  protected readonly recientes = computed(() => [...this.computedTracker()].reverse());
}
