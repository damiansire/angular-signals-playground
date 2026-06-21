import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';

import { VariableRefreshAndTreeComponent } from './variable-refresh-and-tree.component';
import { CodeClick } from '../../../../components-atom/code/code.interface';

describe('VariableRefreshAndTreeComponent', () => {
  let component: VariableRefreshAndTreeComponent;
  let fixture: ComponentFixture<VariableRefreshAndTreeComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [VariableRefreshAndTreeComponent],
      providers: [provideZonelessChangeDetection()],
    }).compileComponents();

    fixture = TestBed.createComponent(VariableRefreshAndTreeComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('arranca en el slider 0 y muestra la etapa HTML (count-increment)', () => {
    expect(component.sliderNumber).toBe(0);
    expect(fixture.nativeElement.querySelector('app-count-increment')).toBeTruthy();
  });

  it('onSliderChanged actualiza el numero de etapa', () => {
    component.onSliderChanged(2);
    expect(component.sliderNumber).toBe(2);
    component.onSliderChanged(1);
    expect(component.sliderNumber).toBe(1);
  });

  it('codeClickHandler agrega/quita nodos del arbol', () => {
    component.codeClickHandler({ target: 'Element', action: 'Select', id: 'span-1' } as CodeClick);
    expect(component.nodesToShow()).toContain('span-1');

    component.codeClickHandler({
      target: 'Element',
      action: 'Deselect',
      id: 'span-1',
    } as CodeClick);
    expect(component.nodesToShow()).not.toContain('span-1');
  });

  it('en la etapa 0 renderiza el arbol y el bloque de codigo', () => {
    expect(fixture.nativeElement.querySelector('app-tree')).toBeTruthy();
    expect(fixture.nativeElement.querySelector('app-code')).toBeTruthy();
  });
});
