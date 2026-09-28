import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';

import { SignalFormsComponent } from './signal-forms.component';

describe('SignalFormsComponent', () => {
  let component: SignalFormsComponent;
  let fixture: ComponentFixture<SignalFormsComponent>;
  let host: HTMLElement;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SignalFormsComponent],
      providers: [provideZonelessChangeDetection()],
    }).compileComponents();

    fixture = TestBed.createComponent(SignalFormsComponent);
    component = fixture.componentInstance;
    host = fixture.nativeElement as HTMLElement;
    await fixture.whenStable();
  });

  const input = (id: string) => host.querySelector<HTMLInputElement>(`#sgf-${id}`)!;
  const sumar = () => host.querySelector<HTMLButtonElement>('.sgf-sumar')!;
  const errores = () =>
    Array.from(host.querySelectorAll('.sgf-error')).map((e) => e.textContent?.trim());
  const flagsDe = (id: string) =>
    Array.from(input(id).parentElement!.querySelectorAll('.sgf-flag--on code')).map(
      (e) => e.textContent,
    );

  async function tipear(id: string, texto: string) {
    input(id).value = texto;
    input(id).dispatchEvent(new Event('input'));
    await fixture.whenStable();
  }

  async function salir(id: string) {
    input(id).dispatchEvent(new Event('blur'));
    await fixture.whenStable();
  }

  it('arranca vacío, inválido y con el botón apagado', () => {
    expect(component.modelo()).toEqual({ nombre: '', correo: '' });
    expect(component.tripulante().valid()).toBe(false);
    expect(sumar().disabled).toBe(true);
  });

  it('el input escribe en el signal del modelo, que es la fuente de verdad', async () => {
    await tipear('nombre', 'Ana');
    expect(component.modelo().nombre).toBe('Ana');
    expect(component.tripulante.nombre().value()).toBe('Ana');
    expect(host.querySelector('.sgf-modelo-val')?.textContent).toContain('nombre: "Ana"');
  });

  it('y al revés: escribir el modelo actualiza el input', async () => {
    component.modelo.set({ nombre: 'Leo', correo: 'leo@nave.io' });
    await fixture.whenStable();
    expect(input('nombre').value).toBe('Leo');
    expect(input('correo').value).toBe('leo@nave.io');
  });

  it('cada campo prende su propio estado: dirty al tipear, touched al salir', async () => {
    expect(flagsDe('correo')).toEqual([]);
    await tipear('correo', 'ana');
    expect(flagsDe('correo')).toEqual(['dirty']);
    await salir('correo');
    expect(flagsDe('correo')).toEqual(['touched', 'dirty']);
    // El otro campo no se enteró: el estado es por FieldTree, no del form entero.
    expect(flagsDe('nombre')).toEqual([]);
  });

  it('los errores aparecen al salir del campo y se van solos al corregir', async () => {
    await tipear('correo', 'ana');
    expect(errores()).toEqual([]);
    await salir('correo');
    expect(errores()).toEqual(['Correo inválido']);

    await tipear('correo', 'ana@nave.io');
    expect(errores()).toEqual([]);
    expect(flagsDe('correo')).toContain('valid');
  });

  it('cada regla del schema da su propio error, de a uno por vez', async () => {
    await salir('nombre');
    expect(errores()).toEqual(['Falta el nombre']);
    await tipear('nombre', 'A');
    expect(errores()).toEqual(['Mínimo 2 letras']);
    await tipear('nombre', 'Ana');
    expect(errores()).toEqual([]);
  });

  it('la validez se deriva en vivo: el botón sigue al modelo en las dos direcciones', async () => {
    await tipear('nombre', 'Ana');
    await tipear('correo', 'ana@nave.io');
    expect(sumar().disabled).toBe(false);

    // Romper el correo después de haberlo tenido bien vuelve a apagar el botón, sin enviar nada.
    await tipear('correo', 'ana@');
    expect(sumar().disabled).toBe(true);
  });

  it('sumar a bordo saca al tripulante por el borde y deja el form limpio', async () => {
    await tipear('nombre', 'Ana');
    await tipear('correo', 'ana@nave.io');
    await salir('correo');
    sumar().click();
    await fixture.whenStable();

    expect(component.tripulacion()).toEqual(['Ana']);
    expect(host.querySelector('.sgf-tripulante')?.textContent?.trim()).toBe('Ana');
    expect(component.modelo()).toEqual({ nombre: '', correo: '' });
    expect(input('nombre').value).toBe('');
    expect(component.tripulante().touched()).toBe(false);
    expect(component.tripulante().dirty()).toBe(false);
    expect(errores()).toEqual([]);
  });

  it('con el form inválido, sumar() no deja pasar a nadie', () => {
    component.sumar();
    expect(component.tripulacion()).toEqual([]);
  });

  it('cierra con el desafío de la validez derivada', () => {
    expect(host.querySelector('app-manipulable-system')).not.toBeNull();
  });
});
