import { TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { provideRouter } from '@angular/router';
import { LandingComponent } from './landing.component';

describe('LandingComponent', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [LandingComponent],
      providers: [provideZonelessChangeDetection(), provideRouter([])],
    }).compileComponents();
  });

  function create() {
    const fixture = TestBed.createComponent(LandingComponent);
    fixture.detectChanges();
    return fixture;
  }

  it('el derivado es siempre el doble de la fuente', () => {
    const c = create().componentInstance;
    expect(c.doubled()).toBe(c.count() * 2);
    c.bump(2);
    expect(c.doubled()).toBe(c.count() * 2);
  });

  it('bump sube y baja la fuente y clampea en [0, 20]', () => {
    const c = create().componentInstance;
    c.bump(-100);
    expect(c.count()).toBe(0);
    c.bump(100);
    expect(c.count()).toBe(20);
  });

  it('reset vuelve la fuente a 3', () => {
    const c = create().componentInstance;
    c.bump(5);
    c.reset();
    expect(c.count()).toBe(3);
  });

  it('el effect real corre al menos una vez y reacciona a los cambios', () => {
    const fixture = create();
    const c = fixture.componentInstance;
    const initial = c.effectRuns();
    expect(initial).toBeGreaterThan(0);

    c.bump(1);
    fixture.detectChanges();
    expect(c.effectRuns()).toBeGreaterThan(initial);
  });
});
