import { ComponentFixture, TestBed } from '@angular/core/testing';

import { OscilloscopeComponent } from './oscilloscope.component';

describe('OscilloscopeComponent (computed trace + imperative effect)', () => {
  let component: OscilloscopeComponent;
  let fixture: ComponentFixture<OscilloscopeComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({ imports: [OscilloscopeComponent] });
    fixture = TestBed.createComponent(OscilloscopeComponent);
    component = fixture.componentInstance;
    fixture.detectChanges(); // primer render: corre el effect inicial
  });

  it('moves the trace upward as the speed increases', () => {
    component.speed.set(component.min);
    const low = component.traceY();
    component.speed.set(component.max);
    const high = component.traceY();
    // más rápido = más arriba = menor Y en coords del CRT
    expect(high).toBeLessThan(low);
  });

  it('labels the regime band against the threshold', () => {
    component.speed.set(component.threshold - 10);
    expect(component.band()).toBe('NOMINAL');
    component.speed.set(component.threshold + 10);
    expect(component.band()).toBe('OVER');
    component.speed.set(component.threshold);
    expect(component.band()).toBe('OVER'); // >= threshold
  });

  it('rebuilds the trace path when speed changes', () => {
    component.speed.set(80);
    const a = component.tracePath();
    component.speed.set(260);
    const b = component.tracePath();
    expect(a).not.toBe(b);
    expect(b.startsWith('M')).toBeTrue();
  });

  it('runs the effect once per speed change (runs increments)', () => {
    const before = component.runs();

    component.setSpeed('150');
    fixture.detectChanges();
    expect(component.runs()).toBe(before + 1);

    component.setSpeed('250');
    fixture.detectChanges();
    expect(component.runs()).toBe(before + 2);
  });

  it('records the side-effect in the on-screen log (newest first, capped)', () => {
    component.setSpeed('111');
    fixture.detectChanges();
    const top = component.log()[0];
    expect(top.speed).toBe(111);
    expect(component.log().length).toBeLessThanOrEqual(6);
  });

  it('etiqueta el destino del side-effect como log on-screen', () => {
    expect(component.sinkLabel()).toBe('telemetry log');
  });
});
