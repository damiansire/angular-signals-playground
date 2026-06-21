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
      path: 'signals/level/1/sub-level/2',
      component: undefined,
      id: '2',
      subLevels: [],
    });
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('muestra el id del item en el li', () => {
    const li = fixture.nativeElement.querySelector('li') as HTMLElement;
    expect(li.textContent?.trim()).toBe('2');
  });

  it('aplica pending por defecto y refleja win/current segun levelState', () => {
    const li = fixture.nativeElement.querySelector('li') as HTMLElement;
    expect(li.classList).toContain('bg-gray-700');

    fixture.componentRef.setInput('levelState', 'win');
    fixture.detectChanges();
    expect(li.classList).toContain('bg-green-600');

    fixture.componentRef.setInput('levelState', 'current');
    fixture.detectChanges();
    expect(li.classList).toContain('bg-orange-500');
  });
});
