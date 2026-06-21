import { TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';

import { SignalFlowComponent } from './signal-flow.component';

describe('SignalFlowComponent (signal + computed derivations)', () => {
  let component: SignalFlowComponent;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [SignalFlowComponent],
      providers: [provideZonelessChangeDetection()],
    });
    component = TestBed.createComponent(SignalFlowComponent).componentInstance;
  });

  it('formats the label in Hz below 1000', () => {
    component.cutoff.set(880);
    expect(component.label()).toBe('880 Hz');
  });

  it('formats the label in kHz with two decimals at/above 1000', () => {
    component.cutoff.set(12000);
    expect(component.label()).toBe('12.00 kHz');
  });

  it('switches to kHz exactly at 1000', () => {
    component.cutoff.set(1000);
    expect(component.label()).toBe('1.00 kHz');
  });

  it('keeps the knob rotation within [-135, 135] across the range', () => {
    for (const hz of [component.min, 880, 9000, component.max]) {
      component.cutoff.set(hz);
      const r = component.rotation();
      expect(r).toBeGreaterThanOrEqual(-135);
      expect(r).toBeLessThanOrEqual(135);
    }
  });

  it('maps the minimum to -135 and the maximum to +135 degrees', () => {
    component.cutoff.set(component.min);
    expect(component.rotation()).toBeCloseTo(-135, 5);
    component.cutoff.set(component.max);
    expect(component.rotation()).toBeCloseTo(135, 5);
  });

  it('derives glow within [0.25, 1] and growing with cutoff', () => {
    component.cutoff.set(component.min);
    expect(component.glow()).toBeCloseTo(0.25, 5);
    component.cutoff.set(component.max);
    expect(component.glow()).toBeCloseTo(1, 5);
  });

  it('setCutoff updates the source signal from a string value', () => {
    component.setCutoff('5000');
    expect(component.cutoff()).toBe(5000);
  });

  it('setCutoff fires the pulse (pulses() changes each call)', () => {
    const before = component.pulses()[0];
    component.setCutoff('3000');
    const after = component.pulses()[0];
    expect(after).toBe(before + 1);

    component.setCutoff('3000');
    expect(component.pulses()[0]).toBe(after + 1);
  });
});
