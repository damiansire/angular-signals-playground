import { Component, input, ChangeDetectionStrategy } from '@angular/core';
import { ClickInButton } from '../component.interface';

import { EventComponent } from '../event/event.component';

@Component({
    selector: 'app-click-history',
    templateUrl: './click-history.component.html',
    styleUrl: './click-history.component.css',
    changeDetection: ChangeDetectionStrategy.OnPush,
    imports: [EventComponent]
})
export class ClickHistoryComponent {
  readonly clickHistory = input<ClickInButton[]>([]);
}
