import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';

import { AfterRenderEffectComponent } from './after-render-effect.component';

describe('AfterRenderEffectComponent', () => {
  let component: AfterRenderEffectComponent;
  let fixture: ComponentFixture<AfterRenderEffectComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AfterRenderEffectComponent],
      providers: [provideZonelessChangeDetection()],
    }).compileComponents();

    fixture = TestBed.createComponent(AfterRenderEffectComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('actualiza el texto a medir', () => {
    const input = fixture.nativeElement.querySelector('input') as HTMLInputElement;
    input.value = 'hola';
    input.dispatchEvent(new Event('input'));
    expect(component.text()).toBe('hola');
  });
});
