import { REGLAS_GUION, palabrasDe } from './cinematicas/cinematica-guion';
import { PAGINAS_DEL_MANUAL } from './manual-de-a-bordo';

describe('el manual de a bordo', () => {
  it('son las cinco pantallas de la Introducción, en el orden del recorrido', () => {
    expect(PAGINAS_DEL_MANUAL.map((p) => p.id)).toEqual([
      'html-to-tree',
      'dom-is-alive',
      'dom-to-pixel',
      'manual-sync-pain',
      'old-change-detection',
    ]);
  });

  it('lo que le dice a la tripulación sigue las reglas del guion', () => {
    for (const p of PAGINAS_DEL_MANUAL) {
      expect(palabrasDe(p.enLaNave)).withContext(p.id).toBeLessThanOrEqual(REGLAS_GUION.palabras);
      expect(p.enLaNave).withContext(p.id).not.toMatch(/[—–]/);
    }
  });

  it('cada página carga su pantalla', async () => {
    for (const p of PAGINAS_DEL_MANUAL) {
      const { component } = await p.cargar();
      expect(component).withContext(p.id).toBeDefined();
    }
  });
});
