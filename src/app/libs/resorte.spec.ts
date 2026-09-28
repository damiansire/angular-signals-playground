import { curvaDeResorte, RESORTES, variablesDeResorte } from './resorte';

/** Los puntos de una curva `linear(a, b, c)` como números. */
function puntosDe(easing: string): number[] {
  const adentro = easing.slice('linear('.length, -1);
  return adentro.split(',').map((p) => Number(p.trim()));
}

describe('resorte', () => {
  it('toda curva arranca exacto en 0 y termina exacto en 1', () => {
    for (const r of Object.values(RESORTES)) {
      const puntos = puntosDe(curvaDeResorte(r).easing);
      expect(puntos[0]).toBe(0);
      expect(puntos[puntos.length - 1]).toBe(1);
    }
  });

  it('el suave llega sin pasarse: ningún punto supera el destino', () => {
    const puntos = puntosDe(curvaDeResorte(RESORTES.suave).easing);
    expect(Math.max(...puntos)).toBeLessThanOrEqual(1);
    expect(curvaDeResorte(RESORTES.suave).sobrepaso).toBeLessThan(0.002);
  });

  it('el de rebote se pasa del destino y vuelve, que es lo que lo distingue', () => {
    const curva = curvaDeResorte(RESORTES.rebote);
    expect(curva.sobrepaso).toBeGreaterThan(0.08);
    expect(curva.sobrepaso).toBeLessThan(0.3);
    expect(Math.max(...puntosDe(curva.easing))).toBeGreaterThan(1);
  });

  it('el firme es el más rápido de los tres: salir cuesta menos que entrar', () => {
    const firme = curvaDeResorte(RESORTES.firme).ms;
    expect(firme).toBeLessThan(curvaDeResorte(RESORTES.suave).ms);
    expect(firme).toBeLessThan(curvaDeResorte(RESORTES.rebote).ms);
  });

  it('las duraciones salen de la física pero caen en un rango que se siente como respuesta', () => {
    for (const r of Object.values(RESORTES)) {
      const { ms } = curvaDeResorte(r);
      expect(ms).toBeGreaterThan(150);
      expect(ms).toBeLessThan(1400);
    }
  });

  it('más rígido asienta antes', () => {
    const blando = curvaDeResorte({ rigidez: 100, amortiguacion: 20 }).ms;
    const rigido = curvaDeResorte({ rigidez: 400, amortiguacion: 40 }).ms;
    expect(rigido).toBeLessThan(blando);
  });

  it('respeta la cantidad de puntos pedida', () => {
    const puntos = puntosDe(curvaDeResorte(RESORTES.suave, { puntos: 20 }).easing);
    expect(puntos.length).toBe(21);
  });

  it('una velocidad inicial hacia el destino adelanta el progreso del primer tramo', () => {
    const quieto = puntosDe(curvaDeResorte({ rigidez: 200, amortiguacion: 28 }).easing);
    const empujado = puntosDe(
      curvaDeResorte({ rigidez: 200, amortiguacion: 28, velocidad: 6 }, { puntos: 48 }).easing,
    );
    expect(empujado[2]).toBeGreaterThan(quieto[2]);
  });

  it('rechaza un resorte sin rigidez en vez de devolver una curva con NaN', () => {
    expect(() => curvaDeResorte({ rigidez: 0, amortiguacion: 10 })).toThrowError(/rigidez/);
  });

  it('no produce NaN en ninguna de las tres ramas (sub, crítico y sobreamortiguado)', () => {
    const ramas = [
      { rigidez: 300, amortiguacion: 10 },
      { rigidez: 100, amortiguacion: 20 },
      { rigidez: 100, amortiguacion: 60 },
    ];
    for (const r of ramas) {
      expect(curvaDeResorte(r).easing).not.toContain('NaN');
    }
  });

  it('expone una variable de curva y otra de duración por cada resorte con nombre', () => {
    const variables = variablesDeResorte();
    for (const nombre of Object.keys(RESORTES)) {
      expect(variables[`--resorte-${nombre}`]).toMatch(/^linear\(0, .*, 1\)$/);
      expect(variables[`--resorte-${nombre}-ms`]).toMatch(/^\d+ms$/);
    }
  });
});
