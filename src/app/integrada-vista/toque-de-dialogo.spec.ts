import { RESPIRO_MS, queHaceElToque } from './toque-de-dialogo';

describe('queHaceElToque', () => {
  it('a medio escribir, el toque lo completa y no pasa', () => {
    expect(queHaceElToque(0, 1200, null)).toBe('completar');
    expect(queHaceElToque(1199, 1200, null)).toBe('completar');
  });

  it('escrito solo, el toque pasa', () => {
    expect(queHaceElToque(1200, 1200, null)).toBe('pasar');
  });

  it('una ráfaga de clics completa una vez y no se lleva el diálogo sin mostrarlo', () => {
    const rafaga = [100, 140, 190, 260, 330, 400];
    const hace = rafaga.map((ms) => queHaceElToque(ms, 1200, 100));
    expect(hace.every((h) => h === 'nada')).toBeTrue();
  });

  it('completado, el toque siguiente pasa cuando ya se lo pudo ver', () => {
    expect(queHaceElToque(100 + RESPIRO_MS, 1200, 100)).toBe('pasar');
  });
});
