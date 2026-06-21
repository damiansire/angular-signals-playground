import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ComputedSignalsLevelComponent } from './computed-signals.component';

describe('ComputedSignalsLevelComponent', () => {
  let component: ComputedSignalsLevelComponent;
  let fixture: ComponentFixture<ComputedSignalsLevelComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ComputedSignalsLevelComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(ComputedSignalsLevelComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('muestra el titulo del nivel via app-title', () => {
    const title = fixture.nativeElement.querySelector('app-title h1') as HTMLElement;
    expect(title.textContent?.trim()).toBe('Computed signals!');
  });

  it('explica computed() y lista los tres sub-niveles', () => {
    const text = (fixture.nativeElement as HTMLElement).textContent ?? '';
    expect(text).toContain('computed()');
    const items = fixture.nativeElement.querySelectorAll('ul li');
    expect(items.length).toBe(3);
  });
});
