import type { Punto } from '../libs/partida';
import { entradaDeLaHistoria, inicioDelRecorrido, puntoDelRecorrido } from './retomar';

const PUNTOS = ['anom-rxjs', 'anom-manual', 'voz-supongo'];
const EN_EL_PROLOGO: Punto = { lugar: 'prologo', linea: 'anom-manual' };
const EN_EL_ATOMO: Punto = { lugar: 'recorrido', concepto: 3, sub: -1 };
const EN_UN_SUB: Punto = { lugar: 'recorrido', concepto: 1, sub: 4 };

describe('retomar', () => {
  describe('inicioDelRecorrido (partida → recorrido)', () => {
    it('vuelve al átomo o al sub-nivel donde quedó, con el sub de la URL', () => {
      expect(inicioDelRecorrido(EN_EL_ATOMO, null)).toEqual({ concept: 3, sub: 0 });
      expect(inicioDelRecorrido(EN_UN_SUB, null)).toEqual({ concept: 1, sub: 5 });
    });

    it('un link manda sobre lo guardado', () => {
      expect(inicioDelRecorrido(EN_UN_SUB, { concept: 7, sub: 2 })).toEqual({ concept: 7, sub: 2 });
    });

    it('antes del recorrido no abre nada: la historia sigue desde la colina', () => {
      expect(inicioDelRecorrido(null, null)).toBeNull();
      expect(inicioDelRecorrido(EN_EL_PROLOGO, null)).toBeNull();
      expect(inicioDelRecorrido({ lugar: 'construccion' }, null)).toBeNull();
    });
  });

  describe('entradaDeLaHistoria', () => {
    it('sin partida, el prólogo arranca del principio', () => {
      expect(entradaDeLaHistoria(null, PUNTOS)).toEqual({ saltarPrologo: false, desde: null });
    });

    it('con un punto del prólogo, arranca en esa línea', () => {
      expect(entradaDeLaHistoria(EN_EL_PROLOGO, PUNTOS)).toEqual({
        saltarPrologo: false,
        desde: 'anom-manual',
      });
    });

    it('una línea que ya no es punto se ignora y arranca del principio', () => {
      const viejo: Punto = { lugar: 'prologo', linea: 'casa-helado' };
      expect(entradaDeLaHistoria(viejo, PUNTOS)).toEqual({ saltarPrologo: false, desde: null });
    });

    it('con el prólogo pasado, entrar va directo a la construcción', () => {
      for (const punto of [{ lugar: 'construccion' } as const, EN_EL_ATOMO]) {
        expect(entradaDeLaHistoria(punto, PUNTOS).saltarPrologo).toBeTrue();
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

    it('la landing del arranque no pisa el punto del prólogo', () => {
      expect(puntoDelRecorrido(EN_EL_PROLOGO, -1, -1)).toBe(EN_EL_PROLOGO);
      expect(puntoDelRecorrido(null, -1, -1)).toBeNull();
    });

    it('ida y vuelta: lo que se guarda en el recorrido se reabre en el mismo lugar', () => {
      for (const [c, s] of [
        [0, -1],
        [4, 0],
        [11, 0],
        [1, 6],
      ]) {
        const punto = puntoDelRecorrido(null, c, s);
        const where = inicioDelRecorrido(punto, null);
        expect(where).toEqual({ concept: c, sub: s + 1 });
      }
    });
  });
});
