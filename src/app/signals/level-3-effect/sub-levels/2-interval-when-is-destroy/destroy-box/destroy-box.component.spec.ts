import { ComponentFixture, TestBed } from '@angular/core/testing';
import { DestroyRef, provideZonelessChangeDetection } from '@angular/core';

import { DestroyBoxComponent } from './destroy-box.component';
import { RelojesDelHijo } from '../../../relojes-del-hijo';

describe('DestroyBoxComponent', () => {
  let component: DestroyBoxComponent;
  let fixture: ComponentFixture<DestroyBoxComponent>;
  let relojes: RelojesDelHijo;
  // El padre de mentira: el test decide cuándo se va y apaga lo que el hijo dejó latiendo.
  let irsePadre: () => void;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DestroyBoxComponent],
      providers: [provideZonelessChangeDetection()],
    }).compileComponents();

    const padre: Pick<DestroyRef, 'onDestroy'> = {
      onDestroy: (callback) => {
        irsePadre = callback;
        return () => undefined;
      },
    };
    relojes = new RelojesDelHijo(padre);
    fixture = TestBed.createComponent(DestroyBoxComponent);
    fixture.componentRef.setInput('relojes', relojes);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  afterEach(() => irsePadre());

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('arranca con autoRefresh en false y el botón ofrece prender el intervalo', () => {
    expect(component.autoRefresh()).toBeFalse();
    const toggleBtn = fixture.nativeElement.querySelectorAll('button')[1] as HTMLElement;
    expect(toggleBtn.textContent?.trim()).toBe('Prender intervalo');
  });

  it('refreshTime actualiza la hora mostrada', () => {
    const before = component.currentTime();
    const later = new Date(before.getTime() + 5000);
    jasmine.clock().install();
    jasmine.clock().mockDate(later);
    component.refreshTime();
    jasmine.clock().uninstall();
    expect(component.currentTime().getTime()).toBe(later.getTime());
  });

  it('toggleAutoRefresh emite el nuevo estado y lo invierte', () => {
    let emitted: boolean | undefined;
    component.autoRefreshEvent.subscribe((v) => (emitted = v));

    component.toggleAutoRefresh();
    expect(emitted).toBeTrue();
    expect(component.autoRefresh()).toBeTrue();

    component.toggleAutoRefresh();
    expect(emitted).toBeFalse();
    expect(component.autoRefresh()).toBeFalse();
  });

  it('con el intervalo prendido late sobre los relojes del padre, y apagarlo lo frena', () => {
    jasmine.clock().install();
    try {
      component.autoRefresh.set(true);
      fixture.detectChanges(); // corre el effect -> programa el intervalo

      jasmine.clock().tick(1000);
      expect(relojes.latidos()).toBe(1);

      component.autoRefresh.set(false);
      fixture.detectChanges();
      jasmine.clock().tick(1000);
      expect(relojes.latidos()).toBe(1);
    } finally {
      jasmine.clock().uninstall();
    }
  });

  // El leak es la lección y se queda. Lo que no puede pasar es que el intervalo huérfano le hable
  // a un output del componente muerto: eso era el NG0953 que llenaba la consola cada segundo.
  it('destruido con el intervalo prendido, sigue latiendo (leak) sin emitir a un output muerto', () => {
    const warn = spyOn(console, 'warn');
    jasmine.clock().install();
    try {
      component.autoRefresh.set(true);
      fixture.detectChanges();
      jasmine.clock().tick(1000);

      fixture.destroy();
      jasmine.clock().tick(2000);
      expect(relojes.latidos()).toBe(3);

      const ng0953 = warn.calls.allArgs().filter((args) => String(args[0]).includes('NG0953'));
      expect(ng0953).toEqual([]);

      // Y cuando el padre se va, lo filtrado se apaga con él.
      irsePadre();
      jasmine.clock().tick(3000);
      expect(relojes.latidos()).toBe(3);
    } finally {
      jasmine.clock().uninstall();
    }
  });
});
