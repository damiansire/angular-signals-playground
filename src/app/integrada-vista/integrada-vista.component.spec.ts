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

  function instance() {
    return TestBed.createComponent(IntegradaVistaComponent).componentInstance;
  }

  it('arma 12 átomos (0 a 11) con posición y un enlace entre cada par', () => {
    const c = instance();
    expect(c.atoms.map((a) => a.id)).toEqual([
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
    expect(c.atoms.every((a) => Number.isFinite(a.x) && Number.isFinite(a.y))).toBeTrue();
    expect(c.bonds.length).toBe(11);
  });

  it('al inicio solo el primer átomo está a la vista y es el actual', () => {
    const c = instance();
    expect(c.revealed()).toBe(1);
    expect(c.isShown(0)).toBeTrue();
    expect(c.isShown(1)).toBeFalse();
    expect(c.current().id).toBe('0');
  });

  it('cada átomo enlaza al primer sub-nivel de su nivel', () => {
    const c = instance();
    expect(c.levelLink('2')).toBe('/signals/level/2/sub-level/1');
  });

  it('la órbita crece con la cantidad de átomos revelados', () => {
    const c = instance();
    expect(c.orbitR()).toBeGreaterThan(0);
  });
});
