import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MenuSubLevelOptionComponent } from './menu-sub-level-option.component';
import { provideRouter } from '@angular/router';

describe('MenuSubLevelOptionComponent', () => {
  let component: MenuSubLevelOptionComponent;
  let fixture: ComponentFixture<MenuSubLevelOptionComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MenuSubLevelOptionComponent],
      providers: [provideRouter([])],
    }).compileComponents();

    fixture = TestBed.createComponent(MenuSubLevelOptionComponent);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('item', {
      path: '',
      component: undefined,
      id: '',
      subLevels: [],
    });
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
