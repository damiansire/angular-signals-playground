import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import axe from 'axe-core';

import { LinkedSignalWithSourceComponent } from './linked-signal-with-source.component';

/** Corre axe-core sobre el elemento y falla el test listando las violaciones (id + nodos). */
async function expectNoA11yViolations(element: Element): Promise<void> {
  const results = await axe.run(element);
  const summary = results.violations
    .map((v) => `- ${v.id} (${v.impact}): ${v.nodes.length} nodo(s) — ${v.help}`)
    .join('\n');
  expect(results.violations.length).withContext(summary).toBe(0);
}

describe('LinkedSignalWithSourceComponent', () => {
  let component: LinkedSignalWithSourceComponent;
  let fixture: ComponentFixture<LinkedSignalWithSourceComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [LinkedSignalWithSourceComponent],
      providers: [provideZonelessChangeDetection()],
    }).compileComponents();

    fixture = TestBed.createComponent(LinkedSignalWithSourceComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('preserva la selección si sigue disponible al cambiar la fuente', () => {
    component.select('Air');
    component.useInternational(); // ['Air', 'Sea', 'Express'] incluye 'Air'
    expect(component.selectedOption()).toBe('Air');
  });

  it('se reinicia a la primera opción si la selección ya no está disponible', () => {
    component.select('Sea');
    component.useDomestic(); // ['Ground', 'Air'] -> 'Sea' no está
    expect(component.selectedOption()).toBe('Ground');
  });

  it('no tiene violaciones de accesibilidad detectables por axe-core', async () => {
    await expectNoA11yViolations(fixture.nativeElement);
  });
});
