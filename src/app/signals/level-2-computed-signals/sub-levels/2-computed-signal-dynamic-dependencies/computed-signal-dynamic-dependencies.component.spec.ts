import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';

import { ComputedSignalDynamicDependenciesComponent } from './computed-signal-dynamic-dependencies.component';

describe('ComputedSignalDynamicDependenciesComponent', () => {
  let component: ComputedSignalDynamicDependenciesComponent;
  let fixture: ComponentFixture<ComputedSignalDynamicDependenciesComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ComputedSignalDynamicDependenciesComponent],
      providers: [provideZonelessChangeDetection()]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ComputedSignalDynamicDependenciesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('con showCount en false conditionalCount no muestra el count', () => {
    expect(component.showCount()).toBeFalse();
    expect(component.conditionalCount()).toBe('Nothing to see here!');
  });

  it('al activar showCount el computed pasa a depender de count', () => {
    expect(component.dependencies()).toEqual(['showCount']);

    component.onShowCountChange();
    expect(component.showCount()).toBeTrue();
    expect(component.dependencies()).toEqual(['showCount', 'count']);
    expect(component.conditionalCount()).toBe('The count is 0.');
  });

  it('con showCount en false subir count NO registra recomputo de conditionalCount', () => {
    component.upCount();
    expect(component.count()).toBe(1);
    // conditionalCount no se registra porque showCount es false
    expect(component.conditionalCountHistory().length).toBe(0);
    expect(component.appEventHistory().length).toBe(1);
  });

  it('con showCount en true subir count recomputa conditionalCount', () => {
    component.onShowCountChange(); // showCount -> true (registra 1 recomputo)
    component.upCount();
    expect(component.conditionalCount()).toBe('The count is 1.');
    expect(component.conditionalCountHistory().length).toBe(2);
  });
});
