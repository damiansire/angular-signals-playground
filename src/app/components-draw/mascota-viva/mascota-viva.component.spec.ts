import { TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';

import { MascotaVivaComponent } from './mascota-viva.component';

describe('MascotaVivaComponent', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MascotaVivaComponent],
      providers: [provideZonelessChangeDetection()],
    }).compileComponents();
  });

  function montar() {
    const fixture = TestBed.createComponent(MascotaVivaComponent);
    fixture.detectChanges();
    return fixture;
  }

  it('es un dibujo en línea con sus partes separadas: cada una se mueve por su cuenta', () => {
    const raiz: HTMLElement = montar().nativeElement;
    expect(raiz.querySelectorAll('svg g').length).toBeGreaterThanOrEqual(10);
  });

  it('dos mascotas no comparten degradados: los ids se repetirían en el documento', () => {
    const ids = (raiz: HTMLElement) => [...raiz.querySelectorAll('svg [id]')].map((el) => el.id);
    const a = ids(montar().nativeElement);
    const b = ids(montar().nativeElement);
    expect(a.length).toBeGreaterThan(0);
    expect(a.filter((id) => b.includes(id))).toEqual([]);
  });

  it('saludar y saltar se pueden pedir apenas montada', () => {
    const mascota = montar().componentInstance;
    expect(() => {
      mascota.saludar();
      mascota.saltar(1);
    }).not.toThrow();
  });
});
