import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';

import { EffectComponent } from './effect.component';

describe('EffectComponent', () => {
  let component: EffectComponent;
  let fixture: ComponentFixture<EffectComponent>;

  // Reloj falso: el latido autónomo de Count1 usa setInterval; con el clock instalado los tests
  // controlan el tiempo (nada late solo salvo que se avance con tick()).
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EffectComponent],
      providers: [provideZonelessChangeDetection()],
    }).compileComponents();
    jasmine.clock().install();
  });

  afterEach(() => {
    fixture?.destroy();
    jasmine.clock().uninstall();
  });

  // La vida autónoma se pausa con prefers-reduced-motion, así que el matchMedia se controla por test.
  const create = (reduce = false): void => {
    spyOn(window, 'matchMedia').and.callFake(
      (query: string) =>
        ({
          matches: reduce && query.includes('reduced-motion'),
          media: query,
          onchange: null,
          addEventListener: jasmine.createSpy('addEventListener'),
          removeEventListener: jasmine.createSpy('removeEventListener'),
          addListener: jasmine.createSpy('addListener'),
          removeListener: jasmine.createSpy('removeListener'),
          dispatchEvent: jasmine.createSpy('dispatchEvent').and.returnValue(false),
        }) as MediaQueryList,
    );
    fixture = TestBed.createComponent(EffectComponent);
    component = fixture.componentInstance;
  };

  const triggers = () => component.appEventHistory().map((h) => h.trigger);

  it('should create', () => {
    create();
    expect(component).toBeTruthy();
  });

  it('al inicializar, ambos effects corren su ejecucion inicial', () => {
    create();
    fixture.detectChanges();
    fixture.detectChanges();

    expect(triggers()).toContain('effect(1) inicial');
    expect(triggers()).toContain('effect(2) inicial');
  });

  it('subir count1 hace correr el effect(1) corrió (no el effect(2) corrió)', () => {
    create();
    fixture.detectChanges();
    fixture.detectChanges();

    component.upCount();
    expect(component.count()).toBe(1);
    fixture.detectChanges(); // re-ejecuta el effect que lee count
    fixture.detectChanges();

    expect(triggers()).toContain('effect(1) corrió');
    expect(triggers()).not.toContain('effect(2) corrió');
  });

  it('subir count2 hace correr el effect(2) corrió (no el effect(1) corrió)', () => {
    create();
    fixture.detectChanges();
    fixture.detectChanges();

    component.upCount2();
    fixture.detectChanges();
    fixture.detectChanges();

    expect(triggers()).toContain('effect(2) corrió');
    expect(triggers()).not.toContain('effect(1) corrió');
  });

  it('cada effect declara su propia dependencia', () => {
    create();
    expect(component.dependencies()).toEqual(['count']);
    expect(component.dependencies2()).toEqual(['count2']);
  });

  it('Count1 late solo: sin input, tras el intervalo su count sube y effect(1) corre', () => {
    create();
    fixture.detectChanges();
    fixture.detectChanges();
    expect(component.count()).toBe(0);

    jasmine.clock().tick(1400); // pasa un latido (< 1.5s), sin ningun click
    fixture.detectChanges();
    fixture.detectChanges();

    expect(component.count()).toBe(1);
    expect(triggers()).toContain('effect(1) corrió');
    // Count2 sigue quieto: solo Count1 tiene vida propia.
    expect(component.count2()).toBe(0);
  });

  it('con prefers-reduced-motion la vida autónoma se pausa (Count1 no late solo)', () => {
    create(true);
    fixture.detectChanges();
    fixture.detectChanges();

    jasmine.clock().tick(5000); // aunque pase mucho tiempo, sin input no cambia
    fixture.detectChanges();

    expect(component.count()).toBe(0);
  });
});
