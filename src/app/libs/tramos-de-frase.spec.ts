import { tramosDeFrase } from './tramos-de-frase';

describe('tramosDeFrase: código entre comillas invertidas dentro de la prosa', () => {
  it('parte la frase en prosa y código, sin las comillas', () => {
    expect(tramosDeFrase('Tiene que salir `p - deriva`: desvío `0`.')).toEqual([
      { texto: 'Tiene que salir ', codigo: false },
      { texto: 'p - deriva', codigo: true },
      { texto: ': desvío ', codigo: false },
      { texto: '0', codigo: true },
      { texto: '.', codigo: false },
    ]);
  });

  it('una frase sin código es un solo tramo', () => {
    expect(tramosDeFrase('Sin código.')).toEqual([{ texto: 'Sin código.', codigo: false }]);
  });
});
