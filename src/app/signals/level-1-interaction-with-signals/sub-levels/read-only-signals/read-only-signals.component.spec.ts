import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ReadOnlySignalsComponent } from './read-only-signals.component';

describe('ReadOnlySignalsComponent', () => {
  let component: ReadOnlySignalsComponent;
  let fixture: ComponentFixture<ReadOnlySignalsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ReadOnlySignalsComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ReadOnlySignalsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('expone un signal de solo lectura que refleja los cambios internos', () => {
    expect(component.count()).toBe(0);
    component.increment();
    component.increment();
    expect(component.count()).toBe(2);
    component.reset();
    expect(component.count()).toBe(0);
  });

  it('el signal expuesto no tiene metodo set (solo lectura)', () => {
    expect((component.count as unknown as { set?: unknown }).set).toBeUndefined();
  });
});
