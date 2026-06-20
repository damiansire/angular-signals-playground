import { Component, input, ChangeDetectionStrategy } from '@angular/core';
import { ClickInButton } from '../component.interface';
import { CommonModule } from '@angular/common';
import { SvgComponent } from '../../../icons/click.component';

@Component({
    selector: 'app-event',
    templateUrl: './event.component.html',
    styleUrl: './event.component.css',
    changeDetection: ChangeDetectionStrategy.OnPush,
    imports: [CommonModule, SvgComponent]
})
export class EventComponent {
  readonly event = input<ClickInButton>({
    date: new Date(),
    firstName: '',
    surname: '',
  });
}
