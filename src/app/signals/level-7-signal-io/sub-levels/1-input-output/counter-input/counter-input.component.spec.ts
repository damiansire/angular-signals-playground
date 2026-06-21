import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';

import { CounterInputComponent } from './counter-input.component';

describe('CounterInputComponent', () => {
  let component: CounterInputComponent;
  let fixture: ComponentFixture<CounterInputComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CounterInputComponent],
      providers: [provideZonelessChangeDetection()],
    }).compileComponents();

    fixture = TestBed.createComponent(CounterInputComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('incrementa según el input step y emite el nuevo valor', () => {
    fixture.componentRef.setInput('step', 3);
    const emitted: number[] = [];
    component.countChange.subscribe((value) => emitted.push(value));

    component.increment();
    component.increment();

    expect(component.count()).toBe(6);
    expect(emitted).toEqual([3, 6]);
  });
});
