import { TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { provideRouter } from '@angular/router';
import { JourneyComponent } from './journey.component';

describe('JourneyComponent', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [JourneyComponent],
      providers: [provideZonelessChangeDetection(), provideRouter([])],
    }).compileComponents();
  });

  function instance() {
    return TestBed.createComponent(JourneyComponent).componentInstance;
  }

  it('cubre los 12 niveles (0 a 11) sin huecos ni repetidos', () => {
    const ids = instance().stops.map((s) => s.id);
    expect(ids).toEqual(['0', '1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11']);
  });

  it('cada parada enlaza al primer sub-nivel de su nivel', () => {
    const c = instance();
    expect(c.levelLink('0')).toBe('/signals/level/0/sub-level/1');
    expect(c.levelLink('11')).toBe('/signals/level/11/sub-level/1');
  });

  it('renderiza una escena por nivel, cada una con su enlace de entrada', () => {
    const fixture = TestBed.createComponent(JourneyComponent);
    fixture.detectChanges();
    const links = (fixture.nativeElement as HTMLElement).querySelectorAll('a.scene__enter');
    expect(links.length).toBe(12);
  });

  it('styleFor devuelve opacidad y transform (la escena en foco es la más opaca)', () => {
    const c = instance();
    const first = c.styleFor(0);
    expect(first.opacity).toBeDefined();
    expect(first.transform).toContain('scale(');
    // Al inicio (scroll 0) la parada 0 está en foco.
    expect(c.isActive(0)).toBeTrue();
  });
});
