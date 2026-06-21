import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';

import { HtmlToTreeComponent } from './html-to-tree.component';
import { CodeClick } from '../../../../components-atom/code/code.interface';

describe('HtmlToTreeComponent', () => {
  let component: HtmlToTreeComponent;
  let fixture: ComponentFixture<HtmlToTreeComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [HtmlToTreeComponent],
      providers: [provideZonelessChangeDetection()]
    })
    .compileComponents();

    fixture = TestBed.createComponent(HtmlToTreeComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('arranca sin nodos visibles', () => {
    expect(component.nodesToShow()).toEqual([]);
  });

  it('addNode agrega un id y removeNode lo quita', () => {
    component.addNode('main-1');
    component.addNode('section-1');
    expect(component.nodesToShow()).toEqual(['main-1', 'section-1']);

    component.removeNode('main-1');
    expect(component.nodesToShow()).toEqual(['section-1']);
  });

  it('codeClickHandler agrega el nodo al seleccionar y lo quita al deseleccionar', () => {
    const select: CodeClick = { target: 'Element', action: 'Select', id: 'h2-1' };
    component.codeClickHandler(select);
    expect(component.nodesToShow()).toContain('h2-1');

    const deselect: CodeClick = { target: 'Element', action: 'Deselect', id: 'h2-1' };
    component.codeClickHandler(deselect);
    expect(component.nodesToShow()).not.toContain('h2-1');
  });

  it('renderiza el arbol y el bloque de codigo en el layout de dos columnas', () => {
    expect(fixture.nativeElement.querySelector('app-tree')).toBeTruthy();
    expect(fixture.nativeElement.querySelector('app-code')).toBeTruthy();
  });
});
