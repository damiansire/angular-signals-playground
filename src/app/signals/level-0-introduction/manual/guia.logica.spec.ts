import { puntaDeLaMano, siguienteSinTocar, sigueMostrando } from './guia.logica';

describe('siguienteSinTocar', () => {
  it('señala el primero del documento que falta, aunque se hayan tocado otros salteados', () => {
    expect(siguienteSinTocar(['main', 'section', 'h2'], ['h2'])).toBe('main');
    expect(siguienteSinTocar(['main', 'section', 'h2'], ['main', 'h2'])).toBe('section');
  });

  it('no señala nada cuando ya se tocaron todos', () => {
    expect(siguienteSinTocar(['main', 'section'], ['section', 'main'])).toBeNull();
    expect(siguienteSinTocar([], [])).toBeNull();
  });
});

describe('puntaDeLaMano', () => {
  it('apoya el dedo adentro del objetivo, relativo al marco de la página', () => {
    const marco = { left: 100, top: 50, width: 800, height: 600 };
    const objetivo = { left: 300, top: 250, width: 50, height: 20 };
    const punta = puntaDeLaMano(objetivo, marco);
    expect(punta).toEqual({ x: 243, y: 212 });
    expect(punta.x).toBeGreaterThan(objetivo.left - marco.left);
    expect(punta.x).toBeLessThan(objetivo.left - marco.left + objetivo.width);
    expect(punta.y).toBeLessThan(objetivo.top - marco.top + objetivo.height);
  });

  it('en un objetivo ancho apoya cerca del borde derecho, sin tapar lo que dice', () => {
    const marco = { left: 0, top: 0, width: 1200, height: 800 };
    const pastilla = { left: 100, top: 100, width: 400, height: 40 };
    expect(puntaDeLaMano(pastilla, marco).x).toBe(486);
  });
});

describe('sigueMostrando', () => {
  it('sigue mientras la página señale algo nuevo', () => {
    expect(sigueMostrando(null, '[data-el-id="main"]', 0, 12)).toBeTrue();
    expect(sigueMostrando('[data-el-id="main"]', '[data-el-id="section"]', 1, 12)).toBeTrue();
  });

  it('para cuando ya no hay nada que tocar', () => {
    expect(sigueMostrando('[data-el-id="p"]', null, 9, 12)).toBeFalse();
  });

  it('para si el toque no movió la guía: no toca lo mismo para siempre', () => {
    expect(sigueMostrando('.correr', '.correr', 1, 12)).toBeFalse();
  });

  it('para en el tope aunque la página siga señalando', () => {
    expect(sigueMostrando('a', 'b', 12, 12)).toBeFalse();
  });
});
