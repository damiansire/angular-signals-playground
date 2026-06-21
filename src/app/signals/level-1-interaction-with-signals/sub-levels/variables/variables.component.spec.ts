import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';

import { VariablesComponent } from './variables.component';

describe('VariablesComponent', () => {
  let component: VariablesComponent;
  let fixture: ComponentFixture<VariablesComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [VariablesComponent],
      providers: [provideZonelessChangeDetection()],
    }).compileComponents();

    fixture = TestBed.createComponent(VariablesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('ngOnInit completa dataTypes con todas las claves de typesExamples', () => {
    expect(component.dataTypes).toEqual(['Number', 'String', 'Boolean', 'Object', 'Array']);
  });

  it('selectType cambia el tipo seleccionado y sus ejemplos', () => {
    component.selectType({ name: 'Boolean', value: '' });
    expect(component.selectedType().name).toBe('Boolean');
    expect(component.selectedType().examples).toEqual(['true', 'false']);
  });

  it('selectExample fija el valor seleccionado y lo refleja en lines', () => {
    component.selectExample({ name: '42', value: '' });
    expect(component.selectedExampleValue()).toBe('42');

    const lines = component.lines().map((l) => l.line as string);
    expect(lines).toContain('var value = 42');
    expect(lines).toContain('const value = 42');
    expect(lines).toContain('let value = 42');
  });

  it('renderiza una cajita por cada tipo de dato', () => {
    fixture.detectChanges();
    const text = (fixture.nativeElement as HTMLElement).textContent ?? '';
    expect(text).toContain('Number');
    expect(text).toContain('Boolean');
  });
});
