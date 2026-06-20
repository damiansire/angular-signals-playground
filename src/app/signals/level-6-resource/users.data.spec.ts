import { KNOWN_USER_IDS, lookupUser } from './users.data';

describe('lookupUser', () => {
  it('devuelve el usuario para un id conocido', () => {
    expect(lookupUser(1).name).toBe('Ada Lovelace');
    expect(lookupUser(3).role).toContain('compilador');
  });

  it('lanza un error para un id desconocido', () => {
    expect(() => lookupUser(99)).toThrowError('No existe el usuario #99');
  });

  it('expone los ids conocidos', () => {
    expect(KNOWN_USER_IDS).toEqual([1, 2, 3]);
  });
});
