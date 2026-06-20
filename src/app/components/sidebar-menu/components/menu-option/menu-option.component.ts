import { Component, input, ChangeDetectionStrategy } from '@angular/core';
import { CustomRoute } from '../../../../app.routes';
import { RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { LevelState } from '../../../component.interface';

@Component({
    selector: 'app-menu-option',
    imports: [RouterModule, CommonModule],
    templateUrl: './menu-option.component.html',
    changeDetection: ChangeDetectionStrategy.OnPush,
    styleUrl: './menu-option.component.css'
})
export class MenuOptionComponent {
  readonly menuItem = input.required<CustomRoute>();
  readonly levelState = input<LevelState>('pending');
  getLink(menuItemPath: string) {
    return `${menuItemPath}/sub-level/1`;
  }
}
