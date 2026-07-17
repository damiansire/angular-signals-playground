import { buildWhereQuery, parseWhereQuery } from './url-sync';

describe('url-sync — buildWhereQuery (estado → URL)', () => {
  it('vista molécula (subIdx -1) escribe solo el nivel', () => {
    expect(buildWhereQuery(7, -1)).toBe('nivel=7');
  });

  it('adentro de un sub-nivel escribe nivel + sub-nivel 1-based', () => {
    expect(buildWhereQuery(3, 2)).toBe('nivel=3&sub-nivel=3');
  });
});

describe('url-sync — parseWhereQuery (URL → estado)', () => {
  it('lee nivel + sub-nivel', () => {
    expect(parseWhereQuery('nivel=3&sub-nivel=3')).toEqual({ concept: 3, sub: 3 });
  });

  it('acepta `?nivel=X` solo (vista molécula) con sub 0', () => {
    expect(parseWhereQuery('nivel=7')).toEqual({ concept: 7, sub: 0 });
  });

  it('rechaza nivel ausente, negativo o no numérico', () => {
    expect(parseWhereQuery('')).toBeNull();
    expect(parseWhereQuery('nivel=-1')).toBeNull();
    expect(parseWhereQuery('nivel=abc')).toBeNull();
  });

  it('rechaza sub-nivel inválido (0 o no entero)', () => {
    expect(parseWhereQuery('nivel=2&sub-nivel=0')).toBeNull();
    expect(parseWhereQuery('nivel=2&sub-nivel=x')).toBeNull();
  });
});

describe('url-sync — round-trip (lo que la vista escribe, lo puede reabrir)', () => {
  it('vista molécula: nivel=7 vuelve como {7, 0} (antes caía a null y aterrizaba arriba)', () => {
    expect(parseWhereQuery(buildWhereQuery(7, -1))).toEqual({ concept: 7, sub: 0 });
  });

  it('sub-nivel: subIdx 0-based ida, sub 1-based vuelta, mismo punto', () => {
    const parsed = parseWhereQuery(buildWhereQuery(5, 1)); // subIdx 1 → sub-nivel 2
    expect(parsed).toEqual({ concept: 5, sub: 2 });
    // el bootScroll del motor consume `sub - 1` → recupera el subIdx original.
    expect(parsed!.sub - 1).toBe(1);
  });
});
