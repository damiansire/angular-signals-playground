import {
  NODOS,
  type Renglon,
  balanceados,
  codigoDelArbol,
  disponerArbol,
  lugarMasCercano,
  estadoDelRenglon,
  fueraDelPanel,
  padres,
  padresPorSangria,
} from './html-to-tree.data';

const CON_BUG = codigoDelArbol(0);
const A_MEDIAS = codigoDelArbol(1);
const ARREGLADO = codigoDelArbol(2);

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

  it('cerrado después del título, el título es de article y el párrafo queda afuera', () => {
    expect(padres(A_MEDIAS)['h3']).toBe('article');
    expect(padres(A_MEDIAS)['p2']).toBe('main');
    expect(fueraDelPanel(A_MEDIAS)).toEqual(['p2']);
    expect(balanceados(A_MEDIAS)).toBeTrue();
    expect(abiertos(A_MEDIAS)).toEqual([...NODOS]);
  });

  it('el cierre que se suelta va al lugar más cercano', () => {
    expect(lugarMasCercano(10, [12, 40, 70])).toBe(0);
    expect(lugarMasCercano(50, [12, 40, 70])).toBe(1);
    expect(lugarMasCercano(500, [12, 40, 70])).toBe(2);
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

  describe('el árbol de nodos', () => {
    const nodo = (renglones: readonly Renglon[], id: string) =>
      disponerArbol(renglones).nodos.find((n) => n.id === id);

    it('con el bug, article es una hoja y el título cuelga de main, a su altura', () => {
      expect(nodo(CON_BUG, 'article')?.nivel).toBe(1);
      expect(nodo(CON_BUG, 'h3')).toEqual(jasmine.objectContaining({ padre: 'main', nivel: 1 }));
      expect(disponerArbol(CON_BUG).hojas).toBe(5);
    });

    it('arreglado, el título y el párrafo bajan bajo article, centrado sobre ellos', () => {
      expect(nodo(ARREGLADO, 'h3')).toEqual(
        jasmine.objectContaining({ padre: 'article', nivel: 2 }),
      );
      expect(nodo(ARREGLADO, 'article')?.x).toBe(((nodo(ARREGLADO, 'h3')?.x ?? 0) + 3) / 2);
      expect(disponerArbol(ARREGLADO).hojas).toBe(4);
    });

    it('trae todos los elementos, con main como única raíz', () => {
      const { nodos } = disponerArbol(CON_BUG);
      expect(nodos.map((n) => n.id)).toEqual([...NODOS]);
      expect(nodos.filter((n) => n.padre === null).map((n) => n.id)).toEqual(['main']);
    });
  });

  describe('el renglón marcado', () => {
    const renglon = (renglones: readonly Renglon[], id: string) =>
      renglones.find((r) => r.piezas.some((p) => p.tipo === 'abre' && p.id === id))!;

    it('se marca recién cuando todo lo que abre o cierra está tocado', () => {
      expect(estadoDelRenglon(renglon(CON_BUG, 'h2'), [], [])).toBe('oculto');
      expect(estadoDelRenglon(renglon(CON_BUG, 'h2'), ['h2'], [])).toBe('visto');
    });

    it('un cierre suelto se marca con su elemento', () => {
      const cierre = CON_BUG.find((r) => r.piezas.length === 1 && r.piezas[0].tipo === 'cierra')!;
      expect(estadoDelRenglon(cierre, [], [])).toBe('oculto');
      expect(estadoDelRenglon(cierre, ['section'], [])).toBe('visto');
    });

    it('lo que quedó fuera de su panel se marca aparte', () => {
      expect(estadoDelRenglon(renglon(CON_BUG, 'h3'), ['h3'], ['h3', 'p2'])).toBe('afuera');
    });
  });
});
