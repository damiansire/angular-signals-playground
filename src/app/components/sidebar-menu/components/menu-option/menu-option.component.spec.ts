import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';

import { MenuOptionComponent } from './menu-option.component';
import { provideRouter } from '@angular/router';

describe('MenuOptionComponent', () => {
  let component: MenuOptionComponent;
  let fixture: ComponentFixture<MenuOptionComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MenuOptionComponent],
      providers: [provideZonelessChangeDetection(), provideRouter([])],
    }).compileComponents();

    fixture = TestBed.createComponent(MenuOptionComponent);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('menuItem', {
      path: 'signals/level/1',
      component: undefined,
      id: '7',
      subLevels: [],
    });
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('muestra el id del menuItem en el span', () => {
    const span = fixture.nativeElement.querySelector('span') as HTMLElement;
    expect(span.textContent?.trim()).toBe('7');
  });

  it('getLink agrega el sufijo /sub-level/1 al path', () => {
    expect(component.getLink('signals/level/3')).toBe('signals/level/3/sub-level/1');
  });

  it('aplica la clase de estado pending por defecto', () => {
    const link = fixture.nativeElement.querySelector('a') as HTMLElement;
    expect(link.classList).toContain('bg-gray-700');
    expect(link.classList).not.toContain('bg-green-600');
  });

  it('refleja levelState win y current en las clases', () => {
    fixture.componentRef.setInput('levelState', 'win');
    fixture.detectChanges();
    const link = fixture.nativeElement.querySelector('a') as HTMLElement;
    expect(link.classList).toContain('bg-green-600');

    fixture.componentRef.setInput('levelState', 'current');
    fixture.detectChanges();
    expect(link.classList).toContain('bg-orange-500');
    expect(link.classList).not.toContain('bg-green-600');
  });

  it('expone un control accesible por teclado con nombre y aria-current', () => {
    const link = fixture.nativeElement.querySelector('a') as HTMLAnchorElement;
    expect(link).toBeTruthy();
    expect(link.getAttribute('aria-label')).toBe('Nivel 7');
    expect(link.getAttribute('href')).toContain('signals/level/1/sub-level/1');
    expect(link.getAttribute('aria-current')).toBeNull();

    fixture.componentRef.setInput('levelState', 'current');
    fixture.detectChanges();
    expect(link.getAttribute('aria-current')).toBe('page');
  });
});
