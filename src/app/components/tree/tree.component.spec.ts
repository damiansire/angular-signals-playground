import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';

import { TreeComponent } from './tree.component';

describe('TreeComponent', () => {
  let component: TreeComponent;
  let fixture: ComponentFixture<TreeComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TreeComponent],
      providers: [provideZonelessChangeDetection()]
    })
    .compileComponents();

    fixture = TestBed.createComponent(TreeComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('arranca sin nodos ni links', () => {
    expect(component.nodesData()).toEqual([]);
    expect(component.links()).toEqual([]);
    expect(component.nodes()).toEqual([]);
  });

  it('el effect parsea htmlCode y genera nodos al setear el input', () => {
    fixture.componentRef.setInput('htmlCode', '<div>\n  <span></span>\n</div>');
    fixture.detectChanges();

    expect(component.nodesData().length).toBeGreaterThan(0);
  });

  it('nodes computed filtra por nodesToShow cuando esta definido', () => {
    fixture.componentRef.setInput('htmlCode', '<div>\n  <span></span>\n</div>');
    fixture.detectChanges();

    const all = component.nodesData();
    expect(all.length).toBeGreaterThan(0);
    const firstId = all[0].id;

    fixture.componentRef.setInput('nodesToShow', [firstId]);
    fixture.detectChanges();

    const visible = component.nodes();
    expect(visible.length).toBe(1);
    expect(visible[0].id).toBe(firstId);
  });

  it('pasa nodes y links al app-node-tree', () => {
    const nodeTree = fixture.nativeElement.querySelector('app-node-tree');
    expect(nodeTree).toBeTruthy();
  });
});
