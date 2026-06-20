import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  DestroyRef,
  OnInit,
  inject,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import {
  NavigationEnd,
  NavigationStart,
  Router,
  RouterModule,
} from '@angular/router';

import { CustomRoute, menuItems } from '../../app.routes';
import { MenuOptionComponent } from './components/menu-option/menu-option.component';
import { MenuSubLevelOptionComponent } from './components/menu-sub-level-option/menu-sub-level-option.component';
import { MenuSeparatorComponent } from './components/menu-separator/menu-separator.component';
import { LevelState } from '../component.interface';

interface CurrentLevel {
  level: string;
  subLevel: string | null;
}

interface Level {
  state: LevelState;
  subLevels: LevelHistory;
}

type LevelHistory = Record<string, Level>;

class HandlerLevelStatus {
  levelHistory: LevelHistory = {};
  currentLevel: CurrentLevel = { level: '1', subLevel: null };
  constructor(menuItems: CustomRoute[]) {
    this.setLevelHistory(menuItems);
  }
  getLevelStatus(level: string, subLevel: string | undefined): LevelState {
    if (subLevel === undefined) {
      return this.levelHistory[level].state;
    }
    return this.levelHistory[level].subLevels[subLevel].state;
  }
  setCurrentLevel(level: string, subLevel: string) {
    this.currentLevel = { level, subLevel };
    this.setLevelState(level, undefined, 'current');
    this.setLevelState(level, subLevel, 'current');
  }

  isPartOfCurrentLevel(level: string) {
    return this.currentLevel.level === level;
  }
  setLevelState(
    level: string,
    subLevel: string | undefined,
    state: LevelState
  ) {
    const isInvalidLevel = this.levelHistory[level] === undefined;
    const isInvalidSubLevel =
      subLevel !== undefined &&
      this.levelHistory[level].subLevels[subLevel].state;
    if (isInvalidLevel && isInvalidSubLevel) {
      throw Error(`[${level},${subLevel}] Is invalidad level`);
    }
    if (subLevel === undefined) {
      this.levelHistory[level].state = state;
    } else {
      this.levelHistory[level].subLevels[subLevel].state = state;
    }
  }
  leaveLevel(level: string, subLevel: string) {
    if (subLevel != undefined) {
      this.setLevelState(level, subLevel, 'win');
    }
    const isCompleteLevel = Object.values(
      this.levelHistory[level].subLevels
    ).every((x) => x.state === 'win');
    if (isCompleteLevel) {
      this.setLevelState(level, undefined, 'win');
    } else {
      this.setLevelState(level, undefined, 'pending');
    }
  }
  private setLevelHistory(menuItems: CustomRoute[]) {
    for (const levelItem of menuItems) {
      this.createLevel(levelItem.id, null);
      for (const subLevelItem of levelItem.subLevels) {
        this.createLevel(levelItem.id, subLevelItem.id);
      }
    }
  }
  private createLevel(levelId: string, sublevelId: string | null) {
    if (this.levelHistory[levelId] === undefined) {
      this.levelHistory[levelId] = {
        state: 'pending',
        subLevels: {},
      };
    }
    if (sublevelId) {
      this.levelHistory[levelId].subLevels[sublevelId] = {
        state: 'pending',
        subLevels: {},
      };
    }
  }
}

@Component({
    selector: 'app-sidebar-menu',
    imports: [
    RouterModule,
    MenuOptionComponent,
    MenuSubLevelOptionComponent,
    MenuSeparatorComponent
],
    templateUrl: './sidebar-menu.component.html',
    changeDetection: ChangeDetectionStrategy.OnPush,
    styleUrl: './sidebar-menu.component.css'
})
export class SidebarMenuComponent implements OnInit {
  private router = inject(Router);
  private cdr = inject(ChangeDetectorRef);
  private destroyRef = inject(DestroyRef);
  menuItems: CustomRoute[] = menuItems;
  levelHandler = new HandlerLevelStatus(this.menuItems);
  ngOnInit() {
    this.router.events
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((event) => {
        if (event instanceof NavigationStart) {
          const currentUrl = this.router.url;
          const routePart = currentUrl.split('/');
          // Solo el árbol de niveles tiene estado; ignorar rutas externas (ej. /lab)
          if (routePart[1] === 'signals') {
            this.levelHandler.leaveLevel(routePart[3], routePart[5]);
          }
        }
        if (event instanceof NavigationEnd) {
          let finalUrl = event.url;
          if (event.urlAfterRedirects != event.url) {
            finalUrl = event.urlAfterRedirects;
          }
          const routePart = finalUrl.split('/');
          if (routePart[1] === 'signals') {
            this.levelHandler.setCurrentLevel(routePart[3], routePart[5]);
          }
        }
        // El estado vive en un objeto mutable (no signal); avisamos a OnPush.
        this.cdr.markForCheck();
      });
  }
  getMenuOptionStatus(level: string, subLevel: string | undefined) {
    return this.levelHandler.getLevelStatus(level, subLevel);
  }
  showSubMenu(menuId: string) {
    return this.levelHandler.isPartOfCurrentLevel(menuId);
  }
}
