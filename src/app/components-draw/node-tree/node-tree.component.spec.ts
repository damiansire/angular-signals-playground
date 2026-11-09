import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';

import { NodeTreeComponent } from './node-tree.component';
import { Link, NodeTree } from '../../libs/tree-model';

const NODOS: NodeTree[] = [
  { id: 'main-1', name: 'main-1', x: 0, y: 0, level: 1 },
  { id: 'h2-1', name: 'h2-1', x: 1, y: 1, level: 2 },
  { id: 'p-1', name: 'p-1', x: 1, y: 2, level: 2 },
];
const RAMAS: Link[] = [
  { source: 'main-1', target: 'h2-1' },
  { source: 'main-1', target: 'p-1' },
];

describe('NodeTreeComponent', () => {
  let fixture: ComponentFixture<NodeTreeComponent>;
  let el: HTMLElement;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [NodeTreeComponent],
      providers: [provideZonelessChangeDetection()],
    }).compileComponents();

    fixture = TestBed.createComponent(NodeTreeComponent);
    el = fixture.nativeElement;
    fixture.componentRef.setInput('nodes', NODOS);
    fixture.componentRef.setInput('links', RAMAS);
    fixture.detectChanges();
  });

  it('sin filtro dibuja todos los nodos y sus ramas', () => {
    expect(el.querySelectorAll('.nodo').length).toBe(3);
    expect(el.querySelectorAll('.rama').length).toBe(2);
  });

  it('dibuja solo los nodos pedidos, y solo las ramas con las dos puntas a la vista', () => {
    fixture.componentRef.setInput('nodesToShow', ['main-1', 'p-1']);
    fixture.detectChanges();

    const ids = [...el.querySelectorAll('.nodo')].map((g) => g.getAttribute('data-nodo-id'));
    expect(ids).toEqual(['main-1', 'p-1']);
    expect(el.querySelectorAll('.rama').length).toBe(1);
  });

  it('el lienzo no cambia de tamaño al revelar nodos', () => {
    const svg = el.querySelector('svg')!;
    fixture.componentRef.setInput('nodesToShow', []);
    fixture.detectChanges();
    const vacio = svg.getAttribute('viewBox');
    fixture.componentRef.setInput('nodesToShow', ['main-1', 'h2-1', 'p-1']);
    fixture.detectChanges();
    expect(svg.getAttribute('viewBox')).toBe(vacio);
  });

  it('el borde izquierdo de un hijo queda a la derecha del de su padre y más abajo', () => {
    const tree = fixture.componentInstance;
    const padre = tree.getScreenEdgePosition('main-1', 'left')!;
    const hijo = tree.getScreenEdgePosition('h2-1', 'left')!;
    expect(hijo.x).toBeGreaterThan(padre.x);
    expect(hijo.y).toBeGreaterThan(padre.y);
  });

  it('sabe dónde va a quedar un nodo aunque todavía no se muestre', () => {
    fixture.componentRef.setInput('nodesToShow', []);
    fixture.detectChanges();
    expect(fixture.componentInstance.getScreenEdgePosition('p-1')).not.toBeNull();
    expect(fixture.componentInstance.getScreenEdgePosition('nada-1')).toBeNull();
  });
});
