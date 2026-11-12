import { signalsRoutesTree } from '../signals/signals-routes-tree';
import { problemasDeLinea } from '../libs/guion';
import { GUION_DEL_VIAJE } from './guion-del-viaje';
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
    const problemas = Object.entries(GUION_DEL_VIAJE).flatMap(([id, { llegada, resuelta }]) =>
      [llegada, resuelta].flatMap((l) => problemasDeLinea(l.txt).map((p) => `${id}: ${p}`)),
    );
    expect(problemas).toEqual([]);
  });

  it('ningún texto se repite: la caja de diálogo reconoce cada línea por su texto', () => {
    const textos = Object.values(GUION_DEL_VIAJE).flatMap((g) => [g.llegada.txt, g.resuelta.txt]);
    expect(textos.filter((t, i) => textos.indexOf(t) !== i)).toEqual([]);
  });

  it('la llegada y lo resuelto los dice otra nave: es una charla, no un monólogo', () => {
    const solas = Object.entries(GUION_DEL_VIAJE).filter(
      ([, g]) => g.llegada.quien === g.resuelta.quien,
    );
    expect(solas.map(([id]) => id)).toEqual([]);
  });
});
