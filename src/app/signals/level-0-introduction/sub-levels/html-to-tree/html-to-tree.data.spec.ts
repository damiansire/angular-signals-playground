import {
  NODOS,
  type Renglon,
  balanceados,
  codigoDelArbol,
  fueraDelPanel,
  padres,
  padresPorSangria,
} from './html-to-tree.data';

const CON_BUG = codigoDelArbol(false);
const ARREGLADO = codigoDelArbol(true);

/** Los elementos que abre el código, en el orden en que aparecen. */
const abiertos = (renglones: readonly Renglon[]) =>
  renglones.flatMap((r) => r.piezas).flatMap((p) => (p.tipo === 'abre' ? [p.id] : []));

describe('html-to-tree (dominio "el navegador lee los tags, no la sangría")', () => {
  it('con el bug, el título y el párrafo son hijos de main', () => {
    expect(padres(CON_BUG)['h3']).toBe('main');
    expect(padres(CON_BUG)['p2']).toBe('main');
  });

  it('arreglado, son hijos de article', () => {
    expect(padres(ARREGLADO)['h3']).toBe('article');
    expect(padres(ARREGLADO)['p2']).toBe('article');
  });

  it('la sangría dice article en las dos versiones: engaña', () => {
    expect(padresPorSangria(CON_BUG)['h3']).toBe('article');
    expect(padresPorSangria(ARREGLADO)['h3']).toBe('article');
  });

  it('con el bug, quedan fuera del panel justo el título y el párrafo; arreglado, nadie', () => {
    expect(fueraDelPanel(CON_BUG)).toEqual(['h3', 'p2']);
    expect(fueraDelPanel(ARREGLADO)).toEqual([]);
  });

  it('lo demás tiene el mismo padre en las dos versiones', () => {
    for (const id of NODOS.filter((n) => n !== 'h3' && n !== 'p2')) {
      expect(padres(CON_BUG)[id]).withContext(id).toBe(padres(ARREGLADO)[id]);
    }
    expect(padres(CON_BUG)['main']).toBeNull();
  });

  it('los ids son los mismos en las dos versiones, en orden de documento', () => {
    expect(abiertos(CON_BUG)).toEqual([...NODOS]);
    expect(abiertos(ARREGLADO)).toEqual([...NODOS]);
  });

  it('los tags quedan balanceados en las dos versiones', () => {
    expect(balanceados(CON_BUG)).toBeTrue();
    expect(balanceados(ARREGLADO)).toBeTrue();
  });

  it('un cierre cruzado o uno de menos no está balanceado', () => {
    const cruzado: Renglon[] = [
      {
        sangria: 0,
        piezas: [
          { tipo: 'abre', id: 'main' },
          { tipo: 'abre', id: 'section' },
          { tipo: 'cierra', id: 'main' },
          { tipo: 'cierra', id: 'section' },
        ],
      },
    ];
    expect(balanceados(cruzado)).toBeFalse();
    expect(balanceados(CON_BUG.slice(0, -1))).toBeFalse();
  });

  it('solo se mueve el cierre: un renglón más, y el resto igual', () => {
    expect(ARREGLADO.length).toBe(CON_BUG.length + 1);
    const texto = (rs: readonly Renglon[]) =>
      rs.flatMap((r) => r.piezas).filter((p) => p.tipo === 'texto');
    expect(texto(ARREGLADO)).toEqual(texto(CON_BUG));
  });
});
