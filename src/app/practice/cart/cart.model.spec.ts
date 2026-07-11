import {
  Product,
  discountAmount,
  itemCount,
  lineTotal,
  qualifiesFreeShipping,
  shippingProgress,
  subtotal,
  total,
} from './cart.model';

const CATALOG: Product[] = [
  { id: 'a', name: 'A', price: 4200 },
  { id: 'b', name: 'B', price: 3600 },
];

describe('cart.model', () => {
  it('lineTotal multiplica precio por cantidad y no baja de cero', () => {
    expect(lineTotal(4200, 3)).toBe(12600);
    expect(lineTotal(4200, -2)).toBe(0);
  });

  it('subtotal suma las líneas del catálogo según las cantidades', () => {
    expect(subtotal(CATALOG, { a: 2, b: 1 })).toBe(4200 * 2 + 3600);
    expect(subtotal(CATALOG, {})).toBe(0);
  });

  it('itemCount cuenta unidades totales ignorando negativos', () => {
    expect(itemCount({ a: 2, b: 3 })).toBe(5);
    expect(itemCount({ a: -1, b: 3 })).toBe(3);
  });

  it('discountAmount aplica el porcentaje redondeado solo con cupón', () => {
    expect(discountAmount(10000, true)).toBe(1000);
    expect(discountAmount(9995, true)).toBe(1000); // 999.5 → 1000
    expect(discountAmount(10000, false)).toBe(0);
  });

  it('total resta el descuento y nunca es negativo', () => {
    expect(total(10000, 1000)).toBe(9000);
    expect(total(500, 1000)).toBe(0);
  });

  it('qualifiesFreeShipping compara contra el umbral', () => {
    expect(qualifiesFreeShipping(12000, 12000)).toBeTrue();
    expect(qualifiesFreeShipping(11999, 12000)).toBeFalse();
  });

  it('shippingProgress queda acotado en 0..1', () => {
    expect(shippingProgress(6000, 12000)).toBe(0.5);
    expect(shippingProgress(20000, 12000)).toBe(1);
    expect(shippingProgress(0, 12000)).toBe(0);
  });
});
