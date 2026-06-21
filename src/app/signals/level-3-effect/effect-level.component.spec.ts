import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';

import { EffectLevelComponent } from './effect-level.component';

describe('EffectLevelComponent', () => {
  let component: EffectLevelComponent;
  let fixture: ComponentFixture<EffectLevelComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EffectLevelComponent],
      providers: [provideZonelessChangeDetection()]
    })
    .compileComponents();

    fixture = TestBed.createComponent(EffectLevelComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('muestra el titulo Effects via app-title', () => {
    const title = fixture.nativeElement.querySelector('app-title h1') as HTMLElement;
    expect(title.textContent?.trim()).toBe('Effects!');
  });

  it('explica effect() y lista los tres sub-niveles', () => {
    const text = (fixture.nativeElement as HTMLElement).textContent ?? '';
    expect(text).toContain('effect()');
    const items = fixture.nativeElement.querySelectorAll('ul li');
    expect(items.length).toBe(3);
  });
});
