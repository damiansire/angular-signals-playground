import {
  stagesTriggered,
  renderCost,
  RENDER_STAGES,
  MutationKind,
  ESTACIONES,
  DIBUJO_SALTO,
  DIBUJO_TRAMO,
  estacionesQueCorren,
  recorridoDelFlujo,
} from './render-pipeline';

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

describe('render-pipeline (el flujo dibujado)', () => {
  const nombres = (kind: MutationKind) =>
    recorridoDelFlujo(kind).map((p) => `${ESTACIONES[p.desde]}→${ESTACIONES[p.hasta]}`);

  it('la cadena arranca en DOM, que corre siempre', () => {
    expect(ESTACIONES[0]).toBe('DOM');
    for (const kind of ['transform', 'color', 'geometry'] as const) {
      expect(estacionesQueCorren(kind)[0]).toBeTrue();
    }
  });

  it('un cambio caro recorre la cadena entera, de a tramos y sin saltos', () => {
    expect(nombres('geometry')).toEqual([
      'DOM→style',
      'style→layout',
      'layout→paint',
      'paint→composite',
    ]);
    expect(recorridoDelFlujo('textContent').some((p) => p.salto)).toBeFalse();
  });

  it('transform salta de style a composite, por encima de layout y paint', () => {
    expect(nombres('transform')).toEqual(['DOM→style', 'style→composite']);
    expect(recorridoDelFlujo('transform')[1].salto).toBeTrue();
    expect(estacionesQueCorren('transform')).toEqual([true, true, false, false, true]);
  });

  it('color salta solo layout', () => {
    expect(nombres('color')).toEqual(['DOM→style', 'style→paint', 'paint→composite']);
  });

  it('se dibuja en orden: cada pieza arranca cuando termina la anterior', () => {
    const piezas = recorridoDelFlujo('color');
    expect(piezas[0].retraso).toBe(0);
    expect(piezas[1].retraso).toBeCloseTo(DIBUJO_TRAMO);
    expect(piezas[2].retraso).toBeCloseTo(DIBUJO_TRAMO + DIBUJO_SALTO);
    for (let i = 1; i < piezas.length; i++) expect(piezas[i].retraso).toBe(piezas[i - 1].fin);
  });
});
