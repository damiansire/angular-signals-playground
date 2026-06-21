import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';

import { EventComponent } from './event.component';

describe('EventComponent', () => {
  let component: EventComponent;
  let fixture: ComponentFixture<EventComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EventComponent],
      providers: [provideZonelessChangeDetection()]
    })
    .compileComponents();

    fixture = TestBed.createComponent(EventComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('muestra firstName y surname del evento en mayusculas via css uppercase', () => {
    fixture.componentRef.setInput('event', {
      date: new Date('2024-01-01T10:20:30'),
      firstName: 'Ada',
      surname: 'Lovelace',
    });
    fixture.detectChanges();

    const name = fixture.nativeElement.querySelector('.uppercase') as HTMLElement;
    expect(name.textContent?.trim()).toBe('Ada Lovelace');
  });

  it('formatea la fecha del evento como HH:mm:ss', () => {
    fixture.componentRef.setInput('event', {
      date: new Date('2024-01-01T10:20:30'),
      firstName: 'X',
      surname: 'Y',
    });
    fixture.detectChanges();

    const text = (fixture.nativeElement as HTMLElement).textContent ?? '';
    expect(text).toContain('10:20:30');
  });

  it('renderiza el icono de click', () => {
    const icon = fixture.nativeElement.querySelector('app-click-icon');
    expect(icon).toBeTruthy();
  });
});
