import { problemasDeLinea } from '../../libs/guion';
import { type FotoDelCarrito, GUION_DEL_CARRITO, momentoDelCarrito } from './guion-del-carrito';

describe('momentoDelCarrito', () => {
  const base: FotoDelCarrito = { unidades: 2, cupon: false, envioGratis: false };

  it('no dice nada si no cambió nada que se vea', () => {
    expect(momentoDelCarrito(base, { ...base })).toBeNull();
  });

  it('una cantidad nueva es un cambio de cantidad', () => {
    expect(momentoDelCarrito(base, { ...base, unidades: 3 })).toBe('cantidad');
  });

  it('el envío gratis gana a la cantidad que lo trajo', () => {
    expect(momentoDelCarrito(base, { ...base, unidades: 5, envioGratis: true })).toBe('envio');
  });

  it('perder el envío también se dice', () => {
    const conEnvio = { ...base, unidades: 5, envioGratis: true };
    expect(momentoDelCarrito(conEnvio, { ...base, unidades: 4 })).toBe('sinEnvio');
  });

  it('vaciar gana a perder el envío', () => {
    const conEnvio = { ...base, unidades: 5, envioGratis: true };
    expect(momentoDelCarrito(conEnvio, { ...base, unidades: 0 })).toBe('vacio');
  });

  it('el cupón se dice al ponerlo y al sacarlo', () => {
    const conCupon = { ...base, cupon: true };
    expect(momentoDelCarrito(base, conCupon)).toBe('cupon');
    expect(momentoDelCarrito(conCupon, base)).toBe('cupon');
  });
});

describe('GUION_DEL_CARRITO', () => {
  it('cada línea sigue las reglas del guion', () => {
    const problemas = Object.entries(GUION_DEL_CARRITO).flatMap(([momento, l]) =>
      problemasDeLinea(l.txt).map((p) => `${momento}: ${p}`),
    );
    expect(problemas).toEqual([]);
  });

  it('lo que pasa seguido lo dicen naves distintas: es una charla', () => {
    expect(GUION_DEL_CARRITO.llegada.quien).not.toBe(GUION_DEL_CARRITO.cantidad.quien);
    expect(GUION_DEL_CARRITO.cantidad.quien).not.toBe(GUION_DEL_CARRITO.envio.quien);
  });
});
