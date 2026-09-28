import { ComponentFixture, TestBed } from '@angular/core/testing';
import { DestroyRef, provideZonelessChangeDetection } from '@angular/core';

import { ComponentDestroyComponent } from './component-destroy.component';
import { RelojesDelHijo } from '../../../relojes-del-hijo';

describe('ComponentDestroyComponent', () => {
  let component: ComponentDestroyComponent;
  let fixture: ComponentFixture<ComponentDestroyComponent>;
  let relojes: RelojesDelHijo;
  let irsePadre: () => void;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ComponentDestroyComponent],
      providers: [provideZonelessChangeDetection()],
    }).compileComponents();

    const padre: Pick<DestroyRef, 'onDestroy'> = {
      onDestroy: (callback) => {
        irsePadre = callback;
        return () => undefined;
      },
    };
    relojes = new RelojesDelHijo(padre);
    fixture = TestBed.createComponent(ComponentDestroyComponent);
    fixture.componentRef.setInput('relojes', relojes);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  afterEach(() => irsePadre());

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('arranca con autoRefresh false y sin latidos', () => {
    expect(component.autoRefresh()).toBeFalse();
    expect(relojes.latidos()).toBe(0);
  });

  it('toggleAutoRefresh emite el nuevo estado y lo invierte', () => {
    let emitted: boolean | undefined;
    component.autoRefreshEvent.subscribe((v) => (emitted = v));

    component.toggleAutoRefresh();
    expect(emitted).toBeTrue();
    expect(component.autoRefresh()).toBeTrue();
  });

  it('con el intervalo prendido late sobre los relojes del padre, y apagarlo lo frena', () => {
    jasmine.clock().install();
    try {
      component.autoRefresh.set(true);
      fixture.detectChanges(); // corre el effect -> programa el intervalo

      jasmine.clock().tick(2000);
      expect(relojes.latidos()).toBe(2);

      component.autoRefresh.set(false);
      fixture.detectChanges(); // re-corre el effect -> onCleanup apaga el intervalo
      jasmine.clock().tick(2000);
      expect(relojes.latidos()).toBe(2);
    } finally {
      jasmine.clock().uninstall();
    }
  });

  // El contraste con 3/2: el padre sigue vivo (no se llama irsePadre) y aun así el intervalo muere,
  // porque el onCleanup corre cuando el effect se destruye con el componente.
  it('destruido con el intervalo prendido, onCleanup lo apaga sin ayuda del padre', () => {
    jasmine.clock().install();
    try {
      component.autoRefresh.set(true);
      fixture.detectChanges();
      jasmine.clock().tick(1000);

      fixture.destroy();
      jasmine.clock().tick(3000);
      expect(relojes.latidos()).toBe(1);
    } finally {
      jasmine.clock().uninstall();
    }
  });
});
