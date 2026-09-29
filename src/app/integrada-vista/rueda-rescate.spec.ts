import {
  EMPUJE_MINIMO,
  laRuedaEsDeAdentro,
  paradaMasCercana,
  pasoDeRescate,
} from './rueda-rescate';

describe('pasoDeRescate', () => {
  it('si el snap devolvió el gesto a la misma parada, da el paso que pidió', () => {
    expect(pasoDeRescate(44.3, 44.3, -500)).toBe(-1);
    expect(pasoDeRescate(42.5, 42.5, 500)).toBe(1);
  });

  it('si el snap ya lo movió, no da otro paso: el rescate nunca duplica', () => {
    expect(pasoDeRescate(44.3, 44.95, 500)).toBe(0);
    expect(pasoDeRescate(44.3, 42.5, -500)).toBe(0);
  });

  it('un roce no es un pedido de moverse', () => {
    expect(pasoDeRescate(10, 10, EMPUJE_MINIMO - 1)).toBe(0);
    expect(pasoDeRescate(10, 10, -(EMPUJE_MINIMO - 1))).toBe(0);
  });
});

describe('paradaMasCercana', () => {
  const paradas = [0, 1.3, 1.95, 2.5, 3.5];

  it('encuentra la parada más cercana, en los dos sentidos', () => {
    expect(paradaMasCercana(1.4, paradas)).toBe(1.3);
    expect(paradaMasCercana(2.3, paradas)).toBe(2.5);
    expect(paradaMasCercana(9, paradas)).toBe(3.5);
  });
});

describe('laRuedaEsDeAdentro', () => {
  let recorrido: HTMLElement;

  beforeEach(() => {
    recorrido = document.body.appendChild(document.createElement('div'));
  });
  afterEach(() => recorrido.remove());

  it('una lista con scroll propio que todavía puede moverse se queda con la rueda', () => {
    const lista = recorrido.appendChild(document.createElement('div'));
    lista.style.cssText = 'height: 50px; overflow-y: auto';
    const alto = lista.appendChild(document.createElement('div'));
    alto.style.height = '200px';

    expect(laRuedaEsDeAdentro(alto, recorrido, 100))
      .withContext('hacia abajo')
      .toBeTrue();
    expect(laRuedaEsDeAdentro(alto, recorrido, -100))
      .withContext('arriba, ya en el tope')
      .toBeFalse();
    lista.scrollTop = 150;
    expect(laRuedaEsDeAdentro(alto, recorrido, 100))
      .withContext('abajo, ya en el fondo')
      .toBeFalse();
  });

  it('un campo se queda con la rueda; el resto del demo no', () => {
    const campo = recorrido.appendChild(document.createElement('input'));
    const texto = recorrido.appendChild(document.createElement('p'));

    expect(laRuedaEsDeAdentro(campo, recorrido, 100)).toBeTrue();
    expect(laRuedaEsDeAdentro(texto, recorrido, 100)).toBeFalse();
  });
});
