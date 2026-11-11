import { signalsRoutesTree } from '../app.routes';
import { REGLAS_GUION, palabrasDe } from './cinematicas/cinematica-guion';
import { GUION_DEL_VIAJE, palabrasDeLinea } from './guion-del-viaje';
import { paginasDeEtapa } from './viaje';

describe('GUION_DEL_VIAJE', () => {
  const ids = signalsRoutesTree.flatMap((concepto) =>
    paginasDeEtapa(Number(concepto.path), concepto.subLevels ?? []).map((p) => p.id),
  );

  it('toda página del viaje tiene su llegada y su resuelta', () => {
    expect(ids.length).toBeGreaterThan(30);
    expect(ids.filter((id) => !GUION_DEL_VIAJE[id])).toEqual([]);
  });

  it('no guarda líneas de páginas que ya no existen', () => {
    expect(Object.keys(GUION_DEL_VIAJE).filter((id) => !ids.includes(id))).toEqual([]);
  });

  it('cada línea sigue las reglas del guion', () => {
    const problemas: string[] = [];
    for (const [id, { llegada, resuelta }] of Object.entries(GUION_DEL_VIAJE)) {
      for (const l of [llegada, resuelta]) {
        const renglones = l.txt.split('\n');
        if (palabrasDe(l.txt) > REGLAS_GUION.palabras) problemas.push(`${id}: muchas palabras`);
        if (renglones.length > REGLAS_GUION.renglones) problemas.push(`${id}: muchos renglones`);
        if (renglones.some((r) => r.length > REGLAS_GUION.columnas)) {
          problemas.push(`${id}: renglón largo`);
        }
        if (/[—–]/.test(l.txt)) problemas.push(`${id}: usa raya`);
      }
    }
    expect(problemas).toEqual([]);
  });

  it('la llegada y lo resuelto los dice otra nave: es una charla, no un monólogo', () => {
    const solas = Object.entries(GUION_DEL_VIAJE).filter(
      ([, g]) => g.llegada.quien === g.resuelta.quien,
    );
    expect(solas.map(([id]) => id)).toEqual([]);
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
});
