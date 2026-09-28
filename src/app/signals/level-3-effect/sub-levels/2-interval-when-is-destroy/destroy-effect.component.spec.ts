import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { By } from '@angular/platform-browser';

import { DestroyEffectComponent } from './destroy-effect.component';
import { DestroyBoxComponent } from './destroy-box/destroy-box.component';

describe('DestroyEffectComponent', () => {
  let component: DestroyEffectComponent;
  let fixture: ComponentFixture<DestroyEffectComponent>;

  const hijo = (): DestroyBoxComponent =>
    fixture.debugElement.query(By.directive(DestroyBoxComponent)).componentInstance;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DestroyEffectComponent],
      providers: [provideZonelessChangeDetection()],
    }).compileComponents();

    fixture = TestBed.createComponent(DestroyEffectComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  // Destruir el padre apaga lo que el hijo haya dejado latiendo: ningún test deja timers vivos.
  afterEach(() => fixture.destroy());

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('setAutoRefresh actualiza el signal autoRefresh', () => {
    component.setAutoRefresh(true);
    expect(component.autoRefresh()).toBeTrue();
  });

  it('destroy oculta al hijo pero su intervalo sigue latiendo (leak intencional)', () => {
    jasmine.clock().install();
    try {
      hijo().toggleAutoRefresh();
      fixture.detectChanges(); // corre el effect del hijo -> programa el intervalo
      jasmine.clock().tick(1000);
      expect(component.relojes.latidos()).toBe(1);

      component.destroy();
      fixture.detectChanges();
      expect(component.showComponent()).toBeFalse();
      expect(fixture.debugElement.query(By.directive(DestroyBoxComponent))).toBeNull();

      // el hijo ya no existe y su intervalo sigue: los latidos siguen subiendo
      jasmine.clock().tick(2000);
      expect(component.relojes.latidos()).toBe(3);
    } finally {
      jasmine.clock().uninstall();
    }
  });

  it('al salir de la pantalla el padre apaga el intervalo que el hijo filtró', () => {
    jasmine.clock().install();
    try {
      hijo().toggleAutoRefresh();
      fixture.detectChanges();
      component.destroy();
      fixture.detectChanges();
      jasmine.clock().tick(1000);
      const alIrse = component.relojes.latidos();
      expect(alIrse).toBe(1);

      fixture.destroy();
      jasmine.clock().tick(5000);
      expect(component.relojes.latidos()).toBe(alIrse);
    } finally {
      jasmine.clock().uninstall();
    }
  });

  it('lines resalta el comentario del leak (la rama else no corre al destruir)', () => {
    const leakLine = component
      .lines()
      .find((l) => typeof l.line === 'string' && l.line.includes('leak'));
    expect(leakLine?.active).toBeTrue();
  });
});
