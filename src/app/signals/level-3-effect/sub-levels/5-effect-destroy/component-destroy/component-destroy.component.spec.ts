import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';

import { ComponentDestroyComponent } from './component-destroy.component';

describe('ComponentDestroyComponent', () => {
  let component: ComponentDestroyComponent;
  let fixture: ComponentFixture<ComponentDestroyComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ComponentDestroyComponent],
      providers: [provideZonelessChangeDetection()]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ComponentDestroyComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  afterEach(() => {
    clearInterval(component.intervalSave);
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('arranca con autoRefresh false y count en 0', () => {
    expect(component.autoRefresh()).toBeFalse();
    expect(component.count()).toBe(0);
  });

  it('toggleAutoRefresh emite el nuevo estado y lo invierte', () => {
    let emitted: boolean | undefined;
    component.autoRefreshEvent.subscribe((v) => (emitted = v));

    component.toggleAutoRefresh();
    expect(emitted).toBeTrue();
    expect(component.autoRefresh()).toBeTrue();
  });

  it('con autoRefresh activo el effect incrementa count y emite cada segundo', () => {
    jasmine.clock().install();
    try {
      const emissions: Date[] = [];
      component.newIntervalOutput.subscribe((d) => emissions.push(d));

      component.autoRefresh.set(true);
      fixture.detectChanges(); // corre el effect -> programa el intervalo

      jasmine.clock().tick(2000);
      expect(component.count()).toBe(2);
      expect(emissions.length).toBe(2);

      component.autoRefresh.set(false);
      fixture.detectChanges();
      jasmine.clock().tick(2000);
      expect(component.count()).toBe(2);
    } finally {
      jasmine.clock().uninstall();
    }
  });
});
