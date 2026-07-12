import { TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { provideRouter } from '@angular/router';
import { IntegradaVistaComponent } from './integrada-vista.component';

describe('IntegradaVistaComponent', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [IntegradaVistaComponent],
      providers: [provideZonelessChangeDetection(), provideRouter([])],
    }).compileComponents();
  });

  it('cubre los 12 niveles (0 a 11) sin huecos ni repetidos', () => {
    const c = TestBed.createComponent(IntegradaVistaComponent).componentInstance;
    expect(c.stops.map((s) => s.id)).toEqual([
      '0',
      '1',
      '2',
      '3',
      '4',
      '5',
      '6',
      '7',
      '8',
      '9',
      '10',
      '11',
    ]);
  });

  it('cada parada enlaza al primer sub-nivel de su nivel', () => {
    const c = TestBed.createComponent(IntegradaVistaComponent).componentInstance;
    expect(c.levelLink('0')).toBe('/signals/level/0/sub-level/1');
    expect(c.levelLink('11')).toBe('/signals/level/11/sub-level/1');
  });

  it('renderiza una estación por nivel, cada una como enlace', () => {
    const fixture = TestBed.createComponent(IntegradaVistaComponent);
    fixture.detectChanges();
    const links = (fixture.nativeElement as HTMLElement).querySelectorAll('a.stop__link');
    expect(links.length).toBe(12);
  });
});
