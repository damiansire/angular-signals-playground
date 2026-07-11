import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import axe from 'axe-core';

import { ResourceBasicComponent } from './resource-basic.component';

/** Corre axe-core sobre el elemento y falla el test listando las violaciones (id + nodos). */
async function expectNoA11yViolations(element: Element): Promise<void> {
  const results = await axe.run(element);
  const summary = results.violations
    .map((v) => `- ${v.id} (${v.impact}): ${v.nodes.length} nodo(s) — ${v.help}`)
    .join('\n');
  expect(results.violations.length).withContext(summary).toBe(0);
}

describe('ResourceBasicComponent', () => {
  let component: ResourceBasicComponent;
  let fixture: ComponentFixture<ResourceBasicComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ResourceBasicComponent],
      providers: [provideZonelessChangeDetection()],
    }).compileComponents();

    fixture = TestBed.createComponent(ResourceBasicComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('actualiza el id de la petición al elegir un usuario', () => {
    expect(component.userId()).toBe(1);
    component.setUser(3);
    expect(component.userId()).toBe(3);
  });

  it('no tiene violaciones de accesibilidad detectables por axe-core (estado loading)', async () => {
    await expectNoA11yViolations(fixture.nativeElement);
  });
});
