import { ComponentFixture, TestBed } from '@angular/core/testing';
import { DomIsAliveComponent } from './dom-is-alive.component';

describe('DomIsAliveComponent', () => {
  let fixture: ComponentFixture<DomIsAliveComponent>;
  let el: HTMLElement;

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [DomIsAliveComponent] }).compileComponents();
    fixture = TestBed.createComponent(DomIsAliveComponent);
    el = fixture.nativeElement as HTMLElement;
    fixture.detectChanges();
  });

  it('se crea', () => {
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('muestra los nodos del DOM con su valor inicial', () => {
    const nodes = el.querySelectorAll('.dia-node');
    expect(nodes.length).toBe(3);
    expect(el.textContent).toContain('inactivo');
  });

  it('correr una línea cambia el valor del nodo objetivo y lo marca tocado', () => {
    (el.querySelector('.dia-run') as HTMLButtonElement).click();
    fixture.detectChanges();
    const touched = el.querySelector('.dia-node.dia-touched');
    expect(touched).toBeTruthy();
    expect(touched!.querySelector('.dia-node-val')!.textContent!.trim()).toBe('1');
  });
});
