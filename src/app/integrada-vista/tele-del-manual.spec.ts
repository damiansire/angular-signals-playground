import { SE_APAGA, SE_PRENDE } from './tele-del-manual';

describe('la tele del manual', () => {
  const funciones = (k: Keyframe) => String(k['filter']).replace(/\([^)]*\)/g, '');

  it('se prende desde nada y termina en la imagen tal cual', () => {
    expect(SE_PRENDE[0]['clipPath']).toBe('inset(50.00% 50.00%)');
    expect(SE_PRENDE.at(-1)).toEqual(
      jasmine.objectContaining({ clipPath: 'inset(0.00% 0.00%)', filter: 'brightness(1)' }),
    );
  });

  it('se apaga desde la imagen tal cual y no deja nada', () => {
    expect(SE_APAGA[0]).toEqual(
      jasmine.objectContaining({ clipPath: 'inset(0.00% 0.00%)', filter: 'brightness(1)' }),
    );
    expect(SE_APAGA.at(-1)?.['clipPath']).toBe('inset(50.00% 50.00%)');
  });

  it('recorta y no achica: ningún cuadro toca la geometría de la página', () => {
    for (const cuadros of [SE_PRENDE, SE_APAGA]) {
      expect(cuadros.some((k) => 'transform' in k || 'scale' in k)).toBeFalse();
    }
  });

  it('cada cuadro filtra con las mismas funciones, así el blanco se interpola', () => {
    for (const cuadros of [SE_PRENDE, SE_APAGA]) {
      expect(new Set(cuadros.map(funciones))).toEqual(new Set(['brightness']));
    }
  });

  it('los cuadros avanzan de 0 a 1', () => {
    for (const cuadros of [SE_PRENDE, SE_APAGA]) {
      const offsets = cuadros.map((k) => k.offset as number);
      expect(offsets[0]).toBe(0);
      expect(offsets.at(-1)).toBe(1);
      expect(offsets).toEqual([...offsets].sort((a, b) => a - b));
    }
  });
});
