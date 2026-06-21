import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ComputedSignalsComponent } from './computed-signals.component';

describe('ComputedSignalsComponent', () => {
  let component: ComputedSignalsComponent;
  let fixture: ComponentFixture<ComputedSignalsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ComputedSignalsComponent]
    })
    .compileComponents();

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
    component.setFirstName({ value: 'Ada' } as HTMLInputElement);
    component.setLastName({ value: 'Lovelace' } as HTMLInputElement);
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

  it('setFirstName con target nulo deja el nombre vacio', () => {
    component.setFirstName(null);
    expect(component.fullName()).toBe(' Sire');
  });
});
