import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TextDescriptionComponent } from './text-description.component';

describe('TextDescriptionComponent', () => {
  let component: TextDescriptionComponent;
  let fixture: ComponentFixture<TextDescriptionComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TextDescriptionComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(TextDescriptionComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('arranca con el parrafo vacio por defecto', () => {
    const p = fixture.nativeElement.querySelector('p') as HTMLElement;
    expect(p).toBeTruthy();
    expect(p.textContent?.trim()).toBe('');
  });

  it('refleja el input text en el parrafo', () => {
    fixture.componentRef.setInput('text', 'Una descripcion de prueba');
    fixture.detectChanges();
    const p = fixture.nativeElement.querySelector('p') as HTMLElement;
    expect(p.textContent?.trim()).toBe('Una descripcion de prueba');
  });
});
