import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { By } from '@angular/platform-browser';

import { EffectDestroyComponent } from './effect-destroy.component';
import { ComponentDestroyComponent } from './component-destroy/component-destroy.component';

describe('EffectDestroyComponent', () => {
  let component: EffectDestroyComponent;
  let fixture: ComponentFixture<EffectDestroyComponent>;

  const hijo = (): ComponentDestroyComponent =>
    fixture.debugElement.query(By.directive(ComponentDestroyComponent)).componentInstance;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EffectDestroyComponent],
      providers: [provideZonelessChangeDetection()],
    }).compileComponents();

    fixture = TestBed.createComponent(EffectDestroyComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  afterEach(() => fixture.destroy());

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('setAutoRefresh actualiza el signal', () => {
    component.setAutoRefresh(true);
    expect(component.autoRefresh()).toBeTrue();
  });

  it('destroy solo saca al hijo: no toca autoRefresh (el mismo destroy que 3/2)', () => {
    component.setAutoRefresh(true);
    component.destroy();
    expect(component.showComponent()).toBeFalse();
    expect(component.autoRefresh()).toBeTrue();
  });

  it('destroy oculta al hijo y su onCleanup frena los latidos (sin leak)', () => {
    jasmine.clock().install();
    try {
      hijo().toggleAutoRefresh();
      fixture.detectChanges(); // corre el effect del hijo -> programa el intervalo
      jasmine.clock().tick(1000);
      expect(component.relojes.latidos()).toBe(1);

      component.destroy();
      fixture.detectChanges(); // el hijo muere -> su effect muere -> onCleanup apaga el intervalo
      expect(fixture.debugElement.query(By.directive(ComponentDestroyComponent))).toBeNull();

      jasmine.clock().tick(3000);
      expect(component.relojes.latidos()).toBe(1);
    } finally {
      jasmine.clock().uninstall();
    }
  });

  it('al destruir la pantalla (navegación) el intervalo también se detiene', () => {
    jasmine.clock().install();
    try {
      hijo().toggleAutoRefresh();
      fixture.detectChanges();
      jasmine.clock().tick(1000);
      const beforeDestroy = component.relojes.latidos();
      expect(beforeDestroy).toBe(1);

      fixture.destroy();
      jasmine.clock().tick(5000);
      expect(component.relojes.latidos()).toBe(beforeDestroy);
    } finally {
      jasmine.clock().uninstall();
    }
  });

  it('lines resalta el onCleanup del clearInterval cuando autoRefresh esta activo', () => {
    component.setAutoRefresh(true);
    const cleanupLine = component
      .lines()
      .find(
        (l) =>
          typeof l.line === 'string' &&
          l.line.includes('onCleanup') &&
          l.line.includes('clearInterval'),
      );
    expect(cleanupLine?.active).toBeTrue();
  });
});
