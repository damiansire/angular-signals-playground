import { TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { provideRouter } from '@angular/router';
import { CartExampleComponent, wireColorFor } from './cart-example.component';

describe('CartExampleComponent', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CartExampleComponent],
      providers: [provideZonelessChangeDetection(), provideRouter([])],
    }).compileComponents();
  });

  function create() {
    const fixture = TestBed.createComponent(CartExampleComponent);
    fixture.detectChanges();
    return fixture;
  }

  it('wireColorFor da un color por rol, distinto para fuente y efecto', () => {
    expect(wireColorFor('signal')).not.toBe(wireColorFor('effect'));
    expect(wireColorFor('subtotal')).toBe(wireColorFor('envio')); // ambos derivados
  });

  // localStorage es editable a mano: es un boundary externo, no una fuente confiable. Lo que se
  // rehidrata tiene que ser alcanzable tocando la UI, si no la lista muestra un número que la
  // matemática no usa (con -3 guardado se veía -3 y el total lo clampeaba a 0).
  describe('estado guardado que no se puede alcanzar desde la UI', () => {
    const CLAVE = 'signals-carrito';
    afterEach(() => localStorage.removeItem(CLAVE));

    function conGuardado(qty: unknown) {
      localStorage.setItem(CLAVE, JSON.stringify({ qty, coupon: false }));
      TestBed.resetTestingModule();
      TestBed.configureTestingModule({
        imports: [CartExampleComponent],
        providers: [provideZonelessChangeDetection(), provideRouter([])],
      });
      const fixture = TestBed.createComponent(CartExampleComponent);
      fixture.detectChanges();
      return fixture.componentInstance;
    }

    it('descarta cantidades negativas y vuelve al arranque', () => {
      expect(conGuardado({ cafe: -3, medialunas: 1 }).qty()).toEqual({ cafe: 1, medialunas: 1 });
    });

    it('descarta cantidades fraccionarias', () => {
      expect(conGuardado({ cafe: 1.5, medialunas: 1 }).qty()).toEqual({ cafe: 1, medialunas: 1 });
    });

    it('sigue aceptando un guardado legítimo', () => {
      expect(conGuardado({ cafe: 4, medialunas: 0 }).qty()).toEqual({ cafe: 4, medialunas: 0 });
    });
  });

  it('linkTo enciende el fragmento activo y unlink lo apaga', () => {
    const c = create().componentInstance;
    expect(c.linked()).toBeNull();

    c.linkTo('subtotal');
    expect(c.linked()).toBe('subtotal');

    c.unlink();
    expect(c.linked()).toBeNull();
    expect(c.wire()).toBeNull();
  });
});
