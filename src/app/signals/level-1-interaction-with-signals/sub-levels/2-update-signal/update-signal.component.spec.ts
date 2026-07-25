import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';

import { UpdateSignalComponent } from './update-signal.component';

describe('UpdateSignalComponent', () => {
  let component: UpdateSignalComponent;
  let fixture: ComponentFixture<UpdateSignalComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [UpdateSignalComponent],
      providers: [provideZonelessChangeDetection()],
    }).compileComponents();

    fixture = TestBed.createComponent(UpdateSignalComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('arranca en 0 y lo muestra como Valor', () => {
    expect(component.count()).toBe(0);
    const text = (fixture.nativeElement as HTMLElement).textContent ?? '';
    expect(text).toContain('Valor: 0');
  });

  it('al hacer click en Incrementar sube el contador y se refleja en pantalla', () => {
    // El primer <button> es la mascota de la pista: apuntamos al de "Incrementar" por su texto.
    const button = [...fixture.nativeElement.querySelectorAll('button')].find((b) =>
      (b.textContent ?? '').includes('Incrementar'),
    ) as HTMLElement;
    button.click();
    button.click();
    button.click();
    fixture.detectChanges();

    expect(component.count()).toBe(3);
    const text = (fixture.nativeElement as HTMLElement).textContent ?? '';
    expect(text).toContain('Valor: 3');
  });

  it('lines marca como activa la linea de update()', () => {
    const updateLine = component
      .lines()
      .find((l) => typeof l.line === 'string' && l.line.includes('update((value)'));
    expect(updateLine?.active).toBeTrue();
  });
});
