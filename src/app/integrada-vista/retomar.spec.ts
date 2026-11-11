import type { Punto } from '../libs/partida';
import { leerPartida } from '../libs/partida';
import { PUNTOS_DEL_PROLOGO } from './puntos-del-prologo';
import { despuesDelAviso, entradaDeLaHistoria } from './retomar';

const PUNTOS = ['anom-rxjs', 'anom-manual', 'voz-supongo'];
const EN_EL_PROLOGO: Punto = { lugar: 'prologo', linea: 'anom-manual' };
const EN_EL_ATOMO: Punto = { lugar: 'recorrido', concepto: 3, sub: -1 };
const EN_UN_SUB: Punto = { lugar: 'recorrido', concepto: 1, sub: 4 };

describe('retomar', () => {
  describe('entradaDeLaHistoria', () => {
    it('sin partida, la historia arranca del principio', () => {
      expect(entradaDeLaHistoria(null, PUNTOS, false)).toEqual({ a: 'prologo', desde: null });
    });

    it('con un punto del comienzo, arranca en esa línea', () => {
      expect(entradaDeLaHistoria(EN_EL_PROLOGO, PUNTOS, false)).toEqual({
        a: 'prologo',
        desde: 'anom-manual',
      });
    });

    it('una línea que ya no es punto se ignora y arranca del principio', () => {
      const viejo: Punto = { lugar: 'prologo', linea: 'casa-helado' };
      expect(entradaDeLaHistoria(viejo, PUNTOS, false)).toEqual({ a: 'prologo', desde: null });
    });

    it('una partida anterior a la 4 con el comienzo visto entra al manual, no al capítulo 1', () => {
      const vieja = JSON.stringify({ v: 3, establecidos: [], cinematicas: [], prologo: true });
      const { punto, prologo } = leerPartida(vieja, [1]);
      expect(entradaDeLaHistoria(punto, PUNTOS_DEL_PROLOGO, prologo)).toEqual({
        a: 'prologo',
        desde: 'anom-manual',
      });
    });

    it('en pleno viaje, entrar lo sigue donde quedó, sin volver al comienzo', () => {
      expect(entradaDeLaHistoria({ lugar: 'viaje' }, PUNTOS, true)).toEqual({ a: 'viaje' });
    });

    it('con el comienzo visto, entrar sigue el viaje aunque la partida quedó en la molécula', () => {
      for (const punto of [{ lugar: 'construccion' } as const, EN_EL_ATOMO, EN_UN_SUB, null]) {
        expect(entradaDeLaHistoria(punto, PUNTOS, true)).toEqual({ a: 'viaje' });
      }
    });

    it('una partida vieja en la molécula sin el comienzo visto lo arranca del principio', () => {
      expect(entradaDeLaHistoria(EN_UN_SUB, PUNTOS, false)).toEqual({ a: 'prologo', desde: null });
    });

    it('entrar nunca abre la molécula', () => {
      const lugares: (Punto | null)[] = [
        null,
        EN_EL_PROLOGO,
        EN_EL_ATOMO,
        { lugar: 'construccion' },
      ];
      for (const punto of lugares) {
        for (const visto of [true, false]) {
          expect(['prologo', 'viaje']).toContain(entradaDeLaHistoria(punto, PUNTOS, visto).a);
        }
      }
    });
  });

  describe('despuesDelAviso', () => {
    it('sin partida, el toque del aviso lleva a la colina', () => {
      expect(despuesDelAviso(null, PUNTOS, false)).toBe('colina');
    });

    it('con un punto del comienzo, sigue directo a esa línea sin pasar por la colina', () => {
      expect(despuesDelAviso(EN_EL_PROLOGO, PUNTOS, false)).toEqual({
        a: 'prologo',
        desde: 'anom-manual',
      });
    });

    it('en pleno viaje, sigue directo al viaje', () => {
      expect(despuesDelAviso({ lugar: 'viaje' }, PUNTOS, true)).toEqual({ a: 'viaje' });
    });

    it('con el comienzo visto, sigue directo al viaje aunque no haya punto', () => {
      expect(despuesDelAviso(null, PUNTOS, true)).toEqual({ a: 'viaje' });
    });

    it('una partida que arrancaría del principio pasa por la colina', () => {
      const viejo: Punto = { lugar: 'prologo', linea: 'casa-helado' };
      expect(despuesDelAviso(viejo, PUNTOS, false)).toBe('colina');
      expect(despuesDelAviso(EN_UN_SUB, PUNTOS, false)).toBe('colina');
    });

    it('una partida anterior a la 4 sigue directo al manual', () => {
      const vieja = JSON.stringify({ v: 3, establecidos: [], cinematicas: [], prologo: true });
      const { punto, prologo } = leerPartida(vieja, [1]);
      expect(despuesDelAviso(punto, PUNTOS_DEL_PROLOGO, prologo)).toEqual({
        a: 'prologo',
        desde: 'anom-manual',
      });
    });
  });
});
