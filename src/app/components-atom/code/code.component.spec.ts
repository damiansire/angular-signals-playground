import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';

import { CodeComponent } from './code.component';
import { CodeLine } from '../component-atom.interface';
import { CodeClick } from './code.interface';

describe('CodeComponent', () => {
  let component: CodeComponent;
  let fixture: ComponentFixture<CodeComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CodeComponent],
      providers: [provideZonelessChangeDetection()],
    }).compileComponents();

    fixture = TestBed.createComponent(CodeComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('parsea htmlCode via effect y emite htmlParsed con una linea por renglon', () => {
    let parsed: CodeLine[] | undefined;
    component.htmlParsed.subscribe((p) => (parsed = p));

    fixture.componentRef.setInput('htmlCode', '<div>\n  <span></span>\n</div>');
    fixture.detectChanges();

    expect(component.codeLines().length).toBe(3);
    expect(parsed?.length).toBe(3);
  });

  it('renderiza una linea de codigo en el DOM por cada renglon parseado', () => {
    fixture.componentRef.setInput('htmlCode', '<a></a>\n<b></b>');
    fixture.detectChanges();

    const lines = fixture.nativeElement.querySelectorAll('[role="button"][tabindex]');
    // una linea contenedora por renglon (cada una con role=button)
    expect(lines.length).toBeGreaterThanOrEqual(2);
  });

  it('onLineClick alterna selected y emite codeClick con accion Select/Deselect', () => {
    const events: CodeClick[] = [];
    component.codeClick.subscribe((e) => events.push(e));

    fixture.componentRef.setInput('htmlCode', '<div></div>');
    fixture.detectChanges();

    const line = component.codeLines()[0];
    component.onLineClick(line);
    expect(component.codeLines()[0].selected).toBeTrue();
    expect(events[0].target).toBe('Line');
    expect(events[0].action).toBe('Select');

    component.onLineClick(component.codeLines()[0]);
    expect(component.codeLines()[0].selected).toBeFalse();
    expect(events[1].action).toBe('Deselect');
  });

  it('parseCode marca reservedWord en los tags', () => {
    const lines = component.parseCode('<div>texto</div>');
    const elements = lines[0].elements ?? [];
    const tag = elements.find((e) => e.text.includes('div'));
    expect(tag?.reservedWord).toBeTrue();
  });

  describe('modo estático (snippet pre-armado vía `lines`)', () => {
    it('entra en modo estático y muestra item.line cuando se pasan `lines`', () => {
      fixture.componentRef.setInput('lines', [
        { id: 'a', line: 'const x = 1;' },
        { id: 'b', line: 'const y = 2;' },
      ] satisfies CodeLine[]);
      fixture.detectChanges();

      expect(component.isStatic()).toBeTrue();
      const rows = fixture.nativeElement.querySelectorAll('.font-mono');
      expect(rows.length).toBe(2);
      expect(rows[0].textContent?.trim()).toBe('const x = 1;');
      expect(rows[1].textContent?.trim()).toBe('const y = 2;');
    });

    it('pasa la sangría propia de cada renglón para que la continuación arranque desde ahí', () => {
      expect(component.sangria({ id: 'a', line: '    return x;' })).toBe(4);
      expect(component.sangria({ id: 'b', line: 'const y = 2;' })).toBe(0);
      expect(component.sangria({ id: 'c' })).toBe(0);

      fixture.componentRef.setInput('lines', [
        { id: 'a', line: '  seconds = toSignal(interval(1000));' },
      ] satisfies CodeLine[]);
      fixture.detectChanges();
      const row: HTMLElement = fixture.nativeElement.querySelector('.font-mono');
      expect(row.style.getPropertyValue('--sangria')).toBe('2');
    });

    it('muestra la sangría con espacios duros: al envolver no deja un renglón vacío', () => {
      expect(component.renglon({ id: 'a', line: '  (countChange)="on($event)" />' })).toBe(
        '\u00a0\u00a0(countChange)="on($event)" />',
      );
      expect(component.renglon({ id: 'b', line: 'sin sangría' })).toBe('sin sangría');
      expect(component.renglon({ id: 'c' })).toBe('');
    });

    it('el renglón arranca con su sangría, sin un espacio común delante, y ofrece cortes', () => {
      fixture.componentRef.setInput('lines', [
        { id: 'a', line: '  querySelector("#count").textContent = count' },
        { id: 'b', line: '' },
      ] satisfies CodeLine[]);
      fixture.detectChanges();
      const [sangrado, vacio]: HTMLElement[] = Array.from(
        fixture.nativeElement.querySelectorAll('.font-mono'),
      );
      expect(sangrado.textContent!.startsWith('  querySelector(')).toBeTrue();
      expect(sangrado.querySelectorAll('wbr').length).toBeGreaterThan(0);
      // Un renglón vacío conserva su alto: lleva un espacio, no queda sin texto.
      expect(vacio.textContent).toBe(' ');
    });

    it('staticLineClasses resalta en verde cuando la linea esta active', () => {
      expect(component.staticLineClasses({ id: 'a', active: true })).toContain('bg-green-700');
      expect(component.staticLineClasses({ id: 'b', active: false })).toContain('bg-gray-800');
    });

    it('trata las líneas con texto como interactivas y las vacías/sin `line` como no interactivas', () => {
      expect(component.isInteractive({ line: 'const x = 1;' })).toBeTrue();
      expect(component.isInteractive({ line: '' })).toBeFalse();
      expect(component.isInteractive({ line: '   ' })).toBeFalse();
      expect(component.isInteractive({ active: false })).toBeFalse();
    });

    it('no expone role="button" ni tabindex en modo estático', () => {
      fixture.componentRef.setInput('lines', [
        { id: 'a', line: 'const x = 1;', active: true },
        { id: 'b', line: '', active: false },
      ] satisfies CodeLine[]);
      fixture.detectChanges();

      const rows: HTMLElement[] = Array.from(
        fixture.nativeElement.querySelectorAll('[class*="font-mono"]'),
      );
      const [interactiveRow, blankRow] = rows;

      expect(interactiveRow.getAttribute('role')).toBeNull();
      expect(interactiveRow.getAttribute('tabindex')).toBeNull();
      expect(blankRow.getAttribute('role')).toBeNull();
      expect(blankRow.getAttribute('tabindex')).toBeNull();
    });
  });
});
