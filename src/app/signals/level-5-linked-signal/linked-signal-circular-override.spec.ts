import { TestBed } from '@angular/core/testing';
import { linkedSignal, provideZonelessChangeDetection, signal } from '@angular/core';

/**
 * linkedSignal() directo (sin componente): verifica dos comportamientos que
 * los specs del nivel 5 no cubren — (a) el override manual se resetea
 * correctamente cuando la fuente cambia de verdad, y (b) el override manual
 * NO dispara la función `computation` (no hay loop: sobreescribir a mano no
 * es lo mismo que la fuente cambiando).
 */
describe('linkedSignal() — override manual vs. reseteo por fuente', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [provideZonelessChangeDetection()] });
  });

  it('un override manual no dispara la computation (no hay loop de recomputación)', () => {
    TestBed.runInInjectionContext(() => {
      let computations = 0;
      const source = signal(1);
      const linked = linkedSignal(() => {
        computations++;
        return source() * 2;
      });

      expect(linked()).toBe(2);
      expect(computations).toBe(1);

      // Override manual: cambia el valor leído pero NO debe volver a llamar
      // a `computation` (si lo hiciera, un `computation` que a su vez
      // dependiera de `linked()` entraría en loop infinito).
      linked.set(999);
      expect(linked()).toBe(999);
      expect(computations).toBe(1);

      // Leer varias veces sin tocar la fuente tampoco recomputa (memoización).
      linked();
      linked();
      expect(computations).toBe(1);
    });
  });

  it('la fuente cambiando de verdad resetea el override manual previo', () => {
    TestBed.runInInjectionContext(() => {
      let computations = 0;
      const source = signal(1);
      const linked = linkedSignal(() => {
        computations++;
        return source() * 2;
      });

      expect(linked()).toBe(2);
      linked.set(999); // override manual
      expect(linked()).toBe(999);
      expect(computations).toBe(1);

      source.set(5); // la fuente cambia de verdad → se descarta el override
      expect(linked()).toBe(10);
      expect(computations).toBe(2);
    });
  });

  it('un `set` de la fuente al mismo valor no dispara recomputación adicional', () => {
    TestBed.runInInjectionContext(() => {
      let computations = 0;
      const source = signal(1);
      const linked = linkedSignal(() => {
        computations++;
        return source() * 2;
      });

      expect(linked()).toBe(2);
      expect(computations).toBe(1);

      source.set(1); // mismo valor → signal() no notifica (igualdad por defecto)
      expect(linked()).toBe(2);
      expect(computations).toBe(1);
    });
  });
});
