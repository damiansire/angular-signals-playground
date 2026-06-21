import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TitleComponent } from './title.component';

describe('TitleComponent', () => {
  let component: TitleComponent;
  let fixture: ComponentFixture<TitleComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TitleComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(TitleComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('renderiza el title por defecto con signo de exclamacion', () => {
    const h1 = fixture.nativeElement.querySelector('h1') as HTMLElement;
    expect(h1.textContent?.trim()).toBe('Missing Title!');
  });

  it('refleja el input title en el template', () => {
    fixture.componentRef.setInput('title', 'Hola Signals');
    fixture.detectChanges();
    const h1 = fixture.nativeElement.querySelector('h1') as HTMLElement;
    expect(h1.textContent?.trim()).toBe('Hola Signals!');
  });

  it('aplica text-4xl como tamano por defecto y refleja textSize', () => {
    const h1 = fixture.nativeElement.querySelector('h1') as HTMLElement;
    expect(h1.classList).toContain('text-4xl');

    fixture.componentRef.setInput('textSize', 'text-lg');
    fixture.detectChanges();
    expect(h1.classList).toContain('text-lg');
    expect(h1.classList).not.toContain('text-4xl');
  });
});
