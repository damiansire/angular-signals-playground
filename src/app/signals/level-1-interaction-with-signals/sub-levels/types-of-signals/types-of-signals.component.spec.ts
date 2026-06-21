import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';

import { TypesOfSignalsComponent } from './types-of-signals.component';

describe('TypesOfSignalsComponent', () => {
  let component: TypesOfSignalsComponent;
  let fixture: ComponentFixture<TypesOfSignalsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TypesOfSignalsComponent],
      providers: [provideZonelessChangeDetection()],
    }).compileComponents();

    fixture = TestBed.createComponent(TypesOfSignalsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('arranca en WritableSignal (escribible)', () => {
    expect(component.selected().label).toBe('WritableSignal');
    expect(component.selected().writable).toBe(true);
  });

  it('al elegir computed muestra un tipo de solo lectura', () => {
    component.select('computed');
    expect(component.selected().writable).toBe(false);
  });
});
