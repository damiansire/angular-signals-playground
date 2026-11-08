import { signalsRoutesTree } from '../app.routes';
import type { RouteItem } from '../interfaces/route-item.interface';
import { CAPITULO_DE_CONCEPTO } from './molecule-engine';
import {
  ETAPAS_DEL_VIAJE,
  esElFin,
  etapaDe,
  finDelViaje,
  paginasDeEtapa,
  siguienteEtapa,
} from './viaje';

describe('el viaje', () => {
  it('cada capítulo del recorrido tiene su etapa, en el mismo orden', () => {
    expect(ETAPAS_DEL_VIAJE.map((e) => e.capitulo)).toEqual([...CAPITULO_DE_CONCEPTO]);
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

  it('después del cierre viene el fin, que es otro lugar: recargar no repite la revelación', () => {
    const subs = [7, 3, 0, 2];
    const cierre = siguienteEtapa(3, subs);
    expect(esElFin(cierre, subs)).toBeFalse();
    expect(finDelViaje(subs)).toEqual({ concepto: 4, pagina: 0 });
    expect(esElFin(finDelViaje(subs), subs)).toBeTrue();
    expect(esElFin({ concepto: 1, pagina: 0 }, subs)).toBeFalse();
  });
});
