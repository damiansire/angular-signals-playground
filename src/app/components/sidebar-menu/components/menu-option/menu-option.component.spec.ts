import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MenuOptionComponent } from './menu-option.component';
import { provideRouter } from '@angular/router';

describe('MenuOptionComponent', () => {
  let component: MenuOptionComponent;
  let fixture: ComponentFixture<MenuOptionComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MenuOptionComponent],
      providers: [provideRouter([])],
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
    const li = fixture.nativeElement.querySelector('li') as HTMLElement;
    expect(li.classList).toContain('bg-gray-700');
    expect(li.classList).not.toContain('bg-green-600');
  });

  it('refleja levelState win y current en las clases', () => {
    fixture.componentRef.setInput('levelState', 'win');
    fixture.detectChanges();
    const li = fixture.nativeElement.querySelector('li') as HTMLElement;
    expect(li.classList).toContain('bg-green-600');

    fixture.componentRef.setInput('levelState', 'current');
    fixture.detectChanges();
    expect(li.classList).toContain('bg-orange-500');
    expect(li.classList).not.toContain('bg-green-600');
  });
});
