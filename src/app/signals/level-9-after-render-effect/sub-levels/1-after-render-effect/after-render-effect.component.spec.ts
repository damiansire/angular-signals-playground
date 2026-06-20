import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AfterRenderEffectComponent } from './after-render-effect.component';

describe('AfterRenderEffectComponent', () => {
  let component: AfterRenderEffectComponent;
  let fixture: ComponentFixture<AfterRenderEffectComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AfterRenderEffectComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(AfterRenderEffectComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('actualiza el texto a medir', () => {
    component.setText('hola');
    expect(component.text()).toBe('hola');
  });
});
