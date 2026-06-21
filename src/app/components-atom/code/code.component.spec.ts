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
      providers: [provideZonelessChangeDetection()]
    })
    .compileComponents();

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
});
