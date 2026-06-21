import { ComponentFixture, TestBed } from '@angular/core/testing';
import { signal, provideZonelessChangeDetection } from '@angular/core';

import { EventHistoryComponent } from './event-history.component';
import { HistoryElement } from '../component.interface';

describe('EventHistoryComponent', () => {
  let component: EventHistoryComponent;
  let fixture: ComponentFixture<EventHistoryComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EventHistoryComponent],
      providers: [provideZonelessChangeDetection()]
    })
    .compileComponents();

    fixture = TestBed.createComponent(EventHistoryComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('beforeNumber devuelve el valor menos uno', () => {
    expect(component.beforeNumber(5)).toBe(4);
    expect(component.beforeNumber('10')).toBe(9);
  });

  it('refleja el input title en el h2', () => {
    fixture.componentRef.setInput('title', 'Historial de eventos');
    fixture.detectChanges();
    const h2 = fixture.nativeElement.querySelector('h2') as HTMLElement;
    expect(h2.textContent?.trim()).toBe('Historial de eventos');
  });

  it('renderiza un item por cada elemento del historial mostrando stateName y trigger', () => {
    const history: HistoryElement[] = [
      { date: new Date(), trigger: 'set', newState: 1, isCountIncrement: false },
      { date: new Date(), trigger: 'update', newState: 2, isCountIncrement: false },
    ];
    fixture.componentRef.setInput('stateName', 'Counter');
    fixture.componentRef.setInput('history', signal(history));
    fixture.detectChanges();

    const triggers = fixture.nativeElement.querySelectorAll('h3');
    expect(triggers.length).toBe(2);
    const text = (fixture.nativeElement as HTMLElement).textContent ?? '';
    expect(text).toContain('Counter');
    expect(text).toContain('set');
    expect(text).toContain('update');
  });
});
