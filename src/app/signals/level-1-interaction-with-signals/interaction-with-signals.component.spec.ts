import { ComponentFixture, TestBed } from '@angular/core/testing';

import { InteractionWithSignalsComponent } from './interaction-with-signals.component';

describe('InteractionWithSignalsComponent', () => {
  let component: InteractionWithSignalsComponent;
  let fixture: ComponentFixture<InteractionWithSignalsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [InteractionWithSignalsComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(InteractionWithSignalsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('muestra el titulo Interactuar con signals via app-title', () => {
    const title = fixture.nativeElement.querySelector('app-title h1') as HTMLElement;
    expect(title.textContent?.trim()).toBe('Interactuar con signals!');
  });

  it('menciona set()/update() y lista los siete sub-niveles', () => {
    const text = (fixture.nativeElement as HTMLElement).textContent ?? '';
    expect(text).toContain('set()');
    expect(text).toContain('update()');
    const items = fixture.nativeElement.querySelectorAll('ul li');
    expect(items.length).toBe(7);
  });
});
