import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SignalIoLevelComponent } from './signal-io-level.component';

describe('SignalIoLevelComponent', () => {
  let component: SignalIoLevelComponent;
  let fixture: ComponentFixture<SignalIoLevelComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SignalIoLevelComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(SignalIoLevelComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('muestra el titulo input/model/output via app-title', () => {
    const title = fixture.nativeElement.querySelector('app-title h1') as HTMLElement;
    expect(title.textContent?.trim()).toBe('input() · model() · output()!');
  });

  it('menciona input()/output() y lista los dos sub-niveles', () => {
    const text = (fixture.nativeElement as HTMLElement).textContent ?? '';
    expect(text).toContain('input()');
    expect(text).toContain('output()');
    const items = fixture.nativeElement.querySelectorAll('ul li');
    expect(items.length).toBe(2);
  });
});
