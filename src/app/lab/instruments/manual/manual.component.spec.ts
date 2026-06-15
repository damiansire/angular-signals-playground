import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ManualComponent } from './manual.component';

describe('ManualComponent (diamond dependency, glitch-free)', () => {
  let component: ManualComponent;
  let fixture: ComponentFixture<ManualComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({ imports: [ManualComponent] });
    fixture = TestBed.createComponent(ManualComponent);
    component = fixture.componentInstance;
    fixture.detectChanges(); // primer render: corre el effect inicial
  });

  it('derives both arms of the diamond from the source', () => {
    component.n.set(8);
    expect(component.square()).toBe(64); // 8 * 8
    expect(component.half()).toBe(4); // 8 / 2
  });

  it('the vertex (report) combines both arms', () => {
    component.n.set(8);
    expect(component.report()).toBe(68); // 64 + 4

    component.n.set(10);
    expect(component.report()).toBe(105); // 100 + 5
  });

  it('setN parses the string source and recomputes report', () => {
    component.setN('6');
    expect(component.n()).toBe(6);
    expect(component.report()).toBe(39); // 36 + 3
  });

  it('flow maps the source to a 0..1 position', () => {
    component.n.set(component.min);
    expect(component.flow()).toBeCloseTo(0, 6);
    component.n.set(component.max);
    expect(component.flow()).toBeCloseTo(1, 6);
  });

  it('evals advances by exactly one per source change (glitch-free)', () => {
    const before = component.evals();

    component.setN('5');
    fixture.detectChanges();
    expect(component.evals()).toBe(before + 1);

    component.setN('9');
    fixture.detectChanges();
    expect(component.evals()).toBe(before + 2);
  });

  it('does not re-run the effect when report stays the same', () => {
    const before = component.evals();
    component.setN(String(component.n())); // mismo valor → report no cambia
    fixture.detectChanges();
    expect(component.evals()).toBe(before);
  });
});
