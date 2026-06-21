import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';

import { DestroyEffectComponent } from './destroy-effect.component';

describe('DestroyEffectComponent', () => {
  let component: DestroyEffectComponent;
  let fixture: ComponentFixture<DestroyEffectComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DestroyEffectComponent],
      providers: [provideZonelessChangeDetection()],
    }).compileComponents();

    fixture = TestBed.createComponent(DestroyEffectComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  afterEach(() => {
    // el componente demuestra un leak: limpiamos a mano para no dejar timers vivos
    clearInterval(component.intervalSave);
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('getFormattedTime formatea HH:mm:ss con padding', () => {
    const date = new Date(2024, 0, 1, 9, 5, 7);
    expect(component.getFormattedTime(date)).toBe('09:05:07');
  });

  it('setAutoRefresh actualiza el signal autoRefresh', () => {
    component.setAutoRefresh(true);
    expect(component.autoRefresh()).toBeTrue();
  });

  it('destroy oculta el componente pero NO limpia el intervalo (leak intencional)', () => {
    jasmine.clock().install();
    try {
      component.setAutoRefresh(true);
      fixture.detectChanges(); // corre el effect -> programa el intervalo
      jasmine.clock().tick(1000);
      const afterFirst = component.appEventHistory().length;
      expect(afterFirst).toBeGreaterThanOrEqual(1);

      component.destroy();
      expect(component.showComponent).toBeFalse();

      // el intervalo sigue vivo: el historial sigue creciendo
      jasmine.clock().tick(1000);
      expect(component.appEventHistory().length).toBeGreaterThan(afterFirst);
    } finally {
      jasmine.clock().uninstall();
    }
  });

  it('lines resalta el comentario del leak (no limpiamos el intervalo)', () => {
    const leakLine = component
      .lines()
      .find((l) => typeof l.line === 'string' && l.line.includes('leak'));
    expect(leakLine?.active).toBeTrue();
  });
});
