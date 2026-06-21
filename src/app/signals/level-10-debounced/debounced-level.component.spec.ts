import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DebouncedLevelComponent } from './debounced-level.component';

describe('DebouncedLevelComponent', () => {
  let component: DebouncedLevelComponent;
  let fixture: ComponentFixture<DebouncedLevelComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DebouncedLevelComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(DebouncedLevelComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('muestra el titulo Signals debounced via app-title', () => {
    const title = fixture.nativeElement.querySelector('app-title h1') as HTMLElement;
    expect(title.textContent?.trim()).toBe('Signals debounced!');
  });

  it('menciona RxJS y lista los dos sub-niveles', () => {
    const text = (fixture.nativeElement as HTMLElement).textContent ?? '';
    expect(text).toContain('RxJS');
    const items = fixture.nativeElement.querySelectorAll('ul li');
    expect(items.length).toBe(2);
  });
});
