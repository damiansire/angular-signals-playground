import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SignalEqualityLevelComponent } from './signal-equality-level.component';

describe('SignalEqualityLevelComponent', () => {
  let component: SignalEqualityLevelComponent;
  let fixture: ComponentFixture<SignalEqualityLevelComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SignalEqualityLevelComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(SignalEqualityLevelComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('muestra el titulo del nivel via app-title', () => {
    const title = fixture.nativeElement.querySelector('app-title h1') as HTMLElement;
    expect(title.textContent?.trim()).toBe('Funciones de igualdad!');
  });

  it('menciona Object.is y lista los dos sub-niveles', () => {
    const text = (fixture.nativeElement as HTMLElement).textContent ?? '';
    expect(text).toContain('Object.is');
    const items = fixture.nativeElement.querySelectorAll('ul li');
    expect(items.length).toBe(2);
  });
});
