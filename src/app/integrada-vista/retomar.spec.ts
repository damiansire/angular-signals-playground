import type { Punto } from '../libs/partida';
import { entradaDeLaHistoria, puntoDelRecorrido } from './retomar';

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

  describe('puntoDelRecorrido (recorrido → partida)', () => {
    it('guarda el átomo o el sub-nivel que el recorrido reporta', () => {
      expect(puntoDelRecorrido(null, 2, -1)).toEqual({ lugar: 'recorrido', concepto: 2, sub: -1 });
      expect(puntoDelRecorrido(EN_EL_PROLOGO, 5, 1)).toEqual({
        lugar: 'recorrido',
        concepto: 5,
        sub: 1,
      });
    });

    it('subir del recorrido a la landing es volver a la construcción', () => {
      expect(puntoDelRecorrido(EN_UN_SUB, -1, -1)).toEqual({ lugar: 'construccion' });
    });

    it('la landing del arranque no pisa el punto del comienzo ni el del viaje', () => {
      expect(puntoDelRecorrido(EN_EL_PROLOGO, -1, -1)).toBe(EN_EL_PROLOGO);
      const viajando: Punto = { lugar: 'viaje' };
      expect(puntoDelRecorrido(viajando, -1, -1)).toBe(viajando);
      expect(puntoDelRecorrido(null, -1, -1)).toBeNull();
    });
  });
});
