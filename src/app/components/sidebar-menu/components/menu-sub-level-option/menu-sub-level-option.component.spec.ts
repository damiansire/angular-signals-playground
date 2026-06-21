import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';

import { MenuSubLevelOptionComponent } from './menu-sub-level-option.component';
import { provideRouter } from '@angular/router';

describe('MenuSubLevelOptionComponent', () => {
  let component: MenuSubLevelOptionComponent;
  let fixture: ComponentFixture<MenuSubLevelOptionComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MenuSubLevelOptionComponent],
      providers: [provideZonelessChangeDetection(), provideRouter([])],
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

  it('muestra el id del item en el span', () => {
    const span = fixture.nativeElement.querySelector('span') as HTMLElement;
    expect(span.textContent?.trim()).toBe('2');
  });

  it('aplica pending por defecto y refleja win/current segun levelState', () => {
    const link = fixture.nativeElement.querySelector('a') as HTMLElement;
    expect(link.classList).toContain('bg-gray-700');

    fixture.componentRef.setInput('levelState', 'win');
    fixture.detectChanges();
    expect(link.classList).toContain('bg-green-600');

    fixture.componentRef.setInput('levelState', 'current');
    fixture.detectChanges();
    expect(link.classList).toContain('bg-orange-500');
  });

  it('expone un control accesible por teclado con nombre y aria-current', () => {
    const link = fixture.nativeElement.querySelector('a') as HTMLAnchorElement;
    expect(link).toBeTruthy();
    expect(link.getAttribute('aria-label')).toBe('Sub-nivel 2');
    expect(link.getAttribute('href')).toContain('signals/level/1/sub-level/2');
    expect(link.getAttribute('aria-current')).toBeNull();

    fixture.componentRef.setInput('levelState', 'current');
    fixture.detectChanges();
    expect(link.getAttribute('aria-current')).toBe('page');
  });
});
