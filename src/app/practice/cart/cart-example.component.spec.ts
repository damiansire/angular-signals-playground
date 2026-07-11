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
