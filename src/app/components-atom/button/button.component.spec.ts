import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ButtonComponent } from './button.component';

describe('ButtonComponent', () => {
  let component: ButtonComponent;
  let fixture: ComponentFixture<ButtonComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ButtonComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(ButtonComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('renders the text input inside the button', () => {
    fixture.componentRef.setInput('text', 'Guardar');
    fixture.detectChanges();
    const button: HTMLButtonElement =
      fixture.nativeElement.querySelector('button');
    expect(button.textContent?.trim()).toBe('Guardar');
  });

  it('falls back to the default text when no input is provided', () => {
    const button: HTMLButtonElement =
      fixture.nativeElement.querySelector('button');
    expect(button.textContent?.trim()).toBe('Missing text');
  });

  it('emits "emitido" through clicked when the button is clicked', () => {
    let emitted: string | undefined;
    component.clicked.subscribe((value) => (emitted = value));

    const button: HTMLButtonElement =
      fixture.nativeElement.querySelector('button');
    button.click();

    expect(emitted).toBe('emitido');
  });
});
