import { claveDeEnlace, origenesDelCambio, puntoDelCable } from './circuito.modelo';

const mapa = (o: Record<string, string>) => new Map(Object.entries(o));

describe('origenesDelCambio', () => {
  const enlaces = [
    { de: 'firstName', a: 'fullName' },
    { de: 'surname', a: 'fullName' },
    { de: 'fullName', a: 'saludo' },
  ];

  it('cambia una fuente y sus derivados: arranca solo la fuente', () => {
    const antes = mapa({ firstName: 'A', surname: 'B', fullName: 'A B', saludo: 'Hola A B' });
    const ahora = mapa({ firstName: 'C', surname: 'B', fullName: 'C B', saludo: 'Hola C B' });
    expect(origenesDelCambio(antes, ahora, enlaces)).toEqual(['firstName']);
  });

  it('cambian las dos fuentes a la vez: arrancan las dos', () => {
    const antes = mapa({ firstName: 'A', surname: 'B', fullName: 'A B' });
    const ahora = mapa({ firstName: 'C', surname: 'D', fullName: 'C D' });
    expect(origenesDelCambio(antes, ahora, enlaces)).toEqual(['firstName', 'surname']);
  });

  it('sin cambios no arranca nada', () => {
    const antes = mapa({ firstName: 'A' });
    expect(origenesDelCambio(antes, antes, enlaces)).toEqual([]);
  });

  it('un enlace suelto no lleva el cambio: el otro extremo arranca por su cuenta', () => {
    const antes = mapa({ count: '0', vista: 'nada' });
    const ahora = mapa({ count: '1', vista: 'uno' });
    const suelto = [{ de: 'count', a: 'vista', vivo: false }];
    expect(origenesDelCambio(antes, ahora, suelto)).toEqual(['count', 'vista']);
  });

  it('un nodo nuevo no cuenta como cambio', () => {
    const antes = mapa({ a: '1' });
    const ahora = mapa({ a: '1', b: '2' });
    expect(origenesDelCambio(antes, ahora, [])).toEqual([]);
  });
});

describe('claveDeEnlace', () => {
  it('distingue el sentido', () => {
    expect(claveDeEnlace({ de: 'a', a: 'b' })).not.toBe(claveDeEnlace({ de: 'b', a: 'a' }));
  });
});

describe('puntoDelCable', () => {
  const curva = { x0: 0, y0: 0, cx: 50, cy: 100, x1: 100, y1: 0 };
  it('arranca y termina en las puntas', () => {
    expect(puntoDelCable(curva, 0)).toEqual({ x: 0, y: 0 });
    expect(puntoDelCable(curva, 1)).toEqual({ x: 100, y: 0 });
  });
  it('a mitad de camino va por la panza de la curva', () => {
    expect(puntoDelCable(curva, 0.5)).toEqual({ x: 50, y: 50 });
  });
});
