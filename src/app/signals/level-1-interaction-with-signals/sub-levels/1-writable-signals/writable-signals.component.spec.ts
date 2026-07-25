import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';

import { WritableSignalsComponent } from './writable-signals.component';

describe('WritableSignalsComponent', () => {
  let component: WritableSignalsComponent;
  let fixture: ComponentFixture<WritableSignalsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [WritableSignalsComponent],
      providers: [provideZonelessChangeDetection()],
    }).compileComponents();

    fixture = TestBed.createComponent(WritableSignalsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('arranca el contador en 0 y lo muestra en pantalla', () => {
    expect(component.count()).toBe(0);
    const text = (fixture.nativeElement as HTMLElement).textContent ?? '';
    expect(text).toContain('Valor: 0');
  });

  it('setValue toma el numero del input y lo asigna al signal', () => {
    component.signalSetInput().nativeElement.value = '42';
    component.setValue();
    fixture.detectChanges();
    expect(component.count()).toBe(42);
    const text = (fixture.nativeElement as HTMLElement).textContent ?? '';
    expect(text).toContain('Valor: 42');
  });

  it('setValue rechaza lo que no es un numero y lo avisa en pantalla', () => {
    component.count.set(7);
    component.signalSetInput().nativeElement.value = 'abc';
    component.setValue();
    fixture.detectChanges();
    expect(component.count()).toBe(7);
    expect(component.rejected()).toBeTrue();
    const text = (fixture.nativeElement as HTMLElement).textContent ?? '';
    expect(text).toContain('Escribí un número');
  });

  it('setValue rechaza el input vacio en vez de escribir NaN', () => {
    component.count.set(7);
    component.signalSetInput().nativeElement.value = '';
    component.setValue();
    expect(component.count()).toBe(7);
    expect(component.rejected()).toBeTrue();
  });

  it('escribir de nuevo borra el aviso de rechazo', () => {
    component.signalSetInput().nativeElement.value = '';
    component.setValue();
    expect(component.rejected()).toBeTrue();
    component.clearRejected();
    expect(component.rejected()).toBeFalse();
  });
});
