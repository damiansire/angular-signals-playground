import { CommonModule } from '@angular/common';
import { Component, Input, ChangeDetectionStrategy } from '@angular/core';
import { ClickInButton } from '../component.interface';

@Component({
    selector: 'app-computed-tracker',
    imports: [CommonModule],
    templateUrl: './computed-tracker.component.html',
    changeDetection: ChangeDetectionStrategy.Eager,
    styleUrl: './computed-tracker.component.css'
})
export class ComputedTrackerComponent {
  @Input() title: string = 'Calculated Signals';
  @Input() computedTracker: ClickInButton[] = [];
}
