import { ComponentFixture, TestBed } from '@angular/core/testing';

import { InputComponent } from './input.component';

describe('InputComponent', () => {
  let component: InputComponent;
  let fixture: ComponentFixture<InputComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [InputComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(InputComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('no muestra label cuando text esta vacio', () => {
    const label = fixture.nativeElement.querySelector('label');
    expect(label).toBeNull();
  });

  it('muestra el label con el texto del input text', () => {
    fixture.componentRef.setInput('text', 'Nombre');
    fixture.detectChanges();
    const label = fixture.nativeElement.querySelector('label') as HTMLElement;
    expect(label).toBeTruthy();
    expect(label.textContent?.trim()).toBe('Nombre');
  });

  it('usa placeholder cuando esta definido, sino cae a text', () => {
    const input = fixture.nativeElement.querySelector('input') as HTMLInputElement;
    fixture.componentRef.setInput('text', 'Apellido');
    fixture.detectChanges();
    expect(input.placeholder).toBe('Apellido');

    fixture.componentRef.setInput('placeholder', 'Escriba aqui');
    fixture.detectChanges();
    expect(input.placeholder).toBe('Escriba aqui');
  });

  it('emite valueChange con el valor del input al disparar change', () => {
    let received: string | undefined;
    component.valueChange.subscribe((v) => (received = v));

    const input = fixture.nativeElement.querySelector('input') as HTMLInputElement;
    input.value = 'hola';
    input.dispatchEvent(new Event('change'));

    expect(received).toBe('hola');
  });
});
