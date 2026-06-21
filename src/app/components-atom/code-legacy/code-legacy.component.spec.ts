import { ComponentFixture, TestBed } from '@angular/core/testing';
import { signal, provideZonelessChangeDetection } from '@angular/core';

import { CodeLegacyComponent } from './code-legacy.component';
import { CodeLine } from '../component-atom.interface';

describe('CodeLegacyComponent', () => {
  let component: CodeLegacyComponent;
  let fixture: ComponentFixture<CodeLegacyComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CodeLegacyComponent],
      providers: [provideZonelessChangeDetection()],
    }).compileComponents();

    fixture = TestBed.createComponent(CodeLegacyComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('renderiza una linea por cada CodeLine y muestra item.line', () => {
    fixture.componentRef.setInput(
      'lines',
      signal<CodeLine[]>([
        { id: 'a', line: 'const x = 1;' },
        { id: 'b', line: 'const y = 2;' },
      ]),
    );
    fixture.detectChanges();

    const rows = fixture.nativeElement.querySelectorAll('[role="button"]');
    expect(rows.length).toBe(2);
    expect(rows[0].textContent?.trim()).toBe('const x = 1;');
    expect(rows[1].textContent?.trim()).toBe('const y = 2;');
  });

  it('onLineClick emite lineClick con el id de la linea', () => {
    let emittedId: string | undefined;
    component.lineClick.subscribe((id) => (emittedId = id));

    component.onLineClick({ id: 'linea-1', line: 'foo' });
    expect(emittedId).toBe('linea-1');
  });

  it('lineClasses resalta en verde cuando la linea esta active', () => {
    const activeClasses = component.lineClasses({ id: 'a', active: true });
    const inactiveClasses = component.lineClasses({ id: 'b', active: false });
    expect(activeClasses).toContain('bg-green-700');
    expect(inactiveClasses).toContain('bg-gray-800');
  });
});
