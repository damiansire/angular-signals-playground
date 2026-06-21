import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';

import { DestroyBoxComponent } from './destroy-box.component';

describe('DestroyBoxComponent', () => {
  let component: DestroyBoxComponent;
  let fixture: ComponentFixture<DestroyBoxComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DestroyBoxComponent],
      providers: [provideZonelessChangeDetection()]
    })
    .compileComponents();

    fixture = TestBed.createComponent(DestroyBoxComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('arranca con autoRefresh en false y muestra el modo manual', () => {
    expect(component.autoRefresh()).toBeFalse();
    const text = (fixture.nativeElement as HTMLElement).textContent ?? '';
    expect(text).toContain('manually');
    const toggleBtn = fixture.nativeElement.querySelectorAll('button')[1] as HTMLElement;
    expect(toggleBtn.textContent?.trim()).toBe('Enable Auto Refresh');
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

  it('con autoRefresh activo el effect emite newIntervalOutput cada segundo', () => {
    jasmine.clock().install();
    try {
      const emissions: Date[] = [];
      component.newIntervalOutput.subscribe((d) => emissions.push(d));

      component.autoRefresh.set(true);
      fixture.detectChanges(); // corre el effect -> programa el intervalo

      jasmine.clock().tick(1000);
      expect(emissions.length).toBe(1);

      // limpiar el intervalo para no dejar timers vivos
      component.autoRefresh.set(false);
      fixture.detectChanges();
      jasmine.clock().tick(1000);
      expect(emissions.length).toBe(1);
    } finally {
      jasmine.clock().uninstall();
    }
  });
});
