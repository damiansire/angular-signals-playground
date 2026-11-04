import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';

import { CircuitoComponent } from './circuito.component';
import type { EnlaceCircuito, NodoCircuito } from './circuito.modelo';

const NODOS: NodoCircuito[] = [
  { id: 'count', nombre: 'count', valor: '0', tono: 'fuente', col: 1, fila: 1 },
  { id: 'vista', nombre: 'vista', valor: '0', tono: 'consumidor', col: 2, fila: 1 },
  { id: 'boton', nombre: 'boton', tono: 'caja', col: 3, fila: 1, accion: 'Tocar el botón' },
];
const ENLACES: EnlaceCircuito[] = [{ de: 'count', a: 'vista' }];

describe('CircuitoComponent', () => {
  let fixture: ComponentFixture<CircuitoComponent>;
  let raiz: HTMLElement;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CircuitoComponent],
      providers: [provideZonelessChangeDetection()],
    }).compileComponents();

    fixture = TestBed.createComponent(CircuitoComponent);
    fixture.componentRef.setInput('nodos', NODOS);
    fixture.componentRef.setInput('enlaces', ENLACES);
    await fixture.whenStable();
    raiz = fixture.nativeElement;
  });

  it('dibuja un nodo por cada dato y un cable por cada enlace', () => {
    expect(raiz.querySelectorAll('[data-nodo]').length).toBe(3);
    expect(raiz.querySelectorAll('.ci__cable').length).toBe(1);
  });

  it('solo es botón el nodo con acción, y su nombre accesible es esa acción', () => {
    const botones = raiz.querySelectorAll('button');
    expect(botones.length).toBe(1);
    expect(botones[0].getAttribute('aria-label')).toBe('Tocar el botón');
  });

  it('activar el botón avisa qué nodo se tocó', () => {
    const tocados: string[] = [];
    fixture.componentInstance.tocado.subscribe((id) => tocados.push(id));
    raiz.querySelector('button')!.click();
    expect(tocados).toEqual(['boton']);
  });

  it('un enlace suelto se ve suelto', async () => {
    fixture.componentRef.setInput('enlaces', [{ de: 'count', a: 'vista', vivo: false }]);
    await fixture.whenStable();
    expect(raiz.querySelector('.ci__cable')!.classList).toContain('ci__cable--suelto');
  });

  it('el nodo que ocupa dos filas se lo pide a la grilla', async () => {
    fixture.componentRef.setInput('nodos', [{ ...NODOS[0], alto: 2 }]);
    await fixture.whenStable();
    const celda = raiz.querySelector<HTMLElement>('.ci__celda')!;
    expect(celda.style.gridRowEnd).toBe('span 2');
  });

  it('un rebote se anuncia, también cuando se repite', async () => {
    const aviso = () => raiz.querySelector('[role="status"]')!.textContent;
    fixture.componentInstance.rebotar('count', 'no compila');
    await fixture.whenStable();
    const primero = aviso();
    expect(primero).toContain('no compila');
    fixture.componentInstance.rebotar('count', 'no compila');
    await fixture.whenStable();
    expect(aviso()).not.toBe(primero);
  });

  it('un nombre largo no es un nodo redondo: su órbita no gira', async () => {
    fixture.componentRef.setInput('nodos', [
      { ...NODOS[0], nombre: 'WritableSignal' },
      { ...NODOS[1], id: 'otro', nombre: 'otro' },
    ]);
    await fixture.whenStable();
    const [largo, corto] = [...raiz.querySelectorAll('[data-nodo]')];
    expect(largo.classList).toContain('ci__nodo--largo');
    expect(corto.classList).not.toContain('ci__nodo--largo');
  });

  it('rebotar sobre un nodo que no existe no rompe nada', () => {
    expect(() => fixture.componentInstance.rebotar('no-existe', 'nada')).not.toThrow();
  });
});
