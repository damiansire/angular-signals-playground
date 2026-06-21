import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';

import { ComputedTrackerComponent } from './computed-tracker.component';
import { ClickInButton } from '../component.interface';

describe('ComputedTrackerComponent', () => {
  let component: ComputedTrackerComponent;
  let fixture: ComponentFixture<ComputedTrackerComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ComputedTrackerComponent],
      providers: [provideZonelessChangeDetection()],
    }).compileComponents();

    fixture = TestBed.createComponent(ComputedTrackerComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('usa el titulo por defecto y lo refleja en el h1', () => {
    const h1 = fixture.nativeElement.querySelector('h1') as HTMLElement;
    expect(h1.textContent?.trim()).toBe('Calculated Signals');
  });

  it('refleja el input title', () => {
    fixture.componentRef.setInput('title', 'Mis computados');
    fixture.detectChanges();
    const h1 = fixture.nativeElement.querySelector('h1') as HTMLElement;
    expect(h1.textContent?.trim()).toBe('Mis computados');
  });

  it('renderiza una box por cada elemento con nombre y apellido', () => {
    const data: ClickInButton[] = [
      { date: new Date(), firstName: 'Ana', surname: 'Gomez' },
      { date: new Date(), firstName: 'Luis', surname: 'Diaz' },
    ];
    fixture.componentRef.setInput('computedTracker', data);
    fixture.detectChanges();

    const boxes = fixture.nativeElement.querySelectorAll('.box');
    expect(boxes.length).toBe(2);
    const text = (fixture.nativeElement as HTMLElement).textContent ?? '';
    expect(text).toContain('Name: Ana');
    expect(text).toContain('Surname: Gomez');
  });
});
