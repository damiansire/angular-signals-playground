import { TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { provideRouter } from '@angular/router';
import { CartExampleComponent, trazoDelEnlace, wireColorFor } from './cart-example.component';

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

  describe('trazoDelEnlace', () => {
    const caja = (left: number, top: number, ancho: number, alto: number) => ({
      left,
      right: left + ancho,
      top,
      height: alto,
    });
    // Medidas reales a 1440×900: la tarjeta del carrito, el Reto y dos fragmentos del código.
    const carrito = caja(241, 141, 508, 563);
    const reto = caja(782, 140, 418, 158);
    const envio = caja(796, 589, 196, 37);
    const subtotal = caja(796, 505, 250, 58);
    const filaDelSubtotal = caja(262, 548, 466, 24);

    it('a una parte del carrito le llega por la derecha', () => {
      expect(trazoDelEnlace(subtotal, filaDelSubtotal, carrito)).toBe(
        'M 796 534 C 760 534 770 560 734 560',
      );
    });

    it('al Reto, que está arriba del código, le entra por la izquierda', () => {
      expect(trazoDelEnlace(envio, reto, carrito)).toBe('M 796 607.5 C 763 607.5 743 219 776 219');
    });

    it('con el pasillo angosto la curva se achica y no se monta sobre el carrito', () => {
      const pegado = caja(262, 162, 510, 292);
      expect(trazoDelEnlace(envio, reto, pegado)).toBe('M 796 607.5 C 784 607.5 764 219 776 219');
    });

    it('con una sola columna no hay flecha, tampoco para el Reto', () => {
      const angosto = caja(16, 900, 343, 37);
      expect(trazoDelEnlace(angosto, caja(16, 500, 343, 24), caja(16, 120, 343, 292))).toBeNull();
      expect(trazoDelEnlace(angosto, caja(16, 700, 343, 158), caja(16, 120, 343, 292))).toBeNull();
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
