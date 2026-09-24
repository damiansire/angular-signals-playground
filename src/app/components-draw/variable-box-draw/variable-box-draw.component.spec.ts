import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';

import { VariableBoxDrawComponent } from './variable-box-draw.component';

describe('VariableBoxDrawComponent', () => {
  let component: VariableBoxDrawComponent;
  let fixture: ComponentFixture<VariableBoxDrawComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [VariableBoxDrawComponent],
      providers: [provideZonelessChangeDetection()],
    }).compileComponents();

    fixture = TestBed.createComponent(VariableBoxDrawComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('muestra variableName en el span', () => {
    fixture.componentRef.setInput('variableName', 'total');
    fixture.detectChanges();
    const span = fixture.nativeElement.querySelector('span') as HTMLElement;
    expect(span.textContent?.trim()).toBe('total');
  });

  it('emite clicked con el nombre de la variable al hacer click', () => {
    let payload: { name: string; value: string } | undefined;
    component.clicked.subscribe((p) => (payload = p));
    fixture.componentRef.setInput('variableName', 'total');
    fixture.detectChanges();

    const box = fixture.nativeElement.querySelector('[role="button"]') as HTMLElement;
    box.click();

    expect(payload).toEqual({ name: 'total', value: '' });
  });

  it('emite clicked con Enter y con Espacio, como un botón nativo', () => {
    let emitted = 0;
    component.clicked.subscribe(() => emitted++);

    const box = fixture.nativeElement.querySelector('[role="button"]') as HTMLElement;
    box.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter' }));
    const espacio = new KeyboardEvent('keydown', { key: ' ', cancelable: true });
    box.dispatchEvent(espacio);

    expect(emitted).toBe(2);
    expect(espacio.defaultPrevented).withContext('Espacio no scrollea la página').toBeTrue();
  });
});
