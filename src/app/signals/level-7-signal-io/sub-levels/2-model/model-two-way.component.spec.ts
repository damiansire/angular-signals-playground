import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';

import { ModelTwoWayComponent } from './model-two-way.component';

describe('ModelTwoWayComponent', () => {
  let component: ModelTwoWayComponent;
  let fixture: ComponentFixture<ModelTwoWayComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ModelTwoWayComponent],
      providers: [provideZonelessChangeDetection()],
    }).compileComponents();

    fixture = TestBed.createComponent(ModelTwoWayComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('resetea el valor desde el padre', () => {
    expect(component.rating()).toBe(3);
    component.reset();
    expect(component.rating()).toBe(0);
  });
});
