import { REGLAS_DE_LINEA, palabrasDe, palabrasDeLinea, problemasDeLinea } from './guion';

describe('palabrasDe', () => {
  it('cuenta palabras como tokens separados por espacio, también a través del corte', () => {
    expect(palabrasDe('Uno dos\ntres')).toBe(3);
    expect(palabrasDe('  ¿Qué   pasa?  ')).toBe(2);
  });
});

describe('palabrasDeLinea', () => {
  it('parte en palabras y marca la primera de cada renglón del guion', () => {
    expect(palabrasDeLinea('Nunca la leí.\n¿Cómo se lee?')).toEqual([
      { txt: 'Nunca', corte: false },
      { txt: 'la', corte: false },
      { txt: 'leí.', corte: false },
      { txt: '¿Cómo', corte: true },
      { txt: 'se', corte: false },
      { txt: 'lee?', corte: false },
    ]);
  });

  it('no cuenta espacios de más como palabras', () => {
    expect(palabrasDeLinea('  hola   mundo ').map((p) => p.txt)).toEqual(['hola', 'mundo']);
  });

  it('da tantas palabras como cuenta palabrasDe', () => {
    const txt = 'Cambió una caja.\nLa suma se rehízo sola.';
    expect(palabrasDeLinea(txt).length).toBe(palabrasDe(txt));
  });
});

describe('problemasDeLinea', () => {
  it('una línea dentro del techo no tiene problemas', () => {
    expect(problemasDeLinea('Con signal,\nla caja ya avisa.')).toEqual([]);
  });

  it('nombra cada regla rota, en el orden en que se leen', () => {
    const larga = 'uno dos tres cuatro cinco seis siete ocho nueve';
    expect(problemasDeLinea(larga)).toEqual([
      `9 palabras, el techo es ${REGLAS_DE_LINEA.palabras}`,
      `renglón de ${larga.length} columnas`,
    ]);
    expect(problemasDeLinea('a\nb\nc')).toEqual(['más de dos renglones']);
    expect(problemasDeLinea('Sí — claro.')).toEqual(['usa raya']);
    expect(problemasDeLinea('Sí – claro.')).toEqual(['usa raya']);
  });

  it('el techo es inclusivo: ocho palabras y 44 columnas entran', () => {
    expect(problemasDeLinea('uno dos tres cuatro cinco seis siete ocho')).toEqual([]);
    expect(problemasDeLinea('x'.repeat(REGLAS_DE_LINEA.columnas))).toEqual([]);
    expect(problemasDeLinea('x'.repeat(REGLAS_DE_LINEA.columnas + 1))).toEqual([
      `renglón de ${REGLAS_DE_LINEA.columnas + 1} columnas`,
    ]);
  });
});
