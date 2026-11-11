import { signalsRoutesTree } from '../app.routes';
import type { RouteItem } from '../interfaces/route-item.interface';
import {
  CAPITULO_DE_CONCEPTO,
  conceptoDeCapitulo,
  ETAPAS_DEL_VIAJE,
  esElFin,
  etapaDe,
  finDelViaje,
  lugarDelLink,
  paginasDeEtapa,
  siguienteEtapa,
} from './viaje';
import { buildWhereQuery, parseWhereQuery } from './url-sync';

describe('el viaje', () => {
  it('cada concepto del árbol de rutas tiene su etapa, y el capítulo es su path', () => {
    // Si alguien agrega o quita un nivel en app.routes sin su etapa, el viaje lo saltearía en silencio.
    expect(CAPITULO_DE_CONCEPTO.map(String)).toEqual(signalsRoutesTree.map((c) => c.path));
    expect(conceptoDeCapitulo(1)).toBe(0);
    expect(conceptoDeCapitulo(11)).toBe(ETAPAS_DEL_VIAJE.length - 1);
    expect(conceptoDeCapitulo(0)).toBeNull();
    expect(conceptoDeCapitulo(12)).toBeNull();
    expect(etapaDe(1)?.nombre).toBe('La caja que avisa');
    expect(etapaDe(11)?.nombre).toBe('Quien lee, avisa');
    expect(etapaDe(0)).toBeNull();
  });

  it('los arcos van en orden: leer el mundo, la banda vieja, la verdad', () => {
    const arcos = ETAPAS_DEL_VIAJE.map((e) => e.arco).join(' ');
    expect(arcos).toMatch(/^(I )+(II )+III( III)*$/);
  });

  it('las pantallas de un capítulo son sus páginas, con su título y su carga', async () => {
    const signals = signalsRoutesTree[0].subLevels ?? [];
    const paginas = paginasDeEtapa(1, signals);
    expect(paginas.length).toBe(signals.length);
    expect(paginas[0].id).toBe('1/1');
    expect(paginas[0].ley).toBe(signals[0].title ?? '');
    expect(paginas[0].enLaNave).toBe('');
    const cargada = await paginas[0].cargar();
    expect(cargada.component).toBeDefined();
  });

  it('una pantalla con componente directo también es página; una sin componente, no', async () => {
    class Pantalla {}
    const subs: RouteItem[] = [
      { path: '1', title: 'Directa', component: Pantalla },
      { path: '2', title: 'Sin nada' },
    ];
    const paginas = paginasDeEtapa(9, subs);
    expect(paginas.map((p) => p.id)).toEqual(['9/1']);
    expect((await paginas[0].cargar()).component).toBe(Pantalla);
  });

  it('después de una hoja viene la cinemática del concepto siguiente, y al final el cierre', () => {
    const subs = [7, 3, 0, 2];
    expect(siguienteEtapa(0, subs)).toEqual({ concepto: 1, pagina: -1 });
    expect(siguienteEtapa(1, subs)).toEqual({ concepto: 3, pagina: -1 });
    expect(siguienteEtapa(3, subs)).toEqual({ concepto: 4, pagina: -1 });
  });

  it('un link abre la página de la hoja, o la cinemática si trae solo el nivel', () => {
    const subs = [7, 3, 0, 2];
    expect(lugarDelLink(1, 2, subs)).toEqual({ concepto: 1, pagina: 1 });
    expect(lugarDelLink(1, 0, subs)).toEqual({ concepto: 1, pagina: -1 });
    expect(lugarDelLink(1, 9, subs)).toEqual({ concepto: 1, pagina: 2 });
    expect(lugarDelLink(2, 1, subs)).toBeNull();
    expect(lugarDelLink(8, 1, subs)).toBeNull();
  });

  it('lo que el viaje escribe en la barra, el link lo vuelve a abrir en el mismo lugar', () => {
    const subs = [7, 3, 0, 2];
    for (const lugar of [
      { concepto: 0, pagina: 4 },
      { concepto: 3, pagina: 0 },
      { concepto: 1, pagina: -1 },
    ]) {
      const link = parseWhereQuery(
        buildWhereQuery(CAPITULO_DE_CONCEPTO[lugar.concepto], lugar.pagina),
      );
      expect(link).not.toBeNull();
      expect(lugarDelLink(conceptoDeCapitulo(link!.concept)!, link!.sub, subs)).toEqual(lugar);
    }
  });

  it('después del cierre viene el fin, que es otro lugar: recargar no repite la revelación', () => {
    const subs = [7, 3, 0, 2];
    const cierre = siguienteEtapa(3, subs);
    expect(esElFin(cierre, subs)).toBeFalse();
    expect(finDelViaje(subs)).toEqual({ concepto: 4, pagina: 0 });
    expect(esElFin(finDelViaje(subs), subs)).toBeTrue();
    expect(esElFin({ concepto: 1, pagina: 0 }, subs)).toBeFalse();
  });
});
