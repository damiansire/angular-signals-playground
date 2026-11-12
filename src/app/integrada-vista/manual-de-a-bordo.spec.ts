import { REGLAS_DE_LINEA, palabrasDe } from '../libs/guion';
import { PAGINAS_DEL_MANUAL, pasoEnElManual } from './manual-de-a-bordo';

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
      expect(palabrasDe(p.enLaNave))
        .withContext(p.id)
        .toBeLessThanOrEqual(REGLAS_DE_LINEA.palabras);
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

describe('las teclas en el manual de a bordo', () => {
  const tecla = (key: string, target: EventTarget | null = document.body, shiftKey = false) => ({
    key,
    shiftKey,
    target,
  });

  it('se lee como una página: flechas de a poco, AvPág y espacio de a una pantalla', () => {
    expect(pasoEnElManual(tecla('ArrowDown'), 500, 2000)).toBe(48);
    expect(pasoEnElManual(tecla('ArrowUp'), 500, 2000)).toBe(-48);
    expect(pasoEnElManual(tecla('PageDown'), 500, 2000)).toBe(425);
    expect(pasoEnElManual(tecla(' '), 500, 2000)).toBe(425);
    expect(pasoEnElManual(tecla(' ', document.body, true), 500, 2000)).toBe(-425);
    expect(pasoEnElManual(tecla('Home'), 500, 2000)).toBe(-2000);
    expect(pasoEnElManual(tecla('End'), 500, 2000)).toBe(2000);
  });

  it('el espacio sobre un botón lo aprieta, y en un campo se escribe', () => {
    expect(pasoEnElManual(tecla(' ', document.createElement('button')), 500, 2000)).toBeNull();
    expect(
      pasoEnElManual(tecla('ArrowDown', document.createElement('input')), 500, 2000),
    ).toBeNull();
  });

  it('las demás teclas no lo mueven', () => {
    expect(pasoEnElManual(tecla('ArrowRight'), 500, 2000)).toBeNull();
    expect(pasoEnElManual(tecla('a'), 500, 2000)).toBeNull();
  });
});
