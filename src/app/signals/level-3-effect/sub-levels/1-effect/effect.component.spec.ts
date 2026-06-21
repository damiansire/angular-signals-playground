import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';

import { EffectComponent } from './effect.component';

describe('EffectComponent', () => {
  let component: EffectComponent;
  let fixture: ComponentFixture<EffectComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EffectComponent],
      providers: [provideZonelessChangeDetection()],
    }).compileComponents();

    fixture = TestBed.createComponent(EffectComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  const triggers = () => component.appEventHistory().map((h) => h.trigger);

  it('al inicializar, ambos effects corren su ejecucion inicial', () => {
    fixture.detectChanges();
    fixture.detectChanges();

    expect(triggers()).toContain('effect(1) inicial');
    expect(triggers()).toContain('effect(2) inicial');
  });

  it('subir count1 hace correr el effect(1) corrió (no el effect(2) corrió)', () => {
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
    fixture.detectChanges();
    fixture.detectChanges();

    component.upCount2();
    fixture.detectChanges();
    fixture.detectChanges();

    expect(triggers()).toContain('effect(2) corrió');
    expect(triggers()).not.toContain('effect(1) corrió');
  });

  it('cada effect declara su propia dependencia', () => {
    expect(component.dependencies()).toEqual(['count']);
    expect(component.dependencies2()).toEqual(['count2']);
  });
});
