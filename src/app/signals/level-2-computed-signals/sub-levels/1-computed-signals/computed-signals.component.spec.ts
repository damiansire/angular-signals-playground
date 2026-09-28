import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';

import { ComputedSignalsComponent } from './computed-signals.component';

describe('ComputedSignalsComponent', () => {
  let component: ComputedSignalsComponent;
  let fixture: ComponentFixture<ComputedSignalsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ComputedSignalsComponent],
      providers: [provideZonelessChangeDetection()],
    }).compileComponents();

    fixture = TestBed.createComponent(ComputedSignalsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('fullName computa el saludo inicial y lo muestra', () => {
    expect(component.fullName()).toBe('Damian Sire');
    const text = (fixture.nativeElement as HTMLElement).textContent ?? '';
    expect(text).toContain('Hola, Damian Sire!');
  });

  it('setFirstName/setLastName recalculan el computed fullName', () => {
    const first = document.createElement('input');
    first.value = 'Ada';
    const last = document.createElement('input');
    last.value = 'Lovelace';
    component.setFirstName(first);
    component.setLastName(last);
    fixture.detectChanges();

    expect(component.fullName()).toBe('Ada Lovelace');
    const text = (fixture.nativeElement as HTMLElement).textContent ?? '';
    expect(text).toContain('Hola, Ada Lovelace!');
  });

  it('escribir en los inputs actualiza el saludo en pantalla', () => {
    const inputs = fixture.nativeElement.querySelectorAll('input');
    (inputs[0] as HTMLInputElement).value = 'Grace';
    inputs[0].dispatchEvent(new Event('input'));
    (inputs[1] as HTMLInputElement).value = 'Hopper';
    inputs[1].dispatchEvent(new Event('input'));
    fixture.detectChanges();

    expect(component.fullName()).toBe('Grace Hopper');
  });

  it('cada rótulo está asociado a su input', () => {
    const labels = Array.from(
      (fixture.nativeElement as HTMLElement).querySelectorAll('label'),
    ) as HTMLLabelElement[];
    expect(labels.length).toBe(2);
    for (const label of labels) {
      expect(label.control).withContext(label.htmlFor).toBeInstanceOf(HTMLInputElement);
    }
  });

  // Si el input arranca vacío mientras el saludo dice "Damian Sire", el primer tecleo lo pisa y
  // el saludo salta a "D Sire": el computed parece romperse en el momento de mostrarlo.
  it('los inputs arrancan con el valor de sus signals', () => {
    const inputs = fixture.nativeElement.querySelectorAll('input');
    expect((inputs[0] as HTMLInputElement).value).toBe('Damian');
    expect((inputs[1] as HTMLInputElement).value).toBe('Sire');
  });

  it('seguir escribiendo extiende el nombre precargado', () => {
    const first = fixture.nativeElement.querySelector('input') as HTMLInputElement;
    first.value += 'a';
    first.dispatchEvent(new Event('input'));
    fixture.detectChanges();

    expect(component.fullName()).toBe('Damiana Sire');
    expect(first.value).toBe('Damiana');
  });

  it('un cambio del signal llega al input', () => {
    component.surname.set('Lovelace');
    fixture.detectChanges();
    const inputs = fixture.nativeElement.querySelectorAll('input');
    expect((inputs[1] as HTMLInputElement).value).toBe('Lovelace');
  });

  it('setFirstName con target nulo deja el nombre vacio', () => {
    component.setFirstName(null);
    expect(component.fullName()).toBe(' Sire');
  });
});
