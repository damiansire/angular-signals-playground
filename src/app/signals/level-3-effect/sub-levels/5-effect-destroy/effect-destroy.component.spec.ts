import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';

import { EffectDestroyComponent } from './effect-destroy.component';

describe('EffectDestroyComponent', () => {
  let component: EffectDestroyComponent;
  let fixture: ComponentFixture<EffectDestroyComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EffectDestroyComponent],
      providers: [provideZonelessChangeDetection()]
    })
    .compileComponents();

    fixture = TestBed.createComponent(EffectDestroyComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  afterEach(() => {
    clearInterval(component.intervalSave);
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('getFormattedTime formatea HH:mm:ss con padding', () => {
    const date = new Date(2024, 0, 1, 3, 4, 5);
    expect(component.getFormattedTime(date)).toBe('03:04:05');
  });

  it('setAutoRefresh actualiza el signal', () => {
    component.setAutoRefresh(true);
    expect(component.autoRefresh()).toBeTrue();
  });

  it('destroy oculta el componente Y limpia el intervalo (sin leak)', () => {
    jasmine.clock().install();
    try {
      component.setAutoRefresh(true);
      fixture.detectChanges(); // corre el effect -> programa el intervalo
      jasmine.clock().tick(1000);
      const afterFirst = component.appEventHistory().length;
      expect(afterFirst).toBeGreaterThanOrEqual(1);

      component.destroy();
      expect(component.showComponent).toBeFalse();

      // el cleanup detuvo el intervalo: el historial NO crece mas
      jasmine.clock().tick(3000);
      expect(component.appEventHistory().length).toBe(afterFirst);
    } finally {
      jasmine.clock().uninstall();
    }
  });

  it('lines resalta el clearInterval del cleanup', () => {
    const cleanupLine = component
      .lines()
      .find((l) => typeof l.line === 'string' && l.line.includes('clearInterval'));
    expect(cleanupLine?.active).toBeTrue();
  });
});
