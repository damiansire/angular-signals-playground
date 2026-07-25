import { stagesTriggered, renderCost, RENDER_STAGES, MutationKind } from './render-pipeline';

describe('render-pipeline (dominio de "de la mutación al pixel")', () => {
  it('transform y opacity recalculan estilo pero se saltean layout y paint', () => {
    expect(stagesTriggered('transform')).toEqual(['style', 'composite']);
    expect(stagesTriggered('opacity')).toEqual(['style', 'composite']);
  });

  it('ninguna mutación llega a composite salteándose style', () => {
    const kinds: MutationKind[] = ['transform', 'opacity', 'color', 'textContent', 'geometry'];
    for (const kind of kinds) {
      expect(stagesTriggered(kind)).toContain('style');
    }
  });

  it('cambiar color recalcula estilo y repinta, sin re-layout', () => {
    expect(stagesTriggered('color')).toEqual(['style', 'paint', 'composite']);
  });

  it('cambiar texto o geometría dispara la cadena entera', () => {
    expect(stagesTriggered('textContent')).toEqual(['style', 'layout', 'paint', 'composite']);
    expect(stagesTriggered('geometry')).toEqual(['style', 'layout', 'paint', 'composite']);
  });

  it('devuelve las etapas en el orden canónico del pipeline', () => {
    expect(stagesTriggered('textContent')).toEqual([...RENDER_STAGES]);
  });

  it('clasifica el costo: transform barato, color medio, texto caro', () => {
    expect(renderCost('transform')).toBe('barato');
    expect(renderCost('color')).toBe('medio');
    expect(renderCost('textContent')).toBe('caro');
  });

  it('es monótono: si dispara layout, también dispara paint y composite', () => {
    const kinds: MutationKind[] = ['transform', 'opacity', 'color', 'textContent', 'geometry'];
    for (const kind of kinds) {
      const stages = stagesTriggered(kind);
      if (stages.includes('layout')) {
        expect(stages).toContain('paint');
        expect(stages).toContain('composite');
      }
      if (stages.includes('paint')) {
        expect(stages).toContain('composite');
      }
    }
  });
});
