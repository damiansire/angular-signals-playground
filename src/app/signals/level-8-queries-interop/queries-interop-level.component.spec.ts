import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';

import { QueriesInteropLevelComponent } from './queries-interop-level.component';

describe('QueriesInteropLevelComponent', () => {
  let component: QueriesInteropLevelComponent;
  let fixture: ComponentFixture<QueriesInteropLevelComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [QueriesInteropLevelComponent],
      providers: [provideZonelessChangeDetection()],
    }).compileComponents();

    fixture = TestBed.createComponent(QueriesInteropLevelComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('muestra el titulo del nivel via app-title', () => {
    const title = fixture.nativeElement.querySelector('app-title h1') as HTMLElement;
    expect(title.textContent?.trim()).toBe('Queries e interop con RxJS!');
  });

  it('menciona viewChild()/toSignal() y lista los dos sub-niveles', () => {
    const text = (fixture.nativeElement as HTMLElement).textContent ?? '';
    expect(text).toContain('viewChild()');
    expect(text).toContain('toSignal()');
    const items = fixture.nativeElement.querySelectorAll('ul li');
    expect(items.length).toBe(2);
  });
});
