import { Component, ChangeDetectionStrategy } from '@angular/core';
import { ComputedTrackerComponent } from '../../../../components/computed-tracker/computed-tracker.component';
import { ClickInButton } from '../../../../components/component.interface';
import { BasicFormComponent } from '../../../../components/basic-form/basic-form.component';
import { ClickHistoryComponent } from '../../../../components/click-history/click-history.component';

@Component({
    selector: 'app-computed-signals-lazily-evaluated-memoized',
    templateUrl: './computed-signals-lazily-evaluated-memoized.component.html',
    styleUrl: './computed-signals-lazily-evaluated-memoized.component.css',
    changeDetection: ChangeDetectionStrategy.Eager,
    imports: [
        ComputedTrackerComponent,
        BasicFormComponent,
        ClickHistoryComponent,
    ]
})
export class ComputedSignalsLazilyEvaluatedMemoizedComponent {
  computedTracker: ClickInButton[] = [];
  clickHistory: ClickInButton[] = [];

  addComputedSignal(data: ClickInButton) {
    this.computedTracker.push(data);
  }

  addClickToHistory(event: ClickInButton) {
    this.clickHistory.push(event);
  }
}
