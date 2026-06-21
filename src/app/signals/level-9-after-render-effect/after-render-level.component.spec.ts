import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';

import { AfterRenderLevelComponent } from './after-render-level.component';

describe('AfterRenderLevelComponent', () => {
  let component: AfterRenderLevelComponent;
  let fixture: ComponentFixture<AfterRenderLevelComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AfterRenderLevelComponent],
      providers: [provideZonelessChangeDetection()],
    }).compileComponents();

    fixture = TestBed.createComponent(AfterRenderLevelComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('muestra el titulo del nivel via app-title', () => {
    const title = fixture.nativeElement.querySelector('app-title h1') as HTMLElement;
    expect(title.textContent?.trim()).toBe('afterRenderEffect y onCleanup!');
  });

  it('menciona afterRenderEffect()/onCleanup() y lista los dos sub-niveles', () => {
    const text = (fixture.nativeElement as HTMLElement).textContent ?? '';
    expect(text).toContain('afterRenderEffect()');
    expect(text).toContain('onCleanup()');
    const items = fixture.nativeElement.querySelectorAll('ul li');
    expect(items.length).toBe(2);
  });
});
